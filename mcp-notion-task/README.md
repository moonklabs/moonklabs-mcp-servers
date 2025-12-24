# MCP Notion Task

Notion MKL작업 데이터베이스 관리를 위한 MCP (Model Context Protocol) 서버입니다.

## 기능

- **작업 조회**: 개별 작업, 목록, 내 스프린트 작업 조회
- **작업 관리**: 생성, 수정, 상태 변경, 보관
- **진행 로그**: 마크다운 형식의 진행 로그 추가
- **페이지 내용**: Notion 페이지 본문 조회 (마크다운 변환)

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

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NOTION_API_TOKEN` | O | Notion Integration 토큰 |
| `TASK_DATABASE_ID` | O | MKL작업 데이터베이스 ID |
| `SPRINT_DATABASE_ID` | O | 스프린트 데이터베이스 ID |

## MCP 도구

### 조회

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `get-task` | 작업 상세 조회 | `taskId` |
| `list-tasks` | 작업 목록 조회 | `status?`, `assignee?`, `sprintNumber?`, `limit?` |
| `get-my-sprint-tasks` | 내 스프린트 작업 | `email`, `sprintNumber`, `status?` |
| `get-task-content` | 페이지 본문 조회 | `taskId` |

### 관리

| 도구 | 설명 | 주요 파라미터 |
|------|------|---------------|
| `create-task` | 작업 생성 | `title`, `sprintNumber?`, `assignee?`, `priority?` |
| `update-task` | 작업 수정 | `taskId`, `title?`, `description?`, `priority?`, ... |
| `update-task-status` | 상태 변경 | `taskId`, `status` |
| `add-task-log` | 진행 로그 추가 | `taskId`, `content`, `author`, `logType?` |
| `archive-task` | 작업 보관 | `taskId` |

### 상태 값

- `대기중` - 시작 전
- `진행중` - 작업 중
- `완료` - 완료됨
- `보류` - 일시 중단

### 로그 타입

- `progress` - 일반 진행 로그 (기본값)
- `blocker` - 차단 사항
- `decision` - 결정 사항
- `review` - 리뷰 내용

## 사용 예시

### Claude Desktop 설정

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

### HTTP 서버 배포

```bash
# 서버 시작
npm run start:http

# Docker
docker build -t mcp-notion-task .
docker run -p 3000:3000 --env-file .env mcp-notion-task
```

### 도구 호출 예시

```typescript
// 내 스프린트 작업 조회
{
  "tool": "get-my-sprint-tasks",
  "arguments": {
    "email": "user@example.com",
    "sprintNumber": 5,
    "status": "진행중"
  }
}

// 진행 로그 추가
{
  "tool": "add-task-log",
  "arguments": {
    "taskId": "page-id-xxx",
    "content": "## 작업 완료\n- API 연동 완료\n- 테스트 통과",
    "author": "홍길동",
    "logType": "progress"
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
│   └── task/             # 9개 도구 구현
│       ├── get.ts / getLogic.ts
│       ├── list.ts / listLogic.ts
│       ├── mySprint.ts / mySprintLogic.ts
│       ├── updateStatus.ts / updateStatusLogic.ts
│       ├── update.ts / updateLogic.ts
│       ├── addLog.ts / addLogLogic.ts
│       ├── getContent.ts / getContentLogic.ts
│       ├── create.ts / createLogic.ts
│       └── archive.ts / archiveLogic.ts
└── utils/
    ├── propertyBuilder.ts    # Notion 속성 빌더
    ├── propertyParser.ts     # 응답 파서
    ├── responseFormatter.ts  # 마크다운 포매터
    └── markdownToBlocks.ts   # MD ↔ Notion 블록
```

## HTTP 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/mcp` | MCP 요청 처리 |
| GET | `/mcp` | SSE 스트림 연결 |
| DELETE | `/mcp` | 세션 종료 |
| GET | `/health` | 헬스 체크 |

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
