# Story 1.2: 공통 타입 정의 (types)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-26
**Completed:** 2025-12-26

---

## Story

As a **개발자**,
I want **모든 MCP 서버에서 사용할 공통 타입이 정의되어 있길**,
So that **타입 안전성을 보장하고 일관된 인터페이스를 사용할 수 있습니다**.

---

## Acceptance Criteria

### AC1: types 디렉토리 구조 생성
**Given** packages/common/src/types 폴더가 생성됨
**When** 타입 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/types/
├── index.ts      # re-export hub
├── mcp.ts        # MCP 응답 타입
├── notion.ts     # Notion API 타입
└── cache.ts      # 캐시 관련 타입
```

### AC2: MCP 응답 타입 정의 (mcp.ts)
**Given** mcp.ts 파일이 생성됨
**When** MCP 응답 타입들이 정의됨
**Then** 다음 타입이 정의되어야 함:
- `McpResponse<T>`: 성공 응답 (`status`, `data`, `token_count`, `cached`)
- `McpErrorResponse`: 에러 응답 (`status`, `error_code`, `message`, `suggestion` 필수, `available_options?`, `retry_after?`)
- `McpToolResult`: MCP SDK 도구 결과 타입
**And** 모든 타입에 JSDoc 주석이 포함됨

### AC3: Notion 타입 정의 (notion.ts)
**Given** notion.ts 파일이 생성됨
**When** Notion API 관련 타입들이 정의됨
**Then** 다음 타입이 정의되어야 함:
- `NotionPage`: 페이지 정보 (id, title, last_edited_time)
- `NotionBlock`: 블록 정보 (id, type, content)
- `NotionDatabase`: 데이터베이스 정보

### AC4: 캐시 타입 정의 (cache.ts)
**Given** cache.ts 파일이 생성됨
**When** 캐시 관련 타입들이 정의됨
**Then** 다음 타입이 정의되어야 함:
- `CacheOptions`: 캐시 설정 (ttl, checkperiod)
- `CacheEntry<T>`: 캐시 항목 (value, timestamp, ttl)
- `CacheKey`: 캐시 키 형식 (server:resource:id:hash)

### AC5: 타입 Export 및 Import 검증
**Given** types/index.ts에서 모든 타입이 re-export됨
**When** 다른 패키지에서 import 시도함
**Then** `import type { McpResponse } from '@moonklabs/mcp-common'`로 import 가능함
**And** `import type { McpErrorResponse, CacheOptions } from '@moonklabs/mcp-common'`로 import 가능함

### AC6: 타입 테스트 작성
**Given** 타입 테스트 파일이 생성됨
**When** 타입 안전성 테스트가 실행됨
**Then** 타입 추론이 정확하게 동작함을 검증함
**And** 필수 필드 누락 시 컴파일 에러가 발생함을 검증함

---

## Tasks / Subtasks

### Task 1: types 디렉토리 구조 생성 (AC: 1)
- [x] 1.1 `src/types/` 디렉토리 생성
- [x] 1.2 `src/types/index.ts` 생성 (re-export hub)

### Task 2: MCP 응답 타입 정의 (AC: 2)
- [x] 2.1 `src/types/mcp.ts` 생성
- [x] 2.2 `McpResponse<T>` 제네릭 인터페이스 정의
- [x] 2.3 `McpErrorResponse` 인터페이스 정의 (suggestion 필수!)
- [x] 2.4 `McpToolResult` 타입 정의 (MCP SDK 호환)
- [x] 2.5 JSDoc 주석 추가

### Task 3: Notion 타입 정의 (AC: 3)
- [x] 3.1 `src/types/notion.ts` 생성
- [x] 3.2 `NotionPage` 인터페이스 정의
- [x] 3.3 `NotionBlock` 인터페이스 정의
- [x] 3.4 `NotionDatabase` 인터페이스 정의
- [x] 3.5 JSDoc 주석 추가

### Task 4: 캐시 타입 정의 (AC: 4)
- [x] 4.1 `src/types/cache.ts` 생성
- [x] 4.2 `CacheOptions` 인터페이스 정의
- [x] 4.3 `CacheEntry<T>` 제네릭 인터페이스 정의
- [x] 4.4 `CacheKey` 타입 정의 (template literal type 권장)
- [x] 4.5 JSDoc 주석 추가

### Task 5: 타입 Export 통합 (AC: 5)
- [x] 5.1 `types/index.ts`에서 모든 타입 re-export
- [x] 5.2 `src/index.ts` 업데이트하여 types re-export
- [x] 5.3 빌드 및 import 검증

### Task 6: 타입 테스트 작성 (AC: 6)
- [x] 6.1 `src/types/__tests__/mcp.test.ts` 생성
- [x] 6.2 `src/types/__tests__/cache.test.ts` 생성
- [x] 6.3 타입 추론 테스트 (expectTypeOf 사용)
- [x] 6.4 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **타입 파일 위치**: `packages/common/src/types/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import type { McpResponse } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./mcp.js` - .js 확장자 필수!)

3. **MCP 응답 표준** (Architecture §API Patterns):
   ```typescript
   // 성공 응답
   interface McpResponse<T> {
     status: "success";
     data: T;
     token_count: number;
     cached: boolean;
   }

   // 에러 응답 (suggestion 필수!)
   interface McpErrorResponse {
     status: "error";
     error_code: string;        // {SERVICE}_{ERROR_TYPE}
     message: string;           // 한글 사용자 메시지
     suggestion: string;        // 다음 행동 안내 (필수!)
     available_options?: unknown;
     retry_after?: number;
   }
   ```

4. **캐시 키 규칙** (Architecture §Data Architecture):
   ```
   {server}:{resource}:{id}:{hash}
   예: spec-reader:notion:page123:abc123
   ```

5. **JSON 필드명 규칙**:
   - MCP 응답: snake_case (token_count, error_code)
   - 내부 코드: camelCase (tokenCount, errorCode)

### Previous Story Learnings (Story 1.1)

1. **NodeNext 모듈 해석**: import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import type { McpResponse } from './mcp.js';

   // ❌ 잘못된 import (컴파일 에러)
   import type { McpResponse } from './mcp';
   ```

2. **exports 필드 순서**: types를 import/require 앞으로

3. **빈 디렉토리**: `.gitkeep` 파일 필요 없음 (types 폴더에는 파일이 있을 것)

### Type Design Guidelines

1. **제네릭 사용**: `McpResponse<T>`, `CacheEntry<T>`로 재사용성 확보

2. **유니온 타입**: 에러 코드에 리터럴 타입 사용 권장
   ```typescript
   type ErrorCode =
     | 'NOTION_RATE_LIMIT'
     | 'NOTION_NOT_FOUND'
     | 'STORY_NOT_FOUND'
     | 'TOKEN_LIMIT_EXCEEDED';
   ```

3. **Template Literal Type**: 캐시 키 형식 검증
   ```typescript
   type CacheKey = `${string}:${string}:${string}:${string}`;
   ```

### Testing Strategy

- **타입 테스트**: vitest의 `expectTypeOf` 사용
- **컴파일 타임 검증**: 필수 필드 누락 시 타입 에러 확인
- **런타임 테스트**: 타입 가드 함수 테스트 (있다면)

### 참고 문서
- Architecture: `_bmad-output/architecture.md` §API Patterns, §Data Architecture
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.2

### 기존 코드베이스 참조
- Story 1.1에서 생성된 `packages/common/` 구조
- `mcp-notion-task/` - Notion 타입 참조 가능

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (55개 테스트 통과)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import type { ... } from '@moonklabs/mcp-common'` 가능
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan

1. types 디렉토리 구조 생성 (src/types/, __tests__/)
2. MCP 응답 타입 정의 (mcp.ts)
   - McpResponse<T> 제네릭 인터페이스
   - McpErrorResponse (suggestion 필수)
   - McpToolResult, McpToolContent
   - ErrorCode 유니온 타입
   - isMcpResponse, isMcpError 타입 가드 함수
3. Notion API 타입 정의 (notion.ts)
   - NotionPage, NotionBlock, NotionDatabase
   - NotionBlockType, NotionPropertyType 유니온 타입
   - NotionApiError, isNotionApiError 타입 가드
4. 캐시 타입 정의 (cache.ts)
   - CacheKey (template literal type)
   - CacheOptions, CacheEntry<T>, CacheStats
   - DEFAULT_TTL 상수 객체
   - buildCacheKey, parseCacheKey 헬퍼 함수
5. 타입 re-export 통합 (types/index.ts, src/index.ts)
6. 타입 테스트 작성 (vitest expectTypeOf 사용)

### Debug Log

- 모든 구현이 첫 시도에 성공
- Story 1.1에서 배운 `.js` 확장자 규칙 적용하여 컴파일 에러 방지
- 34개 테스트 모두 통과

### Completion Notes

**구현 완료 사항:**
- MCP 응답 타입: McpResponse<T>, McpErrorResponse, McpToolResult, McpResult<T>
- Notion API 타입: NotionPage, NotionBlock, NotionDatabase, NotionBlockType
- 캐시 타입: CacheKey (template literal), CacheOptions, CacheEntry<T>, CacheStats
- 타입 가드: isMcpResponse, isMcpError, isNotionApiError
- 헬퍼 함수: buildCacheKey, parseCacheKey
- 상수: DEFAULT_TTL (Architecture 문서 기반 TTL 값)

**테스트 결과:**
- mcp.test.ts: 13개 테스트 통과
- cache.test.ts: 18개 테스트 통과
- index.test.ts: 3개 테스트 통과
- 총 34개 테스트 통과

**빌드 결과:**
- ESM: dist/index.js (1.15 KB)
- CJS: dist/index.cjs (1.31 KB)
- DTS: dist/index.d.ts (10.77 KB)

---

## File List

### New Files
- `packages/common/src/types/index.ts`
- `packages/common/src/types/mcp.ts`
- `packages/common/src/types/notion.ts`
- `packages/common/src/types/cache.ts`
- `packages/common/src/types/__tests__/mcp.test.ts`
- `packages/common/src/types/__tests__/cache.test.ts`
- `packages/common/src/types/__tests__/notion.test.ts` (코드 리뷰 후 추가)

### Modified Files
- `packages/common/src/index.ts` (types re-export 추가)

### Deleted Files
- None

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-26 | Story 1.2 생성 - 공통 타입 정의 | SM (create-story workflow) |
| 2025-12-26 | 구현 완료 - 모든 타입 정의 및 테스트 (34개 통과) | Dev (dev-story workflow) |
| 2025-12-26 | 코드 리뷰 완료 - 6개 이슈 수정, 테스트 55개로 증가 | Dev (code-review workflow) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §API Patterns, §Data Architecture, §Implementation Patterns |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.2 |
| Story 1.1 | Previous Story Learnings (NodeNext, .js 확장자) |

---

_Story created: 2025-12-26 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
