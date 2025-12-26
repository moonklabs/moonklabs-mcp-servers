# Story 1.5: 로깅 시스템 (logger)

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-26

---

## Story

As a **개발자**,
I want **pino 로거가 민감정보 마스킹 설정과 함께 제공되어**,
So that **API 키나 토큰이 로그에 노출되지 않습니다**.

---

## Acceptance Criteria

### AC1: logger 디렉토리 구조 생성
**Given** packages/common/src/logger 폴더가 생성됨
**When** 로깅 관련 파일들이 정의됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/src/logger/
├── index.ts           # re-export hub
└── pinoLogger.ts      # pino 로거 + redact 설정
```

### AC2: pino 로거 생성
**Given** logger가 import됨
**When** 로거 인스턴스가 생성됨
**Then** pino 로거가 반환됨
**And** 다음 메서드가 사용 가능함: debug, info, warn, error, fatal

### AC3: 민감정보 마스킹 (redact)
**Given** logger로 객체를 로깅함
**When** 다음 필드가 포함된 객체를 로깅함:
- `notion_token`
- `api_key`
- `apiKey`
- `token`
- `authorization`
- `req.headers.authorization`
**Then** 해당 필드가 `[REDACTED]`로 마스킹됨
**And** 다른 필드는 정상 출력됨

### AC4: 환경별 출력 형식
**Given** logger가 초기화됨
**When** NODE_ENV가 'development'임
**Then** pino-pretty 포맷으로 컬러 출력됨

**Given** logger가 초기화됨
**When** NODE_ENV가 'production'임
**Then** JSON 형식으로 stdout 출력됨

### AC5: 로그 레벨 설정
**Given** logger가 초기화됨
**When** LOG_LEVEL 환경변수가 설정됨
**Then** 해당 레벨 이상의 로그만 출력됨
**And** 기본값은 'info'

### AC6: 서버 이름 필드 포함
**Given** logger가 생성됨
**When** 서버 이름이 전달됨
**Then** 모든 로그에 `server` 필드가 포함됨
**And** `createLogger(serverName)` 팩토리 함수로 생성

### AC7: 로깅 마스킹 테스트 작성
**Given** 테스트 파일이 생성됨
**When** 로깅 마스킹 테스트가 실행됨
**Then** 다음 항목이 테스트됨:
- 민감정보 필드가 [REDACTED]로 마스킹됨
- 일반 필드는 정상 출력됨
- 로그 레벨별 메서드 동작 확인
- 서버 이름 필드 포함 확인

---

## Tasks / Subtasks

### Task 1: logger 디렉토리 구조 생성 (AC: 1)
- [x] 1.1 `src/logger/` 디렉토리 생성
- [x] 1.2 `src/logger/index.ts` 생성 (re-export hub)

### Task 2: pino 및 pino-pretty 의존성 설치
- [x] 2.1 `npm install pino -w packages/common`
- [x] 2.2 `npm install pino-pretty -D -w packages/common`

### Task 3: pinoLogger 구현 (AC: 2, 3, 4, 5, 6)
- [x] 3.1 `src/logger/pinoLogger.ts` 생성
- [x] 3.2 redact 설정 (민감정보 마스킹)
- [x] 3.3 환경별 transport 설정 (development: pino-pretty, production: JSON)
- [x] 3.4 LOG_LEVEL 환경변수 지원
- [x] 3.5 createLogger(serverName) 팩토리 함수 구현
- [x] 3.6 기본 logger export (serverName: 'mcp-common')
- [x] 3.7 JSDoc 주석 추가

### Task 4: 타입 Export 통합 (AC: 1)
- [x] 4.1 `logger/index.ts`에서 모든 함수 re-export
- [x] 4.2 `src/index.ts` 업데이트하여 logger re-export
- [x] 4.3 빌드 및 import 검증

### Task 5: 로깅 마스킹 테스트 작성 (AC: 7)
- [x] 5.1 `src/logger/__tests__/pinoLogger.test.ts` 생성
- [x] 5.2 민감정보 마스킹 테스트
- [x] 5.3 일반 필드 정상 출력 테스트
- [x] 5.4 로그 레벨 메서드 테스트
- [x] 5.5 서버 이름 필드 테스트
- [x] 5.6 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **파일 위치**: `packages/common/src/logger/` (Architecture §Project Structure)

2. **Import 경로 규칙**:
   - 외부 패키지: `import { logger, createLogger } from '@moonklabs/mcp-common'`
   - 내부 모듈: 상대 경로 사용 (`./pinoLogger.js` - .js 확장자 필수!)

3. **로깅 전략** (Architecture §Logging Strategy):
   - 라이브러리: pino (v9+)
   - 개발환경: debug 레벨, pino-pretty (컬러)
   - 프로덕션: info 레벨, JSON stdout

4. **민감정보 마스킹** (Architecture §Logging Strategy):
   ```typescript
   import pino from 'pino';

   const logger = pino({
     redact: {
       paths: [
         'notion_token',
         'api_key',
         'req.headers.authorization',
         '*.token',
         '*.apiKey'
       ],
       censor: '[REDACTED]'
     }
   });
   ```

5. **로그 구조** (Architecture §Logging Strategy):
   ```json
   {
     "level": "info",
     "time": 1703548800000,
     "server": "mcp-context-loader",
     "tool": "get-story-context",
     "story_id": "Story-42",
     "token_count": 1500,
     "cached": true,
     "duration_ms": 45
   }
   ```

6. **로깅 레벨 사용 기준** (Architecture §Process Patterns):
   | 레벨 | 사용 상황 | 예시 |
   |------|----------|------|
   | `debug` | 개발 중 상세 정보 | 파라미터 값, 중간 결과 |
   | `info` | 도구 호출/완료 | 시작, 종료, duration |
   | `warn` | 주의 필요 상황 | 캐시 미스, 재시도, 폴백 |
   | `error` | 실패/예외 | API 에러, 예외 발생 |

7. **로깅 시점** (Architecture §Process Patterns):
   ```typescript
   logger.info({ tool: 'get-story-context', story_id }, 'Tool invoked');
   logger.debug({ params }, 'Parameters received');
   logger.warn({ cache_key }, 'Cache miss, fetching from source');
   logger.info({ tool, duration_ms, cached }, 'Tool completed');
   logger.error({ tool, error }, 'Tool failed');
   ```

### Previous Story Learnings

1. **NodeNext 모듈 해석** (Story 1.1): import 경로에 `.js` 확장자 필수
   ```typescript
   // ✅ 올바른 import
   import { createLogger } from './pinoLogger.js';

   // ❌ 잘못된 import (컴파일 에러)
   import { createLogger } from './pinoLogger';
   ```

2. **환경변수 접근** (Story 1.4): loadEnvConfig() 사용 권장
   ```typescript
   import { loadEnvConfig } from './config/index.js';
   const config = loadEnvConfig();
   // config.LOG_LEVEL, config.NODE_ENV 사용
   ```

3. **타입 추론** (Story 1.4): Zod 스키마에서 타입 추론 패턴 활용

### Implementation Guidelines

1. **pino-pretty 조건부 로드**:
   - 프로덕션에서는 pino-pretty를 로드하지 않아야 함
   - pino transport 설정으로 조건부 적용

2. **createLogger 팩토리 패턴**:
   ```typescript
   export function createLogger(serverName: string): pino.Logger {
     return pino({
       name: serverName,
       level: config.LOG_LEVEL,
       redact: { ... },
       transport: config.NODE_ENV === 'development'
         ? { target: 'pino-pretty' }
         : undefined
     });
   }
   ```

3. **테스트 전략**:
   - pino의 destination을 mock하여 출력 캡처
   - 마스킹된 필드가 실제로 [REDACTED]인지 확인
   - 로그 레벨 필터링 테스트

### Testing Strategy

- **단위 테스트**: vitest로 각 함수 테스트
- **출력 캡처**: pino destination mock으로 로그 내용 검증
- **마스킹 검증**: 민감정보가 [REDACTED]로 변환되는지 확인
- **환경 격리**: NODE_ENV, LOG_LEVEL 환경변수 격리

### 참고 문서
- Architecture: `_bmad-output/architecture.md` §Logging Strategy, §Process Patterns
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.5

### 기존 코드베이스 참조
- Story 1.4에서 생성된 `packages/common/src/config/` - loadEnvConfig 사용
- `packages/common/src/index.ts` - re-export 패턴

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (125개 테스트 통과)
- [x] `npm run typecheck -w packages/common` 성공
- [x] 다른 패키지에서 `import { logger, createLogger } from '@moonklabs/mcp-common'` 가능
- [x] 민감정보가 [REDACTED]로 마스킹됨 확인
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan

1. **Task 1**: logger 디렉토리 구조 생성
   - src/logger/ 디렉토리 생성
   - src/logger/index.ts 생성 (re-export hub)

2. **Task 2**: pino 의존성 설치
   - pino (runtime dependency)
   - pino-pretty (dev dependency - 개발 환경 출력용)

3. **Task 3**: pinoLogger 구현
   - createLogger(serverName) 팩토리 함수
   - REDACT_PATHS 설정으로 민감정보 마스킹
   - 환경별 transport 설정 (development: pino-pretty, production: JSON)

4. **Task 4**: 타입 Export 통합
   - logger/index.ts에서 re-export
   - src/index.ts 업데이트

5. **Task 5**: RED-GREEN-REFACTOR 테스트
   - 19개 테스트 작성

### Debug Log

- 모든 구현이 첫 시도에 성공
- pino-pretty는 NODE_ENV=development 환경에서만 활성화
- destination 옵션 제공 시 transport 설정 비활성화 (테스트용)

### Completion Notes

**구현 완료 사항:**
- `createLogger(serverName)`: 서버별 로거 생성 팩토리
- `logger`: 기본 로거 인스턴스 (serverName: 'mcp-common')
- `LoggerOptions`: destination, level 옵션 인터페이스
- `REDACT_PATHS`: 민감정보 마스킹 필드 목록

**마스킹 대상 필드:**
- notion_token, api_key, apiKey, token, authorization, password, secret
- 중첩 필드: *.token, *.apiKey, *.api_key, *.password, *.secret
- HTTP 헤더: req.headers.authorization, req.headers.cookie

**테스트 결과:**
- createLogger 테스트: 4개 통과
- 민감정보 마스킹 테스트: 10개 통과
- 로그 레벨 테스트: 3개 통과
- 기본 로거/에러 테스트: 2개 통과
- 총 19개 logger 테스트 통과
- 전체 125개 테스트 통과

**빌드 결과:**
- ESM: dist/index.js (5.29 KB)
- CJS: dist/index.cjs (5.91 KB)
- DTS: dist/index.d.ts (18.64 KB)

### File List

#### New Files
- `packages/common/src/logger/index.ts`
- `packages/common/src/logger/pinoLogger.ts`
- `packages/common/src/logger/__tests__/pinoLogger.test.ts`

#### Modified Files
- `packages/common/src/index.ts` (logger re-export 추가)
- `packages/common/package.json` (pino, pino-pretty 의존성 추가)

#### Deleted Files
- None

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-26 | Story 1.5 생성 - 로깅 시스템 (logger) | SM (create-story workflow) |
| 2025-12-26 | 구현 완료 - createLogger, logger, LoggerOptions (19개 테스트 통과) | Dev (dev-story workflow) |
| 2025-12-27 | 코드 리뷰 완료 - M1,M2 수정: serverName 검증, *.authorization 패턴 추가 (23개 테스트) | Reviewer (code-review workflow) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Logging Strategy, §Process Patterns |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.5 |
| Story 1.1 | Previous Story Learnings (NodeNext, .js 확장자) |
| Story 1.4 | Previous Story Learnings (loadEnvConfig 사용) |

---

_Story created: 2025-12-26 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
