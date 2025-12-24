# Moonklabs MCP Servers

MCP (Model Context Protocol) 서버 모노레포입니다.

## 프로젝트 목록

| 프로젝트 | 설명 | 상태 |
|----------|------|------|
| [mcp-boilerplate](./mcp-boilerplate) | MCP 서버 보일러플레이트 템플릿 | ✅ 완료 |
| [mcp-notion-task](./mcp-notion-task) | Notion MKL작업 데이터베이스 관리 | ✅ 완료 |

## 빠른 시작

### 새 MCP 서버 생성

```bash
# 보일러플레이트 복사
cp -r mcp-boilerplate mcp-새서버이름
cd mcp-새서버이름

# package.json의 name 필드 수정
# 도구/리소스/프롬프트 구현
npm install
npm run dev
```

### 기존 서버 실행

```bash
cd mcp-notion-task  # 또는 원하는 프로젝트

# 의존성 설치
npm install

# 개발 모드
npm run dev          # stdio 서버 (Claude Desktop용)
npm run dev:http     # HTTP 서버 (원격 접근용)

# 테스트
npm test
```

## 아키텍처

### MCP 서버 구조

각 MCP 서버는 동일한 3계층 패턴을 따릅니다:

```
src/
├── stdio.ts              # stdio transport (Claude Desktop용)
├── http.ts               # HTTP transport (원격 배포용)
├── tools/                # MCP 도구
│   ├── index.ts          # registerAllTools()
│   ├── feature.ts        # 도구 등록 (Zod 스키마)
│   └── featureLogic.ts   # 순수 비즈니스 로직
├── resources/            # MCP 리소스
└── prompts/              # MCP 프롬프트 템플릿
```

### 핵심 원칙

1. **비즈니스 로직 분리**: `*Logic.ts` 파일에 순수 함수로 분리 → 테스트 용이
2. **등록 헬퍼 패턴**: `registerAll*()` 함수로 서버에 일괄 등록
3. **Transport 분리**: stdio (로컬)와 HTTP (원격) 두 가지 방식 지원

## 개발 환경

### 공통 의존성

- Node.js 18+
- TypeScript 5+
- `@modelcontextprotocol/sdk` - MCP SDK
- `zod` - 스키마 검증
- `vitest` - 테스트 프레임워크

### 스크립트 규칙

모든 프로젝트가 동일한 스크립트 이름을 사용합니다:

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | stdio 서버 개발 모드 |
| `npm run dev:http` | HTTP 서버 개발 모드 |
| `npm run build` | TypeScript 빌드 |
| `npm start` | stdio 서버 프로덕션 |
| `npm run start:http` | HTTP 서버 프로덕션 |
| `npm test` | 테스트 실행 |
| `npm run inspector` | MCP Inspector로 테스트 |

## 프로젝트별 상세

### mcp-boilerplate

새 MCP 서버를 빠르게 시작하기 위한 템플릿입니다.

**포함 예제:**
- 도구: greet, calculator
- 리소스: greeting, config, help
- 프롬프트: greeting, summarize, code-review, translate

### mcp-notion-task

Notion MKL작업 데이터베이스 CRUD를 위한 9개 MCP 도구를 제공합니다.

**도구 목록:**
- 조회: `get-task`, `list-tasks`, `get-my-sprint-tasks`, `get-task-content`
- 관리: `create-task`, `update-task`, `update-task-status`, `add-task-log`, `archive-task`

**필요 환경변수:**
- `NOTION_API_TOKEN`
- `TASK_DATABASE_ID`
- `SPRINT_DATABASE_ID`

## HTTP 서버 배포

각 MCP 서버는 HTTP 서버로 배포하여 여러 클라이언트가 동시 접근할 수 있습니다.

### 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/mcp` | MCP 요청 처리 |
| GET | `/mcp` | SSE 스트림 연결 |
| DELETE | `/mcp` | 세션 종료 |
| GET | `/health` | 헬스 체크 |

### Docker 배포

```bash
cd mcp-notion-task
docker build -t mcp-notion-task .
docker run -p 3000:3000 --env-file .env mcp-notion-task
```

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## 라이선스

MIT
