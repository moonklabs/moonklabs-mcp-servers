# mcp-context-loader

개발 작업 시 필요한 컨텍스트(PRD, Architecture, Stories 등)를 효율적으로 로드하는 MCP 서버입니다.

## 기능

| 도구 | 설명 | 상태 |
|------|------|------|
| `count-tokens` | 텍스트의 토큰 수 계산 | 예정 (Story 2.2) |
| `load-context` | 여러 문서 유형 통합 로드 | 예정 (Story 2.3) |
| `get-story-context` | 스토리별 컨텍스트 로드 | 예정 (Story 2.4) |
| `list-document-types` | 로드 가능한 문서 유형 목록 | 예정 (Story 2.5) |

## 설치

```bash
# 모노레포 루트에서
npm install

# 또는 이 패키지만
npm install -w mcp-context-loader
```

## 개발

```bash
# stdio 서버 (Claude Desktop 연동용)
npm run dev -w mcp-context-loader

# HTTP 서버 (원격 배포용, 포트 3001)
npm run dev:http -w mcp-context-loader

# MCP Inspector로 테스트
npm run inspector -w mcp-context-loader

# 빌드
npm run build -w mcp-context-loader

# 테스트
npm test -w mcp-context-loader

# 타입 검사
npm run typecheck -w mcp-context-loader
```

## 환경변수

`.env.example`을 `.env`로 복사하여 설정하세요.

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `LOG_LEVEL` | 로그 레벨 (debug, info, warn, error) | `info` |
| `NODE_ENV` | 환경 (development, production, test) | `development` |
| `PORT` | HTTP 서버 포트 | `3001` |
| `HOST` | HTTP 서버 호스트 | `0.0.0.0` |
| `PROJECT_ROOT` | 프로젝트 루트 경로 | `.` |
| `CACHE_TTL_SECONDS` | 캐시 TTL (초) | `300` |

## Claude Desktop 설정

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "context-loader": {
      "command": "node",
      "args": ["/path/to/mcp-context-loader/dist/stdio.js"],
      "env": {
        "LOG_LEVEL": "info",
        "PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

## HTTP 서버 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/mcp` | POST | MCP 요청 처리 |
| `/mcp` | GET | SSE 스트림 연결 |
| `/mcp` | DELETE | 세션 종료 |
| `/health` | GET | 헬스 체크 |

세션 ID는 `mcp-session-id` 헤더로 관리됩니다.

## Docker

```bash
# 빌드 (모노레포 루트에서)
docker build -f mcp-context-loader/Dockerfile -t mcp-context-loader .

# 실행
docker run -p 3001:3001 \
  -e LOG_LEVEL=info \
  -e PROJECT_ROOT=/app/project \
  -v /path/to/project:/app/project \
  mcp-context-loader

# 헬스 체크
curl http://localhost:3001/health
```

## 아키텍처

```
mcp-context-loader/
├── src/
│   ├── stdio.ts          # stdio transport 진입점
│   ├── http.ts           # HTTP transport 진입점
│   ├── config/
│   │   └── index.ts      # 환경변수 관리
│   ├── tools/
│   │   ├── index.ts      # registerAllTools()
│   │   └── __tests__/
│   ├── resources/
│   │   └── index.ts
│   └── prompts/
│       └── index.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── Dockerfile
├── .dockerignore
├── .env.example
└── README.md
```

## 의존성

- `@moonklabs/mcp-common` - 공통 모듈 (타입, 에러, 로깅, 캐싱)
- `@modelcontextprotocol/sdk` - MCP SDK
- `express` - HTTP 서버
- `zod` - 스키마 검증

## 라이선스

MIT
