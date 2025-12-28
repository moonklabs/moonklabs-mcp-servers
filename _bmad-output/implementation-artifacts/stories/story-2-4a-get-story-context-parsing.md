# Story 2.4a: get-story-context - 스토리 파싱 로직

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a AI 에이전트,
I want 스토리 ID로 스토리 파일을 찾고 파싱하여,
so that 스토리의 기본 정보(제목, AC, Tasks)를 추출할 수 있습니다.

## Acceptance Criteria

1. **AC1**: story_id가 다양한 형식으로 전달됨 (형식: "1.3", "Story-1.3", "story-1-3", "2-4a")
2. **AC2**: 스토리 파일이 파싱되어 구조화된 데이터(제목, AC 목록, Tasks 목록)로 반환됨
3. **AC3**: 스토리가 없으면 STORY_NOT_FOUND 에러 반환 (createMcpError 사용)
4. **AC4**: available_options에 사용 가능한 스토리 목록 포함
5. **AC5**: story_id 형식 정규화 로직 포함 (여러 입력 형식 → 표준 파일명 형식)

## Tasks / Subtasks

- [x] Task 1: src/tools/getStoryContextLogic.ts 생성 (AC: #1, #2, #5)
  - [x] 1.1 story_id 형식 정규화 함수 구현 (normalizeStoryId)
    - "1.3" → "story-1.3"
    - "Story-1.3" → "story-1.3"
    - "story-1-3" → "story-1-3" (그대로)
    - "2-4a" → "story-2-4a"
  - [x] 1.2 StoryContext 인터페이스 정의 (title, status, acceptanceCriteria, tasks)
  - [x] 1.3 스토리 마크다운 파싱 함수 구현 (parseStoryMarkdown)
    - 제목 추출 (# Story X.X: ...)
    - Status 추출
    - Acceptance Criteria 섹션 파싱
    - Tasks / Subtasks 섹션 파싱
  - [x] 1.4 getStoryContext 메인 함수 구현

- [x] Task 2: 스토리 파일 탐색 로직 구현 (AC: #1, #3, #4)
  - [x] 2.1 glob 패턴으로 스토리 파일 검색 (_bmad-output/implementation-artifacts/stories/*.md)
  - [x] 2.2 정규화된 story_id와 파일명 매칭
  - [x] 2.3 사용 가능한 스토리 목록 반환 함수 (listAvailableStories)

- [x] Task 3: 에러 처리 구현 (AC: #3, #4)
  - [x] 3.1 STORY_NOT_FOUND 에러 - createMcpError 패턴 사용
  - [x] 3.2 suggestion 필드에 사용 가능한 스토리 목록 안내
  - [x] 3.3 available_options에 스토리 목록 배열 포함

- [x] Task 4: src/tools/getStoryContext.ts 생성 - MCP 도구 등록 (AC: #1-5)
  - [x] 4.1 Zod 스키마 정의 (story_id: string, include_raw_content?: boolean)
  - [x] 4.2 registerGetStoryContextTool 함수 구현
  - [x] 4.3 도구 설명 작성

- [x] Task 5: src/tools/index.ts 업데이트
  - [x] 5.1 registerGetStoryContextTool import 추가
  - [x] 5.2 registerAllTools에서 호출

- [x] Task 6: 단위 테스트 작성 - TDD 접근 (AC: #1-5)
  - [x] 6.1 src/tools/__tests__/getStoryContext.test.ts 생성
  - [x] 6.2 normalizeStoryId 테스트 케이스
    - 다양한 입력 형식 정규화 테스트
  - [x] 6.3 parseStoryMarkdown 테스트 케이스
    - 제목 추출 테스트
    - AC 파싱 테스트
    - Tasks 파싱 테스트
  - [x] 6.4 getStoryContext 통합 테스트
    - 존재하는 스토리 로드 테스트
    - STORY_NOT_FOUND 에러 테스트
    - available_options 포함 확인

- [x] Task 7: 타입 검사 및 린트 통과
  - [x] 7.1 npm run typecheck 통과
  - [x] 7.2 npm run lint 통과 (해당 없음)
  - [x] 7.3 npm test 전체 통과 (72개 테스트)

## Dev Notes

### 아키텍처 패턴 (3계층 분리)

```
src/tools/
├── index.ts                      # registerAllTools() - 도구 등록 헬퍼
├── getStoryContext.ts            # MCP 도구 등록 + Zod 스키마
├── getStoryContextLogic.ts       # 순수 비즈니스 로직 (테스트 대상)
└── __tests__/
    └── getStoryContext.test.ts   # 단위 테스트
```

### 핵심 인터페이스

```typescript
// 스토리 컨텍스트 결과
interface StoryContext {
  story_id: string;           // 정규화된 스토리 ID
  title: string;              // 스토리 제목
  status: string;             // ready-for-dev, in-progress, done 등
  acceptance_criteria: string[]; // AC 목록
  tasks: TaskItem[];          // 태스크 목록
  raw_content?: string;       // 원본 마크다운 (선택적)
}

interface TaskItem {
  description: string;
  completed: boolean;
  subtasks?: TaskItem[];
}
```

### Story 2.3 학습사항 적용

1. **glob v13+ 사용**: `import { glob } from "glob"` + `@types/glob`
2. **TDD 접근**: 테스트 먼저 작성 후 구현
3. **createMcpError 패턴**: suggestion 필드 필수 포함
4. **glob ignore 옵션**: `{ ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"] }`

### 마크다운 파싱 전략

```typescript
// 정규식 패턴
const TITLE_PATTERN = /^#\s*Story\s+[\d.a-z]+:\s*(.+)$/m;
const STATUS_PATTERN = /^Status:\s*(.+)$/m;
const AC_SECTION = /## Acceptance Criteria\n([\s\S]*?)(?=\n## |\n---|\Z)/;
const TASKS_SECTION = /## Tasks \/ Subtasks\n([\s\S]*?)(?=\n## |\n---|\Z)/;
```

### story_id 정규화 규칙

| 입력 형식 | 정규화 결과 | 파일명 매칭 |
|-----------|-------------|-------------|
| "1.3" | "story-1.3" | story-1.3.md, story-1-3.md |
| "Story-1.3" | "story-1.3" | story-1.3.md, story-1-3.md |
| "story-1-3" | "story-1-3" | story-1-3.md |
| "2-4a" | "story-2-4a" | story-2-4a*.md |

### Project Structure Notes

- **파일 위치**: `mcp-context-loader/src/tools/` 내 생성
- **스토리 파일 경로**: `_bmad-output/implementation-artifacts/stories/*.md`
- **네이밍 컨벤션**: camelCase (함수), kebab-case (파일)

### References

- [Source: _bmad-output/epics.md#Story-2.4a]
- [Source: _bmad-output/implementation-artifacts/stories/story-2.3.md#Dev-Agent-Record]
- [Source: project-context.md#Error-Handling]
- [Source: mcp-context-loader/src/tools/loadContextLogic.ts - glob 패턴 참조]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript 타입 오류 수정: `StoryErrorResponse` 인터페이스 생성으로 `available_options` 타입 호환성 해결
- TDD 적용: 28개 테스트 먼저 작성 후 구현

### Completion Notes List

1. **TDD 접근법 적용**: 테스트 먼저 작성(RED) → 구현(GREEN) 순서로 진행
2. **3계층 분리 패턴 준수**: Logic 파일과 MCP 도구 등록 파일 분리
3. **story_id 정규화**: 다양한 입력 형식 지원 (1.3, Story-1.3, story-1-3, 2-4a)
4. **마크다운 파싱**: 정규식으로 제목, Status, AC, Tasks 섹션 추출
5. **에러 처리**: STORY_NOT_FOUND 에러 + available_options 포함
6. **캐싱**: CacheManager.getOrSet() 패턴 적용 (5분 TTL)
7. **glob 패턴**: Story 2.3 학습사항 적용 (ignore 옵션)
8. **타입 안전성**: StoryErrorResponse로 available_options 타입 명시

### Code Review Fixes

코드 리뷰 이후 다음 이슈들이 수정되었습니다:

| 우선순위 | 이슈 | 수정 내용 |
|---------|------|----------|
| H1 | createMcpError 미사용 | AC3 준수를 위해 모든 에러에 createMcpError() 사용 |
| H2 | token_count 누락 | 성공 응답에 token_count 필드 추가 |
| M1 | 에러 캐싱 | 성공 결과만 캐싱하도록 변경 (에러는 캐싱 안 함) |
| M3 | 하드코딩된 패턴 | storyGlobPattern 옵션 추가, DEFAULT_STORY_GLOB_PATTERN export |
| M4 | 마크다운 검증 누락 | warnings 필드 추가, 필수 섹션 누락 시 경고 생성 |

### File List

**신규 생성:**
- `mcp-context-loader/src/tools/getStoryContextLogic.ts` - 비즈니스 로직 (420줄)
- `mcp-context-loader/src/tools/getStoryContext.ts` - MCP 도구 등록 (175줄)
- `mcp-context-loader/src/tools/__tests__/getStoryContext.test.ts` - 단위 테스트 (28개 테스트)

**수정:**
- `mcp-context-loader/src/tools/index.ts` - registerGetStoryContextTool 추가
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - 2-4a 상태 업데이트
