# Test Design: Epic 1 - Common Infrastructure (packages/common)

**Date:** 2025-12-29
**Author:** moonklabs (TEA Agent)
**Status:** Draft (Retrospective)

---

## Executive Summary

**Scope:** Epic-Level test design for Epic 1 (packages/common) - Retrospective Analysis

**Note:** Epic 1은 이미 완료(done)된 상태입니다. 이 문서는 회고적 테스트 설계로, 향후 유지보수 및 Epic 2-5 개발 시 참조용입니다.

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (≥6): 3
- Critical categories: SEC, TECH, DATA

**Coverage Summary:**

- P0 scenarios: 15 (7.5 hours)
- P1 scenarios: 22 (11 hours)
- P2/P3 scenarios: 18 (4.5 hours)
- **Total effort**: 23 hours (~3 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | SEC | 로깅 시 API 키/토큰 민감정보 노출 | 2 | 3 | 6 | pino redact 설정으로 자동 마스킹 | DEV | Story 1.5 |
| R-002 | TECH | 환경변수 누락 시 런타임 크래시 | 3 | 2 | 6 | Zod 스키마 검증으로 조기 실패 | DEV | Story 1.4 |
| R-003 | DATA | 캐시 키 충돌로 잘못된 데이터 반환 | 2 | 3 | 6 | 네임스페이스 기반 키 패턴 적용 | DEV | Story 1.6 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-004 | TECH | createMcpError에서 suggestion 누락 | 2 | 2 | 4 | TypeScript 필수 파라미터 적용 | DEV |
| R-005 | PERF | 캐시 TTL 만료 시 응답 지연 스파이크 | 2 | 2 | 4 | 캐시 워밍업, stale-while-revalidate 패턴 | DEV |
| R-006 | OPS | 메트릭스 수집 오버헤드 | 1 | 3 | 3 | 샘플링, 비동기 수집 | DEV |
| R-007 | TECH | nock 모킹 후 정리 누락으로 테스트 오염 | 2 | 2 | 4 | beforeEach/afterEach 헬퍼 제공 | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-008 | OPS | vitest.workspace.ts 설정 오류 | 1 | 2 | 2 | CI에서 전체 테스트 실행 검증 |
| R-009 | TECH | ESM/CJS 빌드 호환성 이슈 | 1 | 2 | 2 | tsup 듀얼 빌드 테스트 |
| R-010 | BUS | 불명확한 에러 메시지로 디버깅 어려움 | 1 | 1 | 1 | suggestion 필드에 구체적 안내 포함 |

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
| NFR-6: 민감정보 마스킹 | Unit | R-001 | 4 | DEV | notion_token, api_key, password 등 |
| FR-4.3: loadEnvConfig Zod 검증 | Unit | R-002 | 3 | DEV | 필수/선택 변수 |
| Story 1.6: 캐시 키 유일성 | Unit | R-003 | 3 | DEV | 네임스페이스 충돌 방지 |
| AC-2: createMcpError suggestion 필수 | Unit | R-004 | 3 | DEV | TypeScript 컴파일 타임 검증 |
| Story 1.8: nock 격리 헬퍼 | Unit | R-007 | 2 | DEV | cleanAll, enableNetConnect |

**Total P0**: 15 tests, 7.5 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Story 1.2: McpResponse 타입 정의 | Unit | - | 3 | DEV | 타입 안전성 |
| Story 1.6: 캐시 get/set/TTL | Unit | R-005 | 4 | DEV | 만료, 히트/미스 |
| FR-4.1: 피드백 수집 | Unit | - | 2 | DEV | 👍/👎 |
| FR-4.2: 메트릭스 수집 | Unit | R-006 | 4 | DEV | tool_calls, success_rate |
| Story 1.8: mockNotionPage 헬퍼 | Unit | - | 3 | DEV | 페이지/Rate Limit 모킹 |
| Story 1.8: assertMcpSuccess/Error | Unit | - | 3 | DEV | 응답 검증 헬퍼 |
| Story 1.9: npm workspaces 설정 | Integration | - | 3 | DEV | build:all, test:all |

**Total P1**: 22 tests, 11 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Story 1.1: tsup 빌드 | Integration | R-009 | 3 | DEV | ESM/CJS 출력 |
| Story 1.5: pino-pretty 개발 환경 | Unit | - | 2 | DEV | NODE_ENV 분기 |
| Story 1.3: errorCodes 상수 | Unit | - | 2 | DEV | 에러 코드 정의 |
| Story 1.7: /metrics 엔드포인트 | API | - | 3 | DEV | Express 미들웨어 |
| NFR-8: 테스트 커버리지 80%+ | Unit | - | 5 | DEV | 경계 조건 |
| Story 1.9: vitest.workspace.ts | Integration | R-008 | 3 | DEV | 전체 테스트 실행 |

**Total P2**: 18 tests, 4.5 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| NFR-1: 응답 시간 p95 < 500ms | Perf | 2 | DEV | 캐시 레이어 벤치마크 |
| NFR-2: 동시 처리 50 req/s | Perf | 2 | DEV | 스트레스 테스트 |
| Story 1.9: scripts/bootstrap.sh | E2E | 1 | OPS | 초기 설정 자동화 |

**Total P3**: 5 tests, 1.5 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] @moonklabs/mcp-common import 가능 (30s)
- [ ] createMcpError 기본 동작 (30s)
- [ ] logger 초기화 (30s)
- [ ] cacheManager 생성 (30s)

**Total**: 4 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] 민감정보 마스킹 (notion_token, api_key) (Unit)
- [ ] loadEnvConfig 필수 변수 누락 에러 (Unit)
- [ ] 캐시 키 네임스페이스 분리 (Unit)
- [ ] createMcpError suggestion 필수 파라미터 (Unit)
- [ ] nock cleanAll 격리 (Unit)

**Total**: 15 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] McpResponse, McpErrorResponse 타입 (Unit)
- [ ] 캐시 TTL 만료 동작 (Unit)
- [ ] 캐시 cached 필드 표시 (Unit)
- [ ] metricsCollector 수집 (Unit)
- [ ] mockNotionPage nock 설정 (Unit)
- [ ] assertMcpSuccess 검증 (Unit)
- [ ] npm workspaces 빌드 (Integration)

**Total**: 22 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] ESM/CJS 듀얼 빌드 (Integration)
- [ ] pino-pretty 개발 환경 (Unit)
- [ ] /metrics Express 엔드포인트 (API)
- [ ] vitest.workspace.ts 전체 실행 (Integration)
- [ ] 성능 벤치마크 (Perf)

**Total**: 23 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 15 | 0.5 | 7.5 | 보안, 핵심 유틸리티 |
| P1 | 22 | 0.5 | 11 | 타입, 캐싱, 테스팅 |
| P2 | 18 | 0.25 | 4.5 | 빌드, 설정 |
| P3 | 5 | 0.3 | 1.5 | 성능, E2E |
| **Total** | **60** | **-** | **24.5** | **~3 days** |

### Prerequisites

**Test Data:**

- envFixture factory (환경변수 조합 생성)
- mcpResponseFixture factory (MCP 응답 생성)
- notionMockFixture factory (Notion API 모킹 데이터)

**Tooling:**

- vitest for unit/integration tests
- nock for HTTP 모킹
- pino-test for 로그 검증

**Environment:**

- Node.js 18+ (ESM 지원)
- npm workspaces 활성화
- 루트 tsconfig.json 설정

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80% (errors, config, cache, logger)
- **Security scenarios**: 100% (민감정보 마스킹)
- **Business logic**: ≥70% (MCP 응답 생성)
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] R-001 민감정보 마스킹 100% 검증
- [ ] R-002 환경변수 검증 Zod 스키마 적용
- [ ] R-003 캐시 키 네임스페이스 검증

---

## Mitigation Plans

### R-001: 로깅 시 API 키/토큰 민감정보 노출 (Score: 6)

**Mitigation Strategy:** Story 1.5에서 pino redact 설정 적용. 민감 필드 목록: notion_token, api_key, password, secret, authorization, token
**Owner:** DEV
**Timeline:** Story 1.5 완료 시점
**Status:** Complete
**Verification:** 민감정보 포함 객체 로깅 시 [REDACTED] 확인

### R-002: 환경변수 누락 시 런타임 크래시 (Score: 6)

**Mitigation Strategy:** Story 1.4에서 Zod 스키마 검증 적용. 필수 변수 누락 시 명확한 에러 메시지 출력.
**Owner:** DEV
**Timeline:** Story 1.4 완료 시점
**Status:** Complete
**Verification:** 필수 환경변수 미설정 상태에서 loadEnvConfig 호출 시 ZodError 발생

### R-003: 캐시 키 충돌로 잘못된 데이터 반환 (Score: 6)

**Mitigation Strategy:** Story 1.6에서 캐시 키 패턴 적용: `{server}:{resource}:{id}:{hash}`. 서버별 네임스페이스 분리.
**Owner:** DEV
**Timeline:** Story 1.6 완료 시점
**Status:** Complete
**Verification:** 동일 리소스 다른 서버에서 독립적 캐시 유지

---

## Assumptions and Dependencies

### Assumptions

1. Node.js 18+ 환경에서 실행 (ESM 지원 필수)
2. npm workspaces가 올바르게 설정됨
3. pino v8+ 사용 (redact 기능 지원)

### Dependencies

1. **vitest** - 테스트 프레임워크
2. **nock** - HTTP 모킹
3. **zod** - 스키마 검증
4. **pino** - 로깅
5. **node-cache** - 캐싱

### Risks to Plan

- **Risk**: packages/common 변경 시 다른 MCP 서버에 영향
  - **Impact**: 회귀 버그 발생
  - **Contingency**: workspace 전체 테스트 실행 필수

---

## Module-Specific Test Requirements

### types/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| mcp.ts | McpResponse, McpErrorResponse 타입 검증 | P1 |
| notion.ts | NotionPage, NotionBlock 타입 검증 | P2 |
| cache.ts | CacheOptions, CacheEntry 타입 검증 | P2 |

### errors/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| createMcpError.ts | suggestion 필수, available_options, retry_after | P0 |
| errorCodes.ts | 에러 코드 상수 정의 | P2 |

### config/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| environment.ts | Zod 스키마 검증, 필수/선택 변수 | P0 |
| defaults.ts | 기본값 상수 | P2 |

### logger/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| pinoLogger.ts | 민감정보 마스킹, 환경별 출력 포맷 | P0 |

### cache/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| cacheManager.ts | get/set/TTL, 캐시 키 패턴 | P0, P1 |
| cacheManagerLogic.ts | 순수 로직 테스트 | P1 |

### metrics/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| metricsCollector.ts | tool_calls, success_rate 수집 | P1 |
| metricsEndpoint.ts | /metrics Express 미들웨어 | P2 |

### testing/ 모듈

| 파일 | 테스트 범위 | 우선순위 |
|------|-------------|----------|
| mocks/notion.ts | mockNotionPage, mockNotionRateLimit | P1 |
| mocks/slack.ts | Slack API 모킹 (Phase 2 대비) | P2 |
| assertions.ts | assertMcpSuccess, assertMcpError | P1 |
| fixtures/stories.ts | 스토리 픽스처 데이터 | P2 |

---

## Follow-on Workflows (Manual)

- Epic 2-5 개발 시 이 문서의 testing/ 모듈 활용
- 변경 사항 발생 시 영향 분석 필요
- Run `testarch-automate` for coverage expansion

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

| Story | FR/NFR | Tests (P0/P1/P2) | Status |
|-------|--------|------------------|--------|
| 1.1 | - | 0/3/3 | done |
| 1.2 | - | 0/3/2 | done |
| 1.3 | AC-2 | 3/0/2 | done |
| 1.4 | - | 3/0/2 | done |
| 1.5 | NFR-6 | 4/0/2 | done |
| 1.6 | NFR-4 | 3/4/0 | done |
| 1.7 | FR-4.1,4.2 | 0/6/3 | done |
| 1.8 | AC-6 | 2/6/3 | done |
| 1.9 | - | 0/3/3 | done |

### NFR Coverage Matrix

| NFR | Description | Test Coverage | Stories |
|-----|-------------|---------------|---------|
| NFR-1 | 응답 시간 p95 < 500ms | P3 (Perf) | 1.6 |
| NFR-2 | 동시 처리 50 req/s | P3 (Perf) | 1.7 |
| NFR-3 | 업타임 99%+ | OPS (모니터링) | 1.7 |
| NFR-4 | 캐시 폴백 | P1 | 1.6 |
| NFR-5 | 환경변수 API 키 | P0 | 1.4 |
| NFR-6 | 민감정보 마스킹 | P0 | 1.5 |
| NFR-8 | 테스트 커버리지 80%+ | P2 | All |
| NFR-9 | 3계층 분리 | P2 | All |
| NFR-10 | 무상태, 수평 확장 | Design | 1.6 |

### Related Documents

- PRD: _bmad-output/prd.md
- Epic: _bmad-output/epics.md (Epic 1 섹션)
- Architecture: _bmad-output/architecture.md
- Sprint Status: _bmad-output/implementation-artifacts/sprint-status.yaml

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
