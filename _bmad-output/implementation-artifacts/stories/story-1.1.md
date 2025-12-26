# Story 1.1: packages/common 프로젝트 설정

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-26
**Completed:** 2025-12-26

---

## Story

As a **개발자**,
I want **packages/common 패키지의 기본 구조와 빌드 설정이 완료되어 있길**,
So that **다른 MCP 서버들이 공통 모듈을 import하여 사용할 수 있습니다**.

---

## Acceptance Criteria

### AC1: 디렉토리 구조 생성 ✅
**Given** 새로운 packages/common 디렉토리가 생성됨
**When** 기본 디렉토리 구조가 설정됨
**Then** 다음 구조가 존재해야 함:
```
packages/common/
├── src/
│   ├── index.ts       # re-export hub
│   ├── cache/         # (placeholder)
│   ├── errors/        # (placeholder)
│   ├── metrics/       # (placeholder)
│   └── testing/       # (placeholder)
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

### AC2: package.json 설정 ✅
**Given** package.json이 생성됨
**When** 패키지명이 `@moonklabs/mcp-common`으로 설정됨
**Then** 다음 조건을 충족해야 함:
- `name`: `@moonklabs/mcp-common`
- `type`: `module` (ESM)
- `main`, `module`, `types` 필드 정의
- `exports` 필드 정의
- `scripts.build`, `scripts.test` 정의

### AC3: TypeScript 설정 ✅
**Given** tsconfig.json이 생성됨
**When** 루트 tsconfig를 extends함
**Then** 다음 조건을 충족해야 함:
- `extends`: 루트 tsconfig
- `compilerOptions.outDir`: `dist`
- `include`: `["src/**/*"]`

### AC4: tsup 빌드 설정 ✅
**Given** tsup.config.ts가 생성됨
**When** ESM/CJS 듀얼 빌드가 설정됨
**Then** 다음 조건을 충족해야 함:
- `format`: `["esm", "cjs"]`
- `dts`: `true` (타입 정의 생성)
- `entry`: `["src/index.ts"]`

### AC5: vitest 설정 ✅
**Given** vitest.config.ts가 생성됨
**When** 테스트 환경이 설정됨
**Then** 테스트가 실행 가능해야 함

### AC6: 루트 워크스페이스 설정 ✅
**Given** 루트 package.json이 업데이트됨
**When** workspaces 설정이 추가됨
**Then** 다음 조건을 충족해야 함:
- `workspaces` 배열에 `"packages/*"` 포함
- `npm run build -w packages/common` 명령이 성공함

### AC7: 빌드 및 Import 검증 ✅
**Given** 빌드가 완료됨
**When** 다른 패키지에서 import 시도함
**Then** `import { ... } from '@moonklabs/mcp-common'`로 import 가능함

---

## Tasks / Subtasks

### Task 1: 디렉토리 구조 생성
- [x] 1.1 `packages/common` 디렉토리 생성
- [x] 1.2 `src/` 디렉토리 생성
- [x] 1.3 placeholder 하위 디렉토리 생성 (cache, errors, metrics, testing)
- [x] 1.4 `src/index.ts` 생성 (빈 re-export hub)

### Task 2: package.json 설정
- [x] 2.1 package.json 생성
- [x] 2.2 devDependencies 추가 (tsup, vitest, typescript)

### Task 3: TypeScript 설정
- [x] 3.1 tsconfig.json 생성
- [x] 3.2 루트 tsconfig.json 존재 확인 (없으면 생성)

### Task 4: tsup 빌드 설정
- [x] 4.1 tsup.config.ts 생성

### Task 5: vitest 설정
- [x] 5.1 vitest.config.ts 생성

### Task 6: 루트 워크스페이스 설정
- [x] 6.1 루트 package.json에 workspaces 추가
- [x] 6.2 루트 스크립트 추가 (build:all, test:all)

### Task 7: 빌드 검증
- [x] 7.1 `npm install` (루트에서)
- [x] 7.2 `npm run build -w packages/common` 실행
- [x] 7.3 dist/ 폴더에 index.js, index.cjs, index.d.ts 생성 확인
- [x] 7.4 테스트 파일 생성 및 `npm run test -w packages/common` 실행

---

## Dev Notes

### Architecture Constraints

1. **패키지명 규칙**: `@moonklabs/mcp-common` 고정 (Architecture 문서 참조)

2. **의존성 방향 제약**:
   ```
   packages/common은 다른 mcp-* 패키지를 import 금지
   (순환 의존성 방지)
   ```

3. **모듈 포맷**: ESM/CJS 듀얼 빌드 필수 (tsup 사용)

4. **향후 구현 모듈** (Story 1.2~1.8에서 구현):
   - `cache/` - 캐싱 레이어 (node-cache)
   - `errors/` - 에러 응답 헬퍼 (createMcpError)
   - `metrics/` - 메트릭스 수집
   - `testing/` - 테스트 유틸리티 (nock mocks)

### 참고 문서
- Architecture: `_bmad-output/architecture.md` §Monorepo Structure
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1

### 기존 코드베이스 참조
- `mcp-boilerplate/` - 기존 빌드 설정 참조 가능
- `mcp-notion-task/` - tsup, vitest 설정 참조

---

## Definition of Done

- [x] 모든 Acceptance Criteria 충족
- [x] `npm run build -w packages/common` 성공
- [x] `npm run test -w packages/common` 성공 (placeholder 테스트라도)
- [x] 다른 패키지에서 `import from '@moonklabs/mcp-common'` 가능
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Implementation Plan
- packages/common 디렉토리 구조 생성 (src/, cache/, errors/, metrics/, testing/)
- package.json 생성 (@moonklabs/mcp-common, ESM/CJS 듀얼 빌드)
- tsconfig.json 생성 (루트 extends)
- tsup.config.ts 생성 (ESM/CJS, dts: true)
- vitest.config.ts 생성 (globals: true, environment: node)
- 루트 package.json 생성 (workspaces 설정)
- 루트 tsconfig.json 생성 (공유 설정)
- 빌드 검증 및 테스트 실행

### Debug Log
- exports 필드 순서 경고 → types를 import/require 앞으로 이동하여 해결

### Completion Notes
- 모든 7개 Task, 14개 Subtask 완료
- tsup 빌드 성공: ESM (index.js), CJS (index.cjs), DTS (index.d.ts) 생성
- vitest 테스트 성공: 3개 테스트 통과
- npm workspaces 설정으로 `npm run build -w packages/common` 동작 확인

### Code Review (2025-12-26)
**Reviewer:** Adversarial Code Review Agent

**발견된 이슈 (4건 수정됨):**
1. **[HIGH] TypeScript 컴파일 에러** - NodeNext 모듈 해석에서 import 경로에 `.js` 확장자 누락
   - 수정: `import { VERSION } from '../index'` → `import { VERSION } from '../index.js'`
2. **[MEDIUM] Placeholder 디렉토리 Git 추적 불가** - 빈 디렉토리는 Git에 커밋되지 않음
   - 수정: cache/, errors/, metrics/, testing/ 각각에 `.gitkeep` 파일 추가
3. **[MEDIUM] 루트 .gitignore 누락** - node_modules, dist 등 제외 설정 없음
   - 수정: 루트에 `.gitignore` 파일 생성
4. **[MEDIUM] VERSION 동기화 경고 부재** - package.json과 index.ts의 버전 수동 동기화 필요
   - 수정: index.ts에 `⚠️ SYNC` 경고 주석 추가

**검증 결과:**
- `npm run typecheck -w packages/common` ✅ 통과
- `npm run test -w packages/common` ✅ 3개 테스트 통과
- `npm run build -w packages/common` ✅ 빌드 성공

---

## File List

### New Files
- `packages/common/package.json`
- `packages/common/tsconfig.json`
- `packages/common/tsup.config.ts`
- `packages/common/vitest.config.ts`
- `packages/common/src/index.ts`
- `packages/common/src/__tests__/index.test.ts`
- `packages/common/src/cache/.gitkeep`
- `packages/common/src/errors/.gitkeep`
- `packages/common/src/metrics/.gitkeep`
- `packages/common/src/testing/.gitkeep`
- `.gitignore` (root)
- `package.json` (root)
- `tsconfig.json` (root)

### Modified Files
- None

### Deleted Files
- None

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-26 | Story 1.1 구현 완료 - packages/common 프로젝트 설정 | Dev Agent |
| 2025-12-26 | Code Review 완료 - 4건 이슈 수정 (HIGH 1, MEDIUM 3) | Code Review Agent |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Monorepo Structure, §Workspace Configuration |
| PRD | §Common Infrastructure, §NFR-8 (테스트 커버리지) |
| Epic | Epic 1 - Common Infrastructure |

---

_Story created: 2025-12-26 by SM (create-story workflow)_
_Story completed: 2025-12-26 by Dev Agent (dev-story workflow)_
_Code reviewed: 2025-12-26 by Code Review Agent (code-review workflow)_
