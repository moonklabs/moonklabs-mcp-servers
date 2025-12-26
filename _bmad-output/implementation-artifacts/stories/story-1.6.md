# Story 1.6: 캐싱 레이어 (cache)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-27

---

## Story

As a **개발자**,
I want **node-cache 기반 캐싱 레이어가 제공되어**,
So that **Notion API Rate Limit을 회피하고 응답 시간을 개선할 수 있습니다**.

---

## Acceptance Criteria

### AC1: cache 디렉토리 구조 생성
**Given** packages/common/src/cache 폴더가 존재함
**When** 캐싱 관련 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/cache/
├── index.ts              # re-export hub
├── cacheManager.ts       # CacheManager 클래스 + 인터페이스
└── cacheManagerLogic.ts  # 순수 로직 (캐시 키 생성 등)
```

### AC2: CacheManager 인터페이스 정의
**Given** CacheManager가 생성됨
**When** 캐시 인터페이스가 정의됨
**Then** 다음 메서드가 사용 가능함:
- `get<T>(key: string): T | undefined`
- `set<T>(key: string, value: T, ttl?: number): boolean`
- `del(key: string): number`
- `has(key: string): boolean`
- `keys(): string[]`
- `flush(): void`
- `stats(): CacheStats`

### AC3: TTL 기반 자동 만료
**Given** 캐시에 데이터를 저장함
**When** TTL(초)를 지정하여 `set(key, value, ttl)`을 호출함
**Then** TTL 이후 자동으로 만료됨
**And** 만료된 데이터는 `get()`에서 `undefined` 반환

### AC4: 캐시 키 형식 표준화
**Given** `buildCacheKey()` 함수가 호출됨
**When** server, resource, id, hash 파라미터를 전달함
**Then** `{server}:{resource}:{id}:{hash}` 형식의 키가 생성됨
**And** 예: `spec-reader:notion:page123:abc123`
**And** hash가 없으면 `{server}:{resource}:{id}` 형식

### AC5: 캐시 통계 조회
**Given** 캐시가 사용됨
**When** `stats()` 메서드를 호출함
**Then** 다음 통계가 반환됨:
- `hits`: 캐시 히트 수
- `misses`: 캐시 미스 수
- `keys`: 현재 저장된 키 수
- `ksize`: 키 크기 (bytes)
- `vsize`: 값 크기 (bytes)

### AC6: 기본 TTL 설정
**Given** CacheManager가 생성됨
**When** `defaultTtl` 옵션을 지정함
**Then** `set()` 호출 시 TTL 미지정 시 기본 TTL 적용됨
**And** 기본값은 CACHE_TTL_SECONDS 환경변수 또는 300초

### AC7: 캐싱 테스트 작성
**Given** 테스트 파일이 생성됨
**When** 캐싱 테스트가 실행됨
**Then** 다음 항목이 테스트됨:
- get/set/del/has 기본 동작
- TTL 기반 만료
- 캐시 키 생성 (buildCacheKey)
- 캐시 통계 (stats)
- 기본 TTL 적용

---

## Tasks / Subtasks

### Task 1: node-cache 의존성 설치 (AC: 1)
- [x] 1.1 `npm install node-cache -w packages/common`
- [x] 1.2 TypeScript 타입 내장 확인 (@types/node-cache 불필요)

### Task 2: 캐시 타입 및 인터페이스 정의 (AC: 2)
- [x] 2.1 `src/cache/index.ts` 생성 (re-export hub)
- [x] 2.2 CacheOptions 인터페이스 정의 → CacheManagerOptions
- [x] 2.3 CacheStats 인터페이스 정의 (types/cache.ts 재사용)
- [x] 2.4 CacheKeyParams 인터페이스 정의

### Task 3: cacheManagerLogic 구현 (AC: 4)
- [x] 3.1 `src/cache/cacheManagerLogic.ts` 생성
- [x] 3.2 `buildCacheKey(params)` 함수 구현
- [x] 3.3 `parseCacheKey(key)` 함수 구현 (역파싱)
- [x] 3.4 `isValidCacheKey(key)` 검증 함수 구현
- [x] 3.5 JSDoc 주석 추가

### Task 4: CacheManager 클래스 구현 (AC: 2, 3, 5, 6)
- [x] 4.1 `src/cache/cacheManager.ts` 생성
- [x] 4.2 node-cache 래핑 클래스 구현
- [x] 4.3 `get<T>()` 메서드 구현
- [x] 4.4 `set<T>()` 메서드 구현 (TTL 지원)
- [x] 4.5 `del()`, `has()`, `keys()`, `flush()` 메서드 구현
- [x] 4.6 `stats()` 메서드 구현
- [x] 4.7 기본 TTL 옵션 지원 (CACHE_TTL_SECONDS 환경변수)
- [x] 4.8 getOrSet, mget, mset, getTtl, setTtl 추가 메서드 구현
- [x] 4.9 JSDoc 주석 추가

### Task 5: 타입 Export 통합 (AC: 1)
- [x] 5.1 `cache/index.ts`에서 모든 함수/타입 re-export
- [x] 5.2 `src/index.ts` 업데이트하여 cache re-export
- [x] 5.3 빌드 및 import 검증
- [x] 5.4 types/cache.ts와의 이름 충돌 해결

### Task 6: 캐싱 단위 테스트 작성 (AC: 7)
- [x] 6.1 `src/cache/__tests__/cacheManager.test.ts` 생성 (31개 테스트)
- [x] 6.2 `src/cache/__tests__/cacheManagerLogic.test.ts` 생성 (20개 테스트)
- [x] 6.3 get/set/del/has 기본 동작 테스트
- [x] 6.4 TTL 만료 테스트 (실제 setTimeout 사용)
- [x] 6.5 buildCacheKey 테스트 (다양한 파라미터)
- [x] 6.6 stats 메서드 테스트
- [x] 6.7 기본 TTL 적용 테스트
- [x] 6.8 `npm run test -w packages/common` 실행 (179개 테스트 통과)

---

## Dev Notes

### Architecture Constraints

1. **파일 위치**: `packages/common/src/cache/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import { CacheManager, buildCacheKey } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./cacheManagerLogic.js` - .js 확장자 필수!)

3. **캐싱 전략** (Architecture §Data Architecture):
   - Phase 1: node-cache (로컬 메모리)
   - Phase 2+: Redis (ioredis) - 동일 인터페이스로 마이그레이션

4. **캐시 키 규칙** (Architecture §Data Architecture):
   ```typescript
   // 캐시 키 형식: {server}:{resource}:{id}:{hash}
   const key = buildCacheKey({
     server: 'spec-reader',
     resource: 'notion',
     id: 'page123',
     hash: 'abc123'  // 선택적
   });
   // 결과: "spec-reader:notion:page123:abc123"
   ```

5. **TTL 설정** (Architecture §Data Architecture):
   | 리소스 | TTL | 이유 |
   |--------|-----|------|
   | Notion 페이지 | 5분 (300초) | 자주 변경 |
   | 스펙 요약 | 1시간 (3600초) | LLM 비용 절약 |
   | 토큰 수 | 무제한 (0) | 불변 |

6. **캐시 응답 패턴** (Architecture §API Patterns):
   ```typescript
   // 캐시 히트 시
   return {
     status: "success",
     data: cachedData,
     token_count: 1500,
     cached: true  // 캐시에서 반환됨을 표시
   };

   // 캐시 미스 시
   return {
     status: "success",
     data: freshData,
     token_count: 1500,
     cached: false  // 원본에서 로드됨
   };
   ```

7. **캐싱 적용 순서** (Architecture §Process Patterns):
   ```typescript
   async function getDataWithCache(key: string): Promise<Data> {
     // 1. 캐시 확인
     const cached = cache.get<Data>(key);
     if (cached !== undefined) {
       logger.debug({ key }, 'Cache hit');
       return { ...cached, cached: true };
     }

     // 2. 캐시 미스 로깅
     logger.warn({ key }, 'Cache miss, fetching from source');

     // 3. 원본 데이터 로드
     const data = await fetchFromSource();

     // 4. 캐시 저장
     cache.set(key, data, TTL_SECONDS);

     // 5. 결과 반환
     return { ...data, cached: false };
   }
   ```

8. **3계층 분리 패턴** (Architecture §Implementation Patterns):
   - `cacheManagerLogic.ts`: 순수 함수 (buildCacheKey, parseCacheKey, isValidCacheKey)
   - `cacheManager.ts`: node-cache 래핑 클래스 (상태 관리)

### Previous Story Learnings

1. **NodeNext 모듈 해석** (Story 1.1): import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import { buildCacheKey } from './cacheManagerLogic.js';

   // ❌ 잘못된 import (컴파일 에러)
   import { buildCacheKey } from './cacheManagerLogic';
   ```

2. **환경변수 접근** (Story 1.4): loadEnvConfig() 사용
   ```typescript
   import { loadEnvConfig } from './config/index.js';
   const config = loadEnvConfig();
   const defaultTtl = config.CACHE_TTL_SECONDS;  // 300초 기본값
   ```

3. **캐싱 함수 패턴** (Story 1.4): loadEnvConfig()에서 캐싱 패턴 참고
   ```typescript
   // Story 1.4에서 구현된 캐싱 패턴
   let cachedConfig: EnvConfig | null = null;

   export function loadEnvConfig(): EnvConfig {
     if (cachedConfig !== null) return cachedConfig;
     // ...
     cachedConfig = result.data;
     return result.data;
   }

   export function resetEnvConfigCache(): void {
     cachedConfig = null;
   }
   ```

4. **입력 검증** (Story 1.5): serverName 검증 패턴 참고
   ```typescript
   // Story 1.5에서 구현된 검증 패턴
   const trimmedName = serverName.trim();
   if (!trimmedName) {
     throw new Error('serverName은 비어있을 수 없습니다');
   }
   ```

### Implementation Guidelines

1. **node-cache 기본 사용법**:
   ```typescript
   import NodeCache from 'node-cache';

   const cache = new NodeCache({
     stdTTL: 300,        // 기본 TTL (초)
     checkperiod: 60,    // 만료 체크 주기 (초)
     useClones: false,   // 성능 최적화 (참조 반환)
   });

   cache.set('key', { data: 'value' }, 600);  // 600초 TTL
   const data = cache.get<DataType>('key');
   cache.del('key');
   ```

2. **CacheManager 클래스 설계**:
   ```typescript
   export interface CacheOptions {
     defaultTtl?: number;      // 기본 TTL (초), 기본값: CACHE_TTL_SECONDS
     checkPeriod?: number;     // 만료 체크 주기 (초)
     useClones?: boolean;      // 복사본 반환 여부
   }

   export class CacheManager {
     private cache: NodeCache;

     constructor(options?: CacheOptions) {
       const config = loadEnvConfig();
       this.cache = new NodeCache({
         stdTTL: options?.defaultTtl ?? config.CACHE_TTL_SECONDS,
         checkperiod: options?.checkPeriod ?? 60,
         useClones: options?.useClones ?? false,
       });
     }

     get<T>(key: string): T | undefined { ... }
     set<T>(key: string, value: T, ttl?: number): boolean { ... }
     // ...
   }
   ```

3. **buildCacheKey 함수 설계**:
   ```typescript
   export interface CacheKeyParams {
     server: string;     // 서버 이름 (예: 'spec-reader')
     resource: string;   // 리소스 유형 (예: 'notion')
     id: string;         // 리소스 ID (예: 'page123')
     hash?: string;      // 선택적 해시 (예: 'abc123')
   }

   export function buildCacheKey(params: CacheKeyParams): string {
     const { server, resource, id, hash } = params;
     // 입력 검증
     if (!server.trim() || !resource.trim() || !id.trim()) {
       throw new Error('server, resource, id는 필수입니다');
     }
     // 키 생성
     const parts = [server.trim(), resource.trim(), id.trim()];
     if (hash?.trim()) {
       parts.push(hash.trim());
     }
     return parts.join(':');
   }
   ```

4. **TTL 상수 정의** (추후 다른 서버에서 사용):
   ```typescript
   // 권장 TTL 상수 (초)
   export const CACHE_TTL = {
     NOTION_PAGE: 300,      // 5분
     SPEC_SUMMARY: 3600,    // 1시간
     TOKEN_COUNT: 0,        // 무제한
     DEFAULT: 300,          // 기본값 5분
   } as const;
   ```

### Testing Strategy

- **단위 테스트**: vitest로 각 함수 테스트
- **타이머 모킹**: `vi.useFakeTimers()`로 TTL 만료 테스트
- **환경 격리**: beforeEach에서 캐시 flush()
- **통계 검증**: stats() 반환값 검증

### 참고 문서
- Architecture: `_bmad-output/architecture.md` §Data Architecture, §Process Patterns
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.6
- node-cache npm: https://www.npmjs.com/package/node-cache

### 기존 코드베이스 참조
- Story 1.4에서 생성된 `packages/common/src/config/` - 캐싱 패턴, loadEnvConfig 사용
- Story 1.5에서 생성된 `packages/common/src/logger/` - createLogger 패턴
- `packages/common/src/index.ts` - re-export 패턴

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공 (ESM 10.99KB, CJS 11.79KB, DTS 25.84KB)
- [x] `npm run test -w packages/common` 성공 (179개 테스트 통과)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import { CacheManager, buildCacheKey } from '@moonklabs/mcp-common'` 가능
- [x] TTL 기반 자동 만료 동작 확인 (2개 TTL 테스트 통과)
- [x] 캐시 키 형식 `{server}:{resource}:{id}` 및 `{server}:{resource}:{id}:{hash}` 검증됨
- [ ] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan

1. **Task 1**: node-cache 의존성 설치
   - npm install node-cache -w packages/common
   - TypeScript 타입 내장 확인 (index.d.ts)

2. **Task 2-3**: RED-GREEN-REFACTOR 사이클
   - cacheManagerLogic.test.ts 작성 (RED)
   - cacheManagerLogic.ts 구현 (GREEN)
   - buildCacheKey, parseCacheKey, isValidCacheKey, CACHE_TTL

3. **Task 4**: CacheManager 클래스 구현
   - cacheManager.test.ts 작성 (RED)
   - cacheManager.ts 구현 (GREEN)
   - get/set/del/has/keys/flush/stats + getOrSet/mget/mset/getTtl/setTtl

4. **Task 5-6**: 통합 및 검증
   - cache/index.ts re-export hub
   - src/index.ts 업데이트
   - 빌드 및 테스트

### Debug Log

- **이름 충돌 해결**: types/cache.ts에서 이미 `buildCacheKey`, `parseCacheKey`, `CacheStats`를 정의
  - 해결: types/cache.ts에서 buildCacheKey, parseCacheKey 함수 제거 (Story 1.6의 더 유연한 버전 사용)
  - CacheStats는 types/cache.ts에서 유지, cache/cacheManager.ts에서 import

- **types/__tests__/cache.test.ts 수정**: 삭제된 함수 테스트 제거
  - cache/__tests__/cacheManagerLogic.test.ts에서 대체 테스트 수행

### Completion Notes

**구현 완료 사항:**
- `CacheManager`: node-cache 래핑 클래스 (14개 메서드)
- `buildCacheKey()`: 캐시 키 생성 (3-4파트 지원, hash 선택적)
- `parseCacheKey()`: 캐시 키 파싱
- `isValidCacheKey()`: 캐시 키 유효성 검증
- `CACHE_TTL`: TTL 상수 (NOTION_PAGE, SPEC_SUMMARY, TOKEN_COUNT, DEFAULT)

**CacheManager 메서드:**
- 기본: get, set, del, has, keys, flush, stats
- 확장: getOrSet (캐시 또는 팩토리), mget, mset (배치), getTtl, setTtl

**테스트 결과:**
- cacheManagerLogic.test.ts: 20개 테스트 통과
- cacheManager.test.ts: 31개 테스트 통과 (TTL 만료 테스트 포함)
- 전체: 179개 테스트 통과

**빌드 결과:**
- ESM: dist/index.js (10.99 KB)
- CJS: dist/index.cjs (11.79 KB)
- DTS: dist/index.d.ts (25.84 KB)

### File List

#### New Files
- `packages/common/src/cache/index.ts`
- `packages/common/src/cache/cacheManager.ts`
- `packages/common/src/cache/cacheManagerLogic.ts`
- `packages/common/src/cache/__tests__/cacheManager.test.ts`
- `packages/common/src/cache/__tests__/cacheManagerLogic.test.ts`

#### Modified Files
- `packages/common/src/index.ts` (cache re-export 추가)
- `packages/common/package.json` (node-cache 의존성 추가)
- `packages/common/src/types/cache.ts` (buildCacheKey, parseCacheKey 함수 제거)
- `packages/common/src/types/index.ts` (buildCacheKey, parseCacheKey export 제거)
- `packages/common/src/types/__tests__/cache.test.ts` (삭제된 함수 테스트 제거)

#### Deleted Files
- `packages/common/src/cache/.gitkeep` (구현 후 삭제)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-27 | Story 1.6 생성 - 캐싱 레이어 (cache) | SM (create-story workflow) |
| 2025-12-27 | 구현 완료 - CacheManager, buildCacheKey, CACHE_TTL (51개 테스트 통과) | Dev (dev-story workflow) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Data Architecture (캐싱 전략, TTL) |
| Architecture | §Process Patterns (캐싱 적용 순서) |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.6 |
| Story 1.1 | Previous Story Learnings (NodeNext, .js 확장자) |
| Story 1.4 | Previous Story Learnings (loadEnvConfig, 캐싱 패턴) |
| Story 1.5 | Previous Story Learnings (입력 검증 패턴) |

---

_Story created: 2025-12-27 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
