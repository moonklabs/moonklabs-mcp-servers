# 개발 가이드

## 사전 요구사항

- **Node.js** 20 이상
- **npm** 또는 **pnpm**
- **Git**

## 빠른 시작

### 기존 서버 실행

```bash
# mcp-notion-task 예시
cd mcp-notion-task

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 Notion API 토큰 및 데이터베이스 ID 입력

# 개발 모드 실행
npm run dev          # stdio 서버 (Claude Desktop용)
npm run dev:http     # HTTP 서버 (포트 3000, watch 모드)

# 테스트
npm test
```

### 새 MCP 서버 생성

```bash
# 1. 보일러플레이트 복사
cp -r mcp-boilerplate mcp-새서버이름

# 2. 디렉토리 이동
cd mcp-새서버이름

# 3. package.json 수정
# - "name" 필드를 새 서버 이름으로 변경

# 4. 의존성 설치
npm install

# 5. 개발 시작
npm run dev
```

## 스크립트 명령어

모든 Part에서 동일한 스크립트 규칙을 사용합니다:

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | stdio 서버 개발 모드 (tsx) |
| `npm run dev:http` | HTTP 서버 개발 모드 (watch) |
| `npm run build` | TypeScript 빌드 |
| `npm start` | stdio 서버 프로덕션 |
| `npm run start:http` | HTTP 서버 프로덕션 |
| `npm test` | Vitest 테스트 실행 |
| `npm run test:ui` | Vitest UI 모드 |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run typecheck` | TypeScript 타입 검사만 |
| `npm run inspector` | MCP Inspector로 테스트 |

## 아키텍처 패턴

### 3계층 구조

모든 MCP 도구는 3계층으로 분리합니다:

```
src/tools/
├── index.ts          # 1. 등록 헬퍼 (registerAllTools)
├── myTool.ts         # 2. 도구 정의 (Zod 스키마 + 등록)
└── myToolLogic.ts    # 3. 순수 비즈니스 로직 (테스트 대상)
```

**예시:**

```typescript
// myToolLogic.ts - 순수 함수 (테스트 용이)
export function calculateSum(a: number, b: number): number {
  return a + b;
}

// myTool.ts - MCP 도구 등록
import { z } from "zod";
import { calculateSum } from "./myToolLogic.js";

export function registerMyTool(server: McpServer) {
  server.registerTool("my-tool", {
    description: "두 숫자를 더합니다",
    inputSchema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }, async ({ a, b }) => ({
    content: [{ type: "text", text: String(calculateSum(a, b)) }],
  }));
}

// index.ts - 등록 헬퍼
export function registerAllTools(server: McpServer) {
  registerMyTool(server);
  // 다른 도구들...
}
```

### Transport 분리

- **stdio.ts**: Claude Desktop 연동용 (로컬)
- **http.ts**: 원격 접근용 (Express 서버)

## 테스트 규칙

- 테스트 파일은 `__tests__/` 폴더에 위치
- `*Logic.ts` 파일의 순수 함수 테스트에 집중
- Vitest 사용

```bash
# 전체 테스트
npm test

# 특정 파일 테스트
npx vitest run src/utils/__tests__/propertyParser.test.ts

# watch 모드
npx vitest --watch
```

## 환경변수 (mcp-notion-task)

| 변수 | 필수 | 설명 |
|------|------|------|
| `NOTION_API_TOKEN` | O | Notion Integration 토큰 |
| `TASK_DATABASE_ID` | O | MKL작업 데이터베이스 ID |
| `SPRINT_DATABASE_ID` | O | 스프린트 데이터베이스 ID |

**주의:** 서버 시작 시 환경변수가 검증됩니다. 누락 시 즉시 실패합니다.

## Docker 배포

```bash
cd mcp-notion-task

# 빌드
docker build -t mcp-notion-task .

# 실행
docker run -d -p 3000:3000 \
  -e NOTION_API_TOKEN=secret_xxx \
  -e TASK_DATABASE_ID=xxx \
  -e SPRINT_DATABASE_ID=xxx \
  --name mcp-notion-task \
  mcp-notion-task

# 또는 docker-compose
docker compose up -d
```

## Claude Desktop 연동

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "notion-task": {
      "command": "node",
      "args": ["/path/to/mcp-notion-task/dist/stdio.js"],
      "env": {
        "NOTION_API_TOKEN": "secret_xxx",
        "TASK_DATABASE_ID": "xxx",
        "SPRINT_DATABASE_ID": "xxx"
      }
    }
  }
}
```

---

*Generated: 2025-12-25 | Scan Level: Quick*
