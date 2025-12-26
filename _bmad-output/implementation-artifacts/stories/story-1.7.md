# Story 1.7: 메트릭스 수집 (metrics)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-27

---

## Story

As a **개발자**,
I want **도구 호출 횟수, 성공률, 캐시 히트율을 수집하여**,
So that **서버 상태를 모니터링하고 성능을 개선할 수 있습니다**.

---

## Acceptance Criteria

### AC1: metrics 디렉토리 구조 생성
**Given** packages/common/src/metrics 폴더가 존재함
**When** 메트릭스 관련 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/metrics/
├── index.ts                # re-export hub
├── metricsCollector.ts     # MetricsCollector 클래스
└── metricsCollectorLogic.ts # 순수 로직 (통계 계산 등)
```

### AC2: MetricsCollector 인터페이스 정의
**Given** MetricsCollector가 생성됨
**When** 메트릭스 인터페이스가 정의됨
**Then** 다음 메서드가 사용 가능함:
- `recordToolCall(toolName: string, success: boolean, durationMs: number): void`
- `recordCacheHit(hit: boolean): void`
- `getMetrics(): MetricsSummary`
- `reset(): void`

### AC3: tool_calls 메트릭스 수집
**Given** metricsCollector가 활성화됨
**When** `recordToolCall()`이 호출됨
**Then** 도구별 호출 횟수가 기록됨
**And** 전체 호출 횟수가 증가됨
**And** 성공/실패 횟수가 분리 기록됨

### AC4: success_rate 계산
**Given** 도구 호출 기록이 존재함
**When** `getMetrics()`를 호출함
**Then** `success_rate` 필드에 성공률(%)이 반환됨
**And** 호출이 없으면 null 반환 (0으로 나누기 방지)

### AC5: cache_hit_rate 수집
**Given** metricsCollector가 활성화됨
**When** `recordCacheHit(true/false)`가 호출됨
**Then** 캐시 히트/미스 횟수가 기록됨
**And** `cache_hit_rate` 필드에 히트율(%)이 반환됨

### AC6: avg_response_ms 계산
**Given** 도구 호출 기록이 존재함
**When** `getMetrics()`를 호출함
**Then** `avg_response_ms` 필드에 평균 응답 시간이 반환됨
**And** 도구별 평균 응답 시간도 조회 가능함

### AC7: 메트릭스 단위 테스트
**Given** 테스트 파일이 생성됨
**When** 메트릭스 테스트가 실행됨
**Then** 다음 항목이 테스트됨:
- recordToolCall 기본 동작
- recordCacheHit 기본 동작
- getMetrics 반환값 검증
- success_rate 계산 정확성
- cache_hit_rate 계산 정확성
- avg_response_ms 계산 정확성
- reset 동작 검증
- Edge case (호출 없는 경우, 0으로 나누기 방지)

---

## Tasks / Subtasks

### Task 1: 메트릭스 타입 정의 (AC: 2)
- [x] 1.1 `src/types/metrics.ts` 생성 (또는 기존 types에 추가)
- [x] 1.2 MetricsSummary 인터페이스 정의
- [x] 1.3 ToolMetrics 인터페이스 정의 (도구별 상세)
- [x] 1.4 타입 테스트 작성

### Task 2: metricsCollectorLogic 구현 (AC: 4, 5, 6)
- [x] 2.1 `src/metrics/metricsCollectorLogic.ts` 생성
- [x] 2.2 `calculateSuccessRate(success, total)` 함수 구현
- [x] 2.3 `calculateCacheHitRate(hits, total)` 함수 구현
- [x] 2.4 `calculateAverageMs(durations)` 함수 구현
- [x] 2.5 JSDoc 주석 추가

### Task 3: MetricsCollector 클래스 구현 (AC: 2, 3, 5)
- [x] 3.1 `src/metrics/metricsCollector.ts` 생성
- [x] 3.2 내부 상태 관리 (Map 또는 객체)
- [x] 3.3 `recordToolCall()` 메서드 구현
- [x] 3.4 `recordCacheHit()` 메서드 구현
- [x] 3.5 `getMetrics()` 메서드 구현
- [x] 3.6 `reset()` 메서드 구현
- [x] 3.7 도구별 상세 메트릭스 지원 (`getToolMetrics(toolName)`)
- [x] 3.8 JSDoc 주석 추가

### Task 4: 타입 Export 통합 (AC: 1)
- [x] 4.1 `metrics/index.ts`에서 모든 함수/타입 re-export
- [x] 4.2 `src/index.ts` 업데이트하여 metrics re-export
- [x] 4.3 빌드 및 import 검증

### Task 5: 메트릭스 단위 테스트 작성 (AC: 7)
- [x] 5.1 `src/metrics/__tests__/metricsCollector.test.ts` 생성
- [x] 5.2 `src/metrics/__tests__/metricsCollectorLogic.test.ts` 생성
- [x] 5.3 recordToolCall 테스트
- [x] 5.4 recordCacheHit 테스트
- [x] 5.5 getMetrics 테스트
- [x] 5.6 계산 정확성 테스트 (성공률, 히트율, 평균 응답시간)
- [x] 5.7 Edge case 테스트 (0으로 나누기, 빈 상태)
- [x] 5.8 reset 테스트
- [x] 5.9 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **파일 위치**: `packages/common/src/metrics/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import { MetricsCollector } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./metricsCollectorLogic.js` - .js 확장자 필수!)

3. **메트릭스 수집 항목** (Architecture §Cross-Cutting Concerns):
   - `tool_calls`: 도구별 호출 횟수
   - `success_rate`: 전체 성공률 (%)
   - `cache_hit_rate`: 캐시 히트율 (%)
   - `avg_response_ms`: 평균 응답 시간 (ms)

4. **3계층 분리 패턴** (Architecture §Implementation Patterns):
   - `metricsCollectorLogic.ts`: 순수 함수 (계산 로직)
   - `metricsCollector.ts`: 상태 관리 클래스

5. **Phase 1.5 Scope** (Architecture §MVP Scope):
   - 메트릭스 수집은 Phase 1.5 (Should Have)
   - GET /metrics 엔드포인트는 Epic 5 또는 개별 서버에서 구현

### Previous Story Learnings

1. **NodeNext 모듈 해석** (Story 1.1): import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import { calculateSuccessRate } from './metricsCollectorLogic.js';

   // ❌ 잘못된 import (컴파일 에러)
   import { calculateSuccessRate } from './metricsCollectorLogic';
   ```

2. **타입 Export 패턴** (Story 1.2):
   ```typescript
   // types/index.ts에서 re-export
   export type { MetricsSummary, ToolMetrics } from './metrics.js';
   ```

3. **입력 검증 패턴** (Story 1.5):
   ```typescript
   // 음수 duration 방지
   const validDuration = Math.max(0, durationMs);
   ```

4. **캐싱 패턴** (Story 1.6):
   ```typescript
   // CacheManager와 연동 시
   import { CacheManager } from './cache/index.js';

   // 캐시 조회 후 메트릭스 기록
   const cached = cache.get(key);
   metricsCollector.recordCacheHit(cached !== undefined);
   ```

### Implementation Guidelines

1. **MetricsSummary 인터페이스**:
   ```typescript
   export interface MetricsSummary {
     /** 총 도구 호출 횟수 */
     total_calls: number;
     /** 성공한 호출 횟수 */
     successful_calls: number;
     /** 실패한 호출 횟수 */
     failed_calls: number;
     /** 성공률 (0-100), 호출 없으면 null */
     success_rate: number | null;
     /** 캐시 히트 횟수 */
     cache_hits: number;
     /** 캐시 미스 횟수 */
     cache_misses: number;
     /** 캐시 히트율 (0-100), 캐시 조회 없으면 null */
     cache_hit_rate: number | null;
     /** 평균 응답 시간 (ms), 호출 없으면 null */
     avg_response_ms: number | null;
     /** 도구별 상세 메트릭스 */
     tools: Record<string, ToolMetrics>;
     /** 메트릭스 수집 시작 시간 */
     started_at: number;
     /** 마지막 업데이트 시간 */
     updated_at: number;
   }
   ```

2. **ToolMetrics 인터페이스**:
   ```typescript
   export interface ToolMetrics {
     /** 도구 이름 */
     name: string;
     /** 호출 횟수 */
     calls: number;
     /** 성공 횟수 */
     successes: number;
     /** 실패 횟수 */
     failures: number;
     /** 성공률 (0-100) */
     success_rate: number | null;
     /** 평균 응답 시간 (ms) */
     avg_response_ms: number | null;
     /** 최소 응답 시간 (ms) */
     min_response_ms: number | null;
     /** 최대 응답 시간 (ms) */
     max_response_ms: number | null;
   }
   ```

3. **MetricsCollector 클래스 설계**:
   ```typescript
   export class MetricsCollector {
     private totalCalls = 0;
     private successfulCalls = 0;
     private cacheHits = 0;
     private cacheMisses = 0;
     private durations: number[] = [];
     private toolMetrics: Map<string, InternalToolMetrics> = new Map();
     private startedAt: number;
     private updatedAt: number;

     constructor() {
       this.startedAt = Date.now();
       this.updatedAt = Date.now();
     }

     recordToolCall(toolName: string, success: boolean, durationMs: number): void {
       // 구현
     }

     recordCacheHit(hit: boolean): void {
       // 구현
     }

     getMetrics(): MetricsSummary {
       // 구현
     }

     getToolMetrics(toolName: string): ToolMetrics | undefined {
       // 구현
     }

     reset(): void {
       // 구현
     }
   }
   ```

4. **순수 함수 설계 (metricsCollectorLogic.ts)**:
   ```typescript
   /**
    * 성공률 계산 (0-100)
    * @returns 성공률 또는 null (total이 0인 경우)
    */
   export function calculateSuccessRate(success: number, total: number): number | null {
     if (total === 0) return null;
     return Math.round((success / total) * 100 * 100) / 100; // 소수점 2자리
   }

   /**
    * 캐시 히트율 계산 (0-100)
    */
   export function calculateCacheHitRate(hits: number, total: number): number | null {
     if (total === 0) return null;
     return Math.round((hits / total) * 100 * 100) / 100;
   }

   /**
    * 평균 응답 시간 계산 (ms)
    */
   export function calculateAverageMs(durations: number[]): number | null {
     if (durations.length === 0) return null;
     const sum = durations.reduce((a, b) => a + b, 0);
     return Math.round((sum / durations.length) * 100) / 100;
   }
   ```

### Testing Strategy

- **단위 테스트**: vitest로 각 함수 테스트
- **순수 함수 테스트**: metricsCollectorLogic.ts의 계산 함수 별도 테스트
- **상태 관리 테스트**: MetricsCollector 클래스의 상태 변화 검증
- **Edge case**: 0으로 나누기, 빈 배열, 음수 입력 처리

### Project Structure Notes

- 기존 `src/types/` 폴더에 metrics.ts 추가하거나 types/index.ts에 인라인 정의
- `src/metrics/` 폴더 생성 (cache 폴더와 동일한 패턴)
- 루트 index.ts에서 metrics re-export 추가

### References

- Architecture: `_bmad-output/architecture.md` §Cross-Cutting Concerns, §MVP Scope
- PRD: `_bmad-output/prd.md` §Common Infrastructure (FR-4.2 메트릭스 수집)
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.7
- Story 1.6: 캐싱 레이어 구현 (CacheManager와 연동 패턴)

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (전체 테스트 통과)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import { MetricsCollector } from '@moonklabs/mcp-common'` 가능
- [x] 성공률, 캐시 히트율, 평균 응답시간 계산 검증됨
- [x] Edge case (0으로 나누기 등) 처리됨
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 모든 테스트 통과: 234개 테스트 (vitest)
- 타입 체크 통과: tsc --noEmit

### Completion Notes List

- RED-GREEN-REFACTOR TDD 사이클 완료
- 순수 함수 분리 패턴 적용 (metricsCollectorLogic.ts)
- 3계층 분리 패턴 유지
- NodeNext 모듈 해석 (.js 확장자) 준수

### File List

- `src/types/metrics.ts` - MetricsSummary, ToolMetrics 인터페이스
- `src/types/__tests__/metrics.test.ts` - 타입 테스트 (6개)
- `src/metrics/metricsCollectorLogic.ts` - 순수 계산 함수 (5개)
- `src/metrics/__tests__/metricsCollectorLogic.test.ts` - 로직 테스트 (23개)
- `src/metrics/metricsCollector.ts` - MetricsCollector 클래스
- `src/metrics/__tests__/metricsCollector.test.ts` - 클래스 테스트 (20개)
- `src/metrics/index.ts` - re-export hub
- `src/types/index.ts` - metrics 타입 re-export 추가
- `src/index.ts` - metrics 모듈 re-export 추가

---

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (code-review workflow)
**Date:** 2025-12-27
**Result:** ✅ APPROVED (이슈 자동 수정 완료)

### Issues Found & Fixed

| ID | Severity | Issue | Fix Applied |
|----|----------|-------|-------------|
| H1 | HIGH | `allDurations` 배열 메모리 누수 | sum/count 방식으로 변경 |
| M1 | MEDIUM | 도구별 `durations` 배열 메모리 누수 | sum/count + min/max 집계값으로 변경 |
| M2 | MEDIUM | `calculateMinMs`/`calculateMaxMs` 스프레드 연산자 성능 | reduce 사용으로 변경 |
| M3 | MEDIUM | Definition of Done 체크박스 미완료 | 모두 체크 완료 |

### Improvements Applied

1. **메모리 효율성**: 무한 증가하던 배열을 집계값으로 대체하여 O(1) 메모리 사용
2. **대량 데이터 안전성**: 스프레드 연산자 대신 reduce 사용으로 콜 스택 초과 방지
3. **내부 인터페이스 최적화**: `InternalToolData`에 `totalDuration`, `minDuration`, `maxDuration` 필드 추가

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-27 | Story 1.7 생성 - 메트릭스 수집 (metrics) | SM (create-story workflow) |
| 2025-12-27 | 코드 리뷰 완료 - H1, M1, M2, M3 자동 수정 | AI Code Review |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Cross-Cutting Concerns (메트릭스 수집) |
| Architecture | §MVP Scope (Phase 1.5) |
| PRD | §Common Infrastructure (FR-4.2) |
| Epic | Epic 1 - Common Infrastructure, Story 1.7 |
| Story 1.1 | Previous Story Learnings (NodeNext, .js 확장자) |
| Story 1.6 | Previous Story Learnings (CacheManager 연동) |

---

_Story created: 2025-12-27 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
