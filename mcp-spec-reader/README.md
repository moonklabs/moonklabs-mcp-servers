# mcp-spec-reader

Notion 스펙 문서와 BMAD 워크플로우를 읽고 실행하는 MCP 서버입니다.

## 기능 (도구)

### BMAD 워크플로우 도구 ✅

| 도구 | 설명 | 상태 |
|------|------|------|
| `list-workflows` | _bmad 디렉토리의 워크플로우 목록 조회 (카테고리, standalone 필터링) | ✅ 완료 |
| `get-workflow-context` | 워크플로우 실행 컨텍스트 조회 (변수 해석, instructions, 실행 가이드) | ✅ 완료 |
| `get-agent-menu` | 에이전트 메뉴 정보 조회 (persona, menu items) | ✅ 완료 |

### Notion 스펙 도구

| 도구 | 설명 | 상태 |
|------|------|------|
| `list-specs` | Notion 데이터베이스의 스펙 문서 목록 조회 | 예정 (Story 3.2) |
| `read-spec` | Notion 페이지 내용을 Markdown으로 변환 | 예정 (Story 3.3) |
| `summarize-spec` | 긴 스펙 문서 요약 | 예정 (Story 3.4, Phase 1.5) |
| `get-spec-section` | 특정 섹션만 로드 | 예정 (Story 3.5) |

## 설치

### 사전 요구사항

- Node.js 20+
- npm 8+
- Notion Integration Token

### Notion Integration 설정

1. [Notion Integrations](https://www.notion.so/my-integrations)에서 새 Integration 생성
2. Integration Token 복사 (secret_로 시작)
3. 읽을 페이지/데이터베이스에 Integration 권한 부여

### 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필수 설정
NOTION_API_KEY=secret_xxx

# 선택 설정
NOTION_PAGE_IDS=page_id_1,page_id_2  # 접근 허용 페이지 제한
LOG_LEVEL=info                        # debug, info, warn, error
CACHE_TTL=300                         # 캐시 TTL (초)
```

### 의존성 설치

```bash
# 루트 디렉토리에서
npm install

# 또는 워크스페이스 지정
npm install -w mcp-spec-reader
```

## 사용법

### stdio 모드 (Claude Desktop)

```bash
npm run dev -w mcp-spec-reader
```

### HTTP 모드 (원격 배포)

```bash
npm run dev:http -w mcp-spec-reader
```

서버가 `http://localhost:3002`에서 시작됩니다.

### MCP Inspector 테스트

```bash
npm run inspector -w mcp-spec-reader
```

### Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-spec-reader": {
      "command": "node",
      "args": ["/path/to/mcp-spec-reader/dist/stdio.js"],
      "env": {
        "NOTION_API_KEY": "secret_xxx"
      }
    }
  }
}
```

## 개발

### 빌드

```bash
npm run build -w mcp-spec-reader
```

### 타입 검사

```bash
npm run typecheck -w mcp-spec-reader
```

### 테스트

```bash
npm test -w mcp-spec-reader
```

## HTTP 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| `POST /mcp` | MCP 요청 처리 |
| `GET /mcp` | SSE 스트림 연결 |
| `DELETE /mcp` | 세션 종료 |
| `GET /health` | 헬스 체크 |

세션 ID는 `mcp-session-id` 헤더로 관리됩니다.

## Docker

### 빌드

```bash
# 루트 디렉토리에서
docker build -t mcp-spec-reader -f mcp-spec-reader/Dockerfile .
```

### 실행

```bash
docker run -d \
  --name mcp-spec-reader \
  -p 3002:3002 \
  -e NOTION_API_KEY=secret_xxx \
  mcp-spec-reader
```

### 헬스 체크

```bash
curl http://localhost:3002/health
```

## 아키텍처

```
mcp-spec-reader/
├── src/
│   ├── stdio.ts          # stdio transport 진입점
│   ├── http.ts           # HTTP transport 진입점
│   ├── config/           # 환경변수 관리
│   │   └── index.ts
│   ├── bmad/             # BMAD 파서 모듈 ✨ NEW
│   │   ├── parser.ts           # workflow.yaml 파서
│   │   ├── configResolver.ts   # config 변수 해석
│   │   └── agentParser.ts      # 에이전트 .md 파서
│   ├── notion/           # Notion 클라이언트
│   │   └── client.ts
│   ├── tools/            # MCP 도구
│   │   ├── index.ts
│   │   ├── listWorkflows.ts           # 워크플로우 목록 ✨
│   │   ├── getWorkflowContext.ts      # 워크플로우 컨텍스트 ✨
│   │   └── getAgentMenu.ts            # 에이전트 메뉴 ✨
│   ├── resources/        # MCP 리소스
│   │   └── index.ts
│   └── prompts/          # MCP 프롬프트
│       └── index.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── Dockerfile
└── .env.example
```

## 관련 문서

- [PRD](_bmad-output/prd.md)
- [Architecture](_bmad-output/architecture.md)
- [Epics & Stories](_bmad-output/epics.md)

## 라이선스

MIT
