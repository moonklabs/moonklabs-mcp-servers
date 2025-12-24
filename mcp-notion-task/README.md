# MCP Boilerplate

TypeScript로 작성된 MCP (Model Context Protocol) 서버 보일러플레이트입니다.

## 기능

- **Tools**: AI가 실행할 수 있는 도구 (계산, API 호출 등)
- **Resources**: AI가 읽을 수 있는 데이터 소스
- **Prompts**: 재사용 가능한 프롬프트 템플릿

## 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 모드 실행 (stdio)
npm run dev

# MCP Inspector로 테스트
npm run inspector
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | stdio 서버 개발 모드 실행 |
| `npm run dev:http` | HTTP 서버 개발 모드 실행 (watch) |
| `npm run build` | TypeScript 빌드 |
| `npm start` | stdio 서버 프로덕션 실행 |
| `npm run start:http` | HTTP 서버 프로덕션 실행 |
| `npm run inspector` | MCP Inspector로 서버 테스트 |
| `npm run typecheck` | TypeScript 타입 검사 |

## 프로젝트 구조

```
src/
├── stdio.ts          # stdio transport 서버 (Claude Desktop용)
├── http.ts           # Streamable HTTP 서버 (원격 배포용)
├── tools/            # MCP 도구 정의
│   ├── index.ts      # 도구 등록 헬퍼
│   ├── greet.ts      # 인사 도구 예제
│   └── calculator.ts # 계산기 도구 예제
├── resources/        # MCP 리소스 정의
│   ├── index.ts      # 리소스 등록 헬퍼
│   └── files.ts      # 파일 리소스 예제
└── prompts/          # MCP 프롬프트 정의
    ├── index.ts      # 프롬프트 등록 헬퍼
    └── templates.ts  # 프롬프트 템플릿 예제
```

## Claude Desktop 설정

`claude_desktop_config.json`에 다음을 추가하세요:

```json
{
  "mcpServers": {
    "mcp-boilerplate": {
      "command": "node",
      "args": ["/path/to/mcp-boilerplate/dist/stdio.js"]
    }
  }
}
```

또는 개발 모드:

```json
{
  "mcpServers": {
    "mcp-boilerplate": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-boilerplate/src/stdio.ts"]
    }
  }
}
```

## 포함된 예제

### 도구 (Tools)

| 도구 | 설명 |
|------|------|
| `greet` | 이름을 입력받아 인사말 반환 |
| `multi-greet` | 여러 번 인사 (스트리밍 예제) |
| `add` | 덧셈 |
| `subtract` | 뺄셈 |
| `multiply` | 곱셈 |
| `divide` | 나눗셈 (0 나누기 에러 처리) |
| `calculate` | 복합 계산 |

### 리소스 (Resources)

| URI | 설명 |
|-----|------|
| `greeting://default` | 기본 인사말 |
| `config://server` | 서버 설정 정보 (JSON) |
| `help://getting-started` | 시작 가이드 (Markdown) |
| `user://{userId}/profile` | 사용자 프로필 (동적 템플릿) |

### 프롬프트 (Prompts)

| 프롬프트 | 설명 |
|----------|------|
| `greeting-template` | 인사말 생성 템플릿 |
| `summarize-template` | 텍스트 요약 템플릿 |
| `code-review-template` | 코드 리뷰 템플릿 |
| `translate-template` | 번역 템플릿 |

## HTTP 서버 사용

HTTP 서버로 실행하면 원격에서 MCP 클라이언트가 연결할 수 있습니다:

```bash
# 서버 시작
npm run dev:http

# 또는 환경 변수로 포트 지정
PORT=8080 npm run dev:http
```

### 엔드포인트

- `POST /mcp` - MCP 요청 처리
- `GET /mcp` - SSE 스트림 연결
- `DELETE /mcp` - 세션 종료
- `GET /health` - 헬스 체크

## 새 도구 추가하기

1. `src/tools/` 폴더에 새 파일 생성:

```typescript
// src/tools/my-tool.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerMyTools(server: McpServer): void {
  server.registerTool(
    "my-tool",
    {
      description: "도구 설명",
      inputSchema: z.object({
        param: z.string().describe("파라미터 설명"),
      }),
    },
    async ({ param }) => ({
      content: [{ type: "text", text: `결과: ${param}` }],
    })
  );
}
```

2. `src/tools/index.ts`에 등록:

```typescript
import { registerMyTools } from "./my-tool.js";

export function registerAllTools(server: McpServer): void {
  // ... 기존 등록
  registerMyTools(server);
}
```

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## 라이선스

MIT
