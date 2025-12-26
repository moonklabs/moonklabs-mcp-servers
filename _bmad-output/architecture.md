---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: complete
completedAt: '2025-12-26'
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/project-planning-artifacts/research/technical-mcp-tools-research-2025-12-25.md'
  - 'docs/index.md'
workflowType: 'architecture'
project_name: 'moonklabs-mcp-servers'
user_name: 'moonklabs'
date: '2025-12-26'
hasProjectContext: false
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 18개 기능이 3개 MCP 서버에 분산
- Phase 1 (MVP): mcp-context-loader (5), mcp-spec-reader (5)
- Phase 2: mcp-slack-bugfix (4)
- 공통 인프라: 피드백, 메트릭스, 헬스체크, Rate Limiting

**Non-Functional Requirements:**
- 성능: p95 응답시간 500ms 이하, 동시 50 req/s
- 가용성: 99%+, 캐시 폴백으로 Graceful Degradation
- 보안: 환경변수 API 키, IP별 Rate Limit, Notion 접근 범위 제한
- 유지보수성: 테스트 커버리지 80%+ (toolLogic)
- 확장성: 무상태 설계, 수평 확장 가능

**Scale & Complexity:**
- Primary domain: Developer Tool (MCP Server)
- Complexity level: Medium
- Estimated architectural components: 6 (3 servers + common + cache + metrics)

### Technical Constraints & Dependencies

| 제약 | 영향 | 대응 |
|------|------|------|
| Notion API Rate Limit | 초당 3 요청 | 캐싱 필수 |
| MCP SDK 1.0+ | Node.js 20+ 필수 | - |
| Slack Legacy Bots 종료 | Phase 2 일정 | 2025.04 이후 |
| 기존 boilerplate 패턴 | 3계층 아키텍처 | 준수 필수 |
| 외부 API 테스트 | 모킹 필요 | nock 또는 msw |

### Cross-Cutting Concerns Identified

1. **공통 모듈 추출**: `@moonklabs/mcp-common` 패키지로 공유 코드 분리
   - 캐싱 레이어
   - 에러 응답 패턴 (`suggestion` 필드)
   - 메트릭스 수집
   - Rate Limiting

2. **테스트 모킹 전략**: 외부 API 의존성 처리
   - Notion API: `nock` 또는 `msw`로 HTTP 모킹
   - 로컬 파일: 테스트 fixtures

3. **Transport 추상화**: stdio/HTTP 동시 지원

4. **보안 범위 제한**:
   - `NOTION_PAGE_IDS` 환경변수로 접근 가능 페이지 제한

### Architectural Decisions Pending

| 결정 사항 | 옵션 | 권장 |
|----------|------|------|
| 공통 모듈 위치 | 별도 패키지 vs 폴더 | 모노레포 내 `packages/common` |
| 테스트 모킹 | nock vs msw | nock (단순성) |
| Docker 전략 | 단일 이미지 vs 개별 | 서버별 독립 이미지 |
| MVP 범위 | 핵심만 vs 인프라 포함 | 핵심 기능 + 기본 캐싱 |

### MVP Scope Clarification

**Phase 1 Core (Must Have):**
- mcp-context-loader: load-context, get-story-context, count-tokens
- mcp-spec-reader: read-spec, list-specs
- 기본 캐싱 (로컬 메모리)

**Phase 1.5 Infrastructure (Should Have):**
- summarize-spec (LLM 비용 발생)
- 메트릭스 수집
- 피드백 (👍/👎)
- Rate Limiting

## Starter Template Evaluation

### Primary Technology Domain

API/Backend - MCP Server (Developer Tool)
- TypeScript 5.7+, Node.js 20+
- MCP SDK 1.0+
- 기존 모노레포 구조 확장

### Starter Options Considered

| 옵션 | 평가 | 결정 |
|------|------|------|
| mcp-boilerplate (기존) | 검증됨, 패턴 일치 | ✅ 선택 |
| 외부 MCP starter | 존재하지 않음 | N/A |
| 범용 Node.js starter | 패턴 불일치 | ❌ |

### Selected Starter: mcp-boilerplate

**Rationale for Selection:**
- 이미 팀에서 검증된 템플릿
- mcp-notion-task에서 운영 경험 축적
- 3계층 패턴 (index → tool → toolLogic) 표준화됨
- stdio/HTTP dual transport 지원

### Monorepo Structure Decision

**현재 구조 유지 + packages 추가:**
```
moonklabs-mcp-servers/
├── packages/
│   └── common/           # 신규: 공통 모듈
│       ├── src/
│       │   ├── cache/    # 캐싱 레이어
│       │   ├── errors/   # 에러 응답 패턴
│       │   ├── metrics/  # 메트릭스 수집
│       │   ├── testing/  # 테스트 유틸리티
│       │   └── index.ts
│       └── package.json
├── mcp-boilerplate/      # 템플릿 (기존)
├── mcp-notion-task/      # Notion 서버 (기존)
├── mcp-context-loader/   # 신규
├── mcp-spec-reader/      # 신규
└── package.json          # 루트 워크스페이스
```

**의존성 방향 (순환 방지):**
```
packages/common ← mcp-context-loader
                ← mcp-spec-reader
                ← mcp-slack-bugfix (Phase 2)

⚠️ common은 다른 mcp-* 패키지를 import 금지
```

### Workspace Configuration

**루트 package.json:**
```json
{
  "name": "moonklabs-mcp-servers",
  "private": true,
  "workspaces": [
    "packages/*",
    "mcp-*"
  ],
  "scripts": {
    "dev:all": "concurrently \"npm run dev -w mcp-context-loader\" \"npm run dev -w mcp-spec-reader\"",
    "build:all": "npm run build -ws",
    "test:all": "npm run test -ws",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write ."
  }
}
```

**서버 package.json 의존성:**
```json
{
  "dependencies": {
    "@moonklabs/mcp-common": "workspace:*"
  }
}
```

### Environment Variables Strategy

**계층적 환경변수:**
```
/.env                    # 공통 변수 (NOTION_API_KEY 등)
/mcp-context-loader/.env.local  # 서버별 override
/mcp-spec-reader/.env.local     # 서버별 override
```

**로딩 순서:** 루트 `.env` → 서버별 `.env.local` (override)

### Docker Build Strategy

**멀티스테이지 빌드 패턴:**
```dockerfile
# Stage 1: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/common ./packages/common
COPY mcp-context-loader ./mcp-context-loader
RUN npm ci
RUN npm run build -w packages/common
RUN npm run build -w mcp-context-loader

# Stage 2: 실행
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/mcp-context-loader/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/http.js"]
```

### Shared Test Infrastructure

**packages/common/src/testing:**
```typescript
// Mock 팩토리
export { createMockNotionClient } from './mocks/notion';
export { createMockMcpResponse } from './mocks/mcp';

// 테스트 fixtures
export { testFixtures } from './fixtures';

// Assertion 헬퍼
export { assertMcpSuccess, assertMcpError } from './assertions';
```

### Build & Quality Strategy

**Phase 1:** 단순 빌드
- `npm run build:all` - 전체 빌드
- `npm run lint` - 루트 레벨 린팅
- `npm run test:all` - 전체 테스트

**Phase 2+ (필요 시):** turborepo 도입
- 빌드 캐싱
- 변경된 패키지만 재빌드

### Architectural Decisions Provided by Starter

| 영역 | 결정 |
|------|------|
| **Language** | TypeScript strict mode, ESM |
| **Build** | tsup bundling |
| **Test** | Vitest, `__tests__/` 패턴 |
| **Code Org** | 3계층 (index → tool → toolLogic) |
| **Lint** | ESLint + Prettier (루트 통합) |

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. 캐싱 전략: node-cache (Phase 1) → Redis (Phase 2+)
2. 에러 응답 표준: suggestion 필드 필수
3. 로깅: pino (JSON 구조화, 민감정보 마스킹)

**Important Decisions (Shape Architecture):**
1. 테스트 모킹: nock
2. 에러 코드 규칙: {SERVICE}_{ERROR_TYPE}
3. 최소 메트릭스: Phase 1 포함

**Deferred Decisions (Post-MVP):**
1. Redis 캐시 공유
2. 메트릭스 대시보드
3. 분산 Rate Limiting
4. Notion webhook 연동

### Data Architecture

**캐싱 전략:**
| Phase | 구현 | 라이브러리 |
|-------|------|-----------|
| Phase 1 | 로컬 메모리 캐시 | node-cache |
| Phase 2+ | 공유 캐시 | Redis (ioredis) |

**캐시 키 규칙:**
```
{server}:{resource}:{id}:{hash}
예: spec-reader:notion:page123:abc123
```

**TTL 설정:**
| 리소스 | TTL | 이유 |
|--------|-----|------|
| Notion 페이지 | 5분 | 자주 변경 |
| 스펙 요약 | 1시간 | LLM 비용 절약 |
| 토큰 수 | 무제한 | 불변 |

**캐시 무효화 전략:**
- Phase 1: TTL 기반 자동 만료
- Phase 1.5: `invalidate-cache` 도구 추가
  ```typescript
  // 수동 캐시 무효화
  invalidate-cache({ pattern: "spec-reader:notion:*" })
  ```
- Phase 2: Notion webhook 연동 (자동 무효화)

### API & Communication Patterns

**에러 응답 표준:**
```typescript
interface McpErrorResponse {
  status: "error";
  error_code: string;        // {SERVICE}_{ERROR_TYPE}
  message: string;           // 한글 사용자 메시지
  suggestion: string;        // 다음 행동 안내 (필수!)
  available_options?: any;   // 가능한 대안
  retry_after?: number;      // Rate Limit 대기 시간 (초)
}
```

**에러 코드 카탈로그:**
| 코드 | 의미 | suggestion 예시 |
|------|------|----------------|
| `NOTION_RATE_LIMIT` | API 한도 초과 | "잠시 후 다시 시도하세요" |
| `NOTION_NOT_FOUND` | 페이지 없음 | "list-specs로 목록 확인" |
| `STORY_NOT_FOUND` | 스토리 없음 | "사용 가능: Story-41, 42" |
| `TOKEN_LIMIT_EXCEEDED` | 토큰 초과 | "summarize-spec 사용 권장" |
| `CACHE_MISS` | 캐시 없음 | "원본 소스에서 로딩 중" |

### Logging Strategy

**라이브러리:** pino (v9+)

**로그 레벨:**
| 환경 | 기본 레벨 | 출력 형식 |
|------|----------|----------|
| development | debug | pino-pretty (컬러) |
| production | info | JSON stdout |

**민감정보 마스킹 (필수):**
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

**로그 구조:**
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

### Metrics Strategy (Phase 1 Minimum)

**Phase 1 최소 메트릭스:**
```typescript
interface MinimalMetrics {
  tool_calls: number;        // 도구 호출 횟수
  success_rate: number;      // 성공률 (%)
  cache_hit_rate: number;    // 캐시 히트율 (%)
  avg_response_ms: number;   // 평균 응답 시간
}
```

**수집 방법:** 메모리 내 카운터 + `/metrics` 엔드포인트
**Phase 2:** Prometheus 형식 내보내기

### Testing Strategy

**모킹 라이브러리:** nock

**테스트 구조:**
```typescript
// packages/common/src/testing/mocks/notion.ts
import nock from 'nock';

export function mockNotionPage(pageId: string, content: object) {
  return nock('https://api.notion.com')
    .get(`/v1/pages/${pageId}`)
    .reply(200, content);
}

export function mockNotionRateLimit() {
  return nock('https://api.notion.com')
    .get(/.*/)
    .reply(429, { message: 'Rate limited' });
}
```

**에러 시나리오 테스트 필수화:**
```typescript
describe('error handling', () => {
  it('returns NOTION_RATE_LIMIT with retry_after', async () => {
    mockNotionRateLimit();
    const result = await readSpec({ page_id: 'test' });
    expect(result.error_code).toBe('NOTION_RATE_LIMIT');
    expect(result.suggestion).toBeDefined();
  });

  it('returns STORY_NOT_FOUND with available_options', async () => {
    const result = await getStoryContext({ story_id: 'invalid' });
    expect(result.error_code).toBe('STORY_NOT_FOUND');
    expect(result.available_options).toBeInstanceOf(Array);
  });
});
```

### Decision Impact Analysis

**구현 순서:**
1. packages/common 기본 구조 (에러, 로깅, 메트릭스)
2. 캐싱 레이어 (node-cache)
3. 테스트 인프라 (nock mocks, 에러 테스트)
4. mcp-context-loader 도구들
5. mcp-spec-reader 도구들

**Cross-Component Dependencies:**
```
에러 패턴 → 모든 도구에서 사용
캐싱 레이어 → spec-reader, context-loader 공유
로깅 (redact 포함) → 모든 컴포넌트 공통
메트릭스 → 모든 도구에서 수집
테스트 mocks → 모든 테스트에서 import
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 4개 영역 (Naming, Structure, Format, Process)

### Naming Patterns

**MCP 도구 이름:**
| 규칙 | 형식 | 예시 |
|------|------|------|
| 도구 이름 | kebab-case | `get-story-context` |
| 동사-명사 | {action}-{resource} | `read-spec`, `count-tokens` |

**파일 이름:**
| 파일 유형 | 형식 | 예시 |
|----------|------|------|
| 도구 등록 | camelCase.ts | `getStoryContext.ts` |
| 비즈니스 로직 | camelCaseLogic.ts | `getStoryContextLogic.ts` |
| 테스트 | camelCase.test.ts | `getStoryContext.test.ts` |

**함수/변수 이름:**
| 유형 | 형식 | 예시 |
|------|------|------|
| 함수 | camelCase | `buildStoryContext()` |
| 변수 | camelCase | `tokenCount`, `cacheKey` |
| 상수 | UPPER_SNAKE | `DEFAULT_TTL`, `MAX_TOKENS` |

**테스트 네이밍 규칙:**
```typescript
describe('getStoryContextLogic', () => {
  describe('buildStoryContext', () => {
    it('should return context with token_count', ...);
    it('should throw STORY_NOT_FOUND when invalid id', ...);
    it('should include cached field in response', ...);
  });
});
```

### Structure Patterns

**3계층 분리 (필수):**
```
index.ts         → registerAllTools() 호출만
tool.ts          → MCP 도구 등록 + 응답 포맷팅
toolLogic.ts     → 순수 비즈니스 로직 (테스트 대상)
```

**디렉토리 구조:**
```
src/
├── tools/
│   ├── index.ts                 # registerAllTools()
│   ├── getStoryContext.ts       # 도구 등록
│   ├── getStoryContextLogic.ts  # 비즈니스 로직
│   └── __tests__/
│       └── getStoryContext.test.ts
├── resources/
└── prompts/
```

**Import 경로 규칙:**
```typescript
// ✅ packages/common은 패키지명으로
import { createMcpError, logger } from '@moonklabs/mcp-common';

// ✅ 같은 서버 내는 상대 경로
import { buildStoryContext } from './getStoryContextLogic';

// ❌ 상대 경로로 common 접근 금지
import { logger } from '../../packages/common';  // 금지!
```

### Format Patterns

**MCP 응답 구조:**
```typescript
// 성공 응답
{
  status: "success",
  data: { ... },
  token_count: number,
  cached: boolean
}

// 에러 응답 (suggestion 필수!)
{
  status: "error",
  error_code: "{SERVICE}_{ERROR_TYPE}",
  message: "한글 메시지",
  suggestion: "다음 행동 안내"  // 필수!
}
```

**에러 응답 헬퍼 (필수 사용):**
```typescript
// packages/common/src/errors/index.ts
export function createMcpError(
  code: string,
  message: string,
  suggestion: string,
  options?: { available_options?: any; retry_after?: number }
): McpErrorResponse {
  return {
    status: "error",
    error_code: code,
    message,
    suggestion,
    ...options
  };
}

// 사용 예
return createMcpError(
  'STORY_NOT_FOUND',
  'Story-999를 찾을 수 없습니다',
  'list-specs로 사용 가능한 스토리 목록을 확인하세요',
  { available_options: ['Story-41', 'Story-42'] }
);
```

**JSON 필드명 규칙:**
| 위치 | 형식 | 이유 |
|------|------|------|
| MCP 응답 | snake_case | MCP 표준 |
| 내부 코드 | camelCase | TypeScript 관례 |

### Process Patterns

**캐싱 적용 순서:**
1. 캐시 키 생성
2. 캐시 확인 (있으면 `cached: true`로 반환)
3. 로직 실행
4. 캐시 저장
5. `cached: false`로 반환

**로깅 레벨 사용 기준:**
| 레벨 | 사용 상황 | 예시 |
|------|----------|------|
| `debug` | 개발 중 상세 정보 | 파라미터 값, 중간 결과 |
| `info` | 도구 호출/완료 | 시작, 종료, duration |
| `warn` | 주의 필요 상황 | 캐시 미스, 재시도, 폴백 |
| `error` | 실패/예외 | API 에러, 예외 발생 |

**로깅 시점:**
```typescript
logger.info({ tool: 'get-story-context', story_id }, 'Tool invoked');
logger.debug({ params }, 'Parameters received');
logger.warn({ cache_key }, 'Cache miss, fetching from source');
logger.info({ tool, duration_ms, cached }, 'Tool completed');
logger.error({ tool, error }, 'Tool failed');
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. 3계층 분리 패턴 준수 (로직을 toolLogic.ts에 분리)
2. `createMcpError()` 헬퍼 사용하여 에러 응답 생성
3. 도구 이름은 kebab-case, 파일명은 camelCase
4. 캐시 사용 시 `cached` 필드 응답에 포함
5. pino 로거 사용, 레벨별 사용 기준 준수

**PR Checklist Template:**
```markdown
## PR Checklist
- [ ] 3계층 분리 (Logic 파일 분리됨)
- [ ] `createMcpError()` 헬퍼 사용
- [ ] 에러 응답에 suggestion 포함
- [ ] 테스트 커버리지 80%+ (toolLogic)
- [ ] 캐시 사용 시 cached 필드 포함
- [ ] 로깅 레벨 적절히 사용
- [ ] Import 경로 규칙 준수
```

**Pattern Verification:**
- PR 리뷰 시 위 체크리스트 확인
- 테스트에서 에러 응답 suggestion 필드 검증
- ESLint 규칙으로 naming convention 강제

### Pattern Examples

**Good Example:**
```typescript
// getStoryContextLogic.ts
import { createMcpError, logger } from '@moonklabs/mcp-common';

export async function buildStoryContext(storyId: string): Promise<StoryContext> {
  logger.debug({ storyId }, 'Building story context');

  const story = await findStory(storyId);
  if (!story) {
    throw createMcpError(
      'STORY_NOT_FOUND',
      `Story-${storyId}를 찾을 수 없습니다`,
      'list-specs로 사용 가능한 스토리 목록을 확인하세요'
    );
  }

  return { story, token_count: countTokens(story) };
}

// getStoryContext.ts
import { buildStoryContext } from './getStoryContextLogic';

server.registerTool("get-story-context", {
  description: "스토리 관련 컨텍스트 로딩",
  inputSchema: z.object({ story_id: z.string() })
}, async ({ story_id }) => {
  const result = await buildStoryContext(story_id);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
```

**Anti-Patterns:**
```typescript
// ❌ 로직이 도구 등록과 섞임
server.registerTool("get-story-context", {...}, async ({ story_id }) => {
  // 수십 줄의 비즈니스 로직이 여기에...
});

// ❌ 헬퍼 없이 수동 에러 생성 (suggestion 누락 위험)
return { status: "error", message: "Not found" };

// ❌ 잘못된 로그 레벨
logger.error({ cache_key }, 'Cache miss');  // warn이어야 함
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
moonklabs-mcp-servers/
├── README.md
├── package.json                    # 루트 워크스페이스 설정
├── tsconfig.json                   # 공통 TypeScript 설정
├── vitest.workspace.ts             # Vitest 워크스페이스 설정
├── .eslintrc.js                    # 공통 ESLint 설정
├── .prettierrc                     # Prettier 설정
├── .gitignore
├── .env.example                    # 환경변수 예시
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md    # PR 체크리스트 템플릿
│   └── workflows/
│       ├── ci.yml                  # PR 테스트/린트
│       └── release.yml             # Docker 빌드/푸시
├── scripts/
│   └── create-server.js            # 서버 생성 자동화 스크립트
│
├── packages/
│   └── common/                     # @moonklabs/mcp-common
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── vitest.config.ts
│       └── src/
│           ├── index.ts            # 명시적 re-export
│           ├── types/              # 공통 타입 정의
│           │   ├── index.ts
│           │   ├── mcp.ts          # McpResponse, McpErrorResponse
│           │   ├── notion.ts       # NotionPage, NotionBlock
│           │   └── cache.ts        # CacheOptions, CacheEntry
│           ├── config/             # 설정 중앙화
│           │   ├── index.ts
│           │   ├── environment.ts  # 환경변수 로딩 + 검증
│           │   └── defaults.ts     # 기본값 상수
│           ├── cache/
│           │   ├── index.ts
│           │   ├── cacheManager.ts
│           │   └── cacheManagerLogic.ts
│           ├── errors/
│           │   ├── index.ts
│           │   ├── createMcpError.ts
│           │   └── errorCodes.ts
│           ├── logger/
│           │   ├── index.ts
│           │   └── pinoLogger.ts
│           ├── metrics/
│           │   ├── index.ts
│           │   ├── metricsCollector.ts
│           │   └── metricsEndpoint.ts
│           ├── testing/
│           │   ├── index.ts
│           │   ├── mocks/
│           │   │   ├── notion.ts
│           │   │   └── slack.ts
│           │   ├── fixtures/
│           │   │   └── stories.ts
│           │   └── assertions.ts
│           └── __tests__/
│               ├── cacheManager.test.ts
│               ├── createMcpError.test.ts
│               └── pinoLogger.test.ts
│
├── mcp-context-loader/             # Phase 1 MVP
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── vitest.config.ts
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── stdio.ts                # stdio 진입점
│   │   ├── http.ts                 # HTTP 진입점
│   │   ├── tools/
│   │   │   ├── index.ts            # registerAllTools()
│   │   │   ├── loadContext.ts
│   │   │   ├── loadContextLogic.ts
│   │   │   ├── getStoryContext.ts
│   │   │   ├── getStoryContextLogic.ts
│   │   │   ├── countTokens.ts
│   │   │   ├── countTokensLogic.ts
│   │   │   └── __tests__/          # 단위 테스트
│   │   │       ├── loadContext.test.ts
│   │   │       ├── getStoryContext.test.ts
│   │   │       └── countTokens.test.ts
│   │   ├── resources/
│   │   │   └── index.ts
│   │   └── prompts/
│   │       └── index.ts
│   └── tests/                      # 통합 테스트
│       ├── integration/
│       │   └── mcp-protocol.test.ts
│       └── fixtures/
│           └── sample-contexts/
│
├── mcp-spec-reader/                # Phase 1 MVP
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── vitest.config.ts
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── stdio.ts
│   │   ├── http.ts
│   │   ├── tools/
│   │   │   ├── index.ts
│   │   │   ├── readSpec.ts
│   │   │   ├── readSpecLogic.ts
│   │   │   ├── listSpecs.ts
│   │   │   ├── listSpecsLogic.ts
│   │   │   ├── summarizeSpec.ts      # Phase 1.5
│   │   │   ├── summarizeSpecLogic.ts
│   │   │   └── __tests__/
│   │   │       ├── readSpec.test.ts
│   │   │       ├── listSpecs.test.ts
│   │   │       └── summarizeSpec.test.ts
│   │   ├── resources/
│   │   │   └── index.ts
│   │   └── prompts/
│   │       └── index.ts
│   └── tests/
│       ├── integration/
│       │   └── notion-api.test.ts
│       └── fixtures/
│           └── sample-specs/
│
├── mcp-slack-bugfix/               # Phase 2
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── vitest.config.ts
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── stdio.ts
│   │   ├── http.ts
│   │   ├── tools/
│   │   │   ├── index.ts
│   │   │   ├── watchErrors.ts
│   │   │   ├── watchErrorsLogic.ts
│   │   │   ├── analyzeError.ts
│   │   │   ├── analyzeErrorLogic.ts
│   │   │   ├── autoFix.ts
│   │   │   ├── autoFixLogic.ts
│   │   │   └── __tests__/
│   │   └── prompts/
│   │       └── index.ts
│   └── tests/
│       └── integration/
│
├── mcp-boilerplate/                # 템플릿 (기존 유지)
├── mcp-notion-task/                # 기존 서버 (유지)
└── docs/
    └── index.md
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Entry Points | Protocol |
|----------|-------------|----------|
| MCP stdio | `src/stdio.ts` | stdio transport |
| MCP HTTP | `src/http.ts` | Streamable HTTP |
| Health Check | `GET /health` | HTTP REST |
| Metrics | `GET /metrics` | HTTP REST |

**Component Communication:**

```
┌─────────────────────────────────────────────────────────┐
│                     MCP Clients                         │
│              (Claude Desktop, HTTP Clients)             │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ context-    │   │ spec-       │   │ slack-      │
│ loader      │   │ reader      │   │ bugfix      │
│ (MCP)       │   │ (MCP)       │   │ (MCP)       │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
              ┌─────────────────────┐
              │ @moonklabs/mcp-     │
              │ common              │
              │ ├── types           │
              │ ├── config          │
              │ ├── cache           │
              │ ├── errors          │
              │ ├── logger          │
              │ └── metrics         │
              └─────────────────────┘
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Notion API  │   │ Local Files │   │ Slack API   │
└─────────────┘   └─────────────┘   └─────────────┘
```

**Data Flow:**
```
Request → Tool → Cache Check → Logic → External API → Cache Store → Response
                     ↓                      ↓
                cached: true           cached: false
```

### Requirements to Structure Mapping

**mcp-context-loader:**

| Tool | Files |
|------|-------|
| `load-context` | `loadContext.ts`, `loadContextLogic.ts` |
| `get-story-context` | `getStoryContext.ts`, `getStoryContextLogic.ts` |
| `count-tokens` | `countTokens.ts`, `countTokensLogic.ts` |

**mcp-spec-reader:**

| Tool | Files |
|------|-------|
| `read-spec` | `readSpec.ts`, `readSpecLogic.ts` |
| `list-specs` | `listSpecs.ts`, `listSpecsLogic.ts` |
| `summarize-spec` | `summarizeSpec.ts`, `summarizeSpecLogic.ts` |

**packages/common:**

| Feature | Files |
|---------|-------|
| 타입 정의 | `types/mcp.ts`, `types/notion.ts`, `types/cache.ts` |
| 설정 관리 | `config/environment.ts`, `config/defaults.ts` |
| 캐싱 | `cache/cacheManager.ts`, `cache/cacheManagerLogic.ts` |
| 에러 | `errors/createMcpError.ts`, `errors/errorCodes.ts` |
| 로깅 | `logger/pinoLogger.ts` |
| 메트릭스 | `metrics/metricsCollector.ts` |
| 테스트 | `testing/mocks/notion.ts`, `testing/assertions.ts` |

### Integration Points

**Internal Communication:**
```typescript
// 서버 → common 의존 (명시적 import)
import { createMcpError, logger } from '@moonklabs/mcp-common';
import type { McpErrorResponse } from '@moonklabs/mcp-common';
```

**External Integrations:**

| Service | Client | Auth |
|---------|--------|------|
| Notion API | `@notionhq/client` | `NOTION_API_KEY` |
| Slack API | `@slack/web-api` | `SLACK_BOT_TOKEN` |
| GitHub API | `@octokit/rest` | `GITHUB_TOKEN` |

### File Organization Patterns

**Configuration Files:**

| File | Location | Purpose |
|------|----------|---------|
| Root tsconfig | `/tsconfig.json` | 공통 TS 설정 |
| Server tsconfig | `mcp-*/tsconfig.json` | 서버별 extends |
| Vitest workspace | `/vitest.workspace.ts` | 테스트 통합 |
| ESLint | `/.eslintrc.js` | 루트 통합 관리 |

**Test Organization:**
- 단위 테스트: `src/tools/__tests__/` (toolLogic 테스트)
- 통합 테스트: `tests/integration/` (MCP 프로토콜, API 테스트)
- 공통 fixtures: `packages/common/src/testing/fixtures/`
- 서버별 fixtures: `mcp-*/tests/fixtures/`

### Development Workflow Integration

**Development Commands:**
```bash
# 개별 서버 개발
npm run dev -w mcp-context-loader

# 전체 서버 동시 개발
npm run dev:all

# 새 서버 생성
npm run create:server -- mcp-new-server
```

**Build Process:**
```bash
# 의존성 순서 자동 처리
npm run build:all

# 개별 빌드
npm run build -w packages/common
npm run build -w mcp-context-loader
```

**Deployment Structure:**
```dockerfile
# 각 서버별 독립 Docker 이미지
mcp-context-loader:latest
mcp-spec-reader:latest
mcp-slack-bugfix:latest
```

### Key Infrastructure Files

**vitest.workspace.ts:**
```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'mcp-*/vitest.config.ts',
]);
```

**.github/PULL_REQUEST_TEMPLATE.md:**
```markdown
## PR Checklist
- [ ] 3계층 분리 (Logic 파일 분리됨)
- [ ] `createMcpError()` 헬퍼 사용
- [ ] 에러 응답에 suggestion 포함
- [ ] 테스트 커버리지 80%+ (toolLogic)
- [ ] 캐시 사용 시 cached 필드 포함
- [ ] 로깅 레벨 적절히 사용
- [ ] Import 경로 규칙 준수
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

| 결정 영역 | 호환성 | 비고 |
|----------|--------|------|
| TypeScript 5.7+ + MCP SDK 1.0+ | ✅ 호환 | Node.js 20+ 요구 충족 |
| node-cache + Redis (Phase 2) | ✅ 호환 | 동일 API 인터페이스로 마이그레이션 용이 |
| pino + Vitest + nock | ✅ 호환 | 충돌 없음 |
| npm workspaces + workspace:* | ✅ 호환 | 의존성 그래프 명확 |

**Pattern Consistency:**

| 패턴 | 일관성 | 비고 |
|------|--------|------|
| 3계층 분리 (index → tool → toolLogic) | ✅ 일관 | 모든 서버에 적용 |
| kebab-case 도구명 / camelCase 파일명 | ✅ 일관 | 명확한 규칙 문서화 |
| `createMcpError()` 헬퍼 필수 | ✅ 일관 | suggestion 필드 보장 |
| Import 경로 규칙 | ✅ 일관 | 패키지명 vs 상대경로 구분 |

**Structure Alignment:**

| 구조 요소 | 정렬 상태 | 비고 |
|----------|----------|------|
| packages/common 위치 | ✅ 정렬 | 공유 코드 중앙화 |
| 서버별 독립 Dockerfile | ✅ 정렬 | 독립 배포 지원 |
| 테스트 구조 (단위/통합 분리) | ✅ 정렬 | Party Mode 피드백 반영 |

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR | 도구 | 아키텍처 지원 | 위치 |
|----|------|-------------|------|
| FR-1: 컨텍스트 로딩 | `load-context` | ✅ | mcp-context-loader |
| FR-2: 스토리 컨텍스트 | `get-story-context` | ✅ | mcp-context-loader |
| FR-3: 토큰 카운트 | `count-tokens` | ✅ | mcp-context-loader |
| FR-4: 스펙 읽기 | `read-spec` | ✅ | mcp-spec-reader |
| FR-5: 스펙 목록 | `list-specs` | ✅ | mcp-spec-reader |
| FR-6: 스펙 요약 | `summarize-spec` | ✅ | mcp-spec-reader (Phase 1.5) |
| FR-7~10: Slack 버그픽스 | `watch-errors` 등 | ✅ | mcp-slack-bugfix (Phase 2) |
| FR-11: 피드백 수집 | 👍/👎 | ✅ | packages/common/metrics |
| FR-12: 메트릭스 | 호출 횟수, 성공률 | ✅ | packages/common/metrics |

**Non-Functional Requirements Coverage:**

| NFR | 요구사항 | 아키텍처 대응 | 상태 |
|-----|---------|-------------|------|
| 성능 | p95 < 500ms | 캐싱 레이어, 비동기 처리 | ✅ |
| 성능 | 동시 50 req/s | 무상태 설계, 수평 확장 | ✅ |
| 가용성 | 99%+ | 캐시 폴백, 헬스체크 | ✅ |
| 보안 | 환경변수 API 키 | config/environment.ts | ✅ |
| 보안 | 로그 민감정보 마스킹 | pino redact | ✅ |
| 유지보수 | 테스트 80%+ | Vitest + nock mocks | ✅ |
| 확장성 | 무상태 설계 | 서버별 독립 인스턴스 | ✅ |

### Implementation Readiness Validation ✅

**Decision Completeness:**

| 영역 | 완성도 | 비고 |
|------|--------|------|
| 기술 스택 버전 | ✅ 완료 | TypeScript 5.7+, Node 20+, MCP SDK 1.0+ |
| 캐싱 전략 | ✅ 완료 | node-cache → Redis 마이그레이션 경로 |
| 에러 응답 표준 | ✅ 완료 | 코드 카탈로그 + 헬퍼 함수 |
| 로깅 전략 | ✅ 완료 | pino + 레벨별 사용 기준 |
| 테스트 전략 | ✅ 완료 | nock mocks + 에러 시나리오 필수화 |

**Structure Completeness:**

| 영역 | 완성도 | 비고 |
|------|--------|------|
| 프로젝트 트리 | ✅ 완료 | 모든 파일/폴더 정의 |
| packages/common 구조 | ✅ 완료 | types, config, cache, errors, logger, metrics, testing |
| 서버별 구조 | ✅ 완료 | 3계층 + 통합 테스트 분리 |
| CI/CD 파일 | ✅ 완료 | .github/workflows + PR 템플릿 |

### Implementation Sequence (의존성 기반)

```
Phase 1.0: 기반 인프라
├── Step 1: packages/common 핵심
│   ├── 1.1 types/ (McpResponse, McpErrorResponse)
│   ├── 1.2 errors/ (createMcpError)
│   ├── 1.3 logger/ (pino 설정)
│   └── 1.4 config/ (환경변수 로딩)
├── Step 2: packages/common 확장
│   ├── 2.1 cache/ (node-cache 래퍼)
│   ├── 2.2 metrics/ (기본 수집기)
│   └── 2.3 testing/ (Notion mock fixtures)
└── Step 3: 루트 설정
    ├── 3.1 package.json workspaces
    ├── 3.2 vitest.workspace.ts
    └── 3.3 scripts/bootstrap.sh

Phase 1.1: mcp-context-loader
├── Step 4: 서버 생성
│   └── mcp-boilerplate 복사 + 설정
├── Step 5: 도구 구현 (순서대로)
│   ├── 5.1 count-tokens (의존성 없음)
│   ├── 5.2 load-context (파일 시스템)
│   └── 5.3 get-story-context (load-context 활용)
└── Step 6: 통합 테스트

Phase 1.2: mcp-spec-reader
├── Step 7: 서버 생성
├── Step 8: 도구 구현
│   ├── 8.1 list-specs (Notion API)
│   ├── 8.2 read-spec (Notion API + 캐싱)
│   └── 8.3 summarize-spec (Phase 1.5)
└── Step 9: 통합 테스트
```

### Implementation Checkpoints

| 체크포인트 | 완료 기준 | 검증 방법 |
|-----------|----------|----------|
| **CP1: Common Core** | types, errors, logger, config 완료 | `npm run test -w packages/common` 통과 |
| **CP2: Common Full** | cache, metrics, testing 완료 | 커버리지 80%+, `npm run build` 성공 |
| **CP3: Context Loader** | 3개 도구 구현, 테스트 통과 | MCP Inspector로 수동 테스트 |
| **CP4: Spec Reader** | 3개 도구 구현, Notion 연동 | 실제 Notion 페이지로 E2E 테스트 |

### Environment Variables Catalog

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `NODE_ENV` | No | development | 실행 환경 |
| `LOG_LEVEL` | No | info | 로그 레벨 |
| `NOTION_API_KEY` | Yes* | - | Notion API 토큰 |
| `NOTION_PAGE_IDS` | No | - | 접근 허용 페이지 (콤마 구분) |
| `CACHE_TTL_SECONDS` | No | 300 | 기본 캐시 TTL |
| `SLACK_BOT_TOKEN` | Yes** | - | Slack 봇 토큰 (Phase 2) |
| `GITHUB_TOKEN` | Yes** | - | GitHub API 토큰 (Phase 2) |

`*` mcp-spec-reader에서 필수
`**` mcp-slack-bugfix에서 필수 (Phase 2)

### Additional Infrastructure

**scripts/bootstrap.sh:**
```bash
#!/bin/bash
set -e

echo "🚀 Bootstrapping moonklabs-mcp-servers..."

# 의존성 설치
npm install

# common 패키지 먼저 빌드
echo "📦 Building packages/common..."
npm run build -w packages/common

# 타입 체크
echo "🔍 Type checking..."
npm run typecheck --if-present

echo "✅ Ready for development!"
echo ""
echo "Next steps:"
echo "  npm run dev -w mcp-context-loader"
echo "  npm run test -w packages/common"
```

**packages/common/src/config/environment.ts:**
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

export function loadEnvConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}
```

**Failure Recovery Pattern:**
```typescript
// 각 서버 시작 시 (stdio.ts, http.ts)
async function validateDependencies() {
  try {
    const common = await import('@moonklabs/mcp-common');
    if (!common.createMcpError || !common.logger) {
      throw new Error('Incomplete @moonklabs/mcp-common exports');
    }
  } catch (e) {
    console.error('❌ Critical: @moonklabs/mcp-common not available');
    console.error('   Run: npm run build -w packages/common');
    process.exit(1);
  }
}
```

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 프로젝트 컨텍스트 분석 완료
- [x] 규모 및 복잡성 평가 (Medium)
- [x] 기술 제약사항 식별
- [x] Cross-Cutting Concerns 매핑

**✅ Architectural Decisions**
- [x] Critical 결정 버전 포함 문서화
- [x] 기술 스택 완전 명세
- [x] 통합 패턴 정의
- [x] 성능 고려사항 처리

**✅ Implementation Patterns**
- [x] 네이밍 규칙 수립
- [x] 구조 패턴 정의
- [x] 에러 처리 패턴 문서화
- [x] 프로세스 패턴 문서화

**✅ Project Structure**
- [x] 완전한 디렉토리 구조 정의
- [x] 컴포넌트 경계 수립
- [x] 통합 포인트 매핑
- [x] 요구사항 → 구조 매핑 완료

**✅ Implementation Readiness**
- [x] 의존성 기반 구현 순서 정의
- [x] 구현 체크포인트 정의
- [x] 부트스트랩 스크립트 추가
- [x] 환경변수 카탈로그 문서화
- [x] 테스트 fixtures 표준화
- [x] CI 커버리지 임계값 설정
- [x] 장애 복구 패턴 정의

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** Very High (Party Mode 다관점 검증 완료)

**Key Strengths:**
1. 기존 mcp-boilerplate 패턴 확장으로 검증된 구조
2. 3계층 분리로 테스트 용이성 보장
3. packages/common으로 코드 재사용성 극대화
4. Party Mode를 통한 다관점 검토로 견고한 설계
5. PR Checklist로 패턴 준수 강제
6. 의존성 기반 구현 순서로 병렬 작업 최소화

**Areas for Future Enhancement:**
1. Phase 2에서 Redis 캐시 공유 도입
2. Prometheus/Grafana 메트릭스 대시보드
3. turborepo로 빌드 최적화
4. ESLint 커스텀 규칙으로 패턴 자동 검증

### Implementation Handoff

**AI Agent Guidelines:**
1. 모든 아키텍처 결정을 문서 그대로 따를 것
2. 3계층 분리 패턴 필수 적용
3. `createMcpError()` 헬퍼로 에러 응답 생성
4. PR Checklist 준수 확인
5. 테스트 커버리지 80%+ 유지
6. 구현 순서 (Phase 1.0 → 1.1 → 1.2) 준수

**First Implementation Command:**
```bash
# 1. 부트스트랩
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh

# 2. packages/common 개발 시작
npm run dev -w packages/common
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-26
**Document Location:** `_bmad-output/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- 모든 아키텍처 결정이 특정 버전과 함께 문서화됨
- AI 에이전트 일관성을 보장하는 구현 패턴
- 모든 파일 및 디렉토리를 포함한 완전한 프로젝트 구조
- 요구사항 → 아키텍처 매핑
- 일관성 및 완성도 검증 완료

**🏗️ Implementation Ready Foundation**
- 15+ 아키텍처 결정 완료
- 10+ 구현 패턴 정의
- 6개 아키텍처 컴포넌트 명세 (3 servers + common + cache + metrics)
- 18개 기능 요구사항 완전 지원

**📚 AI Agent Implementation Guide**
- 검증된 버전의 기술 스택
- 구현 충돌을 방지하는 일관성 규칙
- 명확한 경계를 가진 프로젝트 구조
- 통합 패턴 및 통신 표준

### Implementation Handoff

**For AI Agents:**
이 아키텍처 문서는 moonklabs-mcp-servers 구현을 위한 완전한 가이드입니다.
문서화된 모든 결정, 패턴, 구조를 정확히 따르세요.

**First Implementation Priority:**
```bash
# 1. 부트스트랩 스크립트 실행
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh

# 2. packages/common 개발 시작
npm run dev -w packages/common
```

**Development Sequence:**
1. 문서화된 스타터 템플릿을 사용하여 프로젝트 초기화
2. 아키텍처에 따른 개발 환경 설정
3. 핵심 아키텍처 기반 구현 (packages/common)
4. 수립된 패턴을 따라 기능 구축
5. 문서화된 규칙으로 일관성 유지

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] 모든 결정이 충돌 없이 함께 작동
- [x] 기술 선택이 호환됨
- [x] 패턴이 아키텍처 결정을 지원
- [x] 구조가 모든 선택과 정렬됨

**✅ Requirements Coverage**
- [x] 모든 기능 요구사항 지원됨
- [x] 모든 비기능 요구사항 처리됨
- [x] Cross-cutting concerns 처리됨
- [x] 통합 포인트 정의됨

**✅ Implementation Readiness**
- [x] 결정이 구체적이고 실행 가능
- [x] 패턴이 에이전트 충돌 방지
- [x] 구조가 완전하고 명확
- [x] 명확성을 위한 예제 제공됨

### Project Success Factors

**🎯 Clear Decision Framework**
모든 기술 선택이 명확한 근거와 함께 협력적으로 이루어졌으며, 모든 이해관계자가 아키텍처 방향을 이해할 수 있습니다.

**🔧 Consistency Guarantee**
구현 패턴과 규칙을 통해 여러 AI 에이전트가 원활하게 함께 작동하는 호환되고 일관된 코드를 생성합니다.

**📋 Complete Coverage**
모든 프로젝트 요구사항이 아키텍처적으로 지원되며, 비즈니스 요구에서 기술 구현으로의 명확한 매핑이 있습니다.

**🏗️ Solid Foundation**
선택된 스타터 템플릿과 아키텍처 패턴이 현재 모범 사례를 따르는 프로덕션 준비 기반을 제공합니다.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** 여기에 문서화된 아키텍처 결정과 패턴을 사용하여 구현을 시작하세요.

**Document Maintenance:** 구현 중 주요 기술 결정이 내려질 때 이 아키텍처를 업데이트하세요.

