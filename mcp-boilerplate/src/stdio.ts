#!/usr/bin/env node
/**
 * MCP Server - stdio Transport
 *
 * 표준 입출력(stdio)을 통해 통신하는 MCP 서버입니다.
 * Claude Desktop이나 다른 MCP 클라이언트와 로컬에서 연결할 때 사용합니다.
 *
 * 사용법:
 *   npm run dev          # 개발 모드
 *   npm run build && npm start  # 프로덕션 모드
 *   npm run inspector    # MCP Inspector로 테스트
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerAllTools } from "./tools/index.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompts } from "./prompts/index.js";

// 서버 이름과 버전 설정
const SERVER_NAME = "mcp-boilerplate";
const SERVER_VERSION = "1.0.0";

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
 * 메인 함수 - 서버를 시작합니다.
 */
async function main(): Promise<void> {
  const server = createServer();

  // stdio transport 생성 및 연결
  const transport = new StdioServerTransport();

  // 서버와 transport 연결
  await server.connect(transport);

  // 종료 시그널 처리
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  // 서버 시작 로그 (stderr로 출력 - stdout은 MCP 통신용)
  console.error(`${SERVER_NAME} v${SERVER_VERSION} started (stdio transport)`);
}

// 서버 실행
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
