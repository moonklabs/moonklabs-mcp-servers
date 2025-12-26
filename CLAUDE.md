# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

MCP (Model Context Protocol) 서버 모노레포. `mcp-boilerplate`를 복사하여 새 MCP 서버를 빠르게 생성.

| Part | 설명 |
|------|------|
| `mcp-boilerplate` | MCP 서버 템플릿 |
| `mcp-notion-task` | Notion MKL작업 CRUD (9개 도구) - [상세](./mcp-notion-task/CLAUDE.md) |

## 개발 명령어 (모든 Part 공통)

```bash
cd mcp-*  # 해당 Part 디렉토리로 이동

npm install              # 의존성 설치
npm run dev              # stdio 서버 (Claude Desktop용)
npm run dev:http         # HTTP 서버 (watch, 포트 3000)
npm test                 # vitest 테스트
npm run typecheck        # 타입 검사만
npm run inspector        # MCP Inspector 테스트

# 단일 테스트 실행
npx vitest run src/tools/__tests__/특정파일.test.ts
```

## 아키텍처: 3계층 패턴

모든 MCP 도구/리소스/프롬프트는 3계층으로 분리:

```
src/tools/
├── index.ts          # 1. registerAllTools() - 등록 헬퍼
├── myTool.ts         # 2. Zod 스키마 + MCP 등록
└── myToolLogic.ts    # 3. 순수 비즈니스 로직 (테스트 대상)
```

**Transport 분리**: `stdio.ts` (로컬, Claude Desktop), `http.ts` (원격 배포)

## MCP SDK 사용법

```typescript
// 도구 등록 - inputSchema 사용
server.registerTool("tool-name", {
  description: "설명",
  inputSchema: z.object({ param: z.string() }),
}, async ({ param }) => ({
  content: [{ type: "text", text: result }],
}));

// 프롬프트 등록 - argsSchema 사용 (주의: arguments가 아님)
server.registerPrompt("prompt-name", {
  description: "설명",
  argsSchema: z.object({ param: z.string() }),
}, async ({ param }) => ({
  messages: [{ role: "user", content: { type: "text", text: result } }],
}));
```

## 새 MCP 서버 생성

```bash
cp -r mcp-boilerplate mcp-새서버이름
cd mcp-새서버이름
# package.json의 name 필드 수정
npm install && npm run dev
```

## HTTP 서버 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| `POST /mcp` | MCP 요청 처리 |
| `GET /mcp` | SSE 스트림 연결 |
| `DELETE /mcp` | 세션 종료 |
| `GET /health` | 헬스 체크 |

세션 ID는 `mcp-session-id` 헤더로 관리.
