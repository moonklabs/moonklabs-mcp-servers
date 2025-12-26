# Story 1.8: 테스트 유틸리티 (testing)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-27

---

## Story

As a **개발자**,
I want **Notion API mock, MCP 응답 assertion 헬퍼가 제공되어**,
So that **외부 API 의존성 없이 일관된 테스트를 작성할 수 있습니다**.

---

## Acceptance Criteria

### AC1: testing 디렉토리 구조 생성
**Given** packages/common/src/testing 폴더가 존재함
**When** 테스트 유틸리티 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/testing/
├── index.ts                  # re-export hub
├── assertions.ts             # MCP 응답 검증 헬퍼
├── mocks/
│   ├── index.ts              # mock re-export
│   ├── notion.ts             # Notion API mock
│   └── slack.ts              # Slack API mock (Phase 2 대비)
└── fixtures/
    ├── index.ts              # fixtures re-export
    └── stories.ts            # Story 관련 테스트 데이터
```

### AC2: Notion API Mock 함수 제공
**Given** testing/mocks/notion 모듈이 import됨
**When** mockNotionPage(), mockNotionRateLimit() 함수를 사용함
**Then** nock 기반 HTTP 모킹이 설정됨
**And** Notion API 엔드포인트가 모킹됨
**And** 모킹 후 nock.cleanAll()로 정리 가능

### AC3: MCP 응답 Assertion 헬퍼 제공
**Given** testing/assertions 모듈이 import됨
**When** assertMcpSuccess(), assertMcpError() 함수를 사용함
**Then** MCP 응답 형식이 검증됨
**And** isError: false/true 필드가 확인됨
**And** content 배열 구조가 검증됨

### AC4: 테스트 Fixtures 제공
**Given** testing/fixtures 모듈이 import됨
**When** createMockStory(), createMockNotionPage() 등을 사용함
**Then** 일관된 테스트 데이터가 생성됨
**And** 필요한 필드가 기본값으로 채워짐
**And** 커스터마이징 가능

### AC5: Slack API Mock 준비 (Phase 2 대비)
**Given** testing/mocks/slack 모듈이 존재함
**When** Phase 2에서 Slack 테스트가 필요함
**Then** mockSlackMessage(), mockSlackRateLimit() 스텁이 준비됨
**And** 실제 구현은 Epic 4에서 완성

### AC6: 테스트 유틸리티 단위 테스트
**Given** 테스트 파일이 생성됨
**When** 유틸리티 테스트가 실행됨
**Then** 다음 항목이 테스트됨:
- mockNotionPage 동작 검증
- mockNotionRateLimit 동작 검증
- assertMcpSuccess 동작 검증
- assertMcpError 동작 검증
- Fixture 생성 함수 검증

---

## Tasks / Subtasks

### Task 1: testing 디렉토리 구조 생성 (AC: 1)
- [x] 1.1 `src/testing/` 폴더 생성
- [x] 1.2 `src/testing/mocks/` 폴더 생성
- [x] 1.3 `src/testing/fixtures/` 폴더 생성
- [x] 1.4 각 폴더에 index.ts 생성

### Task 2: Notion API Mock 구현 (AC: 2)
- [x] 2.1 `src/testing/mocks/notion.ts` 생성
- [x] 2.2 `mockNotionPage(pageId, content)` 함수 구현
- [x] 2.3 `mockNotionDatabase(databaseId, pages)` 함수 구현
- [x] 2.4 `mockNotionRateLimit(retryAfter)` 함수 구현
- [x] 2.5 `mockNotionError(statusCode, errorCode)` 함수 구현
- [x] 2.6 nock scope 반환으로 정리 용이하게

### Task 3: MCP Assertion 헬퍼 구현 (AC: 3)
- [x] 3.1 `src/testing/assertions.ts` 생성
- [x] 3.2 `assertMcpSuccess(response, expectedText?)` 함수 구현
- [x] 3.3 `assertMcpError(response, expectedCode?, expectedMessage?)` 함수 구현
- [x] 3.4 `assertMcpContent(response, matcher)` 함수 구현
- [x] 3.5 에러 메시지 개선 (실패 시 실제 값 표시)

### Task 4: 테스트 Fixtures 구현 (AC: 4)
- [x] 4.1 `src/testing/fixtures/stories.ts` 생성
- [x] 4.2 `createMockStory(overrides?)` 함수 구현
- [x] 4.3 `createMockEpic(overrides?)` 함수 구현
- [x] 4.4 `src/testing/fixtures/notion.ts` 생성
- [x] 4.5 `createMockNotionPage(overrides?)` 함수 구현
- [x] 4.6 `createMockNotionBlock(type, content)` 함수 구현

### Task 5: Slack API Mock 스텁 준비 (AC: 5)
- [x] 5.1 `src/testing/mocks/slack.ts` 생성
- [x] 5.2 `mockSlackMessage` 스텁 (TODO 주석)
- [x] 5.3 `mockSlackRateLimit` 스텁 (TODO 주석)
- [x] 5.4 Epic 4 구현 시 완성 예정 명시

### Task 6: Export 통합 및 테스트 (AC: 1, 6)
- [x] 6.1 `src/testing/index.ts` 생성 (모든 모듈 re-export)
- [x] 6.2 `src/index.ts` 업데이트하여 testing re-export
- [x] 6.3 `src/testing/__tests__/mocks.test.ts` 작성
- [x] 6.4 `src/testing/__tests__/assertions.test.ts` 작성
- [x] 6.5 `src/testing/__tests__/fixtures.test.ts` 작성
- [x] 6.6 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **파일 위치**: `packages/common/src/testing/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import { mockNotionPage, assertMcpSuccess } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./mocks/notion.js` - .js 확장자 필수!)

3. **테스트 모킹 전략** (Architecture §Cross-Cutting Concerns):
   - nock 사용 (단순성)
   - beforeEach에서 격리 (AC-6)

4. **3계층 분리 패턴** (Architecture §Implementation Patterns):
   - testing 모듈은 순수 헬퍼 함수들이므로 Logic 분리 불필요
   - 단일 파일로 충분

5. **nock 사용법**:
   ```typescript
   import nock from 'nock';

   // Mock 설정
   const scope = nock('https://api.notion.com')
     .get('/v1/pages/page-id')
     .reply(200, { /* mock response */ });

   // 테스트 후 정리
   scope.done(); // 모든 mock이 호출되었는지 확인
   nock.cleanAll(); // 모든 mock 제거
   ```

### Previous Story Learnings

1. **NodeNext 모듈 해석** (Story 1.1): import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import { mockNotionPage } from './mocks/notion.js';

   // ❌ 잘못된 import (컴파일 에러)
   import { mockNotionPage } from './mocks/notion';
   ```

2. **타입 Export 패턴** (Story 1.2):
   ```typescript
   // 타입과 값 분리 export
   export type { MockOptions } from './types.js';
   export { mockNotionPage } from './mocks/notion.js';
   ```

3. **메모리 효율성** (Story 1.7 Code Review):
   - 테스트 유틸리티는 테스트 시에만 사용되므로 메모리 효율성보다 사용 편의성 우선

4. **TDD 패턴** (Story 1.7):
   - RED: 테스트 먼저 작성
   - GREEN: 구현으로 통과
   - REFACTOR: 개선

### Implementation Guidelines

1. **mockNotionPage 인터페이스**:
   ```typescript
   interface MockNotionPageOptions {
     pageId: string;
     title?: string;
     content?: NotionBlock[];
     properties?: Record<string, unknown>;
   }

   export function mockNotionPage(options: MockNotionPageOptions): nock.Scope {
     return nock('https://api.notion.com')
       .get(`/v1/pages/${options.pageId}`)
       .reply(200, {
         id: options.pageId,
         object: 'page',
         properties: options.properties ?? { title: { title: [{ text: { content: options.title ?? 'Mock Page' } }] } },
       });
   }
   ```

2. **mockNotionRateLimit 인터페이스**:
   ```typescript
   export function mockNotionRateLimit(retryAfter = 60): nock.Scope {
     return nock('https://api.notion.com')
       .get(/.*/)
       .reply(429, { message: 'Rate limited' }, { 'Retry-After': String(retryAfter) });
   }
   ```

3. **assertMcpSuccess 인터페이스**:
   ```typescript
   export function assertMcpSuccess(response: McpToolResult, expectedText?: string): void {
     expect(response.isError).toBe(false);
     expect(response.content).toBeInstanceOf(Array);
     expect(response.content.length).toBeGreaterThan(0);

     if (expectedText) {
       const textContent = response.content.find(c => c.type === 'text');
       expect(textContent?.text).toContain(expectedText);
     }
   }
   ```

4. **assertMcpError 인터페이스**:
   ```typescript
   export function assertMcpError(
     response: McpToolResult,
     expectedCode?: string,
     expectedMessage?: string
   ): void {
     expect(response.isError).toBe(true);
     expect(response.content).toBeInstanceOf(Array);

     const textContent = response.content.find(c => c.type === 'text');
     expect(textContent).toBeDefined();

     if (expectedCode) {
       expect(textContent?.text).toContain(expectedCode);
     }
     if (expectedMessage) {
       expect(textContent?.text).toContain(expectedMessage);
     }
   }
   ```

5. **Fixture 팩토리 패턴**:
   ```typescript
   interface MockStoryOverrides {
     id?: string;
     title?: string;
     status?: string;
     acceptanceCriteria?: string[];
   }

   export function createMockStory(overrides: MockStoryOverrides = {}): MockStory {
     return {
       id: overrides.id ?? 'story-1-1',
       title: overrides.title ?? 'Test Story',
       status: overrides.status ?? 'ready-for-dev',
       acceptanceCriteria: overrides.acceptanceCriteria ?? ['AC1', 'AC2'],
     };
   }
   ```

### Testing Strategy

- **단위 테스트**: vitest로 각 함수 테스트
- **Mock 동작 테스트**: nock scope가 올바르게 설정되는지 확인
- **Assertion 테스트**: 성공/실패 케이스 모두 검증
- **Fixture 테스트**: 기본값과 오버라이드 동작 확인

### Dependencies

```json
{
  "devDependencies": {
    "nock": "^13.5.0"
  }
}
```

**주의**: nock은 devDependencies에 이미 있어야 함. 없으면 추가 필요.

### Project Structure Notes

- 기존 `src/` 폴더에 `testing/` 추가
- `src/index.ts`에서 testing re-export 추가
- 다른 모듈(cache, metrics 등)과 동일한 패턴 유지

### References

- Architecture: `_bmad-output/architecture.md` §Cross-Cutting Concerns (테스트 모킹 전략)
- Architecture: `_bmad-output/architecture.md` §Additional Requirements (AC-6 nock 기반 HTTP 모킹)
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.8
- Story 1.7: Previous Story Learnings (TDD 패턴, 메모리 효율성)

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (전체 테스트 통과: 295개)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import { mockNotionPage, assertMcpSuccess } from '@moonklabs/mcp-common'` 가능
- [x] nock 기반 mock 함수들이 동작함
- [x] Assertion 헬퍼들이 올바르게 검증함
- [x] Fixture 팩토리들이 일관된 데이터 생성
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 타입 오류 수정: `NotionBlock` 타입에 맞게 `createMockNotionBlock` 함수 수정 (content 필드 포함)
- 테스트 타입 안정성: API 응답에 명시적 타입 캐스팅 추가

### Completion Notes List

1. **nock 패키지 설치**: `npm install nock --save-dev -w packages/common`
2. **테스트 유틸리티 모듈 구현**:
   - Notion API Mock: `mockNotionPage`, `mockNotionDatabase`, `mockNotionRateLimit`, `mockNotionError`
   - MCP Assertion: `assertMcpSuccess`, `assertMcpError`, `assertMcpContent`
   - Fixtures: `createMockStory`, `createMockEpic`, `createMockNotionPage`, `createMockNotionBlock`
   - Slack Mock (Phase 2 스텁): `mockSlackMessage`, `mockSlackRateLimit`, `mockSlackError`
3. **52개 신규 테스트 추가**: assertions (16), mocks (14), fixtures (22)
4. **전체 테스트 통과**: 286개 (기존 + 신규)
5. **코드 리뷰 수정 완료** (9개 테스트 추가, 총 295개):
   - H1: vitest 전용 모듈임을 JSDoc @remarks로 명시
   - M1: 미사용 `AssertMcpSuccessOptions` 인터페이스 제거
   - M2: `mockNotionPageBlocks` 함수 추가 (페이지 블록 조회 모킹)
   - M3: null/undefined 응답에 대한 edge case 테스트 추가
   - M4: Fixtures vs Mocks 차이점 문서화 (각 모듈에 @remarks 추가)

### File List

**신규 파일:**
- `packages/common/src/testing/index.ts`
- `packages/common/src/testing/assertions.ts`
- `packages/common/src/testing/mocks/index.ts`
- `packages/common/src/testing/mocks/notion.ts`
- `packages/common/src/testing/mocks/slack.ts`
- `packages/common/src/testing/fixtures/index.ts`
- `packages/common/src/testing/fixtures/stories.ts`
- `packages/common/src/testing/fixtures/notion.ts`
- `packages/common/src/testing/__tests__/assertions.test.ts`
- `packages/common/src/testing/__tests__/mocks.test.ts`
- `packages/common/src/testing/__tests__/fixtures.test.ts`

**수정된 파일:**
- `packages/common/src/index.ts` (testing 모듈 re-export 추가)
- `packages/common/package.json` (nock devDependency 추가)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-27 | Story 1.8 생성 - 테스트 유틸리티 (testing) | SM (create-story workflow) |
| 2025-12-27 | Story 1.8 구현 완료 - 모든 Task 완료, 테스트 통과 (286개) | Dev (dev-story workflow) |
| 2025-12-27 | 코드 리뷰 수정 완료 - 5개 이슈 수정, 테스트 통과 (295개) | Dev (code-review workflow) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Cross-Cutting Concerns (테스트 모킹 전략) |
| Architecture | §Additional Requirements (AC-6 nock) |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.8 |
| Story 1.7 | Previous Story Learnings (TDD 패턴) |

---

_Story created: 2025-12-27 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
