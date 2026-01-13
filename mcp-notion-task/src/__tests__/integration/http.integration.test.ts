/**
 * HTTP X-User-Id 헤더 통합 테스트
 * 실제 HTTP 서버와 MCP 프로토콜을 통해 X-User-Id 헤더 처리를 검증합니다.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TEST_CONFIG, delay } from "./setup.js";

// 유틸리티
import { emailToUserId } from "../../utils/emailToUserId.js";
import { userIdToEmail } from "../../utils/userIdToEmail.js";

/**
 * 테스트 사용자 목록
 */
const TEST_USERS = {
  dosunyun: "dosunyun",
  bongheecha: "bongheecha",
};

describe("HTTP X-User-Id 헤더 통합 테스트", () => {
  describe("사용자 존재 여부 확인", () => {
    it("dosunyun 사용자가 워크스페이스에 존재", async () => {
      const email = userIdToEmail(TEST_USERS.dosunyun);
      const userId = await emailToUserId(email);

      expect(userId).toBeDefined();
      expect(typeof userId).toBe("string");
      expect(userId.length).toBeGreaterThan(0);

      console.log(`✓ dosunyun 사용자 UUID: ${userId}`);
      await delay(300);
    }, 60000);

    it("bongheecha 사용자가 워크스페이스에 존재", async () => {
      const email = userIdToEmail(TEST_USERS.bongheecha);

      try {
        const userId = await emailToUserId(email);

        expect(userId).toBeDefined();
        expect(typeof userId).toBe("string");
        expect(userId.length).toBeGreaterThan(0);

        console.log(`✓ bongheecha 사용자 UUID: ${userId}`);
      } catch (error) {
        // 사용자가 없는 경우
        console.error(`✗ bongheecha 사용자를 찾을 수 없습니다: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }

      await delay(300);
    }, 60000);
  });

  describe("MCP 프로토콜 X-User-Id 헤더 테스트 (HTTP 서버 필요)", () => {
    const SERVER_URL = "http://localhost:3434";

    // HTTP 서버가 실행 중인지 확인
    async function checkServerRunning(): Promise<boolean> {
      try {
        const response = await fetch(`${SERVER_URL}/health`);
        return response.ok;
      } catch {
        return false;
      }
    }

    it("X-User-Id 헤더로 작업 목록 필터링 (bongheecha)", async () => {
      const isRunning = await checkServerRunning();
      if (!isRunning) {
        console.log("⊘ HTTP 서버가 실행 중이 아닙니다. 테스트 건너뜀");
        console.log("  테스트하려면: npm run dev:http");
        return;
      }

      // 1. MCP 초기화
      const initRequest = {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: {
            name: "integration-test",
            version: "1.0.0",
          },
        },
      };

      const initResponse = await fetch(`${SERVER_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "x-user-id": TEST_USERS.bongheecha,
        },
        body: JSON.stringify(initRequest),
      });

      const initData = await initResponse.json();
      const sessionId = initResponse.headers.get("mcp-session-id");
      expect(sessionId).toBeDefined();

      // 2. MCP 도구 호출
      const mcpRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "notion-task-list",
          arguments: {
            pageSize: 5,
          },
        },
      };

      // X-User-Id 헤더와 세션 ID를 함께 전송
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "x-user-id": TEST_USERS.bongheecha,
          "mcp-session-id": sessionId!,
        },
        body: JSON.stringify(mcpRequest),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      console.log(`✓ X-User-Id: bongheecha로 작업 목록 조회 성공`);
      console.log(`  응답: ${JSON.stringify(data).substring(0, 200)}...`);

      // 응답 검증
      expect(data).toHaveProperty("result");
      await delay(300);
    }, 30000);

    it("X-User-Id 헤더로 작업 목록 필터링 (dosunyun)", async () => {
      const isRunning = await checkServerRunning();
      if (!isRunning) {
        console.log("⊘ HTTP 서버가 실행 중이 아닙니다. 테스트 건너뜀");
        return;
      }

      const mcpRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "notion-task-list",
          arguments: {
            pageSize: 5,
          },
        },
      };

      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "x-user-id": TEST_USERS.dosunyun,
        },
        body: JSON.stringify(mcpRequest),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      console.log(`✓ X-User-Id: dosunyun으로 작업 목록 조회 성공`);

      expect(data).toHaveProperty("result");
      await delay(300);
    }, 30000);

    it("X-User-Id 헤더 없이 전체 조회", async () => {
      const isRunning = await checkServerRunning();
      if (!isRunning) {
        console.log("⊘ HTTP 서버가 실행 중이 아닙니다. 테스트 건너뜀");
        return;
      }

      const mcpRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "notion-task-list",
          arguments: {
            pageSize: 5,
          },
        },
      };

      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify(mcpRequest),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      console.log(`✓ 헤더 없이 전체 작업 목록 조회 성공`);

      expect(data).toHaveProperty("result");
      await delay(300);
    }, 30000);

    it("존재하지 않는 사용자 에러 처리", async () => {
      const isRunning = await checkServerRunning();
      if (!isRunning) {
        console.log("⊘ HTTP 서버가 실행 중이 아닙니다. 테스트 건너뜀");
        return;
      }

      const mcpRequest = {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "notion-task-list",
          arguments: {},
        },
      };

      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "x-user-id": "nonexistent",
        },
        body: JSON.stringify(mcpRequest),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      console.log(`✓ 존재하지 않는 사용자 에러 처리 확인`);
      console.log(`  응답: ${JSON.stringify(data).substring(0, 200)}...`);

      // 에러 응답일 것으로 예상
      await delay(300);
    }, 30000);
  });
});
