# Test Design: Epic 2 - mcp-context-loader 구현

**Date:** 2025-12-29
**Author:** moonklabs (TEA Agent)
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-Level test design for Epic 2 (mcp-context-loader)

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (≥6): 2
- Critical categories: TECH, DATA, PERF

**Coverage Summary:**

- P0 scenarios: 12 (6 hours)
- P1 scenarios: 18 (9 hours)
- P2/P3 scenarios: 15 (4 hours)
- **Total effort**: 19 hours (~2.5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | 스토리 파일 파싱 실패 시 컨텍스트 누락 | 2 | 3 | 6 | graceful degradation 적용, 부분 결과 반환 | DEV | Story 2.4c |
| R-002 | TECH | tiktoken 네이티브 바인딩 호환성 이슈 (플랫폼별) | 2 | 3 | 6 | js-tiktoken 대안 검토, fallback 구현 | DEV | Story 2.2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-003 | PERF | 대용량 문서 로드 시 응답 지연 (p95 < 500ms 위반) | 2 | 2 | 4 | 캐싱 레이어 적용, 청크 로딩 고려 | DEV |
| R-004 | DATA | glob 패턴 매칭 실패로 문서 누락 | 2 | 2 | 4 | 지원 문서 유형 명확화, 경고 로그 | DEV |
| R-005 | TECH | packages/common 의존성 버전 불일치 | 1 | 3 | 3 | workspace 설정 검증, peerDependencies | DEV |
| R-006 | BUS | 잘못된 story_id 형식으로 STORY_NOT_FOUND 빈번 발생 | 2 | 2 | 4 | story_id 정규화 로직, available_options 제공 | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-007 | OPS | Docker 빌드 시 tiktoken 바이너리 누락 | 1 | 2 | 2 | Dockerfile 멀티스테이지 빌드 테스트 |
| R-008 | TECH | 빈 문서 처리 시 불필요한 토큰 카운트 | 1 | 1 | 1 | 빈 문서 조기 반환 |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| FR-1.1: load-context 기본 동작 | API | R-001 | 3 | DEV | prd, architecture, epic 로드 |
| FR-1.2: get-story-context 스토리 파싱 | API | R-001 | 3 | DEV | 정상/실패/부분 케이스 |
| FR-1.3: count-tokens 정확성 | Unit | R-002 | 3 | DEV | 다양한 텍스트 입력 |
| FR-1.2: story_id 정규화 | Unit | R-006 | 3 | DEV | 다양한 형식 지원 |

**Total P0**: 12 tests, 6 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| FR-1.1: load-context 캐싱 동작 | API | R-003 | 3 | DEV | 캐시 히트/미스 |
| FR-1.4: list-document-types 응답 | API | - | 2 | DEV | 메타데이터 포함 |
| FR-1.2: Epic/FR/Architecture 연결 | API | R-004 | 4 | DEV | 관련 문서 매핑 |
| FR-1.1: 지원하지 않는 document_type 처리 | API | R-004 | 2 | DEV | 무시 + 경고 로그 |
| AC-2: createMcpError suggestion 필수 | Unit | - | 3 | DEV | 모든 에러 응답 |
| FR-1.2: 응답 포맷팅 구조 | Unit | - | 4 | DEV | story/epic/requirements/architecture |

**Total P1**: 18 tests, 9 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| NFR-8: 테스트 커버리지 80%+ | Unit | - | 8 | DEV | 경계 조건, 엣지 케이스 |
| FR-1.5: validate-context (Could Have) | API | - | 3 | DEV | 추후 구현 |
| NFR-9: 3계층 분리 검증 | Unit | R-005 | 2 | DEV | index→tool→toolLogic |
| AC-6: nock 기반 HTTP 모킹 | Unit | - | 2 | DEV | beforeEach 격리 |

**Total P2**: 15 tests, 4 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| NFR-1: 응답 시간 p95 < 500ms | Perf | 3 | DEV | 대용량 문서 벤치마크 |
| Story 2.6: MCP Inspector 수동 테스트 | E2E | 2 | QA | 실제 프로토콜 검증 |
| Docker 빌드/실행 테스트 | E2E | 1 | OPS | Dockerfile 검증 |

**Total P3**: 6 tests, 2 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] count-tokens 기본 동작 (30s)
- [ ] load-context 단일 문서 로드 (45s)
- [ ] list-document-types 응답 (30s)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] count-tokens 다양한 모델 (Unit)
- [ ] load-context 복합 문서 로드 (API)
- [ ] get-story-context 정상 파싱 (API)
- [ ] get-story-context STORY_NOT_FOUND 처리 (API)
- [ ] story_id 정규화 ("1.3", "Story-1.3", "story-1-3") (Unit)
- [ ] 부분 실패 시 graceful degradation (API)

**Total**: 12 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] 캐싱 동작 검증 (캐시 히트 시 cached: true) (API)
- [ ] Epic → Story → FR 연결 로직 (API)
- [ ] Architecture 결정 연결 (API)
- [ ] 지원하지 않는 document_type 무시 + 경고 (API)
- [ ] createMcpError suggestion 필드 필수 (Unit)
- [ ] 응답 구조 검증 (Unit)

**Total**: 18 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] 빈 텍스트 count-tokens → 0 (Unit)
- [ ] 빈 문서 처리 (Unit)
- [ ] 3계층 분리 구조 검증 (Unit)
- [ ] nock 격리 검증 (Unit)
- [ ] 성능 벤치마크 (Perf)
- [ ] Docker 빌드 테스트 (E2E)

**Total**: 21 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 12 | 0.5 | 6 | 핵심 로직, 단순 구조 |
| P1 | 18 | 0.5 | 9 | 통합 검증, 캐싱 |
| P2 | 15 | 0.25 | 4 | 엣지 케이스 |
| P3 | 6 | 0.3 | 2 | 성능/E2E |
| **Total** | **51** | **-** | **21** | **~2.5 days** |

### Prerequisites

**Test Data:**

- storyFixture factory (스토리 마크다운 생성)
- epicFixture factory (Epic 데이터 생성)
- documentFixture factory (PRD, Architecture 문서)

**Tooling:**

- vitest for unit/API tests
- nock for HTTP 모킹 (Notion API 대비)
- MCP Inspector for E2E 검증

**Environment:**

- packages/common 빌드 완료
- .env.example 기반 환경변수 설정
- _bmad-output 테스트 픽스처

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80% (load-context, get-story-context, count-tokens)
- **Security scenarios**: N/A (Epic 2는 보안 민감 기능 없음)
- **Business logic**: ≥70% (파싱, 연결, 포맷팅)
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] R-001 graceful degradation 구현 완료
- [ ] R-002 tiktoken 플랫폼 호환성 검증

---

## Mitigation Plans

### R-001: 스토리 파일 파싱 실패 시 컨텍스트 누락 (Score: 6)

**Mitigation Strategy:** Story 2.4c에서 graceful degradation 적용. 일부 문서 파싱 실패 시에도 성공한 부분은 반환하고, 실패한 부분은 경고 로그와 함께 suggestion 제공.
**Owner:** DEV
**Timeline:** Story 2.4c 완료 시점
**Status:** Complete (Story 2.4c 구현 완료)
**Verification:** 부분 실패 시나리오 테스트 (P0 테스트에 포함)

### R-002: tiktoken 네이티브 바인딩 호환성 이슈 (Score: 6)

**Mitigation Strategy:** Story 2.2 Task에 js-tiktoken 대안 검토 포함. 네이티브 바인딩 실패 시 순수 JS 구현으로 fallback.
**Owner:** DEV
**Timeline:** Story 2.2 완료 시점
**Status:** Complete (js-tiktoken 사용)
**Verification:** 다양한 플랫폼(Linux, macOS, Docker)에서 count-tokens 테스트

---

## Assumptions and Dependencies

### Assumptions

1. packages/common (Epic 1)이 완료되어 @moonklabs/mcp-common import 가능
2. _bmad-output 디렉토리 구조가 표준 BMM 형식을 따름
3. 스토리 파일 명명 규칙: story-{epic}-{num}.md 또는 story-{epic}-{num}-{slug}.md

### Dependencies

1. **Epic 1 완료** - @moonklabs/mcp-common 패키지 사용
2. **vitest 설정** - 테스트 프레임워크
3. **nock 설치** - HTTP 모킹

### Risks to Plan

- **Risk**: 테스트 픽스처 생성 시간 과소평가
  - **Impact**: 테스트 개발 지연
  - **Contingency**: 기존 _bmad-output 파일을 픽스처로 활용

---

## Follow-on Workflows (Manual)

- Run `testarch-atdd` to generate failing P0 tests (separate workflow)
- Run `testarch-automate` for broader coverage once implementation exists
- Story 2.6 통합 테스트 구현 시 이 문서 참조

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _____ Date: _____
- [ ] Tech Lead: _____ Date: _____
- [ ] QA Lead: _____ Date: _____

**Comments:**

---

## Appendix

### Story Coverage Matrix

| Story | FR | Tests (P0/P1/P2) | Status |
|-------|-----|------------------|--------|
| 2.1 | - | 0/2/1 | done |
| 2.2 | FR-1.3 | 3/0/2 | done |
| 2.3 | FR-1.1 | 3/5/3 | done |
| 2.4a | FR-1.2 | 3/2/2 | done |
| 2.4b | FR-1.2 | 0/4/2 | done |
| 2.4c | FR-1.2 | 3/3/2 | done |
| 2.5 | FR-1.4 | 0/2/1 | done |
| 2.6 | - | 0/0/2 | backlog |

### Related Documents

- PRD: _bmad-output/prd.md
- Epic: _bmad-output/epics.md (Epic 2 섹션)
- Architecture: _bmad-output/architecture.md
- Sprint Status: _bmad-output/implementation-artifacts/sprint-status.yaml

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
