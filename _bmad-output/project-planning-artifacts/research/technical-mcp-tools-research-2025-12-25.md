---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: completed
inputDocuments: ['_bmad-output/analysis/brainstorming-session-2025-12-25.md']
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'MCP 도구 개발을 위한 기술 조사 (mcp-spec-reader, mcp-slack-bugfix, mcp-context-loader)'
research_goals: 'API 통합 방법, 토큰 최적화 기법, 유사 도구 분석'
user_name: 'moonklabs'
date: '2025-12-25'
web_research_enabled: true
source_verification: true
---

# Technical Research Report: MCP 도구 개발

**Date:** 2025-12-25
**Author:** moonklabs
**Research Type:** Technical

---

## Research Overview

브레인스토밍에서 도출된 TOP 3 MCP 도구에 대한 기술 조사:

1. **mcp-spec-reader** - Notion/Sheet에서 스펙 토큰 효율적 로딩
2. **mcp-slack-bugfix** - Slack 오류 알림 → 자동 분석/수정
3. **mcp-context-loader** - PRD/Architecture/Story 통합 컨텍스트 로딩

---

## 1. MCP 서버 개발 패턴

### 1.1 공식 TypeScript SDK

**Source:** [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)

| 항목 | 내용 |
|------|------|
| GitHub Stars | 11,115+ |
| 최신 업데이트 | 2024-12-24 |
| 필수 의존성 | `zod` (v3.25+) |

**핵심 기능:**
- Tools, Resources, Prompts 등록
- Streamable HTTP (권장) 및 stdio 지원
- 타입 안전한 스키마 검증 (Zod)

**Transport 옵션:**
- `stdio` - Claude Desktop 로컬 연동
- `Streamable HTTP` - 원격 서버 (권장)
- `HTTP + SSE` - 하위 호환성

### 1.2 공식 MCP 서버 저장소

**Source:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

참고할 수 있는 공식 서버 구현체들이 있음.

### 1.3 기존 MCP 서버 목록

**Sources:**
- [awesome-mcp-servers (punkpeye)](https://github.com/punkpeye/awesome-mcp-servers)
- [awesome-mcp-servers (wong2)](https://github.com/wong2/awesome-mcp-servers)
- [mcpservers.org](https://mcpservers.org/)

카테고리: Search, Web Scraping, Communication, Productivity, Development, Database, Cloud Service, File System 등

---

## 2. Notion API 통합 (mcp-spec-reader)

### 2.1 공식 Notion MCP 서버

**Source:** [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server)

**특징:**
- 공식 Notion 제공
- Token-efficient Markdown 기반 API
- ChatGPT, Claude 등 최적화

**설치:**
```bash
npx @notionhq/notion-mcp-server
```

### 2.2 커뮤니티 대안

**Source:** [suekou/mcp-notion-server](https://github.com/suekou/mcp-notion-server)

**핵심 기능:**
- Markdown 변환으로 컨텍스트 크기 감소
- LLM 통신 시 토큰 사용량 최적화

### 2.3 Notion API 통합 방법

**Source:** [Notion Developers - MCP](https://developers.notion.com/docs/mcp)

1. Integration 생성: https://www.notion.so/profile/integrations
2. Read-only 토큰 발급 가능
3. 페이지별 접근 권한 설정

**보안 고려사항:**
- API 노출 범위 제한 (예: 데이터베이스 삭제 불가)
- LLM에 워크스페이스 데이터 노출 위험 인지 필요

### 2.4 mcp-spec-reader 구현 전략

| 기능 | 구현 방법 |
|------|-----------|
| 토큰 효율적 로딩 | Markdown 변환 + 불필요 메타데이터 제거 |
| 선택적 섹션 로딩 | 블록 단위 필터링 |
| 요약 모드 | LLM 기반 자동 요약 |
| 캐싱 | 변경 감지 + 로컬 캐시 |

---

## 3. Slack API 통합 (mcp-slack-bugfix)

### 3.1 Slack API 변경사항 (2025)

**Source:** [Slack API Changelog](https://api.slack.com/changelog)

**⚠️ 중요 변경:**
- 2025년 3월 31일: Legacy custom bots 지원 종료
- 2025년 3월 11일: files.upload 마이그레이션 마감

### 3.2 Slack Events API

**Source:** [Slack Events API](https://api.slack.com/events-api)

**활용:**
- 실시간 채널 메시지 모니터링
- 오류 알림 감지

**필요 스코프:**
- `channels:history` - 채널 메시지 읽기
- `chat:write` - 메시지 전송
- `files:write` - 파일 업로드 (PR 링크 등)

### 3.3 에러 모니터링 패턴

**Source:** [ClearML Slack Alerts](https://clear.ml/docs/latest/docs/guides/services/slack_alerts/)

**구현 패턴:**
```python
# slack_sdk 사용 예시
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
```

**일반적인 오류 처리:**
- `not_in_channel` → 봇 초대 필요
- `missing_scope` → OAuth scope 추가 필요
- Timeout → ack 먼저 호출, 결과는 나중에

### 3.4 mcp-slack-bugfix 구현 전략

| 기능 | 구현 방법 |
|------|-----------|
| 오류 감지 | Events API로 특정 채널 모니터링 |
| 오류 파싱 | 정규식 + LLM 분석 |
| 자동 수정 | 코드베이스 분석 + 패치 생성 |
| PR 생성 | GitHub API 연동 |
| 알림 | 수정 완료 시 Slack 메시지 |

---

## 4. Sentry 통합 (참고)

**Source:** [Sentry JavaScript Troubleshooting](https://docs.sentry.io/platforms/javascript/troubleshooting/)

**Sentry SDK 기능:**
- 미처리 오류 자동 캡처
- Promise rejection 자동 처리
- 커스텀 태그로 컨텍스트 추가

**API 활용:**
```javascript
Sentry.captureException(err, {
  tags: { feature: "data-fetching" }
});
```

---

## 5. 토큰 최적화 기법 (mcp-context-loader)

### 5.1 컨텍스트 윈도우 현황 (2025)

**Source:** [Agenta - Context Length Techniques](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms)

| 모델 | 컨텍스트 윈도우 |
|------|----------------|
| ChatGPT (2022) | 4,000 토큰 |
| 2025 표준 | 128,000 토큰 |
| Gemini 1.5 Pro | 1,000,000 토큰 |
| Llama 4 | 10,000,000 토큰 |

**주의:** 컨텍스트 길이 증가 시 계산 비용 제곱으로 증가

### 5.2 압축 기법

**Sources:**
- [Token Compression - 80% Cost Reduction](https://medium.com/@yashpaddalwar/token-compression-how-to-slash-your-llm-costs-by-80-without-sacrificing-quality-bfd79daf7c7c)
- [Context Engineering](https://medium.com/@kuldeep.paul08/context-engineering-optimizing-llm-memory-for-production-ai-agents-6a7c9165a431)

| 기법 | 압축률 | 특징 |
|------|--------|------|
| **LLMLingua v1** | 20x | 범용 압축 |
| **LongLLMLingua** | - | "Lost in the middle" 문제 해결 |
| **LLMLingua-2** | - | 3-6x 속도 향상 |
| **Recurrent Compression** | 32x+ | 100만 토큰까지 처리 |
| **Acon (Agent)** | 26-54% | 에이전트 특화 |

### 5.3 메모리 기반 접근

**Source:** [Mem0 - Chat History Summarization](https://mem0.ai/blog/llm-chat-history-summarization-guide-2025)

**효과:**
- 토큰 비용 80-90% 절감
- 응답 품질 26% 향상 (기본 히스토리 관리 대비)

**핵심 전략:**
- 요약 vs 메모리: 모든 것을 압축 보존 vs 영구 보존할 것만 선택
- Embedding 기반 압축: 텍스트 → 벡터 → 필요 시 재구성

### 5.4 주요 고려사항

**Source:** [Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)

**"Lost in the Middle" 현상:**
- LLM은 긴 프롬프트의 시작/끝 정보를 중간보다 잘 기억
- 중요 정보는 시작/끝에 배치 권장

**"Context Rot" 현상:**
- 입력 토큰 증가 시 성능 저하 가능
- 적절한 컨텍스트 크기 유지 필요

### 5.5 mcp-context-loader 구현 전략

| 기능 | 구현 방법 |
|------|-----------|
| 선택적 로딩 | 작업 관련 문서만 로딩 |
| 토큰 압축 | LLMLingua 또는 자체 요약 |
| 우선순위 배치 | 중요 정보 시작/끝 배치 |
| 캐싱 | 자주 사용되는 컨텍스트 캐시 |
| 점진적 로딩 | 필요 시 추가 컨텍스트 로딩 |

---

## 6. 구현 우선순위 권장

| 순위 | 도구 | 근거 |
|------|------|------|
| 1 | **mcp-context-loader** | 모든 도구의 기반, 토큰 효율성 핵심 |
| 2 | **mcp-spec-reader** | 기존 mcp-notion-task 확장 가능 |
| 3 | **mcp-slack-bugfix** | API 변경 대응 필요, 복잡도 높음 |

---

## Sources

### MCP 개발
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

### Notion API
- [Notion MCP Server (Official)](https://github.com/makenotion/notion-mcp-server)
- [Notion MCP Documentation](https://developers.notion.com/docs/mcp)
- [suekou/mcp-notion-server](https://github.com/suekou/mcp-notion-server)

### Slack API
- [Slack API Changelog](https://api.slack.com/changelog)
- [Slack Events API](https://api.slack.com/events-api)
- [ClearML Slack Alerts](https://clear.ml/docs/latest/docs/guides/services/slack_alerts/)

### 토큰 최적화
- [Context Length Techniques](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms)
- [Token Compression 80% Cost Reduction](https://medium.com/@yashpaddalwar/token-compression-how-to-slash-your-llm-costs-by-80-without-sacrificing-quality-bfd79daf7c7c)
- [Mem0 Chat History Guide](https://mem0.ai/blog/llm-chat-history-summarization-guide-2025)
- [Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)
