# Story 1.4: 설정 관리 (config)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-26

---

## Story

As a **개발자**,
I want **loadEnvConfig() 함수로 환경변수를 안전하게 로드하여**,
So that **Zod 스키마 검증으로 누락된 필수 변수를 조기에 발견할 수 있습니다**.

---

## Acceptance Criteria

### AC1: config 디렉토리 구조 생성
**Given** packages/common/src/config 폴더가 생성됨
**When** 설정 관련 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/config/
├── index.ts           # re-export hub
├── environment.ts     # Zod 스키마 + loadEnvConfig
└── defaults.ts        # 기본값 상수
```

### AC2: loadEnvConfig 함수 구현
**Given** loadEnvConfig() 함수가 호출됨
**When** 환경변수가 Zod 스키마로 검증됨
**Then** 유효한 EnvConfig 객체가 반환됨
**And** 다음 시그니처를 가짐:
```typescript
function loadEnvConfig(): EnvConfig
```

### AC3: Zod 스키마 정의
**Given** envSchema가 정의됨
**When** 환경변수를 파싱함
**Then** 다음 필드가 검증됨:
- `NODE_ENV`: 'development' | 'production' | 'test' (기본: 'development')
- `LOG_LEVEL`: 'debug' | 'info' | 'warn' | 'error' (기본: 'info')
- `NOTION_API_KEY`: 선택적 문자열
- `NOTION_PAGE_IDS`: 선택적 문자열 (콤마 구분)
- `CACHE_TTL_SECONDS`: 숫자 (기본: 300)
**And** 검증 실패 시 명확한 에러 메시지 출력

### AC4: 기본값 상수 정의 (defaults.ts)
**Given** defaults.ts 파일이 생성됨
**When** 기본값 상수들이 정의됨
**Then** 다음 기본값이 정의되어야 함:
- `DEFAULT_CACHE_TTL_SECONDS`: 300
- `DEFAULT_LOG_LEVEL`: 'info'
- `DEFAULT_NODE_ENV`: 'development'
**And** 상수는 as const로 정의됨

### AC5: EnvConfig 타입 Export
**Given** environment.ts에서 EnvConfig 타입이 정의됨
**When** 다른 패키지에서 import 시도함
**Then** `import type { EnvConfig } from '@moonklabs/mcp-common'`로 import 가능함
**And** 타입은 Zod 스키마에서 추론됨 (z.infer)

### AC6: 환경변수 직접 접근 금지 가이드
**Given** config 모듈이 사용됨
**When** 개발자가 환경변수에 접근함
**Then** `loadEnvConfig()`를 통해서만 접근해야 함
**And** 직접 `process.env` 접근은 코드 리뷰에서 거부됨
**And** JSDoc에 이 규칙이 명시됨

### AC7: 설정 로드 테스트 작성
**Given** 테스트 파일이 생성됨
**When** 설정 로드 테스트가 실행됨
**Then** 다음 항목이 테스트됨:
- loadEnvConfig()가 기본값으로 EnvConfig 반환
- NODE_ENV 유효성 검증 (development, production, test만 허용)
- LOG_LEVEL 유효성 검증
- CACHE_TTL_SECONDS가 숫자로 변환됨
- 잘못된 환경변수 시 에러 발생
- 기본값 상수 존재 확인

---

## Tasks / Subtasks

### Task 1: config 디렉토리 구조 생성 (AC: 1)
- [x] 1.1 `src/config/` 디렉토리 생성
- [x] 1.2 `src/config/index.ts` 생성 (re-export hub)

### Task 2: 기본값 상수 정의 (AC: 4)
- [x] 2.1 `src/config/defaults.ts` 생성
- [x] 2.2 DEFAULT_CACHE_TTL_SECONDS 정의 (300)
- [x] 2.3 DEFAULT_LOG_LEVEL 정의 ('info')
- [x] 2.4 DEFAULT_NODE_ENV 정의 ('development')
- [x] 2.5 JSDoc 주석 추가

### Task 3: Zod 스키마 및 loadEnvConfig 구현 (AC: 2, 3)
- [x] 3.1 `src/config/environment.ts` 생성
- [x] 3.2 zod 의존성 확인 (설치 완료)
- [x] 3.3 envSchema Zod 스키마 정의
- [x] 3.4 loadEnvConfig() 함수 구현
- [x] 3.5 에러 메시지 포맷팅 (실패한 필드 표시)
- [x] 3.6 EnvConfig 타입 export (z.infer 사용)
- [x] 3.7 JSDoc 주석 추가 (직접 process.env 접근 금지 규칙 명시)

### Task 4: 타입 Export 통합 (AC: 5, 6)
- [x] 4.1 `config/index.ts`에서 모든 함수/타입 re-export
- [x] 4.2 `src/index.ts` 업데이트하여 config re-export
- [x] 4.3 빌드 및 import 검증

### Task 5: 설정 로드 테스트 작성 (AC: 7)
- [x] 5.1 `src/config/__tests__/environment.test.ts` 생성
- [x] 5.2 loadEnvConfig 기본값 테스트
- [x] 5.3 NODE_ENV 유효성 테스트 (유효/무효 값)
- [x] 5.4 LOG_LEVEL 유효성 테스트
- [x] 5.5 CACHE_TTL_SECONDS 숫자 변환 테스트
- [x] 5.6 잘못된 환경변수 에러 테스트
- [x] 5.7 defaults.ts 상수 테스트
- [x] 5.8 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **파일 위치**: `packages/common/src/config/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import { loadEnvConfig } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./environment.js` - .js 확장자 필수!)

3. **환경변수 접근 패턴** (Architecture §Implementation Patterns):
   ```typescript
   // ✅ 올바른 접근
   import { loadEnvConfig } from '@moonklabs/mcp-common';
   const config = loadEnvConfig();
   console.log(config.LOG_LEVEL);

   // ❌ 금지 (코드 리뷰에서 거부)
   const logLevel = process.env.LOG_LEVEL;
   ```

4. **Zod 스키마 패턴** (Architecture §Additional Infrastructure):
   ```typescript
   import { z } from 'zod';

   const envSchema = z.object({
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
     LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
     NOTION_API_KEY: z.string().optional(),
     NOTION_PAGE_IDS: z.string().optional(),
     CACHE_TTL_SECONDS: z.coerce.number().default(300),
   });

   export type EnvConfig = z.infer<typeof envSchema>;
   ```

5. **loadEnvConfig 구현** (Architecture §Additional Infrastructure):
   ```typescript
   export function loadEnvConfig(): EnvConfig {
     const result = envSchema.safeParse(process.env);
     if (!result.success) {
       console.error('Environment validation failed:', result.error.format());
       throw new Error('Invalid environment configuration');
     }
     return result.data;
   }
   ```

6. **환경변수 카탈로그** (Architecture §Environment Variables Catalog):
   | 변수 | 필수 | 기본값 | 설명 |
   |------|------|--------|------|
   | `NODE_ENV` | No | development | 실행 환경 |
   | `LOG_LEVEL` | No | info | 로그 레벨 |
   | `NOTION_API_KEY` | Yes* | - | Notion API 토큰 |
   | `NOTION_PAGE_IDS` | No | - | 접근 허용 페이지 (콤마 구분) |
   | `CACHE_TTL_SECONDS` | No | 300 | 기본 캐시 TTL |

### Previous Story Learnings

1. **NodeNext 모듈 해석** (Story 1.1): import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import { loadEnvConfig } from './environment.js';

   // ❌ 잘못된 import (컴파일 에러)
   import { loadEnvConfig } from './environment';
   ```

2. **타입 가드 null 처리** (Story 1.2): 타입 가드 함수는 null/undefined 체크 필요

3. **suggestion 필수** (Story 1.3): 에러 발생 시 suggestion 필드 포함 권장

4. **ErrorCode 타입 동기화** (Story 1.3 코드 리뷰): 상수와 타입 정의 일치 확인

### Implementation Guidelines

1. **환경변수 테스트 격리**:
   ```typescript
   describe('loadEnvConfig', () => {
     const originalEnv = process.env;

     beforeEach(() => {
       process.env = { ...originalEnv };
     });

     afterEach(() => {
       process.env = originalEnv;
     });

     it('should use default values when not set', () => {
       delete process.env.NODE_ENV;
       delete process.env.LOG_LEVEL;
       const config = loadEnvConfig();
       expect(config.NODE_ENV).toBe('development');
       expect(config.LOG_LEVEL).toBe('info');
     });
   });
   ```

2. **에러 메시지 포맷팅**:
   ```typescript
   if (!result.success) {
     const formatted = result.error.format();
     console.error('환경변수 검증 실패:', JSON.stringify(formatted, null, 2));
     throw new Error('Invalid environment configuration');
   }
   ```

3. **z.coerce.number() 사용**:
   - 환경변수는 항상 문자열로 전달됨
   - `z.coerce.number()`는 문자열을 숫자로 자동 변환

### Testing Strategy

- **단위 테스트**: vitest로 각 함수 테스트
- **환경 격리**: beforeEach/afterEach로 process.env 격리
- **에러 케이스**: 잘못된 NODE_ENV, LOG_LEVEL 값 테스트
- **타입 테스트**: expectTypeOf로 EnvConfig 타입 검증

### 참고 문서
- Architecture: `_bmad-output/architecture.md` §Additional Infrastructure, §Environment Variables Catalog
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.4

### 기존 코드베이스 참조
- Story 1.1~1.3에서 생성된 `packages/common/src/` 구조
- `package.json` - zod 의존성 확인

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (106개 테스트 통과)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import { loadEnvConfig } from '@moonklabs/mcp-common'` 가능
- [x] EnvConfig 타입 import 가능
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan

1. **Task 1**: config 디렉토리 구조 생성
   - src/config/ 디렉토리 생성
   - src/config/index.ts 생성 (re-export hub)

2. **Task 2**: 기본값 상수 정의
   - src/config/defaults.ts 생성
   - DEFAULT_CACHE_TTL_SECONDS, DEFAULT_LOG_LEVEL, DEFAULT_NODE_ENV 정의

3. **Task 3**: Zod 스키마 및 loadEnvConfig 구현
   - zod 의존성 설치
   - src/config/environment.ts 생성
   - envSchema Zod 스키마 정의
   - loadEnvConfig() 함수 구현

4. **Task 4**: 타입 Export 통합
   - config/index.ts에서 re-export
   - src/index.ts 업데이트

5. **Task 5**: 설정 로드 테스트 작성
   - RED-GREEN-REFACTOR 사이클 적용
   - 24개 테스트 작성

### Debug Log

- zod 의존성 설치 필요 → npm install zod -w packages/common 실행
- @types/node 누락 → npm install @types/node -D -w packages/common 실행
- 모든 구현이 첫 시도에 성공

### Completion Notes

**구현 완료 사항:**
- `loadEnvConfig()`: 환경변수 검증 및 로드 함수
- `envSchema`: Zod 스키마로 환경변수 검증
- `EnvConfig`: Zod 스키마에서 추론된 타입
- `DEFAULT_*` 상수: 기본값 상수 (as const)

**테스트 결과:**
- loadEnvConfig 테스트: 15개 통과
- defaults 테스트: 6개 통과
- EnvConfig 타입 테스트: 5개 통과 (expectTypeOf)
- 총 24개 config 테스트 통과
- 전체 106개 테스트 통과

**빌드 결과:**
- ESM: dist/index.js (3.97 KB)
- CJS: dist/index.cjs (4.36 KB)
- DTS: dist/index.d.ts (16.96 KB)

### File List

#### New Files
- `packages/common/src/config/index.ts`
- `packages/common/src/config/defaults.ts`
- `packages/common/src/config/environment.ts`
- `packages/common/src/config/__tests__/environment.test.ts`

#### Modified Files
- `packages/common/src/index.ts` (config re-export 추가)
- `packages/common/package.json` (zod, @types/node 의존성 추가)

#### Deleted Files
- None

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-26 | Story 1.4 생성 - 설정 관리 (config) | SM (create-story workflow) |
| 2025-12-26 | 구현 완료 - loadEnvConfig, envSchema, EnvConfig, DEFAULT_* (24개 테스트 통과) | Dev (dev-story workflow) |
| 2025-12-27 | 코드 리뷰 완료 - H1,M1,M2,M3 수정: 캐싱, TTL 범위 검증, 빈 문자열 처리, 에러 메시지 일관성 (30개 테스트) | Reviewer (code-review workflow) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Additional Infrastructure, §Environment Variables Catalog |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.4 |
| Story 1.1 | Previous Story Learnings (NodeNext, .js 확장자) |
| Story 1.2 | Previous Story Learnings (타입 가드 null 처리) |
| Story 1.3 | Previous Story Learnings (suggestion 필수, ErrorCode 동기화) |

---

_Story created: 2025-12-26 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
