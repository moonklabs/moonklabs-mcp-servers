---
project_name: 'moonklabs-mcp-servers'
user_name: 'moonklabs'
date: '2025-12-26'
sections_completed: ['technology_stack', 'implementation_rules', 'testing_rules', 'logging_rules', 'caching_rules', 'critical_rules']
existing_patterns_found: 15
status: complete
---

# Project Context for AI Agents

_moonklabs-mcp-servers 프로젝트 구현 시 AI 에이전트가 반드시 따라야 할 핵심 규칙과 패턴_

---

## Technology Stack & Versions

| Category | Technology | Version | Note |
|----------|------------|---------|------|
| Language | TypeScript | 5.7+ | strict mode 필수 |
| Runtime | Node.js | 20+ | ES2022 target |
| Build | tsc | - | NodeNext module |
| MCP SDK | @modelcontextprotocol/sdk | 1.0+ | - |
| Validation | Zod | 3.25+ | 스키마 검증 |
| HTTP | Express | 4.21+ | HTTP transport |
| Test | Vitest | 2.0+ | globals: true |
| Logging | pino | 9+ | JSON 로깅 |
| Cache | node-cache | - | Phase 1 |
| Mocking | nock | - | HTTP mock |

---

## Critical Implementation Rules

### MCP 서버 패턴 (필수)

**3계층 분리:**
```
index.ts       → registerAllTools() 호출만
tool.ts        → MCP 도구 등록 + 응답 포맷팅
toolLogic.ts   → 순수 비즈니스 로직 (테스트 대상)
```

**도구 등록:**
```typescript
server.registerTool("tool-name", {
  description: "설명",
  inputSchema: z.object({ param: z.string() }),
}, async ({ param }) => ({
  content: [{ type: "text", text: result }],
}));
```

### 에러 처리 (필수)

**createMcpError() 헬퍼 사용 필수:**
```typescript
import { createMcpError } from '@moonklabs/mcp-common';

return createMcpError(
  'STORY_NOT_FOUND',           // {SERVICE}_{ERROR_TYPE}
  'Story-999를 찾을 수 없습니다',  // 한글 메시지
  'list-specs로 목록을 확인하세요', // suggestion 필수!
  { available_options: [...] }  // 선택적
);
```

### 환경변수 접근 (필수)

```typescript
// ✅ loadEnvConfig() 사용 필수
import { loadEnvConfig } from '@moonklabs/mcp-common';
const config = loadEnvConfig();

// ❌ 직접 process.env 접근 금지 (검증 누락 위험)
```

### 비동기 처리 규칙

```typescript
// ✅ try-catch로 에러 처리
try {
  const result = await notionClient.pages.retrieve({ page_id });
} catch (error) {
  return createMcpError(...);
}

// ❌ .catch() 체이닝 금지 (일관성)
```

### 네이밍 규칙

| 대상 | 형식 | 예시 |
|------|------|------|
| MCP 도구 이름 | kebab-case | `get-story-context` |
| 파일 이름 | camelCase.ts | `getStoryContext.ts` |
| Logic 파일 | camelCaseLogic.ts | `getStoryContextLogic.ts` |
| 함수/변수 | camelCase | `buildStoryContext` |
| 상수 | UPPER_SNAKE | `DEFAULT_TTL` |

### Import 규칙

```typescript
// ✅ packages/common은 패키지명으로
import { createMcpError, logger } from '@moonklabs/mcp-common';

// ✅ 같은 서버 내는 상대 경로
import { buildStoryContext } from './getStoryContextLogic';

// ❌ 절대 금지: 상대 경로로 common 접근
import { logger } from '../../packages/common';
```

### 의존성 방향 규칙

```
packages/common ← mcp-context-loader
                ← mcp-spec-reader
                ← mcp-slack-bugfix

⚠️ common은 절대로 mcp-* 패키지를 import 금지
⚠️ mcp-* 서버 간 상호 import 금지
```

### 타입 정의 위치

- 공통 타입: `@moonklabs/mcp-common` 에서 import
- 서버 특화 타입: 해당 서버의 `src/types/` 폴더

### 서버 시작 순서

```typescript
async function main() {
  await validateDependencies(); // 1. 의존성 체크
  const config = loadEnvConfig(); // 2. 설정 로드
  const server = new McpServer(...); // 3. 서버 생성
  registerAllTools(server); // 4. 도구 등록
}
```

---

## Testing Rules

**구조:**
- 단위 테스트: `src/tools/__tests__/toolName.test.ts`
- 통합 테스트: `tests/integration/`
- 커버리지 목표: 80%+ (toolLogic)

**테스트 네이밍:**
```typescript
describe('getStoryContextLogic', () => {
  describe('buildStoryContext', () => {
    it('should return context with token_count', ...);
    it('should throw STORY_NOT_FOUND when invalid id', ...);
  });
});
```

**테스트 격리 (필수):**
```typescript
beforeEach(() => {
  nock.cleanAll();
  cache.clear(); // 캐시도 초기화
});

afterEach(() => {
  nock.restore();
});
```

**에러 테스트 필수:**
```typescript
it('returns STORY_NOT_FOUND with available_options', async () => {
  const result = await getStoryContext({ story_id: 'invalid' });
  expect(result.error_code).toBe('STORY_NOT_FOUND');
  expect(result.suggestion).toBeDefined(); // suggestion 검증!
});
```

**테스트 데이터 규칙:**
- 하드코딩된 테스트 데이터 금지
- `@moonklabs/mcp-common/testing/fixtures` 사용
- 각 테스트는 자체 fixture 사용 (공유 상태 금지)

---

## Logging Rules

**pino 사용 (민감정보 마스킹 필수):**
```typescript
const logger = pino({
  redact: {
    paths: ['notion_token', 'api_key', '*.token'],
    censor: '[REDACTED]'
  }
});
```

**레벨별 사용:**
| Level | 사용 상황 |
|-------|----------|
| debug | 개발 중 상세 정보 |
| info | 도구 호출/완료 |
| warn | 캐시 미스, 재시도 |
| error | 실패/예외 |

---

## Caching Rules

**캐시 키 형식:**
```
{server}:{resource}:{id}:{hash}
예: spec-reader:notion:page123:abc123
```

**캐싱 순서:**
1. 캐시 키 생성
2. 캐시 확인 (있으면 `cached: true`)
3. 로직 실행
4. 캐시 저장
5. `cached: false`로 반환

---

## Documentation Rules

**코드 주석:**
```typescript
// ✅ 복잡한 로직에 한글 주석
// Notion API rate limit 대응: 캐시 우선 확인 후 API 호출
const cached = await cache.get(key);

// ❌ 자명한 코드에 주석 금지
```

**JSDoc 사용 (public 함수):**
```typescript
/**
 * 스토리 관련 컨텍스트를 구성합니다.
 * @param storyId - 스토리 식별자 (예: "Story-42")
 * @returns 토큰 수가 포함된 컨텍스트
 * @throws STORY_NOT_FOUND - 스토리가 존재하지 않을 때
 */
export async function buildStoryContext(storyId: string): Promise<StoryContext>
```

---

## Critical Don't-Miss Rules

### ❌ 절대 금지

1. **로직을 도구 등록에 섞지 말 것** - toolLogic.ts로 분리
2. **수동 에러 생성 금지** - createMcpError() 필수
3. **suggestion 누락 금지** - 모든 에러에 필수
4. **상대 경로로 common 접근 금지** - 패키지명 사용
5. **민감정보 로깅 금지** - redact 설정 필수
6. **직접 process.env 접근 금지** - loadEnvConfig() 사용
7. **.catch() 체이닝 금지** - try-catch 사용
8. **common에서 mcp-* import 금지** - 의존성 방향 준수
9. **서버 간 상호 import 금지** - 독립성 유지
10. **테스트 상태 공유 금지** - beforeEach에서 초기화

### ⚠️ 주의사항

1. **MCP 응답 필드는 snake_case** (token_count, cached)
2. **내부 코드는 camelCase** (TypeScript 관례)
3. **캐시 사용 시 cached 필드 응답에 포함**
4. **Rate Limit 에러 시 retry_after 포함**

---

## PR Checklist

```markdown
- [ ] 3계층 분리 (Logic 파일 분리됨)
- [ ] createMcpError() 헬퍼 사용
- [ ] 에러 응답에 suggestion 포함
- [ ] 테스트 커버리지 80%+ (toolLogic)
- [ ] 캐시 사용 시 cached 필드 포함
- [ ] 로깅 레벨 적절히 사용
- [ ] Import 경로 규칙 준수
- [ ] 환경변수는 loadEnvConfig() 사용
- [ ] 테스트 격리 (beforeEach 초기화)
```

---

**Last Updated:** 2025-12-26
**Source:** `_bmad-output/architecture.md`
