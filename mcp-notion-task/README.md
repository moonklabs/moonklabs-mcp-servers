# MCP Notion Task

Notion MKL작업 데이터베이스 관리를 위한 MCP (Model Context Protocol) 서버입니다.

## 기능

- **작업 조회**: 개별 작업, 목록, 내 스프린트 작업 조회
- **작업 관리**: 생성, 수정, 상태 변경, 보관
- **진행 로그**: 마크다운 형식의 진행 로그 추가
- **페이지 내용**: Notion 페이지 본문 조회 (마크다운 변환)
- **Inbox 관리**: 문서 조회, 생성, 수정

## 빠른 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Notion API 토큰과 데이터베이스 ID 입력

# 개발 모드 실행
npm run dev          # stdio 서버
npm run dev:http     # HTTP 서버 (포트 3434)

# 테스트
npm test
```

## 환경 변수

### 필수 설정

| 변수명 | 설명 |
|--------|------|
| `NOTION_TOKEN` | Notion Integration 토큰 |
| `NOTION_TASK_DATABASE_ID` | MKL작업 데이터베이스 ID |
| `NOTION_SPRINT_DATABASE_ID` | 스프린트 데이터베이스 ID |
| `NOTION_INBOX_DATABASE_ID` | Inbox(문서) 데이터베이스 ID |
| `EMAIL_DOMAIN` | 사용자 이메일 도메인 (예: `moonklabs.com`) |

### 선택 설정

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `PORT` | `3434` | HTTP 서버 포트 |
| `HOST` | `0.0.0.0` | HTTP 서버 호스트 |
| `LOG_LEVEL` | `info` | 로그 레벨 (`debug`, `info`, `warn`, `error`, `silent`) |

**EMAIL_DOMAIN 설명:**
각 도구에서 userId (이메일 앞부분)를 전체 이메일로 변환할 때 사용됩니다.
- 예: userId `"hong"` + EMAIL_DOMAIN `"moonklabs.com"` → `"hong@moonklabs.com"`

## MCP 도구 (14개)

### 핵심 도구 (5개)

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `notion-task-my-sprint` | 내 스프린트 작업 조회 | `userId`, `sprintNumber`, `status?`, `includeSubAssignee?` |
| `notion-task-update-status` | 작업 상태 빠르게 변경 | `pageId`, `status` |
| `notion-task-add-log` | 진행 로그 추가 | `pageId`, `content`, `author`, `logType?` |
| `notion-task-get-content` | 페이지 내용 조회 | `pageId` |
| `notion-task-update` | 작업 속성 수정 | `pageId`, `title?`, `status?`, `priority?`, ... |

### 보조 도구 (5개)

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `notion-task-get` | 작업 메타데이터 조회 | `pageId` |
| `notion-task-list` | 작업 목록 검색 | `status?`, `userId?`, `sprintId?`, `sortBy?`, ... |
| `notion-task-create` | 새 작업 생성 | `title`, `userId?`, `status?`, `issueType?`, `priority?`, ... |
| `notion-task-archive` | 작업 보관 | `pageId` |
| `notion-task-help` | 도구 사용법 안내 | `topic?` (`all`, `workflow`, `status`, `sprint`) |

### Inbox (문서) 도구 (4개)

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `notion-inbox-list` | Inbox 문서 목록 조회 | `tags?`, `sortBy?`, `limit?` |
| `notion-inbox-get` | Inbox 문서 상세 조회 | `pageId` |
| `notion-inbox-create` | 새 Inbox 문서 생성 | `title`, `userIds?`, `tags?`, `content?` |
| `notion-inbox-update` | Inbox 문서 수정 | `pageId`, `title?`, `tags?`, `appendContent?` |

**userId 파라미터:** 이메일 앞부분만 입력하세요 (예: `"hong"` → `"hong@moonklabs.com"`)

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

## 사용자 식별

모든 도구는 `userId` 또는 `author` 파라미터를 통해 사용자를 식별합니다.

### userId 형식

**이메일 앞부분만 입력**하면 자동으로 전체 이메일로 변환됩니다:
- 입력: `"hong"`
- 변환: `"hong@moonklabs.com"` (EMAIL_DOMAIN 환경변수 사용)

### X-User-Id 헤더를 통한 자동 주입 (권장)

**Claude Desktop HTTP MCP 설정**에서 `X-User-Id` 헤더를 추가하면 **모든 도구에서 userId 파라미터를 생략**할 수 있습니다:

```json
{
  "mcpServers": {
    "notion-task": {
      "type": "http",
      "url": "http://your-server:3434/mcp",
      "headers": {
        "X-User-Id": "dosunyun"
      }
    }
  }
}
```

**효과:**
- `notion-task-my-sprint`: userId 파라미터 생략 가능
- `notion-task-create`: userId 파라미터 생략 가능 (담당자 자동 설정)
- `notion-task-list`: userId 파라미터 생략 가능 (전체 조회 가능)
- `notion-task-add-log`: author 파라미터 생략 가능 (헤더의 userId 사용)
- `notion-inbox-create`: userIds 파라미터 생략 가능 (작성자 자동 설정)

**파라미터 우선순위:** 도구 호출 시 명시적으로 userId/author를 전달하면 헤더 값보다 파라미터가 우선됩니다.

### 사용 예시

```javascript
// 헤더가 설정된 경우 (X-User-Id: "hong")
// 내 스프린트 작업 조회 - userId 생략
{
  "name": "notion-task-my-sprint",
  "arguments": {
    "sprintNumber": 50
  }
}

// 진행 로그 추가 - author 생략
{
  "name": "notion-task-add-log",
  "arguments": {
    "pageId": "xxx",
    "content": "작업 완료"
  }
}

// Inbox 문서 생성 - userIds 생략 (헤더의 userId를 작성자로 설정)
{
  "name": "notion-inbox-create",
  "arguments": {
    "title": "회의록",
    "content": "# 회의 내용..."
  }
}

// 헤더가 없거나 다른 사용자를 지정하는 경우
{
  "name": "notion-task-my-sprint",
  "arguments": {
    "userId": "kim",  // 파라미터가 헤더보다 우선
    "sprintNumber": 50
  }
}
```

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
        "NOTION_SPRINT_DATABASE_ID": "xxx",
        "NOTION_INBOX_DATABASE_ID": "xxx",
        "EMAIL_DOMAIN": "moonklabs.com"
      }
    }
  }
}
```

### Claude Desktop 설정 (원격 HTTP 서버)

**기본 설정:**
```json
{
  "mcpServers": {
    "notion-task": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://your-server:3434/mcp"
      ]
    }
  }
}
```

**X-User-Id 헤더 설정 (권장):**
```json
{
  "mcpServers": {
    "notion-task": {
      "type": "http",
      "url": "http://your-server:3434/mcp",
      "headers": {
        "X-User-Id": "dosunyun"
      }
    }
  }
}
```
> 헤더를 설정하면 모든 도구에서 userId/author 파라미터를 생략할 수 있습니다.

### HTTP 서버 배포

```bash
# .env 파일 설정
cp .env.example .env
# NOTION_TOKEN, DATABASE IDs, EMAIL_DOMAIN 설정

# 개발 모드 (자동 재로드)
npm run dev:http

# 프로덕션 모드
npm run build
npm run start:http
```

### 다른 LLM에서 HTTP API 호출

```bash
# 1. 세션 초기화
curl -X POST http://your-server:3434/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
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
curl -X POST http://your-server:3434/mcp \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc": "2.0", "method": "notifications/initialized"}'

# 3. 도구 호출 (X-User-Id 헤더 권장, 또는 userId 파라미터 사용)
# 방법 1: X-User-Id 헤더 사용 (권장)
curl -X POST http://your-server:3434/mcp \
  -H "mcp-session-id: <session-id>" \
  -H "X-User-Id: hong" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "notion-task-my-sprint",
      "arguments": {
        "sprintNumber": 50
      }
    }
  }'

# 방법 2: userId 파라미터 사용 (헤더 없이)
curl -X POST http://your-server:3434/mcp \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "notion-task-my-sprint",
      "arguments": {
        "userId": "hong",
        "sprintNumber": 50
      }
    }
  }'
```

### Docker 배포

```bash
# 이미지 빌드
docker build -t mcp-notion-task .

# 컨테이너 실행
docker run -d -p 3434:3434 \
  -e NOTION_TOKEN=secret_xxx \
  -e NOTION_TASK_DATABASE_ID=xxx \
  -e NOTION_SPRINT_DATABASE_ID=xxx \
  -e NOTION_INBOX_DATABASE_ID=xxx \
  -e EMAIL_DOMAIN=moonklabs.com \
  --name mcp-notion-task \
  mcp-notion-task

# 또는 docker-compose 사용 (.env 파일 필요)
docker compose up -d

# 헬스체크
curl http://localhost:3434/health

# 로그 확인
docker logs mcp-notion-task
```

### 도구 호출 예시

```javascript
// X-User-Id 헤더가 설정된 경우

// 내 스프린트 작업 조회 (userId 생략 가능)
{
  "name": "notion-task-my-sprint",
  "arguments": {
    "sprintNumber": 50,
    "status": "진행 중"  // optional
  }
}

// 진행 로그 추가 (author 생략 가능, 헤더의 userId 사용)
{
  "name": "notion-task-add-log",
  "arguments": {
    "pageId": "page-id-xxx",
    "content": "## 작업 완료\n- API 연동 완료\n- 테스트 통과",
    "logType": "progress"
  }
}

// 작업 상태 변경 (userId 불필요)
{
  "name": "notion-task-update-status",
  "arguments": {
    "pageId": "page-id-xxx",
    "status": "완료"
  }
}

// 작업 생성 (userId 생략 시 헤더 값 사용)
{
  "name": "notion-task-create",
  "arguments": {
    "title": "새 작업",
    "status": "시작 전",
    "priority": "높음"
  }
}

// X-User-Id 헤더가 없는 경우 (또는 파라미터 우선)

// userId 파라미터 명시
{
  "name": "notion-task-my-sprint",
  "arguments": {
    "userId": "hong",  // 필수 (헤더 없으면)
    "sprintNumber": 50
  }
}

// author 파라미터 명시
{
  "name": "notion-task-add-log",
  "arguments": {
    "pageId": "page-id-xxx",
    "content": "작업 완료",
    "author": "hong"  // 필수 (헤더 없으면)
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
├── http.ts               # HTTP transport 진입점
├── config/
│   └── index.ts          # 환경변수 관리
├── notion/
│   ├── client.ts         # Notion 클라이언트
│   └── types.ts          # Task, TaskStatus 타입
├── tools/
│   ├── index.ts          # 도구 등록
│   ├── task/             # 10개 Task 도구
│   │   ├── get.ts / getLogic.ts
│   │   ├── list.ts / listLogic.ts
│   │   ├── mySprint.ts / mySprintLogic.ts
│   │   ├── updateStatus.ts / updateStatusLogic.ts
│   │   ├── update.ts / updateLogic.ts
│   │   ├── addLog.ts / addLogLogic.ts
│   │   ├── getContent.ts / getContentLogic.ts
│   │   ├── create.ts / createLogic.ts
│   │   ├── archive.ts / archiveLogic.ts
│   │   └── help.ts / helpLogic.ts
│   └── inbox/            # 4개 Inbox 도구
│       ├── list.ts / listLogic.ts
│       ├── get.ts / getLogic.ts
│       ├── create.ts / createLogic.ts
│       └── update.ts / updateLogic.ts
└── utils/
    ├── propertyBuilder.ts    # Notion 속성 빌더
    ├── propertyParser.ts     # 응답 파서
    ├── responseFormatter.ts  # 마크다운 포매터
    ├── markdownToBlocks.ts   # MD ↔ Notion 블록
    ├── userIdToEmail.ts      # userId → 이메일 변환
    └── emailToUserId.ts      # 이메일 → UUID 변환
```

## HTTP 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/mcp` | MCP 요청 처리 (세션 자동 생성) |
| GET | `/mcp` | SSE 스트림 연결 |
| DELETE | `/mcp` | 세션 종료 |
| GET | `/health` | 헬스 체크 (활성 세션 수 포함) |

**헤더:**
- `mcp-session-id: <uuid>` - 세션 ID (initialize 후 사용, 필수)
- `Content-Type: application/json` - JSON 요청 (필수)
- `X-User-Id: <userId>` - 사용자 ID (선택, 설정 시 도구에서 userId/author 파라미터 생략 가능)

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
