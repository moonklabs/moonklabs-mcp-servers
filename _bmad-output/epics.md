---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/architecture.md'
  - '_bmad-output/project-planning-artifacts/research/technical-mcp-tools-research-2025-12-25.md'
  - '_bmad-output/analysis/brainstorming-session-2025-12-25.md'
workflowType: 'epics-and-stories'
project_name: 'moonklabs-mcp-servers'
user_name: 'moonklabs'
date: '2025-12-26'
status: 'complete'
epicListApproved: true
storiesGenerated: true
validationComplete: true
totalStories: 32
totalEpics: 5
frCoverage: '18/18 (100%)'
partyModeRounds: 4
partyModeFeedback:
  - 'Epic 2, 3 병렬 개발 가능'
  - 'Story 2.4를 2.4a/2.4b/2.4c로 분해'
  - 'count-tokens Epic 2 유지'
  - 'summarize-spec Phase 1.5 유지'
  - 'tiktoken 대안 검토'
  - 'Markdown 변환 라이브러리 결정'
  - 'README.md 생성 Task'
  - 'story_id 형식 예시'
  - 'Edge Case 처리'
---

# moonklabs-mcp-servers - Epic Breakdown

## Overview

이 문서는 moonklabs-mcp-servers 프로젝트의 완전한 Epic 및 Story 분해를 제공합니다.
PRD, Architecture, Technical Research에서 요구사항을 추출하여 구현 가능한 Story로 분해합니다.

**프로젝트 목표:** 3개의 MCP 서버 (mcp-context-loader, mcp-spec-reader, mcp-slack-bugfix) 구현

**구현 순서:** Architecture 문서 기반
1. Phase 1.0: packages/common (기반 인프라)
2. Phase 1.1: mcp-context-loader
3. Phase 1.2: mcp-spec-reader
4. Phase 2: mcp-slack-bugfix

## Requirements Inventory

### Functional Requirements

| ID | 요구사항 | 서버 | 우선순위 | Epic |
|----|----------|------|----------|------|
| FR-1.1 | load-context: 작업 컨텍스트 통합 로딩 | context-loader | Must Have | Epic 2 |
| FR-1.2 | get-story-context: 스토리별 컨텍스트 로딩 | context-loader | Must Have | Epic 2 |
| FR-1.3 | count-tokens: 토큰 수 계산 | context-loader | Must Have | Epic 2 |
| FR-1.4 | list-document-types: 문서 유형 목록 | context-loader | Should Have | Epic 2 |
| FR-1.5 | validate-context: 컨텍스트 유효성 검사 | context-loader | Could Have | Epic 2 |
| FR-2.1 | read-spec: Notion 스펙 읽기 | spec-reader | Must Have | Epic 3 |
| FR-2.2 | list-specs: 스펙 목록 조회 | spec-reader | Must Have | Epic 3 |
| FR-2.3 | summarize-spec: 스펙 요약 (LLM) | spec-reader | Should Have | Epic 3 |
| FR-2.4 | get-spec-section: 섹션별 로딩 | spec-reader | Should Have | Epic 3 |
| FR-2.5 | compare-specs: 스펙 비교 | spec-reader | Could Have | Epic 3 |
| FR-3.1 | watch-errors: Slack 오류 모니터링 | slack-bugfix | Must Have | Epic 4 |
| FR-3.2 | analyze-error: 오류 분석 | slack-bugfix | Must Have | Epic 4 |
| FR-3.3 | auto-fix: 자동 수정 제안 | slack-bugfix | Should Have | Epic 4 |
| FR-3.4 | create-pr: GitHub PR 생성 | slack-bugfix | Should Have | Epic 4 |
| FR-4.1 | 피드백 수집 (👍/👎) | common | Should Have | Epic 1 |
| FR-4.2 | 메트릭스 수집 | common | Should Have | Epic 1 |
| FR-4.3 | 헬스체크 엔드포인트 | common | Must Have | Epic 1 |
| FR-4.4 | Rate Limiting | common | Should Have | Epic 5 |

### Non-Functional Requirements

| NFR | 영역 | 요구사항 | 목표 | Epic |
|-----|------|----------|------|------|
| NFR-1 | 성능 | 응답 시간 | p95 < 500ms | Epic 1, 2, 3 |
| NFR-2 | 성능 | 동시 처리 | 50 req/s | Epic 1 |
| NFR-3 | 가용성 | 업타임 | 99%+ | Epic 1 |
| NFR-4 | 가용성 | 폴백 | 캐시 폴백 | Epic 1 |
| NFR-5 | 보안 | 인증 | 환경변수 API 키 | Epic 1 |
| NFR-6 | 보안 | 로깅 | 민감정보 마스킹 | Epic 1 |
| NFR-7 | 보안 | 접근 제한 | NOTION_PAGE_IDS | Epic 3 |
| NFR-8 | 유지보수 | 테스트 | 커버리지 80%+ | All Epics |
| NFR-9 | 유지보수 | 코드 구조 | 3계층 분리 | All Epics |
| NFR-10 | 확장성 | 설계 | 무상태, 수평 확장 | Epic 1 |

### Additional Requirements (Architecture Constraints)

| ID | 제약사항 | 적용 범위 |
|----|----------|----------|
| AC-1 | 3계층 분리 패턴 필수 (index → tool → toolLogic) | 모든 도구 |
| AC-2 | createMcpError() 헬퍼 사용, suggestion 필드 필수 | 에러 처리 |
| AC-3 | loadEnvConfig()로 환경변수 접근, 직접 process.env 금지 | 설정 관리 |
| AC-4 | @moonklabs/mcp-common 패키지명 import | Import 규칙 |
| AC-5 | pino 로거 + redact 설정 | 로깅 |
| AC-6 | nock 기반 HTTP 모킹, beforeEach 격리 | 테스트 |
| AC-7 | node-cache (Phase 1) → Redis (Phase 2+) | 캐싱 |
| AC-8 | try-catch 비동기 처리, .catch() 금지 | 비동기 |

### FR Coverage Map

| Epic | FR 커버리지 | NFR 커버리지 |
|------|------------|--------------|
| Epic 1: Common Infrastructure | FR-4.1, FR-4.2, FR-4.3 | NFR-1~10 |
| Epic 2: mcp-context-loader | FR-1.1~FR-1.5 | NFR-1, NFR-8, NFR-9 |
| Epic 3: mcp-spec-reader | FR-2.1~FR-2.5 | NFR-1, NFR-7, NFR-8, NFR-9 |
| Epic 4: mcp-slack-bugfix | FR-3.1~FR-3.4 | NFR-8, NFR-9 |
| Epic 5: Infrastructure Enhancement | FR-4.4 | NFR-2 |

## Epic List

| # | Epic 이름 | Phase | 의존성 | 우선순위 | 비고 |
|---|----------|-------|--------|---------|------|
| 1 | Common Infrastructure (packages/common) | 1.0 | 없음 | Critical | 가장 먼저 구현 |
| 2 | mcp-context-loader 구현 | 1.1 | Epic 1 | High | **Epic 3과 병렬 개발 가능** |
| 3 | mcp-spec-reader 구현 | 1.2 | Epic 1 | High | **Epic 2와 병렬 개발 가능** |
| 4 | mcp-slack-bugfix 구현 | 2.0 | Epic 1 | Medium | Phase 2 (Slack API 변경 대비) |
| 5 | Infrastructure Enhancement | 1.5 | Epic 1 | Low | MVP 이후 |

### Party Mode 피드백 반영 사항

**Round 1 (Epic 구조 검토):**

| 관점 | 피드백 | 반영 결과 |
|------|--------|----------|
| PM (John) | Epic 2, 3 병렬 개발 권장 | ✅ Epic List에 병렬 개발 가능 명시 |
| Architect (Winston) | Story 2.4 분해 필요 | ✅ Story 2.4를 2.4a/2.4b/2.4c로 분해 |
| SM (Bob) | count-tokens 위치 확인 | ✅ Epic 2 유지 (context-loader 전용) |
| Dev (Amelia) | tiktoken 의존성 확인 필요 | ✅ Story 2.2 Task에 명시 |
| Dev (Amelia) | summarize-spec LLM 방식 | ✅ Phase 1.5 유지, 추후 결정 |

**Round 2 (Story 완성도 검토):**

| 관점 | 피드백 | 반영 결과 |
|------|--------|----------|
| Dev (Amelia) | Story 2.3에 문서 유형 목록 명시 | ✅ AC에 지원 문서 유형 추가 |
| Dev (Amelia) | Story 3.3 Markdown 변환 라이브러리 | ✅ Task에 라이브러리 결정 추가 |
| TEA (Murat) | Story 3.6 테스트 격리 검증 | ✅ AC와 Task에 격리 검증 추가 |
| Architect (Winston) | Story 2.2 tiktoken 대안 검토 | ✅ Task에 js-tiktoken 대안 추가 |
| SM (Bob) | Story 3.4 LLM 제공자 결정 | ✅ Task에 LLM 제공자 결정 추가 |

**Round 3 (구현 준비도 검토):**

| 관점 | 피드백 | 반영 결과 |
|------|--------|----------|
| TEA (Murat) | Story 2.6, 4.6에 테스트 격리 AC | ✅ AC와 Task에 격리 검증 추가 |
| Tech Writer (Paige) | README.md 생성 Task 추가 | ✅ Story 2.1, 3.1, 4.1에 추가 |
| UX (Sally) | story_id 형식 예시 추가 | ✅ Story 2.4a AC에 형식 예시 추가 |
| Architect (Winston) | bootstrap.sh Task 확인 | ✅ Story 1.9에 이미 포함됨 |

**Round 4 (Edge Case 검토):**

| 관점 | 피드백 | 반영 결과 |
|------|--------|----------|
| Dev (Amelia) | Story 2.3 잘못된 document_type 처리 | ✅ AC에 무시+경고 로그 추가 |
| Dev (Amelia) | Story 3.3 빈 페이지 처리 | ✅ AC에 empty_content 필드 추가 |
| UX (Sally) | Rate Limit 동적 suggestion | ✅ Story 3.3 AC에 동적 suggestion 추가 |
| TEA (Murat) | 성능 테스트 | ℹ️ Phase 1.5+ 로 연기 |
| Architect (Winston) | ALLOWED_REPOS 보안 | ℹ️ Phase 2 구현 시 반영 |

---

## Epic 1: Common Infrastructure (packages/common)

**Epic Goal:** 모든 MCP 서버가 공유할 공통 인프라스트럭처 구축. 타입 정의, 에러 헬퍼, 로깅, 캐싱, 메트릭스, 테스트 유틸리티를 제공하여 일관된 개발 패턴을 보장합니다.

**Phase:** 1.0 (기반 인프라)
**의존성:** 없음 (가장 먼저 구현)
**커버리지:** FR-4.1, FR-4.2, FR-4.3, NFR-1~10

---

### Story 1.1: packages/common 프로젝트 설정

As a 개발자,
I want packages/common 패키지의 기본 구조와 빌드 설정이 완료되어 있길,
So that 다른 MCP 서버들이 공통 모듈을 import하여 사용할 수 있습니다.

**Acceptance Criteria:**

**Given** 새로운 packages/common 디렉토리가 생성됨
**When** package.json, tsconfig.json, tsup.config.ts를 설정함
**Then** `npm run build -w packages/common` 명령이 성공함
**And** 빌드된 모듈이 `@moonklabs/mcp-common`으로 import 가능함

**Tasks:**
- [ ] packages/common 디렉토리 생성
- [ ] package.json 생성 (name: @moonklabs/mcp-common)
- [ ] tsconfig.json 생성 (extends 루트 tsconfig)
- [ ] tsup.config.ts 생성 (ESM/CJS 빌드)
- [ ] vitest.config.ts 생성
- [ ] src/index.ts 생성 (re-export hub)
- [ ] 루트 package.json workspaces 설정 업데이트

---

### Story 1.2: 공통 타입 정의 (types)

As a 개발자,
I want 모든 MCP 서버에서 사용할 공통 타입이 정의되어 있길,
So that 타입 안전성을 보장하고 일관된 인터페이스를 사용할 수 있습니다.

**Acceptance Criteria:**

**Given** types 폴더가 생성됨
**When** McpResponse, McpErrorResponse, CacheOptions 등 타입을 정의함
**Then** `import type { McpResponse } from '@moonklabs/mcp-common'`로 import 가능함
**And** 모든 타입이 JSDoc 주석으로 문서화됨

**Tasks:**
- [ ] src/types/index.ts 생성
- [ ] src/types/mcp.ts 생성 (McpResponse, McpErrorResponse)
- [ ] src/types/notion.ts 생성 (NotionPage, NotionBlock)
- [ ] src/types/cache.ts 생성 (CacheOptions, CacheEntry)
- [ ] 타입 단위 테스트 작성

---

### Story 1.3: 에러 응답 헬퍼 (errors)

As a 개발자,
I want createMcpError() 헬퍼 함수가 제공되어,
So that 모든 에러 응답에 suggestion 필드가 포함되고 일관된 형식을 유지할 수 있습니다.

**Acceptance Criteria:**

**Given** createMcpError 함수가 호출됨
**When** error_code, message, suggestion 파라미터를 전달함
**Then** McpErrorResponse 객체가 반환됨
**And** suggestion 필드가 필수로 포함됨
**And** available_options, retry_after 옵션이 지원됨

**Tasks:**
- [ ] src/errors/index.ts 생성
- [ ] src/errors/createMcpError.ts 구현
- [ ] src/errors/errorCodes.ts 생성 (에러 코드 상수)
- [ ] 에러 헬퍼 단위 테스트 작성 (suggestion 필수 검증)

---

### Story 1.4: 설정 관리 (config)

As a 개발자,
I want loadEnvConfig() 함수로 환경변수를 안전하게 로드하여,
So that Zod 스키마 검증으로 누락된 필수 변수를 조기에 발견할 수 있습니다.

**Acceptance Criteria:**

**Given** loadEnvConfig() 함수가 호출됨
**When** 환경변수가 Zod 스키마로 검증됨
**Then** 유효한 EnvConfig 객체가 반환됨
**And** 검증 실패 시 명확한 에러 메시지 출력
**And** 직접 process.env 접근이 금지됨 (코드 리뷰 규칙)

**Tasks:**
- [ ] src/config/index.ts 생성
- [ ] src/config/environment.ts 구현 (Zod 스키마 + loadEnvConfig)
- [ ] src/config/defaults.ts 생성 (기본값 상수)
- [ ] 설정 로드 단위 테스트 작성

---

### Story 1.5: 로깅 시스템 (logger)

As a 개발자,
I want pino 로거가 민감정보 마스킹 설정과 함께 제공되어,
So that API 키나 토큰이 로그에 노출되지 않습니다.

**Acceptance Criteria:**

**Given** logger가 import됨
**When** notion_token, api_key 등을 포함한 객체를 로깅함
**Then** 해당 필드가 [REDACTED]로 마스킹됨
**And** 개발환경에서는 pino-pretty 출력, 프로덕션에서는 JSON 출력

**Tasks:**
- [ ] src/logger/index.ts 생성
- [ ] src/logger/pinoLogger.ts 구현 (redact 설정)
- [ ] 로깅 마스킹 단위 테스트 작성

---

### Story 1.6: 캐싱 레이어 (cache)

As a 개발자,
I want node-cache 기반 캐싱 레이어가 제공되어,
So that Notion API Rate Limit을 회피하고 응답 시간을 개선할 수 있습니다.

**Acceptance Criteria:**

**Given** cacheManager가 생성됨
**When** get/set 메서드로 캐시를 조작함
**Then** TTL 기반 자동 만료가 동작함
**And** 캐시 키 형식이 `{server}:{resource}:{id}:{hash}` 패턴을 따름
**And** 캐시 히트 시 `cached: true` 필드가 응답에 포함됨

**Tasks:**
- [ ] src/cache/index.ts 생성
- [ ] src/cache/cacheManager.ts 구현 (node-cache 래퍼)
- [ ] src/cache/cacheManagerLogic.ts 분리 (순수 로직)
- [ ] 캐싱 단위 테스트 작성

---

### Story 1.7: 메트릭스 수집 (metrics)

As a 개발자,
I want 도구 호출 횟수, 성공률, 캐시 히트율을 수집하여,
So that 서버 상태를 모니터링하고 성능을 개선할 수 있습니다.

**Acceptance Criteria:**

**Given** metricsCollector가 활성화됨
**When** 도구가 호출될 때마다 메트릭스를 기록함
**Then** tool_calls, success_rate, cache_hit_rate, avg_response_ms가 수집됨
**And** GET /metrics 엔드포인트로 조회 가능함

**Tasks:**
- [ ] src/metrics/index.ts 생성
- [ ] src/metrics/metricsCollector.ts 구현
- [ ] src/metrics/metricsEndpoint.ts 구현 (Express 미들웨어)
- [ ] 메트릭스 단위 테스트 작성

---

### Story 1.8: 테스트 유틸리티 (testing)

As a 개발자,
I want Notion API mock, MCP 응답 assertion 헬퍼가 제공되어,
So that 외부 API 의존성 없이 일관된 테스트를 작성할 수 있습니다.

**Acceptance Criteria:**

**Given** testing 모듈이 import됨
**When** mockNotionPage, mockNotionRateLimit 함수를 사용함
**Then** nock 기반 HTTP 모킹이 설정됨
**And** assertMcpSuccess, assertMcpError 헬퍼로 응답 검증 가능
**And** 테스트 fixtures가 제공됨

**Tasks:**
- [ ] src/testing/index.ts 생성
- [ ] src/testing/mocks/notion.ts 구현
- [ ] src/testing/mocks/slack.ts 구현 (Phase 2 대비)
- [ ] src/testing/fixtures/stories.ts 생성
- [ ] src/testing/assertions.ts 구현
- [ ] 테스트 유틸리티 자체 테스트 작성

---

### Story 1.9: 루트 워크스페이스 설정

As a 개발자,
I want 루트 레벨 워크스페이스 설정이 완료되어,
So that 모노레포 전체를 일관되게 빌드/테스트할 수 있습니다.

**Acceptance Criteria:**

**Given** 루트 package.json이 업데이트됨
**When** npm workspaces 설정이 적용됨
**Then** `npm run build:all`, `npm run test:all` 명령이 동작함
**And** vitest.workspace.ts로 전체 테스트 실행 가능
**And** scripts/bootstrap.sh로 초기 설정 자동화

**Tasks:**
- [ ] 루트 package.json workspaces 설정
- [ ] vitest.workspace.ts 생성
- [ ] scripts/bootstrap.sh 생성
- [ ] .github/PULL_REQUEST_TEMPLATE.md 생성

---

## Epic 2: mcp-context-loader 구현

**Epic Goal:** 개발 작업 시 필요한 컨텍스트(PRD, Architecture, Story 등)를 효율적으로 로드하는 MCP 서버 구현. 토큰 최적화를 통해 LLM 비용을 절감합니다.

**Phase:** 1.1
**의존성:** Epic 1 (packages/common)
**커버리지:** FR-1.1~FR-1.5, NFR-1, NFR-8, NFR-9

---

### Story 2.1: mcp-context-loader 프로젝트 생성

As a 개발자,
I want mcp-context-loader 서버의 기본 구조가 설정되어,
So that 컨텍스트 로딩 도구들을 구현할 준비가 됩니다.

**Acceptance Criteria:**

**Given** mcp-boilerplate가 복사됨
**When** package.json과 설정 파일들을 수정함
**Then** `npm run dev -w mcp-context-loader`로 서버 시작 가능
**And** @moonklabs/mcp-common 의존성이 연결됨
**And** stdio/HTTP 양쪽 transport 지원

**Tasks:**
- [ ] mcp-boilerplate → mcp-context-loader 복사
- [ ] package.json 수정 (name, dependencies)
- [ ] .env.example 생성
- [ ] Dockerfile 생성
- [ ] README.md 작성 (도구 목록, 설치, 사용법)
- [ ] 기본 도구 등록 (greet 삭제)

---

### Story 2.2: count-tokens 도구 구현

As a AI 에이전트,
I want 텍스트의 토큰 수를 미리 계산하여,
So that 컨텍스트 윈도우 한도를 초과하지 않도록 계획할 수 있습니다.

**Acceptance Criteria:**

**Given** count-tokens 도구가 호출됨
**When** text 파라미터로 텍스트를 전달함
**Then** token_count 필드에 토큰 수가 반환됨
**And** model 파라미터로 토크나이저 선택 가능 (기본: gpt-4)
**And** 빈 텍스트는 0 반환

**Tasks:**
- [ ] src/tools/countTokens.ts 생성 (도구 등록)
- [ ] src/tools/countTokensLogic.ts 생성 (tiktoken 활용)
- [ ] tiktoken vs js-tiktoken 대안 검토 (네이티브 바인딩 이슈 대비)
- [ ] src/tools/__tests__/countTokens.test.ts 작성
- [ ] 에러 케이스 테스트 (지원하지 않는 모델 등)

---

### Story 2.3: load-context 도구 구현

As a AI 에이전트,
I want 여러 문서 유형(PRD, Architecture, Story 등)을 한 번에 로드하여,
So that 작업에 필요한 모든 컨텍스트를 효율적으로 얻을 수 있습니다.

**Acceptance Criteria:**

**Given** load-context 도구가 호출됨
**When** document_types 배열로 필요한 문서 유형을 지정함
**Then** 요청된 문서들의 통합 컨텍스트가 반환됨
**And** 지원 문서 유형: prd, architecture, epic, story, project-context, brainstorming
**And** 지원하지 않는 document_type은 무시하고 경고 로그 출력
**And** token_count 필드에 총 토큰 수가 포함됨
**And** 캐싱이 적용되어 cached 필드가 표시됨

**Tasks:**
- [ ] src/tools/loadContext.ts 생성 (도구 등록)
- [ ] src/tools/loadContextLogic.ts 생성
- [ ] 문서 유형별 로딩 로직 구현
- [ ] 지원하지 않는 document_type 처리 (무시 + 경고 로그)
- [ ] 캐싱 적용
- [ ] src/tools/__tests__/loadContext.test.ts 작성

---

### Story 2.4a: get-story-context - 스토리 파싱 로직

As a AI 에이전트,
I want 스토리 ID로 스토리 파일을 찾고 파싱하여,
So that 스토리의 기본 정보(제목, AC, Tasks)를 추출할 수 있습니다.

**Acceptance Criteria:**

**Given** story_id가 전달됨 (형식: "1.3" 또는 "Story-1.3" 또는 "story-1-3")
**When** 스토리 파일을 탐색함
**Then** 스토리 파일이 파싱되어 구조화된 데이터로 반환됨
**And** 스토리가 없으면 STORY_NOT_FOUND 에러 반환
**And** available_options에 사용 가능한 스토리 목록 포함
**And** story_id 형식 정규화 로직 포함 (다양한 형식 허용)

**Tasks:**
- [ ] src/tools/getStoryContext.ts 생성 (도구 등록)
- [ ] src/tools/getStoryContextLogic.ts 생성
- [ ] story_id 형식 정규화 함수 구현
- [ ] 스토리 파일 탐색 로직 (glob 패턴)
- [ ] 스토리 마크다운 파싱 로직
- [ ] STORY_NOT_FOUND 에러 처리 (createMcpError 사용)
- [ ] 단위 테스트 작성

---

### Story 2.4b: get-story-context - 관련 문서 연결

As a AI 에이전트,
I want 스토리와 관련된 Epic, PRD 요구사항, Architecture 결정을 연결하여,
So that 스토리 구현에 필요한 전체 컨텍스트를 파악할 수 있습니다.

**Acceptance Criteria:**

**Given** 스토리가 파싱됨
**When** 관련 문서를 탐색함
**Then** Epic 정보, 관련 FR, Architecture 결정이 연결됨
**And** token_count에 총 토큰 수 포함
**And** cached 필드로 캐시 상태 표시

**Tasks:**
- [ ] Epic 연결 로직 구현 (스토리 → Epic 매핑)
- [ ] FR 연결 로직 구현 (Epic → FR 매핑)
- [ ] Architecture 결정 연결 로직
- [ ] 토큰 카운트 통합
- [ ] 캐싱 적용
- [ ] 단위 테스트 작성

---

### Story 2.4c: get-story-context - 응답 포맷팅 및 에러 처리

As a AI 에이전트,
I want 연결된 컨텍스트가 구조화된 형식으로 반환되어,
So that 효율적으로 정보를 파악하고 활용할 수 있습니다.

**Acceptance Criteria:**

**Given** 모든 관련 문서가 연결됨
**When** 응답을 생성함
**Then** story, epic, requirements, architecture 섹션으로 구조화됨
**And** suggestion 필드에 다음 행동 안내 포함
**And** 부분 실패 시 graceful degradation 적용

**Tasks:**
- [ ] 응답 포맷터 구현
- [ ] suggestion 생성 로직 (예: "다음 스토리: Story-43")
- [ ] 부분 실패 처리 (일부 문서 없어도 동작)
- [ ] src/tools/__tests__/getStoryContext.test.ts 통합 테스트
- [ ] 에러 시나리오 테스트

---

### Story 2.5: list-document-types 도구 구현

As a AI 에이전트,
I want 로드 가능한 문서 유형 목록을 조회하여,
So that load-context 도구에 올바른 파라미터를 전달할 수 있습니다.

**Acceptance Criteria:**

**Given** list-document-types 도구가 호출됨
**When** 파라미터 없이 호출함
**Then** 사용 가능한 document_types 배열이 반환됨
**And** 각 유형에 description과 예시가 포함됨

**Tasks:**
- [ ] src/tools/listDocumentTypes.ts 생성
- [ ] src/tools/listDocumentTypesLogic.ts 생성
- [ ] 문서 유형 메타데이터 정의
- [ ] 단위 테스트 작성

---

### Story 2.6: mcp-context-loader 통합 테스트

As a 개발자,
I want mcp-context-loader의 전체 기능이 통합 테스트되어,
So that 실제 MCP 프로토콜로 동작함을 검증할 수 있습니다.

**Acceptance Criteria:**

**Given** 모든 도구가 구현됨
**When** MCP Inspector 또는 통합 테스트를 실행함
**Then** 모든 도구가 올바르게 등록됨
**And** 입력 스키마 검증이 동작함
**And** 에러 응답에 suggestion이 포함됨
**And** 테스트 간 격리 검증됨 (beforeEach에서 상태 초기화)

**Tasks:**
- [ ] tests/integration/mcp-protocol.test.ts 생성
- [ ] 각 도구의 E2E 시나리오 테스트
- [ ] 테스트 격리 검증 (beforeEach/afterEach 헬퍼)
- [ ] MCP Inspector 수동 테스트 수행
- [ ] Docker 빌드 및 실행 테스트

---

## Epic 3: mcp-spec-reader 구현

**Epic Goal:** Notion에 저장된 PRD, 스토리 등 스펙 문서를 효율적으로 읽고 요약하는 MCP 서버 구현. Notion API Rate Limit을 고려한 캐싱 전략 적용.

**Phase:** 1.2
**의존성:** Epic 1 (packages/common)
**커버리지:** FR-2.1~FR-2.5, NFR-1, NFR-7, NFR-8, NFR-9

---

### Story 3.1: mcp-spec-reader 프로젝트 생성

As a 개발자,
I want mcp-spec-reader 서버의 기본 구조가 설정되어,
So that Notion 연동 도구들을 구현할 준비가 됩니다.

**Acceptance Criteria:**

**Given** mcp-boilerplate가 복사됨
**When** Notion 클라이언트 의존성을 추가함
**Then** @notionhq/client가 설치됨
**And** NOTION_API_KEY 환경변수 검증이 동작함

**Tasks:**
- [ ] mcp-boilerplate → mcp-spec-reader 복사
- [ ] package.json 수정 (@notionhq/client 추가)
- [ ] .env.example 생성 (NOTION_API_KEY, NOTION_PAGE_IDS)
- [ ] Dockerfile 생성
- [ ] README.md 작성 (도구 목록, Notion 설정, 사용법)
- [ ] Notion 클라이언트 초기화 로직

---

### Story 3.2: list-specs 도구 구현

As a AI 에이전트,
I want Notion 데이터베이스의 스펙 문서 목록을 조회하여,
So that 읽어야 할 문서를 선택할 수 있습니다.

**Acceptance Criteria:**

**Given** list-specs 도구가 호출됨
**When** database_id 또는 기본 데이터베이스를 조회함
**Then** 스펙 문서 목록이 반환됨 (id, title, last_edited)
**And** 접근 권한 없는 페이지는 필터링됨
**And** 캐싱이 적용됨 (TTL: 5분)

**Tasks:**
- [ ] src/tools/listSpecs.ts 생성 (도구 등록)
- [ ] src/tools/listSpecsLogic.ts 생성
- [ ] Notion database query 구현
- [ ] NOTION_PAGE_IDS 필터링 적용
- [ ] 캐싱 적용
- [ ] src/tools/__tests__/listSpecs.test.ts 작성 (nock mock)

---

### Story 3.3: read-spec 도구 구현

As a AI 에이전트,
I want Notion 페이지의 내용을 Markdown으로 변환하여 읽어,
So that 토큰 효율적인 형태로 스펙을 파악할 수 있습니다.

**Acceptance Criteria:**

**Given** read-spec 도구가 호출됨
**When** page_id로 Notion 페이지를 지정함
**Then** Markdown으로 변환된 내용이 반환됨
**And** token_count 필드에 토큰 수가 포함됨
**And** 빈 페이지는 empty_content: true 필드와 함께 반환
**And** 캐싱이 적용됨 (TTL: 5분)
**And** NOTION_RATE_LIMIT 에러 시 retry_after 포함 (동적 suggestion)

**Tasks:**
- [ ] src/tools/readSpec.ts 생성 (도구 등록)
- [ ] src/tools/readSpecLogic.ts 생성
- [ ] Markdown 변환 라이브러리 결정 (@notionhq/notion-to-md vs 자체 구현)
- [ ] Notion blocks → Markdown 변환 구현
- [ ] 빈 페이지 처리 (empty_content 필드)
- [ ] 토큰 카운트 통합
- [ ] Rate Limit 에러 처리 (동적 suggestion 생성)
- [ ] 캐싱 적용
- [ ] src/tools/__tests__/readSpec.test.ts 작성

---

### Story 3.4: summarize-spec 도구 구현 (Phase 1.5)

As a AI 에이전트,
I want 긴 스펙 문서를 요약하여,
So that 제한된 컨텍스트 윈도우에서도 핵심 내용을 파악할 수 있습니다.

**Acceptance Criteria:**

**Given** summarize-spec 도구가 호출됨
**When** page_id와 max_tokens를 지정함
**Then** 요약된 내용이 max_tokens 이하로 반환됨
**And** 캐싱이 적용됨 (TTL: 1시간 - LLM 비용 절약)
**And** original_token_count, summarized_token_count 필드 포함

**Tasks:**
- [ ] src/tools/summarizeSpec.ts 생성 (도구 등록)
- [ ] src/tools/summarizeSpecLogic.ts 생성
- [ ] LLM 제공자 결정 (OpenAI vs Claude vs 자체 요약 로직)
- [ ] LLM 요약 API 연동
- [ ] 긴 TTL 캐싱 적용
- [ ] src/tools/__tests__/summarizeSpec.test.ts 작성

---

### Story 3.5: get-spec-section 도구 구현

As a AI 에이전트,
I want 스펙 문서의 특정 섹션만 로드하여,
So that 필요한 부분만 컨텍스트에 포함할 수 있습니다.

**Acceptance Criteria:**

**Given** get-spec-section 도구가 호출됨
**When** page_id와 section_title을 지정함
**Then** 해당 섹션의 내용만 반환됨
**And** 섹션이 없으면 SECTION_NOT_FOUND 에러와 available_sections 반환

**Tasks:**
- [ ] src/tools/getSpecSection.ts 생성 (도구 등록)
- [ ] src/tools/getSpecSectionLogic.ts 생성
- [ ] 섹션 파싱 로직 구현
- [ ] SECTION_NOT_FOUND 에러 처리
- [ ] 단위 테스트 작성

---

### Story 3.6: mcp-spec-reader 통합 테스트

As a 개발자,
I want mcp-spec-reader의 전체 기능이 Notion API 모킹과 함께 테스트되어,
So that 실제 환경과 유사한 조건에서 동작을 검증할 수 있습니다.

**Acceptance Criteria:**

**Given** 모든 도구가 구현됨
**When** nock으로 Notion API를 모킹하고 테스트 실행
**Then** Rate Limit 시나리오가 테스트됨
**And** 캐시 히트/미스 시나리오가 테스트됨
**And** 권한 없는 페이지 접근 시나리오가 테스트됨
**And** 테스트 간 격리 검증됨 (beforeEach에서 nock.cleanAll() 호출)

**Tasks:**
- [ ] tests/integration/notion-api.test.ts 생성
- [ ] Rate Limit 시나리오 테스트
- [ ] 캐시 동작 테스트
- [ ] 권한 에러 시나리오 테스트
- [ ] 테스트 격리 검증 (beforeEach/afterEach 헬퍼)
- [ ] 실제 Notion 페이지로 E2E 수동 테스트

---

## Epic 4: mcp-slack-bugfix 구현

**Epic Goal:** Slack 오류 알림 채널을 모니터링하고, 오류를 분석하여 자동 수정 제안 및 PR 생성을 수행하는 MCP 서버 구현.

**Phase:** 2.0
**의존성:** Epic 1 (packages/common)
**커버리지:** FR-3.1~FR-3.4, NFR-8, NFR-9

⚠️ **주의:** 2025년 3월 31일 Slack Legacy Bots 지원 종료에 대비 필요

---

### Story 4.1: mcp-slack-bugfix 프로젝트 생성

As a 개발자,
I want mcp-slack-bugfix 서버의 기본 구조가 설정되어,
So that Slack 연동 도구들을 구현할 준비가 됩니다.

**Acceptance Criteria:**

**Given** mcp-boilerplate가 복사됨
**When** Slack 클라이언트 의존성을 추가함
**Then** @slack/web-api가 설치됨
**And** SLACK_BOT_TOKEN 환경변수 검증이 동작함

**Tasks:**
- [ ] mcp-boilerplate → mcp-slack-bugfix 복사
- [ ] package.json 수정 (@slack/web-api 추가)
- [ ] .env.example 생성 (SLACK_BOT_TOKEN, GITHUB_TOKEN)
- [ ] Dockerfile 생성
- [ ] README.md 작성 (도구 목록, Slack/GitHub 설정, 사용법)
- [ ] Slack 클라이언트 초기화 로직

---

### Story 4.2: watch-errors 도구 구현

As a AI 에이전트,
I want Slack 채널의 최근 오류 메시지를 조회하여,
So that 분석해야 할 오류를 파악할 수 있습니다.

**Acceptance Criteria:**

**Given** watch-errors 도구가 호출됨
**When** channel_id와 시간 범위를 지정함
**Then** 오류 패턴이 포함된 메시지 목록이 반환됨
**And** 스택 트레이스, 에러 메시지가 파싱됨

**Tasks:**
- [ ] src/tools/watchErrors.ts 생성
- [ ] src/tools/watchErrorsLogic.ts 생성
- [ ] Slack conversations.history API 연동
- [ ] 오류 패턴 감지 정규식
- [ ] 단위 테스트 작성

---

### Story 4.3: analyze-error 도구 구현

As a AI 에이전트,
I want 오류 메시지를 분석하여 원인과 해결 방안을 파악하여,
So that 수정 작업을 계획할 수 있습니다.

**Acceptance Criteria:**

**Given** analyze-error 도구가 호출됨
**When** 오류 메시지와 스택 트레이스를 전달함
**Then** 원인 분석, 관련 파일, 수정 제안이 반환됨
**And** 코드베이스 검색 결과가 포함됨

**Tasks:**
- [ ] src/tools/analyzeError.ts 생성
- [ ] src/tools/analyzeErrorLogic.ts 생성
- [ ] 오류 패턴 분석 로직
- [ ] 코드베이스 검색 연동
- [ ] 단위 테스트 작성

---

### Story 4.4: auto-fix 도구 구현

As a AI 에이전트,
I want 분석된 오류에 대한 자동 수정 패치를 생성하여,
So that 개발자가 검토 후 적용할 수 있습니다.

**Acceptance Criteria:**

**Given** auto-fix 도구가 호출됨
**When** 분석 결과와 수정 전략을 지정함
**Then** 수정 패치(diff)가 생성됨
**And** 영향받는 파일 목록이 포함됨

**Tasks:**
- [ ] src/tools/autoFix.ts 생성
- [ ] src/tools/autoFixLogic.ts 생성
- [ ] 패치 생성 로직 구현
- [ ] 단위 테스트 작성

---

### Story 4.5: create-pr 도구 구현

As a AI 에이전트,
I want 생성된 패치로 GitHub PR을 자동 생성하여,
So that 수정 사항을 코드 리뷰 프로세스에 통합할 수 있습니다.

**Acceptance Criteria:**

**Given** create-pr 도구가 호출됨
**When** 패치와 PR 메타데이터를 전달함
**Then** GitHub에 브랜치가 생성되고 PR이 열림
**And** PR URL이 반환됨
**And** Slack에 완료 알림이 전송됨

**Tasks:**
- [ ] src/tools/createPr.ts 생성
- [ ] src/tools/createPrLogic.ts 생성
- [ ] @octokit/rest 연동
- [ ] Slack 알림 전송
- [ ] 단위 테스트 작성

---

### Story 4.6: mcp-slack-bugfix 통합 테스트

As a 개발자,
I want mcp-slack-bugfix의 전체 워크플로우가 테스트되어,
So that 오류 감지부터 PR 생성까지 전체 흐름을 검증할 수 있습니다.

**Acceptance Criteria:**

**Given** 모든 도구가 구현됨
**When** Slack/GitHub API를 모킹하고 테스트 실행
**Then** 전체 워크플로우가 정상 동작함
**And** 권한 에러 시나리오가 테스트됨
**And** 테스트 간 격리 검증됨 (beforeEach에서 nock.cleanAll() 호출)

**Tasks:**
- [ ] tests/integration/ 통합 테스트 작성
- [ ] Slack API mock 구현
- [ ] GitHub API mock 구현
- [ ] 테스트 격리 검증 (beforeEach/afterEach 헬퍼)
- [ ] E2E 시나리오 테스트

---

## Epic 5: Infrastructure Enhancement

**Epic Goal:** Phase 1.5에서 추가할 인프라 기능들. Rate Limiting, 고급 메트릭스, 피드백 시스템 강화.

**Phase:** 1.5
**의존성:** Epic 1 (packages/common)
**커버리지:** FR-4.4, NFR-2

---

### Story 5.1: Rate Limiting 구현

As a 개발자,
I want IP 기반 Rate Limiting이 적용되어,
So that 과도한 요청으로 인한 서비스 장애를 방지할 수 있습니다.

**Acceptance Criteria:**

**Given** Rate Limiting 미들웨어가 적용됨
**When** 동일 IP에서 초당 50회 이상 요청함
**Then** 429 Too Many Requests 응답 반환
**And** retry_after 필드에 대기 시간 포함

**Tasks:**
- [ ] packages/common/src/rateLimit/index.ts 생성
- [ ] Express 미들웨어 구현
- [ ] IP 추출 로직 (X-Forwarded-For 지원)
- [ ] 단위 테스트 작성

---

### Story 5.2: 캐시 무효화 도구

As a AI 에이전트,
I want 캐시를 수동으로 무효화하여,
So that 문서 변경 후 즉시 최신 내용을 로드할 수 있습니다.

**Acceptance Criteria:**

**Given** invalidate-cache 도구가 호출됨
**When** pattern 파라미터로 캐시 키 패턴을 지정함
**Then** 매칭되는 캐시 항목이 삭제됨
**And** 삭제된 항목 수가 반환됨

**Tasks:**
- [ ] packages/common에 invalidateCache 함수 추가
- [ ] 각 서버에 invalidate-cache 도구 등록
- [ ] 단위 테스트 작성

---

### Story 5.3: 피드백 시스템 강화

As a AI 에이전트,
I want 도구 사용 결과에 대한 상세 피드백을 제공하여,
So that 개발자가 도구 품질을 개선할 수 있습니다.

**Acceptance Criteria:**

**Given** 피드백 도구가 호출됨
**When** tool_name, rating (1-5), comment를 전달함
**Then** 피드백이 저장됨
**And** 메트릭스에 집계됨

**Tasks:**
- [ ] packages/common에 피드백 저장 로직 추가
- [ ] 각 서버에 submit-feedback 도구 등록
- [ ] 메트릭스 엔드포인트에 피드백 통계 추가
- [ ] 단위 테스트 작성

---

## Implementation Sequence

```
Phase 1.0: Epic 1 - Common Infrastructure
├── Story 1.1~1.4: 프로젝트 설정, 타입, 에러, 설정
├── Story 1.5~1.7: 로깅, 캐싱, 메트릭스
└── Story 1.8~1.9: 테스트 유틸리티, 워크스페이스 설정

Phase 1.1: Epic 2 - mcp-context-loader (Epic 3과 병렬 가능)
├── Story 2.1~2.2: 프로젝트 생성, count-tokens
├── Story 2.3: load-context
├── Story 2.4a~2.4c: get-story-context (파싱, 연결, 포맷팅)
├── Story 2.5: list-document-types
└── Story 2.6: 통합 테스트

Phase 1.2: Epic 3 - mcp-spec-reader (Epic 2와 병렬 가능)
├── Story 3.1~3.3: 프로젝트 생성, list-specs, read-spec
├── Story 3.4~3.5: summarize-spec, get-spec-section
└── Story 3.6: 통합 테스트

Phase 1.5: Epic 5 - Infrastructure Enhancement
└── Story 5.1~5.3: Rate Limiting, 캐시 무효화, 피드백

Phase 2.0: Epic 4 - mcp-slack-bugfix
├── Story 4.1~4.3: 프로젝트 생성, watch-errors, analyze-error
├── Story 4.4~4.5: auto-fix, create-pr
└── Story 4.6: 통합 테스트
```

## Story Summary

| Epic | Story 수 | Must Have | Should Have | Could Have |
|------|---------|-----------|-------------|------------|
| Epic 1 | 9 | 6 | 3 | 0 |
| Epic 2 | 8 | 5 | 2 | 1 |
| Epic 3 | 6 | 3 | 2 | 1 |
| Epic 4 | 6 | 3 | 2 | 1 |
| Epic 5 | 3 | 1 | 2 | 0 |
| **Total** | **32** | **18** | **11** | **3** |

---

**Document Status:** Step 3 Complete - All Stories Generated
**Total Stories:** 32 stories across 5 epics
**Party Mode Feedback:** Applied (Story 2.4 분해, 병렬 개발 명시)
**Next Step:** Final Validation (Step 4)
