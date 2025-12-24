# CLAUDE.md - mcp-notion-task

This file provides guidance to Claude Code when working with this MCP server.

## 프로젝트 개요

**MKL작업 Notion 데이터베이스 관리용 MCP 서버**

Notion Task(MKL작업) 데이터베이스의 CRUD 작업을 위한 9개 MCP 도구를 제공합니다.
HTTP 서버 형태로 배포되어 여러 개발자가 동시에 사용할 수 있습니다.

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 모드
npm run dev              # stdio 서버 (Claude Desktop 연동용)
npm run dev:http         # HTTP 서버 (watch 모드, 포트 3000)

# 테스트
npm test                 # vitest 실행
npm run test:ui          # vitest UI 모드
npm run test:coverage    # 커버리지 리포트

# 단일 테스트 실행
npx vitest run src/utils/__tests__/propertyParser.test.ts

# 빌드 및 타입 검사
npm run build            # TypeScript 빌드
npm run typecheck        # 타입 검사만

# MCP Inspector로 테스트
npm run inspector
```

## 환경 변수

`.env` 파일 필요:
```bash
NOTION_API_TOKEN=secret_xxx      # Notion Integration Token (필수)
TASK_DATABASE_ID=xxx             # MKL작업 데이터베이스 ID (필수)
SPRINT_DATABASE_ID=xxx           # 스프린트 데이터베이스 ID (필수)
```

**주의**: 서버 시작 시 환경변수가 검증됩니다. 누락 시 즉시 실패합니다.

## 아키텍처

### 디렉토리 구조

```
src/
├── stdio.ts              # stdio transport 진입점
├── http.ts               # HTTP transport 진입점
├── config/
│   └── index.ts          # 환경변수 관리 (조기 검증)
├── notion/
│   ├── client.ts         # Notion 클라이언트 싱글톤
│   └── types.ts          # Task, TaskStatus 등 타입 정의
├── tools/                # 9개 MCP 도구
│   ├── index.ts          # registerAllTools()
│   └── task/
│       ├── get.ts / getLogic.ts           # 작업 상세 조회
│       ├── list.ts / listLogic.ts         # 작업 목록 조회
│       ├── mySprint.ts / mySprintLogic.ts # 내 스프린트 작업
│       ├── updateStatus.ts / updateStatusLogic.ts # 상태 변경
│       ├── update.ts / updateLogic.ts     # 작업 수정
│       ├── addLog.ts / addLogLogic.ts     # 진행 로그 추가
│       ├── getContent.ts / getContentLogic.ts # 페이지 내용 조회
│       ├── create.ts / createLogic.ts     # 작업 생성
│       └── archive.ts / archiveLogic.ts   # 작업 보관
├── resources/            # MCP 리소스 (현재 미사용)
├── prompts/              # MCP 프롬프트 (현재 미사용)
└── utils/
    ├── propertyBuilder.ts   # Notion 속성 빌더
    ├── propertyParser.ts    # Notion 응답 → Task 파싱
    ├── responseFormatter.ts # Task → 마크다운 포맷팅
    └── markdownToBlocks.ts  # 마크다운 → Notion 블록 변환
```

### 3계층 패턴

모든 도구는 3계층으로 분리:
1. **index.ts**: `registerAllTools()` - 도구 등록 헬퍼
2. **tool.ts**: Zod 스키마 정의 및 MCP 도구 등록
3. **toolLogic.ts**: 순수 비즈니스 로직 (테스트 대상)

```typescript
// 예시: updateStatus.ts
server.registerTool("update-task-status", {
  description: "작업 상태 변경",
  inputSchema: updateTaskStatusSchema,
}, async (input) => {
  const result = await updateTaskStatus(input.taskId, input.status);
  return { content: [{ type: "text", text: formatStatusUpdateResult(result) }] };
});
```

## MCP 도구 목록

| 도구명 | 설명 | 주요 파라미터 |
|--------|------|---------------|
| `get-task` | 작업 상세 조회 | taskId |
| `list-tasks` | 작업 목록 조회 | status?, assignee?, sprintNumber?, limit? |
| `get-my-sprint-tasks` | 내 스프린트 작업 | email, sprintNumber, status? |
| `update-task-status` | 상태 변경 | taskId, status |
| `update-task` | 작업 수정 | taskId, title?, description?, ... |
| `add-task-log` | 진행 로그 추가 | taskId, content, author, logType? |
| `get-task-content` | 페이지 내용 조회 | taskId |
| `create-task` | 작업 생성 | title, sprintNumber?, assignee?, ... |
| `archive-task` | 작업 보관 | taskId |

## Notion 스키마

### MKL작업 데이터베이스 속성

| 속성명 | 타입 | 설명 |
|--------|------|------|
| 이름 | title | 작업 제목 |
| 상태 | select | 대기중, 진행중, 완료, 보류 |
| 우선순위 | select | 높음, 중간, 낮음 |
| 담당자(정) | people | 주 담당자 |
| 담당자(부) | people | 부 담당자 |
| 스프린트 | relation | 스프린트 DB 연결 |
| 마감일 | date | 마감일 |
| 예상 시간 | number | 예상 작업 시간 |

### 스프린트 데이터베이스

- **이름**: "스프린트 {number}" 형식 (예: "스프린트 5")
- `findSprintIdByNumber()` 함수로 스프린트 번호 → 페이지 ID 변환

## 핵심 유틸리티

### @tryfabric/martian 사용

마크다운 ↔ Notion 블록 변환:
```typescript
import { markdownToBlocks, blocksToMarkdown } from "./utils/markdownToBlocks.js";

// 마크다운 → Notion 블록
const blocks = markdownToBlocks("# 제목\n본문");

// Notion 블록 → 마크다운
const markdown = blocksToMarkdown(blocks);
```

### 로그 블록 생성

진행 로그는 `createLogBlocks()` 사용:
```typescript
import { createLogBlocks } from "./utils/markdownToBlocks.js";

const blocks = createLogBlocks(content, author, "progress");
// 결과: divider + 헤더(타입/시간/작성자) + 내용 블록들
```

## 테스트

```bash
npm test                 # 전체 테스트 (54개)
npm run test:coverage    # 커버리지 확인
```

테스트 위치: 각 모듈 내 `__tests__/` 폴더

## 주의사항

1. **Notion API `blocks.children.append`**: `after` 파라미터를 지원하지 않음. 블록은 항상 페이지 끝에 추가됨.

2. **스프린트 검색**: `equals` 사용 필수 (`contains` 사용 시 "스프린트 5"가 "스프린트 50"도 매칭)

3. **환경변수 검증**: `stdio.ts`, `http.ts`의 `main()` 시작 시 `getConfig()` 호출로 조기 검증

4. **People 필터**: Notion API에서 people 속성 필터링 시 이메일 직접 사용 가능

## HTTP 서버 엔드포인트

- `POST /mcp` - MCP 요청 처리 (세션 자동 생성)
- `GET /mcp` - SSE 스트림 연결
- `DELETE /mcp` - 세션 종료
- `GET /health` - 헬스 체크

세션 ID는 `mcp-session-id` 헤더로 관리됩니다.
