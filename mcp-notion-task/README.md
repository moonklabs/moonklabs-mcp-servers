# MCP Notion Task

Notion MKL작업 데이터베이스 관리를 위한 MCP (Model Context Protocol) 서버입니다.

## 기능

- **작업 조회**: 개별 작업, 목록, 내 스프린트 작업 조회
- **작업 관리**: 생성, 수정, 상태 변경, 보관
- **진행 로그**: 마크다운 형식의 진행 로그 추가
- **페이지 내용**: Notion 페이지 본문 조회 (마크다운 변환)
- **개발자 인증**: 토큰 기반 인증 및 자동 사용자 정보 주입

## 빠른 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Notion API 토큰과 데이터베이스 ID 입력

# 개발 모드 실행
npm run dev          # stdio 서버
npm run dev:http     # HTTP 서버 (포트 3000)

# 테스트
npm test
```

## 환경 변수

### Notion 설정

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NOTION_TOKEN` | O | Notion Integration 토큰 |
| `NOTION_TASK_DATABASE_ID` | O | MKL작업 데이터베이스 ID |
| `NOTION_SPRINT_DATABASE_ID` | O | 스프린트 데이터베이스 ID |

### 인증 설정 (HTTP 서버)

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `AUTH_USERS` | 권장 | - | 인증된 사용자 목록 (형식: `token:email:name,token:email:name,...`) |
| `AUTH_REQUIRED` | X | `true` | 인증 필수 여부 (`false`면 익명 접근 허용) |

**예시:**
```bash
AUTH_USERS=abc123:user1@moonklabs.com:홍길동,def456:user2@moonklabs.com:김철수
AUTH_REQUIRED=true
```

## MCP 도구 (10개)

### 핵심 도구 (5개)

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `notion-task-my-sprint` | 내 스프린트 작업 조회 | `sprintNumber`, `email?`*, `status?`, `includeSubAssignee?` |
| `notion-task-update-status` | 작업 상태 빠르게 변경 | `pageId`, `status` |
| `notion-task-add-log` | 진행 로그 추가 | `pageId`, `content`, `author?`*, `logType?` |
| `notion-task-get-content` | 페이지 내용 조회 | `pageId` |
| `notion-task-update` | 작업 속성 수정 | `pageId`, `title?`, `status?`, `priority?`, ... |

### 보조 도구 (4개)

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `notion-task-get` | 작업 메타데이터 조회 | `pageId` |
| `notion-task-list` | 작업 목록 검색 | `status?`, `assignee?`, `useSessionUser?`*, `sprintId?`, ... |
| `notion-task-create` | 새 작업 생성 | `title`, `status?`, `issueType?`, `priority?`, ... |
| `notion-task-archive` | 작업 보관 | `pageId` |

### 도움말 도구 (1개)

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `notion-task-help` | 도구 사용법 안내 | `topic?` (`all`, `workflow`, `status`, `sprint`) |

**\* 인증된 세션에서는 자동 주입됨**

### 상태 값

- `시작 전` - 대기 중
- `일시중지` - 일시 중단
- `진행 중` - 작업 중
- `완료` - 완료됨
- `보관됨` - 보관됨
- `상담완료` - 상담 완료

### 로그 타입

- `progress` 🔄 - 일반 진행 로그 (기본값)
- `blocker` 🚧 - 차단 사항
- `decision` ✅ - 결정 사항
- `note` 📌 - 메모

## 인증 시스템

HTTP 서버는 토큰 기반 인증을 지원합니다.

### 관리자: 사용자 추가

`.env` 파일에 사용자 정보 추가:
```bash
AUTH_USERS=token1:email1@example.com:이름1,token2:email2@example.com:이름2
```

### 개발자: 인증 후 사용

인증된 세션에서는 `email`과 `author` 파라미터를 생략 가능:
```javascript
// 인증 전: email 필수
notion-task-my-sprint {"email": "user@example.com", "sprintNumber": 50}

// 인증 후: email 자동 주입
notion-task-my-sprint {"sprintNumber": 50}

// 인증 후: author 자동 주입
notion-task-add-log {"pageId": "xxx", "content": "작업 완료"}
```

### 장점

- ✅ 개발자별 작업 자동 추적
- ✅ 파라미터 입력 간소화
- ✅ 실수로 다른 사람 이름 사용 방지

## 사용 예시

### Claude Desktop 설정 (로컬)

```json
{
  "mcpServers": {
    "notion-task": {
      "command": "node",
      "args": ["/path/to/mcp-notion-task/dist/stdio.js"],
      "env": {
        "NOTION_TOKEN": "secret_xxx",
        "NOTION_TASK_DATABASE_ID": "xxx",
        "NOTION_SPRINT_DATABASE_ID": "xxx"
      }
    }
  }
}
```

### Claude Desktop 설정 (원격 HTTP 서버 + 인증)

```json
{
  "mcpServers": {
    "notion-task": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://your-server:3000/mcp",
        "--header",
        "Authorization: Bearer ${AUTH_TOKEN}"
      ],
      "env": {
        "AUTH_TOKEN": "your-personal-token"
      }
    }
  }
}
```

### HTTP 서버 배포

```bash
# .env 파일 설정
cp .env.example .env
# NOTION_TOKEN, DATABASE IDs, AUTH_USERS 설정

# 개발 모드 (자동 재로드)
npm run dev:http

# 프로덕션 모드
npm run build
npm run start:http
```

### 다른 LLM에서 HTTP API 호출

```bash
# 1. 세션 초기화
curl -X POST http://your-server:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "my-client", "version": "1.0.0"}
    }
  }'

# 응답에서 mcp-session-id 헤더 추출

# 2. initialized 알림
curl -X POST http://your-server:3000/mcp \
  -H "mcp-session-id: <session-id>" \
  -H "Authorization: Bearer your-token" \
  -d '{"jsonrpc": "2.0", "method": "notifications/initialized"}'

# 3. 도구 호출 (email 자동 주입!)
curl -X POST http://your-server:3000/mcp \
  -H "mcp-session-id: <session-id>" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "notion-task-my-sprint",
      "arguments": {"sprintNumber": 50}
    }
  }'
```

### Docker 배포

```bash
# 이미지 빌드
docker build -t mcp-notion-task .

# 컨테이너 실행
docker run -d -p 3000:3000 \
  -e NOTION_TOKEN=secret_xxx \
  -e NOTION_TASK_DATABASE_ID=xxx \
  -e NOTION_SPRINT_DATABASE_ID=xxx \
  -e AUTH_USERS=token1:user1@example.com:이름1 \
  -e AUTH_REQUIRED=true \
  --name mcp-notion-task \
  mcp-notion-task

# 또는 docker-compose 사용 (.env 파일 필요)
docker compose up -d

# 헬스체크
curl http://localhost:3000/health

# 로그 확인
docker logs mcp-notion-task
```

### 도구 호출 예시

```javascript
// 내 스프린트 작업 조회 (인증된 세션에서는 email 생략)
{
  "name": "notion-task-my-sprint",
  "arguments": {
    "sprintNumber": 50,
    "status": "진행 중"  // optional
  }
}

// 진행 로그 추가 (인증된 세션에서는 author 생략)
{
  "name": "notion-task-add-log",
  "arguments": {
    "pageId": "page-id-xxx",
    "content": "## 작업 완료\n- API 연동 완료\n- 테스트 통과",
    "logType": "progress"
  }
}

// 작업 상태 변경
{
  "name": "notion-task-update-status",
  "arguments": {
    "pageId": "page-id-xxx",
    "status": "완료"
  }
}
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | stdio 서버 개발 모드 |
| `npm run dev:http` | HTTP 서버 개발 모드 (watch) |
| `npm run build` | TypeScript 빌드 |
| `npm start` | stdio 서버 프로덕션 |
| `npm run start:http` | HTTP 서버 프로덕션 |
| `npm test` | Vitest 테스트 실행 |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run inspector` | MCP Inspector로 테스트 |

## 프로젝트 구조

```
src/
├── stdio.ts              # stdio transport 진입점
├── http.ts               # HTTP transport 진입점 + 인증
├── auth/
│   └── index.ts          # 토큰 인증 및 세션 관리
├── config/
│   └── index.ts          # 환경변수 관리
├── notion/
│   ├── client.ts         # Notion 클라이언트
│   └── types.ts          # Task, TaskStatus 타입
├── tools/
│   ├── index.ts          # 도구 등록 + getUserFromSession 헬퍼
│   └── task/             # 10개 도구 구현
│       ├── get.ts / getLogic.ts
│       ├── list.ts / listLogic.ts
│       ├── mySprint.ts / mySprintLogic.ts        # email 자동 주입
│       ├── updateStatus.ts / updateStatusLogic.ts
│       ├── update.ts / updateLogic.ts
│       ├── addLog.ts / addLogLogic.ts            # author 자동 주입
│       ├── getContent.ts / getContentLogic.ts
│       ├── create.ts / createLogic.ts
│       ├── archive.ts / archiveLogic.ts
│       └── help.ts / helpLogic.ts
└── utils/
    ├── propertyBuilder.ts    # Notion 속성 빌더
    ├── propertyParser.ts     # 응답 파서
    ├── responseFormatter.ts  # 마크다운 포매터
    └── markdownToBlocks.ts   # MD ↔ Notion 블록
```

## HTTP 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/mcp` | Bearer Token | MCP 요청 처리 (세션 자동 생성) |
| GET | `/mcp` | Bearer Token | SSE 스트림 연결 |
| DELETE | `/mcp` | - | 세션 종료 |
| GET | `/health` | - | 헬스 체크 (활성 세션 수 포함) |

**헤더 요구사항:**
- `Authorization: Bearer <token>` - 인증 토큰 (AUTH_REQUIRED=true일 때 필수)
- `mcp-session-id: <uuid>` - 세션 ID (initialize 후 사용)

## Notion 데이터베이스 스키마

### MKL작업

| 속성 | 타입 | 설명 |
|------|------|------|
| 이름 | title | 작업 제목 |
| 상태 | select | 대기중/진행중/완료/보류 |
| 우선순위 | select | 높음/중간/낮음 |
| 담당자(정) | people | 주 담당자 |
| 담당자(부) | people | 부 담당자 |
| 스프린트 | relation | 스프린트 연결 |
| 마감일 | date | 마감일 |
| 예상 시간 | number | 예상 시간 (시간) |

### 스프린트

| 속성 | 타입 | 설명 |
|------|------|------|
| 이름 | title | "스프린트 {번호}" 형식 |

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [Notion API 문서](https://developers.notion.com)
- [@tryfabric/martian](https://github.com/tryfabric/martian) - 마크다운 변환

## 라이선스

MIT
