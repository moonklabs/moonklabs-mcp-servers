#!/usr/bin/env node
/**
 * MCP Server - Streamable HTTP Transport
 *
 * HTTP 프로토콜을 통해 통신하는 MCP 서버입니다.
 * 원격 서버로 배포하거나 웹 기반 클라이언트와 연결할 때 사용합니다.
 *
 * 사용법:
 *   npm run dev:http     # 개발 모드 (watch)
 *   npm run build && npm run start:http  # 프로덕션 모드
 *
 * 엔드포인트:
 *   POST /mcp  - MCP 요청 처리
 *   GET  /mcp  - SSE 스트림 연결
 *   DELETE /mcp - 세션 종료
 */

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";

import { getConfig } from "./config/index.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompts } from "./prompts/index.js";
import {
  authenticateToken,
  setAuthSession,
  getAuthSession,
  deleteAuthSession,
  isAuthRequired,
} from "./auth/index.js";

// 서버 설정
const SERVER_NAME = "mcp-notion-task";
const SERVER_VERSION = "1.0.0";
const PORT = parseInt(process.env.PORT || "3434", 10);
const HOST = process.env.HOST || "0.0.0.0";

// 활성 세션 저장소
const sessions = new Map<
  string,
  { server: McpServer; transport: StreamableHTTPServerTransport }
>();

/**
 * MCP 서버를 생성하고 설정합니다.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // 도구, 리소스, 프롬프트 등록
  registerAllTools(server);
  registerAllResources(server);
  registerAllPrompts(server);

  return server;
}

/**
 * Express 앱을 생성하고 설정합니다.
 */
function createApp(): express.Application {
  const app = express();

  // JSON 파싱
  app.use(express.json());

  // CORS 헤더 (필요시)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, mcp-session-id, Last-Event-ID, Authorization"
    );
    next();
  });

  // OPTIONS 요청 처리
  app.options("/mcp", (_req: Request, res: Response) => {
    res.sendStatus(204);
  });

  // POST /mcp - MCP 요청 처리
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      // 인증 처리
      const authHeader = req.headers.authorization;
      let authenticatedUser = null;

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        authenticatedUser = authenticateToken(token);
      }

      // 인증 필수 모드에서 인증 실패 시
      if (isAuthRequired() && !authenticatedUser) {
        res.status(401).json({
          error: "Authentication required",
          message: "Valid Authorization: Bearer <token> header required",
        });
        return;
      }

      // 세션 ID 확인 또는 생성
      let sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (!sessionId || !sessions.has(sessionId)) {
        // 새 세션 생성
        sessionId = randomUUID();
        const server = createServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId!,
        });

        await server.connect(transport);
        sessions.set(sessionId, { server, transport });

        // 인증 정보 세션에 저장
        if (authenticatedUser) {
          setAuthSession(sessionId, authenticatedUser);
        }

        console.log(
          `New session created: ${sessionId}, user: ${authenticatedUser?.email || "anonymous"}`
        );
      }

      const session = sessions.get(sessionId)!;

      // 요청 처리
      await session.transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("POST /mcp error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /mcp - SSE 스트림 연결
  app.get("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }

    const session = sessions.get(sessionId)!;

    // SSE 헤더 설정
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Last-Event-ID 처리 (재연결 지원)
    const lastEventId = req.headers["last-event-id"] as string | undefined;

    try {
      await session.transport.handleRequest(req, res, undefined);
    } catch (error) {
      console.error("GET /mcp error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // DELETE /mcp - 세션 종료
  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId) {
      res.status(400).json({ error: "Missing session ID" });
      return;
    }

    const session = sessions.get(sessionId);
    if (session) {
      await session.server.close();
      sessions.delete(sessionId);
      deleteAuthSession(sessionId); // 인증 정보도 삭제
      console.log(`Session closed: ${sessionId}`);
    }

    res.sendStatus(204);
  });

  // 헬스 체크 엔드포인트
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      server: SERVER_NAME,
      version: SERVER_VERSION,
      activeSessions: sessions.size,
    });
  });

  return app;
}

/**
 * 메인 함수 - HTTP 서버를 시작합니다.
 */
async function main(): Promise<void> {
  // 환경 변수 조기 검증 (필수 값 누락 시 즉시 실패)
  getConfig();

  const app = createApp();

  const server = app.listen(PORT, HOST, () => {
    console.log(`${SERVER_NAME} v${SERVER_VERSION} started`);
    console.log(`HTTP server listening on http://${HOST}:${PORT}`);
    console.log(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
  });

  // 종료 시그널 처리
  const shutdown = async () => {
    console.log("\nShutting down...");

    // 모든 세션 종료
    for (const [sessionId, session] of sessions) {
      await session.server.close();
      console.log(`Session ${sessionId} closed`);
    }
    sessions.clear();

    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// 서버 실행
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
