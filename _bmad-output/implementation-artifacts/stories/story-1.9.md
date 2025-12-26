# Story 1.9: 루트 워크스페이스 설정

**Epic:** Epic 1 - Common Infrastructure (packages/common)
**Phase:** 1.0 (기반 인프라)
**Status:** done
**Created:** 2025-12-27

---

## Story

As a **개발자**,
I want **루트 레벨 워크스페이스 설정이 완료되어**,
So that **모노레포 전체를 일관되게 빌드/테스트할 수 있습니다**.

---

## Acceptance Criteria

### AC1: 루트 package.json 워크스페이스 설정 검증
**Given** 루트 package.json이 존재함
**When** npm workspaces 설정을 검증함
**Then** `"workspaces": ["packages/*", "mcp-*"]`가 설정되어 있음
**And** `npm run build:all`, `npm run test:all` 스크립트가 동작함

### AC2: vitest.workspace.ts로 전체 테스트 실행
**Given** vitest.workspace.ts 파일이 루트에 존재함
**When** `npx vitest --workspace` 명령을 실행함
**Then** 모든 패키지의 테스트가 통합 실행됨
**And** 각 패키지별 테스트 결과가 구분되어 표시됨

### AC3: scripts/bootstrap.sh 초기 설정 자동화
**Given** scripts/bootstrap.sh 파일이 존재함
**When** 새로운 환경에서 `./scripts/bootstrap.sh`를 실행함
**Then** 의존성 설치가 완료됨 (`npm install`)
**And** packages/common 빌드가 완료됨
**And** 환경변수 템플릿이 복사됨 (.env.example → .env)
**And** Git hooks가 설정됨 (있는 경우)

### AC4: PR 템플릿 제공
**Given** .github/PULL_REQUEST_TEMPLATE.md가 존재함
**When** GitHub에서 새 PR을 생성함
**Then** 체크리스트와 가이드가 자동으로 표시됨
**And** 테스트, 문서화, 리뷰어 항목이 포함됨

---

## Tasks / Subtasks

### Task 1: 루트 package.json 검증 및 보완 (AC: 1)
- [x] 1.1 현재 workspaces 설정 확인 (이미 존재함)
- [x] 1.2 `dev:all` 스크립트 추가 (`npm run dev -ws --if-present`)
- [x] 1.3 `lint`, `format` 스크립트 추가 (`--if-present` 패턴)
- [x] 1.4 스크립트 동작 테스트

### Task 2: vitest.workspace.ts 생성 (AC: 2)
- [x] 2.1 루트에 `vitest.workspace.ts` 파일 생성
- [x] 2.2 packages/common 테스트 설정 포함
- [x] 2.3 mcp-* 패키지들 테스트 설정 (glob 패턴)
- [x] 2.4 `npx vitest run` 실행 테스트 (400개 테스트 통과)

### Task 3: scripts/bootstrap.sh 생성 (AC: 3)
- [x] 3.1 `scripts/` 디렉토리 생성
- [x] 3.2 `bootstrap.sh` 스크립트 작성
- [x] 3.3 의존성 설치 로직 (`npm install`)
- [x] 3.4 packages/common 빌드 로직
- [x] 3.5 .env 파일 생성 로직 (.env.example 복사)
- [x] 3.6 실행 권한 부여 (`chmod +x`)
- [x] 3.7 스크립트 테스트

### Task 4: PR 템플릿 생성 (AC: 4)
- [x] 4.1 `.github/` 디렉토리 확인/생성
- [x] 4.2 `PULL_REQUEST_TEMPLATE.md` 작성
- [x] 4.3 체크리스트 항목 정의 (테스트, 문서, 리뷰)

---

## Dev Notes

### Architecture Constraints

1. **모노레포 구조** (Architecture §Monorepo Structure):
   ```
   moonklabs-mcp-servers/
   ├── packages/
   │   └── common/         # @moonklabs/mcp-common
   ├── mcp-boilerplate/    # 템플릿
   ├── mcp-notion-task/    # 기존 서버
   ├── mcp-context-loader/ # Phase 1.1 (예정)
   ├── mcp-spec-reader/    # Phase 1.2 (예정)
   └── package.json        # 루트 워크스페이스
   ```

2. **npm workspaces 규칙**:
   - `packages/*`: 공통 패키지 (common)
   - `mcp-*`: MCP 서버들
   - 의존성: `"@moonklabs/mcp-common": "workspace:*"`

3. **Node.js 요구사항**: Node.js 20+ (Architecture §Technical Constraints)

4. **테스트 프레임워크**: vitest (기존 packages/common에서 사용 중)

### Previous Story Learnings

**Story 1.8 완료 내용:**
- packages/common에 295개 테스트 존재
- vitest.config.ts 이미 설정됨
- nock 기반 HTTP 모킹 설정 완료
- 코드 리뷰 수정 완료 (vitest 의존성 문서화, edge case 테스트)

**적용할 패턴:**
- vitest.workspace.ts에서 packages/common/vitest.config.ts 참조
- TypeScript NodeNext 모듈 해석 (.js 확장자)

### Implementation Guidelines

1. **vitest.workspace.ts 구조**:
   ```typescript
   import { defineWorkspace } from 'vitest/config';

   export default defineWorkspace([
     'packages/common',
     'mcp-*',
   ]);
   ```

2. **bootstrap.sh 구조**:
   ```bash
   #!/bin/bash
   set -e

   echo "🚀 moonklabs-mcp-servers 초기화..."

   # 의존성 설치
   npm install

   # packages/common 빌드
   npm run build -w packages/common

   # .env 파일 생성
   if [ ! -f .env ]; then
     cp .env.example .env 2>/dev/null || echo "⚠️ .env.example 없음"
   fi

   echo "✅ 초기화 완료!"
   ```

3. **PR 템플릿 내용**:
   - 변경 사항 요약
   - 테스트 체크리스트
   - 문서화 체크리스트
   - 리뷰어 가이드

4. **package.json 스크립트 추가**:
   ```json
   {
     "scripts": {
       "dev:all": "concurrently \"npm run dev -w mcp-context-loader\" \"npm run dev -w mcp-spec-reader\"",
       "lint": "eslint . --ext .ts",
       "format": "prettier --write ."
     }
   }
   ```
   ⚠️ 주의: mcp-context-loader, mcp-spec-reader는 아직 생성되지 않음.
   dev:all은 현재 존재하는 패키지만 포함하거나, 향후 추가 예정임을 명시

### Testing Strategy

- **vitest workspace 테스트**: `npx vitest --run` 실행 후 모든 테스트 통과 확인
- **bootstrap.sh 테스트**: 새 디렉토리에서 클론 후 스크립트 실행 테스트 (수동)
- **PR 템플릿 테스트**: GitHub에서 PR 생성 시 템플릿 표시 확인 (수동)

### Dependencies

현재 루트 package.json에 devDependencies 없음. 필요시 추가:
- `concurrently`: dev:all 스크립트용 (선택사항)
- `eslint`, `prettier`: lint/format 스크립트용 (선택사항)

**주의**: 현재는 최소 설정만 하고, 필요시 Phase 1.5에서 확장

### Project Structure Notes

- packages/common은 이미 완성됨 (Story 1.1-1.8)
- mcp-context-loader, mcp-spec-reader는 Epic 2, 3에서 생성 예정
- 현재 스토리는 워크스페이스 인프라 설정에 집중

### References

- Architecture: `_bmad-output/architecture.md` §Monorepo Structure
- Architecture: `_bmad-output/architecture.md` §Workspace Configuration
- PRD: `_bmad-output/prd.md` §Common Infrastructure
- Epic: `_bmad-output/epics.md` §Epic 1, Story 1.9
- Story 1.8: packages/common 완료 (295 테스트)

---

## Definition of Done

- [x] 루트 package.json workspaces 설정 검증
- [x] `npm run build:all` 성공
- [x] `npm run test:all` 성공 (400 tests passed)
- [x] vitest.workspace.ts 생성 및 동작
- [x] scripts/bootstrap.sh 생성 및 실행 가능
- [x] .github/PULL_REQUEST_TEMPLATE.md 생성
- [x] 코드 리뷰 완료

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

없음

### Completion Notes List

- vitest 워크스페이스가 자동으로 vitest.workspace.ts를 감지하여 400개 테스트 통합 실행
- `--if-present` 플래그로 각 패키지에 스크립트가 없어도 오류 없이 실행
- bootstrap.sh는 Node.js 버전 확인, 의존성 설치, common 빌드, .env 복사, Git hooks 설정을 자동화

### Code Review Fixes (2025-12-27)

- M1: bootstrap.sh에 Git hooks 설정 로직 추가 (Husky, .githooks 지원)
- L1: vitest.workspace.ts JSDoc 명령어 수정 (`npx vitest run`)
- L2: bootstrap.sh에 .env.example 없을 때 경고 메시지 추가
- L3: PR 템플릿에 Breaking Changes 섹션 추가
- L4: bootstrap.sh 헤더 단계 번호 수정 (4단계 → 5단계)

### File List

- `package.json` - dev:all, lint, format 스크립트 추가
- `vitest.workspace.ts` - vitest 워크스페이스 설정 (신규)
- `scripts/bootstrap.sh` - 프로젝트 초기 설정 스크립트 (신규)
- `.github/PULL_REQUEST_TEMPLATE.md` - PR 템플릿 (신규)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-27 | Story 1.9 생성 - 루트 워크스페이스 설정 | SM (create-story workflow) |
| 2025-12-27 | 구현 완료 - 코드 리뷰 대기 | Dev (Claude Opus 4.5) |
| 2025-12-27 | 코드 리뷰 완료 - 5개 이슈 수정 (1M, 4L) | Code Review (Claude Opus 4.5) |

---

## Related Documents

| 문서 | 섹션 |
|------|------|
| Architecture | §Monorepo Structure |
| Architecture | §Workspace Configuration |
| PRD | §Common Infrastructure |
| Epic | Epic 1 - Common Infrastructure, Story 1.9 |
| Story 1.8 | packages/common 완료 |

---

_Story created: 2025-12-27 by SM (create-story workflow)_
_Ultimate context engine analysis completed - comprehensive developer guide created_
