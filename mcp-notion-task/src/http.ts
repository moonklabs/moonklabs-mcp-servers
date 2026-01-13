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
import { initLogger, createLogger, getLogger } from "./utils/logger.js";

// 로거 인스턴스
const log = createLogger("http");

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

  // 요청/응답 로깅 미들웨어
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // 요청 로깅
    log.request(req.method, req.path, {
      sessionId: sessionId?.slice(0, 8),
      contentLength: req.headers["content-length"],
    });

    // DEBUG 레벨에서 요청 본문 로깅
    if (req.body && Object.keys(req.body).length > 0) {
      log.debug("Request body", {
        method: req.body.method,
        id: req.body.id,
        params: req.body.params ? Object.keys(req.body.params) : undefined,
      });
    }

    // 응답 완료 시 로깅
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      log.response(req.method, req.path, res.statusCode, duration, {
        sessionId: sessionId?.slice(0, 8),
      });
    });

    next();
  });

  // CORS 헤더 (필요시)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, mcp-session-id, Last-Event-ID, X-User-Id"
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

        log.info("New session created", {
          sessionId: sessionId.slice(0, 8),
        });
      }

      const session = sessions.get(sessionId)!;

      // 요청 처리
      await session.transport.handleRequest(req, res, req.body);
    } catch (error) {
      log.error("POST /mcp error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
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
      log.error("GET /mcp error", {
        error: error instanceof Error ? error.message : String(error),
        sessionId: sessionId?.slice(0, 8),
      });
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
      log.info("Session closed", { sessionId: sessionId.slice(0, 8) });
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
  const config = getConfig();

  // 로거 초기화
  initLogger(config.server.logLevel);
  const rootLog = getLogger();

  // 환경 변수 확인 로그 (민감 정보는 마스킹)
  rootLog.info("Environment variables loaded", {
    NOTION_TOKEN: config.notion.token ? "***" + config.notion.token.slice(-4) : "NOT SET",
    NOTION_TASK_DATABASE_ID: config.notion.taskDatabaseId || "NOT SET",
    NOTION_SPRINT_DATABASE_ID: config.notion.sprintDatabaseId || "NOT SET",
    NOTION_INBOX_DATABASE_ID: config.notion.inboxDatabaseId || "NOT SET",
    EMAIL_DOMAIN: config.user.emailDomain || "NOT SET",
    PORT: config.server.port,
    HOST: config.server.host,
    LOG_LEVEL: config.server.logLevel,
  });

  rootLog.info(`${SERVER_NAME} v${SERVER_VERSION} starting...`, {
    logLevel: config.server.logLevel,
  });

  const app = createApp();

  const server = app.listen(PORT, HOST, () => {
    rootLog.info("HTTP server started", {
      host: HOST,
      port: PORT,
      mcpEndpoint: `http://${HOST}:${PORT}/mcp`,
      healthEndpoint: `http://${HOST}:${PORT}/health`,
    });
  });

  // 종료 시그널 처리
  const shutdown = async () => {
    rootLog.info("Shutting down...");

    // 모든 세션 종료
    for (const [sessionId, session] of sessions) {
      await session.server.close();
      rootLog.debug("Session closed", { sessionId: sessionId.slice(0, 8) });
    }
    sessions.clear();
    rootLog.info("All sessions closed", { count: sessions.size });

    server.close(() => {
      rootLog.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// 서버 실행
main().catch((error) => {
  const rootLog = getLogger();
  rootLog.error("Server startup failed", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
