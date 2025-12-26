# Story 1.3: 에러 응답 헬퍼 (errors)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-26

---

## Story

As a **개발자**,
I want **createMcpError() 헬퍼 함수가 제공되어**,
So that **모든 에러 응답에 suggestion 필드가 포함되고 일관된 형식을 유지할 수 있습니다**.

---

## Acceptance Criteria

### AC1: errors 디렉토리 구조 생성
**Given** packages/common/src/errors 폴더가 생성됨
**When** 에러 관련 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/errors/
├── index.ts           # re-export hub
├── createMcpError.ts  # 에러 생성 헬퍼
└── errorCodes.ts      # 에러 코드 상수
```

### AC2: createMcpError 함수 구현
**Given** createMcpError 함수가 호출됨
**When** error_code, message, suggestion 파라미터를 전달함
**Then** McpErrorResponse 객체가 반환됨
**And** 다음 시그니처를 가짐:
```typescript
function createMcpError(
  code: string,
  message: string,
  suggestion: string,
  options?: { available_options?: unknown; retry_after?: number }
): McpErrorResponse
```

### AC3: suggestion 필드 필수 검증
**Given** createMcpError 함수가 정의됨
**When** suggestion 파라미터 없이 호출 시도함
**Then** TypeScript 컴파일 에러가 발생함
**And** 런타임에 suggestion이 빈 문자열이면 에러 발생

### AC4: 에러 코드 상수 정의 (errorCodes.ts)
**Given** errorCodes.ts 파일이 생성됨
**When** 에러 코드 상수들이 정의됨
**Then** 다음 에러 코드가 정의되어야 함:
- `NOTION_RATE_LIMIT`: Notion API 속도 제한
- `NOTION_NOT_FOUND`: Notion 리소스 없음
- `STORY_NOT_FOUND`: 스토리 없음
- `TOKEN_LIMIT_EXCEEDED`: 토큰 제한 초과
- `CACHE_MISS`: 캐시 미스
- `INVALID_INPUT`: 잘못된 입력
- `CONFIG_ERROR`: 설정 오류
**And** 에러 코드 형식은 `{SERVICE}_{ERROR_TYPE}`

### AC5: McpToolResult 반환 헬퍼 구현
**Given** MCP SDK 통합이 필요함
**When** 에러를 MCP 도구 결과로 변환해야 함
**Then** `toMcpToolResult()` 헬퍼 함수가 제공됨:
```typescript
function toMcpToolResult(error: McpErrorResponse): McpToolResult
```
**And** MCP SDK의 content 배열 형식으로 변환됨

### AC6: 타입 Export 및 Import 검증
**Given** errors/index.ts에서 모든 함수가 re-export됨
**When** 다른 패키지에서 import 시도함
**Then** `import { createMcpError } from '@moonklabs/mcp-common'`로 import 가능함
**And** `import { ERROR_CODES } from '@moonklabs/mcp-common'`로 import 가능함

### AC7: 에러 헬퍼 테스트 작성
**Given** 테스트 파일이 생성됨
**When** 에러 헬퍼 테스트가 실행됨
**Then** 다음 항목이 테스트됨:
- createMcpError가 올바른 McpErrorResponse 반환
- suggestion 빈 문자열 시 에러 발생
- available_options 옵션 동작
- retry_after 옵션 동작
- toMcpToolResult 변환 정확성
- ERROR_CODES 상수 존재 확인

---

## Tasks / Subtasks

### Task 1: errors 디렉토리 구조 생성 (AC: 1)
- [x] 1.1 `src/errors/` 디렉토리 생성
- [x] 1.2 `src/errors/index.ts` 생성 (re-export hub)

### Task 2: 에러 코드 상수 정의 (AC: 4)
- [x] 2.1 `src/errors/errorCodes.ts` 생성
- [x] 2.2 ERROR_CODES 객체 정의 (as const)
- [x] 2.3 ErrorCode 유니온 타입 정의
- [x] 2.4 JSDoc 주석 추가

### Task 3: createMcpError 함수 구현 (AC: 2, 3)
- [x] 3.1 `src/errors/createMcpError.ts` 생성
- [x] 3.2 createMcpError 함수 구현
- [x] 3.3 suggestion 빈 문자열 검증 로직 추가
- [x] 3.4 CreateMcpErrorOptions 타입 정의
- [x] 3.5 JSDoc 주석 추가

### Task 4: toMcpToolResult 헬퍼 구현 (AC: 5)
- [x] 4.1 toMcpToolResult 함수 구현
- [x] 4.2 McpToolResult 형식으로 변환
- [x] 4.3 JSDoc 주석 추가

### Task 5: 타입 Export 통합 (AC: 6)
- [x] 5.1 `errors/index.ts`에서 모든 함수/상수 re-export
- [x] 5.2 `src/index.ts` 업데이트하여 errors re-export
- [x] 5.3 빌드 및 import 검증

### Task 6: 에러 헬퍼 테스트 작성 (AC: 7)
- [x] 6.1 `src/errors/__tests__/createMcpError.test.ts` 생성
- [x] 6.2 createMcpError 정상 동작 테스트
- [x] 6.3 suggestion 빈 문자열 검증 테스트
- [x] 6.4 옵션 파라미터 테스트
- [x] 6.5 toMcpToolResult 변환 테스트
- [x] 6.6 ERROR_CODES 상수 테스트
- [x] 6.7 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **파일 위치**: `packages/common/src/errors/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import { createMcpError } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./createMcpError.js` - .js 확장자 필수!)

3. **에러 응답 표준** (Architecture §API Patterns):
   ```typescript
   interface McpErrorResponse {
     status: "error";
     error_code: string;        // {SERVICE}_{ERROR_TYPE}
     message: string;           // 한글 사용자 메시지
     suggestion: string;        // 다음 행동 안내 (필수!)
     available_options?: unknown;
     retry_after?: number;
   }
   ```

4. **createMcpError 시그니처** (Architecture §Error Handling):
   ```typescript
   export function createMcpError(
     code: string,
     message: string,
     suggestion: string,
     options?: { available_options?: unknown; retry_after?: number }
   ): McpErrorResponse {
     return {
       status: 'error',
       error_code: code,
       message,
       suggestion,
       ...options
     };
   }
   ```

5. **에러 코드 카탈로그** (Architecture §Error Codes):
   | 코드 | 설명 | 서비스 |
   |------|------|--------|
   | NOTION_RATE_LIMIT | Notion API 속도 제한 | Notion API |
   | NOTION_NOT_FOUND | Notion 리소스 없음 | Notion API |
   | STORY_NOT_FOUND | 스토리 없음 | context-loader |
   | TOKEN_LIMIT_EXCEEDED | 토큰 제한 초과 | context-loader |
   | CACHE_MISS | 캐시 미스 | 공통 |
   | INVALID_INPUT | 잘못된 입력 | 공통 |
   | CONFIG_ERROR | 설정 오류 | 공통 |

### Previous Story Learnings

1. **NodeNext 모듈 해석** (Story 1.1): import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import { createMcpError } from './createMcpError.js';

   // ❌ 잘못된 import (컴파일 에러)
   import { createMcpError } from './createMcpError';
   ```

2. **타입 가드 null 처리** (Story 1.2): 타입 가드 함수는 null/undefined 체크 필요
   ```typescript
   // result != null && 체크 추가
   ```

3. **exports 필드 순서** (Story 1.1): types를 import/require 앞으로

### Implementation Guidelines

1. **suggestion 필수 검증**:
   ```typescript
   if (!suggestion || suggestion.trim() === '') {
     throw new Error('suggestion은 필수입니다. 빈 문자열은 허용되지 않습니다.');
   }
   ```

2. **에러 코드 형식 검증** (선택적):
   ```typescript
   const ERROR_CODE_PATTERN = /^[A-Z]+_[A-Z_]+$/;
   if (!ERROR_CODE_PATTERN.test(code)) {
     console.warn(`에러 코드 형식이 올바르지 않습니다: ${code}`);
   }
   ```

3. **toMcpToolResult 변환**:
   ```typescript
   export function toMcpToolResult(error: McpErrorResponse): McpToolResult {
     return {
       content: [
         {
           type: 'text',
           text: JSON.stringify(error, null, 2)
         }
       ],
       isError: true
     };
   }
   ```

### Testing Strategy

- **단위 테스트**: vitest로 각 함수 테스트
- **타입 테스트**: expectTypeOf로 반환 타입 검증
- **에러 케이스**: suggestion 빈 문자열 시 에러 발생 검증
- **경계 테스트**: 옵션 파라미터 있을 때/없을 때 동작 검증

### 참고 문서
- Architecture: `_bmad-output/architecture.md` §API Patterns, §Error Handling
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.3

### 기존 코드베이스 참조
- Story 1.2에서 생성된 `packages/common/src/types/mcp.ts` - McpErrorResponse 타입
- `mcp-notion-task/` - 에러 처리 패턴 참조 가능

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (82개 테스트 통과)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import { createMcpError } from '@moonklabs/mcp-common'` 가능
- [x] suggestion 빈 문자열 시 런타임 에러 발생 검증
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan

1. **Task 1**: errors 디렉토리 구조 생성
   - src/errors/ 디렉토리 생성
   - src/errors/index.ts 생성 (re-export hub)

2. **Task 2**: 에러 코드 상수 정의
   - src/errors/errorCodes.ts 생성
   - ERROR_CODES 객체 정의 (as const)
   - ErrorCode 유니온 타입 정의

3. **Task 3**: createMcpError 함수 구현
   - src/errors/createMcpError.ts 생성
   - suggestion 빈 문자열 검증 (런타임)
   - CreateMcpErrorOptions 타입 정의

4. **Task 4**: toMcpToolResult 헬퍼 구현
   - McpToolResult 형식으로 변환
   - isError: true 플래그 설정

5. **Task 5**: 타입 Export 통합
   - errors/index.ts에서 re-export
   - src/index.ts 업데이트

6. **Task 6**: 에러 헬퍼 테스트 작성
   - createMcpError 테스트
   - toMcpToolResult 테스트
   - ERROR_CODES 테스트

### Debug Log

- 모든 구현이 첫 시도에 성공
- Story 1.1, 1.2에서 배운 `.js` 확장자 규칙 적용하여 컴파일 에러 방지
- RED-GREEN-REFACTOR 사이클: 테스트 먼저 작성 후 구현
- 총 79개 테스트 통과 (기존 55개 + 새 24개)

### Completion Notes

**구현 완료 사항:**
- `createMcpError()`: 에러 응답 생성 헬퍼 (suggestion 필수 검증)
- `toMcpToolResult()`: MCP SDK 형식 변환 헬퍼
- `ERROR_CODES`: 표준 에러 코드 상수 (10개)
- `CreateMcpErrorOptions`: 옵션 타입 정의
- `ErrorCodeValue`: 에러 코드 값 유니온 타입

**테스트 결과:**
- createMcpError 테스트: 10개 통과
- toMcpToolResult 테스트: 4개 통과
- ERROR_CODES 테스트: 11개 통과 (코드 리뷰 후 3개 추가)
- CreateMcpErrorOptions 테스트: 2개 통과
- 총 27개 테스트 통과

**빌드 결과:**
- ESM: dist/index.js (2.75 KB)
- CJS: dist/index.cjs (2.98 KB)
- DTS: dist/index.d.ts (14.50 KB)

---

## File List

### New Files
- `packages/common/src/errors/index.ts`
- `packages/common/src/errors/createMcpError.ts`
- `packages/common/src/errors/errorCodes.ts`
- `packages/common/src/errors/__tests__/createMcpError.test.ts`

### Modified Files
- `packages/common/src/index.ts` (errors re-export 추가)
- `packages/common/src/types/mcp.ts` (ErrorCode 타입에 INVALID_INPUT, CONFIG_ERROR 추가 - 코드 리뷰)

### Deleted Files
- None

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-26 | Story 1.3 생성 - 에러 응답 헬퍼 | SM (create-story workflow) |
| 2025-12-26 | 구현 완료 - createMcpError, toMcpToolResult, ERROR_CODES (24개 테스트 통과) | Dev (dev-story workflow) |
| 2025-12-26 | 코드 리뷰 완료 - 4개 이슈 수정, ErrorCode 타입 동기화, 테스트 27개로 증가 | Reviewer (code-review workflow) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §API Patterns, §Error Handling, §Implementation Patterns |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.3 |
| Story 1.1 | Previous Story Learnings (NodeNext, .js 확장자) |
| Story 1.2 | Previous Story Learnings (타입 가드 null 처리) |

---

_Story created: 2025-12-26 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
