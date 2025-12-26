---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - '_bmad-output/analysis/brainstorming-session-2025-12-25.md'
  - '_bmad-output/project-planning-artifacts/research/technical-mcp-tools-research-2025-12-25.md'
  - 'docs/index.md'
documentCounts:
  briefs: 0
  research: 1
  brainstorming: 1
  projectDocs: 1
workflowType: 'prd'
lastStep: 11
status: completed
project_name: 'moonklabs-mcp-servers'
user_name: 'moonklabs'
date: '2025-12-25'
---

# Product Requirements Document - moonklabs-mcp-servers

**Author:** moonklabs
**Date:** 2025-12-25

## Executive Summary

### 타겟 사용자

**Primary Persona:** 파이프라인화된 AI 개발 워크플로우를 구축하려는 개발자/팀
- BMAD Method 또는 유사한 Spec 기반 개발 프로세스 사용
- Claude Code 서브에이전트를 활용한 대규모 작업 자동화 희망
- 반복적인 컨텍스트 로딩으로 토큰 비용 및 시간 낭비 경험

### 핵심 문제: 파이프라인화의 병목

강의에서 언급된 **파이프라인화 3대 조건**:
1. ✅ 잘 정의됨 (Well-defined spec)
2. ✅ Self-verifiable (에이전트가 스스로 검증)
3. ✅ 규칙적 작업 (Rule-based)

**현재 병목:**

| 병목 | 문제 | 해결 도구 |
|------|------|-----------|
| **스펙 접근** | Notion에서 수동 복사, 퍼블릭 MCP는 툴 과다/프롬프트 장황 | **mcp-spec-reader** |
| **컨텍스트 낭비** | 매번 전체 문서 로딩, 토큰 비용 폭발 | **mcp-context-loader** |
| **검증 루프** | 오류 발생 → 수동 확인 → 수정 반복 | **mcp-slack-bugfix** |

### 프로젝트 비전

**"파이프라인화된 AI 개발을 위한 커스텀 MCP 도구 세트"**

퍼블릭 MCP의 한계(툴 과다, 장황한 프롬프트)를 해결하고,
팀 전체가 HTTP 서버 배포를 통해 즉시 활용할 수 있는 최적화된 MCP 서버 제공

### What Makes This Special

1. **파이프라인 네이티브 설계**
   - Specify → Research → Plan → Implement 단계에 최적화
   - 서브에이전트가 필요한 컨텍스트만 정확히 로딩

2. **커스텀 MCP 철학**
   - 퍼블릭 Notion MCP 대신 Spec 읽기에 특화된 최소 툴셋
   - 프롬프트 최적화로 토큰 절감

3. **팀 공유 우선**
   - HTTP 서버 배포 → 재배포만으로 전팀 신기능 적용
   - 스킬(파일 기반) 대비 운영 효율성

4. **토큰 비용 최적화**
   - 규칙적 파일 생성은 스크립트로 (LLM 호출 X)
   - 중요 작업만 Opus, 구현은 Sonnet 분리 지원

### Before/After 시나리오

**Before (현재):**
```
1. Notion에서 스펙 수동 복사 (5분)
2. 전체 문서 붙여넣기 (토큰 10,000+)
3. 서브에이전트 작업 중 컨텍스트 부족 → 재시작
4. Slack 오류 알림 확인 → 수동 분석 → 코드 수정
```

**After (도구 적용 후):**
```
1. mcp-spec-reader로 필요 섹션만 로딩 (10초, 토큰 2,000)
2. mcp-context-loader가 작업별 컨텍스트 자동 구성
3. 서브에이전트가 점진적으로 추가 컨텍스트 요청
4. mcp-slack-bugfix가 오류 감지 → 분석 → PR 자동 생성
```

### 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 토큰 사용량 | 동일 스토리 구현 기준 80% 감소 | tiktoken으로 before/after 비교 |
| 컨텍스트 로딩 시간 | 수동 대비 90% 단축 | 5개 스토리 샘플 측정 |
| 파이프라인 성공률 | 원샷 성공률 70%+ | 서브에이전트 재시작 횟수 추적 |
| 팀 배포 효율 | 신기능 적용 5분 이내 | HTTP 서버 재배포 시간 |

## Project Classification

| 항목 | 값 |
|------|-----|
| **Technical Type** | developer_tool (커스텀 MCP 서버) |
| **Domain** | AI/LLM 파이프라인 도구 |
| **Complexity** | medium |
| **Project Context** | Brownfield - 기존 mcp-notion-task 확장 |

### 기존 시스템 컨텍스트

- **모노레포 구조:** mcp-boilerplate (템플릿) + mcp-notion-task (Notion CRUD)
- **아키텍처 패턴:** 3계층 (index → tool → toolLogic)
- **배포 방식:** stdio (로컬) + HTTP (팀 공유) + Docker

### 구현 로드맵

| Phase | 서버 | 핵심 가치 | 파이프라인화 기여 |
|-------|------|-----------|------------------|
| **Phase 1** | mcp-context-loader | 토큰 최적화 엔진 | 서브에이전트 컨텍스트 자동 구성 |
| **Phase 1** | mcp-spec-reader | Notion 커스텀 MCP | 퍼블릭 MCP 대체, 최소 툴셋 |
| **Phase 2** | mcp-slack-bugfix | Self-verify 자동화 | 오류 → PR 파이프라인 |

### 커스텀 MCP 설계 원칙 (강의 기반)

| 원칙 | 적용 |
|------|------|
| **최소 툴셋** | 퍼블릭 MCP의 수십 개 툴 → 3-5개로 압축 |
| **간결한 프롬프트** | 장황한 설명 제거, 핵심만 |
| **서버 배포** | HTTP로 팀 공유, 스킬 대비 운영 효율 |
| **토큰 최적화** | 규칙적 작업은 스크립트로 분리 |

### 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Slack legacy bots 종료 (2025.3.31) | mcp-slack-bugfix 지연 | Phase 2로 분리 |
| 커스텀 MCP 개발 공수 | 초기 투자 필요 | boilerplate 기반 빠른 생성 |
| 팀 온보딩 | 새 도구 학습 곡선 | HTTP 배포로 설치 부담 최소화 |

## Success Criteria

### User Success

**"이거 쓰길 잘했다" 순간:**
1. 서브에이전트가 한 번에 작업 완료 - 재시작/컨텍스트 재입력 없음
2. Notion 열지 않고 필요한 스펙 정보 즉시 획득
3. Slack 오류 알림 확인 시 이미 PR이 생성되어 있음

**사용자 경험 지표:**
| 지표 | 현재 (Baseline) | 목표 |
|------|-----------------|------|
| 컨텍스트 재입력 횟수 | 작업당 2-3회 | 0회 |
| 스펙 탐색 시간 | 5분 | 10초 |
| 오류 대응 시간 | 30분 | 5분 (Phase 2) |
| **도구 호출당 작업 완료율** | 측정 필요 | 90%+ |

**사용자 만족도 측정:**
- 각 도구 응답에 👍/👎 피드백 옵션 제공
- 월간 만족도 목표: 👍 비율 80%+

### Business Success

**효율성 지표:**
| 지표 | Baseline (측정 필요) | 3개월 | 12개월 |
|------|---------------------|-------|--------|
| 파이프라인 작업 시간 | Phase 1 전 측정 | 50% 단축 | 70% 단축 |
| 월간 토큰 비용 | 현재 사용량 기록 | 75% 감소 | 85% 감소 |
| 서브에이전트 재작업률 | 현재 빈도 기록 | 30% 감소 | 50% 감소 |

**채택 지표:**
| 지표 | 목표 |
|------|------|
| 팀 내 사용률 | 100% (HTTP 서버 연결) |
| 도구 호출당 성공률 | 90%+ |

### Technical Success

**안정성:**
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| HTTP 서버 가용성 | 99%+ | 헬스체크 모니터링 |
| API 응답 시간 | p95 < 500ms | 응답시간 로깅 |
| 에러율 | 1% 미만 | 에러 로깅 + 알림 |

**코드 품질:**
| 지표 | 목표 |
|------|------|
| 테스트 커버리지 | 80%+ (toolLogic) |
| TypeScript strict mode | 100% |
| 3계층 패턴 준수 | 100% |

**메트릭스 수집 (MVP 포함):**
- 도구 호출 횟수/성공률 로깅
- 토큰 사용량 추적
- 응답 시간 기록
- 사용자 피드백 (👍/👎) 수집

### Measurable Outcomes

**Phase 1 Baseline 측정 (착수 전):**
- [ ] 현재 파이프라인 작업 시간 기록 (5개 스토리 샘플)
- [ ] 현재 월간 토큰 사용량 기록
- [ ] 현재 서브에이전트 재시작 빈도 기록

**Phase 1 Definition of Done:**
- [ ] mcp-context-loader 3개 도구 구현
  - 단위 테스트 80%+ 커버리지
  - 통합 테스트 1회 이상 (실제 파일 기반)
- [ ] mcp-spec-reader 3개 도구 구현
  - 단위 테스트 80%+ 커버리지
  - E2E 테스트 1회 이상 (실제 Notion 페이지)
- [ ] Docker 로컬 배포 + README 문서화
- [ ] 메트릭스 수집 기능 구현
- [ ] 토큰 사용량 80% 감소 검증 리포트

**Phase 1 예상 공수:**
| 서버 | Story Points | 비고 |
|------|-------------|------|
| mcp-context-loader | 8 | 신규 개발 |
| mcp-spec-reader | 5 | mcp-notion-task 확장 |
| **총계** | **13** | 1-2 스프린트 |

**Phase 2 Definition of Done:**
- [ ] mcp-slack-bugfix 4개 도구 구현
- [ ] Slack → PR 자동화 E2E 검증
- [ ] 오류 대응 시간 30분 → 5분 검증 리포트

## Product Scope

### MVP - Minimum Viable Product (Phase 1)

**mcp-context-loader:**
| 도구 | 기능 |
|------|------|
| `load-context` | 작업 유형별 컨텍스트 자동 구성 |
| `get-story-context` | 특정 스토리 관련 전체 문서 로딩 |
| `count-tokens` | 현재 컨텍스트 토큰 수 표시 |

**mcp-spec-reader:**
| 도구 | 기능 |
|------|------|
| `read-spec` | Notion 페이지 섹션별 선택 로딩 |
| `summarize-spec` | 긴 문서 LLM 요약 |
| `list-specs` | 접근 가능한 스펙 목록 |

**공통 인프라 (MVP 포함):**
| 기능 | 설명 |
|------|------|
| 메트릭스 수집 | 호출 횟수, 성공률, 토큰 사용량 |
| 헬스체크 | `/health` 엔드포인트 (이미 boilerplate에 존재) |
| 피드백 수집 | 👍/👎 응답 옵션 |

### Growth Features (Phase 2)

**mcp-slack-bugfix:**
| 도구 | 기능 |
|------|------|
| `watch-channel` | Slack 오류 채널 실시간 모니터링 |
| `analyze-error` | 오류 로그 분석 및 원인 파악 |
| `suggest-fix` | 수정 방안 제안 |
| `create-pr` | 자동 수정 및 GitHub PR 생성 |

**확장 기능:**
- 컨텍스트 캐싱 (Redis/로컬)
- 압축 알고리즘 플러그인 시스템

### Vision (Phase 1-2 성공 후 재평가)

> ⚠️ 아래 항목은 Phase 1-2 성공 검증 후 우선순위 재평가 예정

- 다중 소스 통합 (Google Sheets, Confluence)
- 에이전트 간 컨텍스트 공유 프로토콜
- 양방향 동기화 (구현 → 스펙)
- 팀 대시보드

## User Journeys

### Journey 1: 민수 - 첫 만남 (Onboarding)

민수는 팀 슬랙에서 "MCP 도구 배포 완료"라는 공지를 본다. 링크를 클릭하니 README가 열린다. "Claude Code 설정에 아래 한 줄 추가"라고 적혀있다.

```json
{"mcpServers": {"context-loader": {"url": "http://internal.team:3001/mcp"}}}
```

민수는 반신반의하며 설정을 추가하고 Claude Code를 재시작한다. `/mcp` 명령어로 연결된 서버를 확인하니 `context-loader`가 보인다.

"테스트 삼아 해볼까?" 민수가 `list-specs`를 호출하자 팀 Notion에 있는 스펙 문서 목록이 표시된다. "오, 진짜 되네?"

`count-tokens`로 현재 컨텍스트를 확인하니 "현재 컨텍스트: 0 토큰"이 표시된다. 민수는 "이제 진짜 작업해볼까"라며 첫 스토리 작업을 시작한다.

**Onboarding 시간: 5분**

---

### Journey 2: 민수 - 파이프라인 개발자의 하루 (Happy Path)

민수는 스타트업에서 백엔드 개발을 담당하는 3년차 개발자다. 최근 팀에서 BMAD Method를 도입했고, Claude Code로 개발 작업을 자동화하려고 한다. 하지만 매번 서브에이전트를 돌릴 때마다 Notion에서 PRD를 복사하고, Architecture 문서를 붙여넣고, Story 파일을 찾아서 컨텍스트를 구성하는 데 10분 이상 소요된다. 토큰도 매번 15,000개 이상 소비된다.

이제 mcp-context-loader가 있다. "Story-42 컨텍스트 로딩해줘"라고 입력하자, `get-story-context` 도구가 자동으로 해당 스토리와 연관된 PRD 섹션, Architecture 결정사항, 관련 코드 파일 목록을 2,000 토큰 이내로 구성해서 반환한다. 이전에는 5번 재시작하던 서브에이전트가 한 번에 작업을 완료한다.

일주일 후, 민수는 월간 토큰 사용량이 $180에서 $35로 줄어든 것을 확인하고 팀 회고에서 공유한다.

---

### Journey 3: 민수 - 컨텍스트 부족 상황 (Edge Case)

같은 민수가 복잡한 결제 시스템 스토리를 작업 중이다. `get-story-context`로 컨텍스트를 로딩했지만, 서브에이전트가 "PG사 연동 규격이 필요합니다"라고 추가 정보를 요청한다.

민수는 당황하지 않는다. `read-spec`을 호출하여 Notion의 "결제 시스템 스펙" 페이지에서 "PG 연동" 섹션만 선택적으로 로딩한다. 전체 30페이지 문서 대신 필요한 2페이지만 가져와서 토큰을 절약한다.

그런데 이번에는 문서가 너무 길어서 여전히 5,000 토큰이다. `summarize-spec`을 호출하여 핵심 내용만 1,000 토큰으로 요약받는다. 서브에이전트가 작업을 재개하고 성공적으로 완료한다.

---

### Journey 4: 민수 - "이거 아닌데..." (Recovery)

민수가 `get-story-context`로 Story-42 컨텍스트를 로딩했다. 그런데 서브에이전트가 엉뚱한 방향으로 코드를 작성하기 시작한다. "잠깐, 이건 Story-41 내용 아닌가?"

민수가 응답을 자세히 보니 연관 문서 중 하나가 잘못 포함되어 있다. 민수는 응답에 👎를 누르고 피드백을 남긴다: "Story-41 문서가 잘못 포함됨"

그리고 `get-story-context`를 다시 호출하면서 `exclude` 파라미터로 잘못된 문서를 제외한다:
```json
{"story_id": "Story-42", "exclude": ["docs/story-41-spec.md"]}
```

이번에는 정확한 컨텍스트가 로딩된다. 민수는 👍를 누르고 작업을 재개한다.

**Lesson:** 👎 피드백 + exclude 파라미터로 잘못된 컨텍스트 수정 가능

---

### Journey 5: 민수 - Notion 장애 상황 (Failure)

금요일 오후, 민수가 `read-spec`을 호출했는데 응답이 느리다. 10초 후 에러 메시지가 뜬다:

```
⚠️ Notion API 응답 지연 (timeout: 10s)
- 상태: Notion 서비스 장애 추정
- 대안: 로컬 캐시에서 마지막 버전 로딩 가능
- 명령: read-spec --use-cache
```

민수는 `--use-cache` 옵션으로 재시도한다. 어제 캐시된 버전이 로딩되고, "(캐시됨: 2025-12-24)" 표시가 함께 뜬다. 완벽하진 않지만 작업을 계속할 수 있다.

월요일에 Notion이 복구되면 캐시가 자동으로 갱신된다.

---

### Journey 6: 지영 - 팀 리드의 서버 관리 (Admin Happy Path)

지영은 5명 개발팀의 테크 리드다. 팀원들이 각자 다른 MCP 설정을 사용하면서 "내 컴퓨터에서는 되는데요"가 반복되고 있다.

지영은 mcp-context-loader와 mcp-spec-reader를 Docker로 팀 내부 서버에 배포한다. `docker-compose up -d` 한 번으로 두 서버가 올라가고, 팀원들에게 서버 URL만 공유한다.

일주일 후, 스펙 문서 로딩에 새로운 필터링 기능이 필요하다는 피드백이 온다. 지영은 코드를 수정하고 `docker-compose up -d --build`로 재배포한다. 팀원들은 아무것도 하지 않아도 새 기능을 바로 사용한다.

신입 개발자가 합류했을 때, 지영은 Claude Code 설정 파일 한 줄만 전달한다. **온보딩 시간: 5분**

---

### Journey 7: 지영 - 새벽 장애 대응 (Admin Failure)

토요일 새벽 3시, 지영의 폰에 알림이 울린다. "MCP Server Health Check Failed"

지영은 노트북을 열고 상태를 확인한다:
```bash
curl http://internal.team:3001/health
# {"status": "unhealthy", "error": "Notion API rate limit exceeded"}
```

로그를 확인하니 한 팀원이 대용량 스펙 문서를 반복 호출하면서 Notion API 한도를 초과했다.

지영은 두 가지 조치를 취한다:
1. 환경변수로 Rate Limiting 활성화: `RATE_LIMIT_PER_MINUTE=30`
2. `docker-compose restart`로 서버 재시작

5분 후 헬스체크가 정상으로 돌아온다. 지영은 월요일 팀 미팅에서 "대용량 문서는 summarize-spec 먼저 사용하세요"라고 공유하고 다시 잠든다.

---

### Journey 8: Claude 서브에이전트 - 성공 흐름 (API Consumer Happy)

Claude Code 메인 세션에서 "Story-42를 구현해줘"라는 명령이 들어온다. 서브에이전트가 생성되고 `get-story-context`를 호출한다.

**요청:**
```json
{"story_id": "Story-42", "include_architecture": true}
```

**응답 (성공):**
```json
{
  "status": "success",
  "context": {
    "prd_section": "...(500 tokens)",
    "architecture": "...(300 tokens)",
    "files": ["src/payment/...", "..."]
  },
  "token_count": 1000,
  "cached": false
}
```

서브에이전트는 구조화된 응답을 파싱하여 작업을 시작한다. 도구 설명이 간결해서 파라미터 선택이 명확하다.

---

### Journey 9: Claude 서브에이전트 - 에러 처리 (API Consumer Error)

서브에이전트가 존재하지 않는 스토리를 요청한다.

**요청:**
```json
{"story_id": "Story-999"}
```

**응답 (에러):**
```json
{
  "status": "error",
  "error_code": "STORY_NOT_FOUND",
  "message": "Story-999를 찾을 수 없습니다",
  "suggestion": "list-specs로 사용 가능한 스토리 목록을 확인하세요",
  "available_stories": ["Story-41", "Story-42", "Story-43"]
}
```

서브에이전트는 에러 메시지를 읽고, 사용자에게 "Story-999가 없습니다. Story-41, 42, 43 중 선택해주세요"라고 질문한다. 사용자가 "42"라고 답하면 올바른 스토리로 재시도한다.

---

### Journey 10: 현우 - 오류 대응자의 아침 (Phase 2)

> ⚠️ Phase 2 기능 - mcp-slack-bugfix

현우는 운영팀 개발자다. 매일 아침 #error-alerts 채널을 확인하며 하루를 시작한다. 오늘도 새벽 3시에 발생한 `NullPointerException` 알림이 3개 쌓여있다.

예전에는 각 오류를 클릭하고, 스택트레이스를 분석하고, 코드를 찾아가서 수정하고, PR을 만드는 데 건당 30분이 걸렸다. 하지만 이제는 다르다.

Slack을 열자마자 각 오류 알림 아래에 봇이 남긴 댓글이 보인다:
- "🔍 분석 완료: user.getName() null 체크 누락"
- "🔧 수정 PR: #1234"
- "✅ 테스트 통과"

현우는 PR 링크를 클릭하고, 변경사항을 리뷰하고, Approve를 누른다. **3개 오류 대응: 10분**

---

### Journey Requirements Summary

| Journey | 필요 기능 |
|---------|-----------|
| **민수 Onboarding** | 간단한 설정, list-specs, count-tokens |
| **민수 Happy Path** | get-story-context, 토큰 최적화 |
| **민수 Edge Case** | read-spec, summarize-spec, 선택적 로딩 |
| **민수 Recovery** | 👎 피드백, exclude 파라미터, 재호출 |
| **민수 Failure** | 에러 메시지, 캐시 폴백, --use-cache |
| **지영 Admin** | Docker 배포, 헬스체크, 재배포 |
| **지영 장애 대응** | 헬스체크 알림, 로그, Rate Limiting |
| **서브에이전트 Success** | 구조화된 응답, token_count |
| **서브에이전트 Error** | 에러 코드, suggestion, available 목록 |
| **현우 오류 대응** | Slack 모니터링, 자동 PR (Phase 2) |

### Capability Mapping

| 기능 영역 | 관련 Journey | 우선순위 |
|-----------|-------------|----------|
| **Onboarding/설정** | 민수 Onboarding, 지영 Admin | Phase 1 |
| **컨텍스트 로딩** | 민수 Happy, 서브에이전트 | Phase 1 |
| **선택적 Notion 로딩** | 민수 Edge Case | Phase 1 |
| **문서 요약** | 민수 Edge Case | Phase 1 |
| **피드백 수집** | 민수 Recovery | Phase 1 |
| **에러 메시지 설계** | 민수 Failure, 서브에이전트 Error | Phase 1 |
| **캐시 폴백** | 민수 Failure | Phase 1 |
| **Docker 배포** | 지영 Admin | Phase 1 |
| **헬스체크/알림** | 지영 장애 대응 | Phase 1 |
| **Rate Limiting** | 지영 장애 대응 | Phase 1 |
| **Slack 오류 감지** | 현우 오류 대응 | Phase 2 |
| **자동 PR 생성** | 현우 오류 대응 | Phase 2 |

## Innovation & Novel Patterns

### Detected Innovation Areas

#### 1. 커스텀 MCP 철학 (Paradigm Shift)

**현재 문제:**
- 퍼블릭 MCP 서버는 20-30개의 범용 도구 제공
- 도구 설명이 장황하여 토큰 낭비
- 에이전트가 잘못된 도구 선택 확률 증가

**우리의 접근:**
| 측면 | 퍼블릭 MCP | 커스텀 MCP |
|------|-----------|-----------|
| 도구 수 | 20-30개 | 3-5개 |
| 프롬프트 | 장황한 설명 | 핵심만 |
| 용도 | 범용 | 파이프라인 특화 |

**"Less is more"** - 도구 수를 줄이면:
- 토큰 절약 (도구 설명 자체가 컨텍스트)
- 에이전트 혼란 감소
- 정확한 도구 선택률 증가

#### 2. 파이프라인 네이티브 설계 (Novel Combination)

**조합 요소:**
```
[MCP 프로토콜] + [BMAD 워크플로우] + [서브에이전트 자동화]
         ↓               ↓                   ↓
   표준화된 통신    Spec 기반 개발     대규모 작업 분할
```

**파이프라인화 3대 조건 충족:**
1. ✅ **Well-defined spec** - BMAD 산출물이 명확한 입력
2. ✅ **Self-verifiable** - 에이전트가 스스로 검증 가능
3. ✅ **Rule-based** - 반복 가능한 규칙적 작업

**검증 방법론:**
- Before/After 비교: 동일 스토리 구현 시 재시작 횟수 측정
- A/B 테스트: MCP 도구 사용 vs 수동 컨텍스트 구성

#### 3. 토큰 경제학 중심 설계 (Design Philosophy)

**핵심 원칙:**
> 토큰 비용을 핵심 설계 목표로 삼음

**적용 전략:**
| 전략 | 구현 | 예상 절감 |
|------|------|----------|
| 선택적 로딩 | 필요 섹션만 로딩 | 50% |
| LLM 요약 | 긴 문서 압축 | 추가 30% |
| 캐싱 | 반복 요청 방지 | 추가 20% |
| **누적** | | **80%+** |

**연구 기반:**
- LLMLingua: 20x 압축 가능
- Mem0: 80-90% 토큰 비용 절감 사례

#### 4. 행동 안내형 에러 설계 (UX Innovation)

**기존 에러 패턴:**
```json
{"error": "Story not found"}
```

**우리의 에러 패턴:**
```json
{
  "status": "error",
  "error_code": "STORY_NOT_FOUND",
  "message": "Story-999를 찾을 수 없습니다",
  "suggestion": "list-specs로 사용 가능한 스토리 목록을 확인하세요",
  "available_stories": ["Story-41", "Story-42", "Story-43"]
}
```

**혁신 포인트:**
- 에러가 **다음 행동**을 안내
- 서브에이전트가 자동 복구 가능
- 사용자 개입 최소화

### Innovation Evolution Strategy

**피드백 기반 진화:**
```
사용자 👎 피드백 → 패턴 분석 → 도구 개선 → 재배포
       ↑                                    ↓
       ←←←←←←← 효과 측정 ←←←←←←←←←←←←←←←←
```

**메트릭스 기반 개선:**
- 도구별 성공률 추적
- 👎 피드백 클러스터링
- 분기별 Innovation 재평가

### Future Innovation Potential

**서버 간 연계 가능성:**
> 현재 3개 서버는 독립적이나, 향후 조합 시나리오 고려

```
mcp-slack-bugfix
       ↓ 오류 감지
mcp-spec-reader
       ↓ 관련 스펙 로딩
mcp-context-loader
       ↓ 컨텍스트 구성
서브에이전트 → 자동 수정
```

**Phase 3 고려사항:**
- 서버 간 통신 프로토콜
- 공유 캐시 레이어
- 통합 메트릭스 대시보드

### Market Context

**경쟁 현황:**
| 경쟁자 | 특징 | 우리의 차별화 |
|--------|------|--------------|
| 퍼블릭 Notion MCP | 범용, 도구 과다 | 스펙 특화, 최소 도구 |
| 직접 API 호출 | 매번 구현 필요 | 재사용 가능한 서버 |
| 로컬 스킬 파일 | 개인 설정 | HTTP로 팀 공유 |

**시장 기회:**
- BMAD Method 사용 팀 증가 중
- 토큰 비용 절감 니즈 보편적
- 팀 단위 MCP 배포 사례 부족

### Risk Mitigation for Innovation

| 혁신 리스크 | 영향 | 완화 방안 |
|-------------|------|----------|
| "커스텀 MCP"가 오히려 불편 | 채택 실패 | Phase 1 dogfooding 검증 |
| 토큰 절감 목표 미달 | 가치 증명 실패 | 점진적 목표 (50% → 80%) |
| 파이프라인 복잡도 증가 | 유지보수 부담 | 최소 도구셋 원칙 고수 |

### Validation Approach

**Phase 1 검증 계획:**
1. **Week 1-2:** 내부 dogfooding (팀 3명)
2. **Week 3:** Before/After 측정
3. **Week 4:** 피드백 기반 개선

**성공 기준:**
- 토큰 50%+ 절감 (80% 목표 전 중간 검증)
- 서브에이전트 재시작 50%+ 감소
- 팀원 만족도 👍 70%+

## Project Type Analysis

### Technical Type: Developer Tool

**사용자 계층:**

| 계층 | 사용자 | 상호작용 방식 |
|------|--------|--------------|
| **Primary** | 개발자 (민수, 지영) | Claude Code 통해 도구 호출 |
| **Secondary** | Claude 서브에이전트 | MCP API 직접 호출 |
| **Admin** | 팀 리드 (지영) | Docker 배포, 모니터링 |

**API Consumer 아키텍처:**

```
┌─────────────────────┐
│   Claude Code       │
│   (메인 세션)        │
└─────────┬───────────┘
          │ MCP 호출
          ▼
┌─────────────────────┐
│   서브에이전트       │ ← Primary API Consumer
│   (작업 실행)        │
└─────────┬───────────┘
          │ 도구 호출
          ▼
┌─────────────────────┐
│   MCP 서버          │
│   (context-loader,  │
│    spec-reader)     │
└─────────────────────┘
```

### Developer Tool 품질 요구사항

| 영역 | 요구사항 | 구현 |
|------|----------|------|
| **에러 메시지** | 명확한 원인 + 해결 방법 | `suggestion` 필드 필수 |
| **응답 형식** | 구조화된 JSON | 일관된 스키마 |
| **문서화** | API 레퍼런스 + 예시 | README + 인라인 주석 |
| **버전 관리** | 하위 호환성 | 도구 추가 시 기존 파라미터 유지 |

### Integration Points

| 통합 대상 | 방향 | 프로토콜 |
|----------|------|----------|
| Claude Code | ← MCP 요청 | MCP over HTTP/stdio |
| Notion API | → 데이터 조회 | REST API |
| Slack API | → 메시지 모니터링 | Events API (Phase 2) |
| GitHub API | → PR 생성 | REST API (Phase 2) |
| 로컬 파일 | ↔ 컨텍스트 파일 | 파일 시스템 |

### Developer Experience 원칙

1. **Zero Config 시작**: 기본값으로 즉시 사용 가능
2. **Progressive Disclosure**: 고급 옵션은 필요 시 노출
3. **Fail Fast**: 잘못된 입력 즉시 거부 + 수정 안내
4. **Predictable**: 동일 입력 → 동일 출력

## Functional Requirements

### FR-1: mcp-context-loader

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| FR-1.1 | `load-context` | 작업 유형별 컨텍스트 자동 구성 | P0 |
| FR-1.2 | `get-story-context` | 특정 스토리 관련 문서 통합 로딩 | P0 |
| FR-1.3 | `count-tokens` | 현재 컨텍스트 토큰 수 계산 | P0 |
| FR-1.4 | 캐시 폴백 | 외부 서비스 장애 시 캐시 사용 | P1 |
| FR-1.5 | `exclude` 파라미터 | 잘못된 문서 제외 기능 | P1 |

**FR-1.1 `load-context` 상세:**
```typescript
// 입력
{
  task_type: "implement" | "review" | "test",
  story_id?: string
}

// 출력
{
  status: "success",
  context: {
    prd: string,
    architecture: string,
    files: string[]
  },
  token_count: number,
  cached: boolean
}
```

**FR-1.2 `get-story-context` 상세:**
```typescript
// 입력
{
  story_id: string,
  include_architecture?: boolean,  // default: true
  exclude?: string[]               // 제외할 문서 경로
}

// 출력
{
  status: "success",
  context: {
    prd_section: string,
    architecture: string,
    story: string,
    related_files: string[]
  },
  token_count: number
}
```

**FR-1.3 `count-tokens` 상세:**
```typescript
// 입력
{ text?: string }  // 없으면 현재 컨텍스트

// 출력
{ token_count: number, model: "cl100k_base" }
```

### FR-2: mcp-spec-reader

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| FR-2.1 | `read-spec` | Notion 페이지 섹션별 선택 로딩 | P0 |
| FR-2.2 | `summarize-spec` | LLM 기반 문서 요약 | P0 |
| FR-2.3 | `list-specs` | 접근 가능한 스펙 목록 조회 | P0 |
| FR-2.4 | Markdown 변환 | Notion → Markdown 토큰 최적화 | P0 |
| FR-2.5 | `--use-cache` | Notion 장애 시 캐시 폴백 | P1 |

**FR-2.1 `read-spec` 상세:**
```typescript
// 입력
{
  page_id: string,
  sections?: string[],    // 특정 섹션만 로딩
  use_cache?: boolean     // 캐시 사용 여부
}

// 출력
{
  status: "success",
  content: string,        // Markdown 형식
  token_count: number,
  cached: boolean,
  last_edited: string     // ISO 날짜
}
```

**FR-2.2 `summarize-spec` 상세:**
```typescript
// 입력
{
  page_id: string,
  max_tokens?: number     // 요약 목표 토큰 수
}

// 출력
{
  status: "success",
  summary: string,
  original_tokens: number,
  summary_tokens: number,
  compression_ratio: number
}
```

### FR-3: mcp-slack-bugfix (Phase 2)

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| FR-3.1 | `watch-channel` | 오류 채널 모니터링 등록 | P0 |
| FR-3.2 | `analyze-error` | 오류 스택트레이스 분석 | P0 |
| FR-3.3 | `suggest-fix` | 코드베이스 기반 수정 제안 | P1 |
| FR-3.4 | `create-pr` | GitHub PR 자동 생성 | P1 |

### FR-4: 공통 기능

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| FR-4.1 | 피드백 수집 | 응답에 👍/👎 옵션 포함 | P1 |
| FR-4.2 | 메트릭스 로깅 | 호출 횟수, 성공률, 토큰 사용량 | P1 |
| FR-4.3 | 헬스체크 | `/health` 엔드포인트 | P0 |
| FR-4.4 | Rate Limiting | 환경변수로 분당 호출 수 제한 | P1 |

**공통 에러 응답 스키마:**
```typescript
{
  status: "error",
  error_code: string,      // 예: "STORY_NOT_FOUND"
  message: string,         // 사용자 친화적 메시지
  suggestion: string,      // 다음 행동 안내
  available_options?: any  // 가능한 대안 목록
}
```

## Non-Functional Requirements

### NFR-1: 성능 (Performance)

| ID | 요구사항 | 목표 | 측정 |
|----|----------|------|------|
| NFR-1.1 | API 응답 시간 | p95 < 500ms | 응답 시간 로깅 |
| NFR-1.2 | 토큰 계산 속도 | < 100ms (10K 토큰) | 벤치마크 |
| NFR-1.3 | 캐시 히트율 | > 60% | 캐시 메트릭스 |
| NFR-1.4 | 동시 요청 처리 | 50 req/s | 부하 테스트 |

### NFR-2: 가용성 (Availability)

| ID | 요구사항 | 목표 | 구현 |
|----|----------|------|------|
| NFR-2.1 | HTTP 서버 업타임 | 99%+ | 헬스체크 모니터링 |
| NFR-2.2 | Graceful Degradation | 외부 장애 시 캐시 폴백 | 캐시 레이어 |
| NFR-2.3 | 재시작 복구 시간 | < 10초 | Docker 컨테이너 |

### NFR-3: 보안 (Security)

| ID | 요구사항 | 구현 |
|----|----------|------|
| NFR-3.1 | API 키 관리 | 환경변수로 주입, 코드에 하드코딩 금지 |
| NFR-3.2 | Notion 토큰 | Read-only 권한만 요청 |
| NFR-3.3 | 로그 민감정보 | 토큰/키 마스킹 |
| NFR-3.4 | 내부 네트워크 | HTTP 서버는 팀 내부망 배포 권장 |
| NFR-3.5 | IP별 Rate Limit | 클라이언트 IP별 요청 제한 |
| NFR-3.6 | 비정상 패턴 로깅 | 반복 실패, 대량 요청 감지 및 로깅 |

### NFR-4: 유지보수성 (Maintainability)

| ID | 요구사항 | 목표 | 구현 |
|----|----------|------|------|
| NFR-4.1 | 테스트 커버리지 | 80%+ (toolLogic) | Vitest |
| NFR-4.2 | TypeScript strict | 100% | tsconfig.json |
| NFR-4.3 | 코드 패턴 | 3계층 (index→tool→Logic) | boilerplate 준수 |
| NFR-4.4 | 문서화 | README + API 레퍼런스 | 각 서버별 |

**테스트 피라미드:**
```
        /\
       /  \  E2E (5%)
      /----\  - 실제 Notion 페이지 연동
     /      \  - Docker 통합 테스트
    /--------\  Integration (15%)
   /          \  - MCP 서버 요청/응답
  /------------\  - 캐시 레이어 통합
 /              \  Unit (80%)
/----------------\  - toolLogic 순수 함수
```

### NFR-5: 운영성 (Operability)

| ID | 요구사항 | 구현 |
|----|----------|------|
| NFR-5.1 | 헬스체크 | `GET /health` 엔드포인트 |
| NFR-5.2 | 로깅 | JSON 형식, 레벨 설정 가능 |
| NFR-5.3 | 환경변수 구성 | `.env` 파일 또는 Docker 환경변수 |
| NFR-5.4 | Docker 배포 | `docker-compose.yml` 제공 |

**모니터링 및 알림:**

| 이벤트 | 임계값 | 알림 채널 |
|--------|--------|----------|
| 서버 다운 | 헬스체크 3회 연속 실패 | Slack #ops-alerts |
| 높은 에러율 | 5분간 에러 > 10% | Slack #ops-alerts |
| Notion API 장애 | 5분간 실패 > 50% | Slack #ops-alerts |
| Rate Limit 초과 | 분당 요청 > 설정값 | 로그만 (경고) |

### NFR-6: 호환성 (Compatibility)

| ID | 요구사항 | 버전 |
|----|----------|------|
| NFR-6.1 | Node.js | 20+ |
| NFR-6.2 | MCP SDK | 1.0+ |
| NFR-6.3 | Notion API | 2022-06-28+ |
| NFR-6.4 | Transport | stdio + HTTP 지원 |

### NFR-7: 확장성 (Scalability)

| ID | 요구사항 | 구현 |
|----|----------|------|
| NFR-7.1 | 무상태 설계 | 세션 정보 서버에 저장 안 함 |
| NFR-7.2 | 수평 확장 가능 | 로드밸런서 뒤 다중 인스턴스 |
| NFR-7.3 | 캐시 공유 | Redis 외부 캐시 지원 (Phase 2) |

**확장 시나리오:**
```
현재 (Phase 1):
┌─────────────┐
│ MCP Server  │ ← 단일 인스턴스, 로컬 캐시
└─────────────┘

확장 시 (필요 시):
         ┌─────────────┐
         │ Load        │
         │ Balancer    │
         └──────┬──────┘
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────┐
│ MCP 1 │  │ MCP 2 │  │ MCP 3 │
└───┬───┘  └───┬───┘  └───┬───┘
    └───────────┼───────────┘
                ▼
         ┌─────────────┐
         │   Redis     │ ← 공유 캐시
         └─────────────┘
```

## Risks & Constraints

### Risks (리스크)

#### 기술 리스크

| ID | 리스크 | 영향 | 확률 | 완화 방안 |
|----|--------|------|------|----------|
| R-1 | Notion API 변경 | 서버 동작 중단 | 낮음 | API 버전 고정, 추상화 레이어 |
| R-2 | MCP SDK 호환성 | 업그레이드 시 파손 | 중간 | SDK 버전 고정, 릴리스 노트 모니터링 |
| R-3 | 토큰 계산 정확도 | 실제 사용량과 차이 | 중간 | tiktoken 라이브러리 사용, 정기 검증 |
| R-4 | LLM 요약 품질 | 중요 정보 손실 | 중간 | 원본 링크 제공, 요약 길이 옵션 |

#### 운영 리스크

| ID | 리스크 | 영향 | 확률 | 완화 방안 |
|----|--------|------|------|----------|
| R-5 | Slack API 마이그레이션 | Phase 2 지연 | 높음 | Phase 2로 분리 (2025.03.31 이후) |
| R-6 | 팀 온보딩 저항 | 채택률 저하 | 중간 | 5분 온보딩, HTTP 배포로 설치 부담 최소화 |
| R-7 | Notion 서비스 장애 | 작업 중단 | 낮음 | 캐시 폴백, Graceful Degradation |

#### 비즈니스 리스크

| ID | 리스크 | 영향 | 확률 | 완화 방안 |
|----|--------|------|------|----------|
| R-8 | 토큰 절감 목표 미달 | ROI 증명 실패 | 중간 | 점진적 목표 (50% → 80%), 측정 리포트 |
| R-9 | 커스텀 MCP 유지보수 부담 | 장기 비용 증가 | 중간 | boilerplate 기반, 최소 도구셋 원칙 |

### Constraints (제약 조건)

#### 기술 제약

| 제약 | 설명 | 영향 |
|------|------|------|
| Notion API Rate Limit | 초당 3 요청 | 대량 로딩 시 지연 |
| MCP SDK 버전 | 1.0+ 필수 | Node.js 20+ 필요 |
| LLM 요약 비용 | 추가 API 호출 | summarize-spec 비용 발생 |

#### 조직 제약

| 제약 | 설명 | 대응 |
|------|------|------|
| 개발 리소스 | 1인 개발 | Phase 분리, MVP 집중 |
| Slack 정책 | Legacy bots 종료 | Phase 2 일정 조정 |

#### 범위 제약

| 범위 외 | 이유 |
|---------|------|
| 다중 소스 통합 | Phase 1-2 성공 후 재평가 |
| 양방향 동기화 | 복잡도 높음, Vision으로 분류 |
| 팀 대시보드 | Phase 1-2 성공 후 재평가 |

## Appendix

### Document History

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-25 | moonklabs | 초안 작성 |

### Related Documents

| 문서 | 경로 | 설명 |
|------|------|------|
| 브레인스토밍 | `_bmad-output/analysis/brainstorming-session-2025-12-25.md` | 21개 아이디어, TOP 3 선정 |
| 기술 조사 | `_bmad-output/project-planning-artifacts/research/technical-mcp-tools-research-2025-12-25.md` | API 통합, 토큰 최적화 연구 |
| 프로젝트 문서 | `docs/index.md` | 기존 코드베이스 분석 |

### Glossary

| 용어 | 설명 |
|------|------|
| MCP | Model Context Protocol - AI 에이전트와 도구 간 통신 표준 |
| 서브에이전트 | Claude Code의 Task 도구로 생성되는 하위 에이전트 |
| BMAD Method | PRD → Architecture → Epics → Implementation 워크플로우 |
| 토큰 | LLM 입력/출력 단위, 비용 계산 기준 |
| 파이프라인화 | 반복 작업을 자동화 가능한 형태로 구조화 |

### Approval

| 역할 | 이름 | 승인 | 날짜 |
|------|------|------|------|
| Product Owner | moonklabs | ⬜ | - |
| Tech Lead | moonklabs | ⬜ | - |

---

## PRD Summary

### 한눈에 보기

| 항목 | 내용 |
|------|------|
| **프로젝트** | moonklabs-mcp-servers |
| **목표** | 파이프라인화된 AI 개발을 위한 커스텀 MCP 도구 세트 |
| **핵심 가치** | 토큰 80% 절감, 서브에이전트 원샷 성공률 70%+ |

### Phase 1 MVP (mcp-context-loader + mcp-spec-reader)

| 도구 | 핵심 기능 |
|------|----------|
| `load-context` | 작업 유형별 컨텍스트 자동 구성 |
| `get-story-context` | 스토리 관련 문서 통합 로딩 |
| `count-tokens` | 토큰 수 계산 |
| `read-spec` | Notion 섹션별 선택 로딩 |
| `summarize-spec` | LLM 요약 |
| `list-specs` | 스펙 목록 조회 |

### Phase 2 (mcp-slack-bugfix)

| 도구 | 핵심 기능 |
|------|----------|
| `watch-channel` | Slack 오류 채널 모니터링 |
| `analyze-error` | 오류 원인 분석 |
| `create-pr` | GitHub PR 자동 생성 |

### 주요 리스크

| 리스크 | 완화 방안 |
|--------|----------|
| Slack API 마이그레이션 | Phase 2로 분리 |
| 토큰 절감 목표 미달 | 점진적 목표 (50% → 80%) |
| 팀 온보딩 저항 | 5분 온보딩, HTTP 배포 |

### 다음 단계

1. ⬜ PRD 승인
2. ⬜ Architecture 설계 (`/bmad:bmm:workflows:create-architecture`)
3. ⬜ Epics & Stories 작성 (`/bmad:bmm:workflows:create-epics-and-stories`)

