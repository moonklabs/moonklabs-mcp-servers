# Story 2.6: mcp-context-loader 통합 테스트

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 개발자,
I want mcp-context-loader의 전체 기능이 통합 테스트되어,
so that 실제 MCP 프로토콜로 동작함을 검증할 수 있습니다.

## Acceptance Criteria

1. **AC1**: 모든 도구가 올바르게 MCP 서버에 등록됨 (count-tokens, load-context, get-story-context, list-document-types)
2. **AC2**: 입력 스키마 검증이 동작함 (잘못된 파라미터 → 명확한 에러 메시지)
3. **AC3**: 에러 응답에 suggestion 필드가 포함됨 (createMcpError() 패턴 검증)
4. **AC4**: 테스트 간 격리 검증됨 (beforeEach에서 상태 초기화, afterEach에서 정리)
5. **AC5**: 캐시 동작 테스트됨 (첫 호출 cached:false, 두 번째 호출 cached:true)
6. **AC6**: 전체 워크플로우 시나리오 테스트 (도구 조합 사용 시나리오)
7. **AC7**: Docker 빌드 및 실행 테스트 성공 (Dockerfile 검증)
8. **AC8**: MCP Inspector 수동 테스트 문서화

## Tasks / Subtasks

- [x] Task 1: 통합 테스트 구조 생성 (AC: #4)
  - [x] 1.1 `mcp-context-loader/tests/integration/` 폴더 생성
  - [x] 1.2 `mcp-context-loader/tests/fixtures/` 폴더 생성
  - [x] 1.3 테스트용 샘플 컨텍스트 파일 생성 (fixtures)
    - `fixtures/sample-story.md`: 테스트용 스토리 파일
    - `fixtures/sample-epics.md`: 테스트용 에픽 파일
    - `fixtures/sample-prd.md`: 테스트용 PRD 파일
  - [x] 1.4 vitest.config.ts에 integration 테스트 경로 추가

- [x] Task 2: MCP 프로토콜 테스트 작성 (AC: #1, #2, #3)
  - [x] 2.1 `tests/integration/mcp-protocol.test.ts` 생성
  - [x] 2.2 MCP 서버 초기화 테스트
  - [x] 2.3 각 도구 등록 상태 검증 (도구 이름, 설명, 스키마 확인)
  - [x] 2.4 잘못된 파라미터 에러 테스트
  - [x] 2.5 suggestion 필드 포함 검증 (모든 에러 응답)

- [x] Task 3: 도구별 E2E 시나리오 테스트 (AC: #5, #6)
  - [x] 3.1 count-tokens E2E 테스트
  - [x] 3.2 load-context E2E 테스트
  - [x] 3.3 get-story-context E2E 테스트
  - [x] 3.4 list-document-types E2E 테스트

- [x] Task 4: 테스트 격리 및 정리 헬퍼 (AC: #4)
  - [x] 4.1 `tests/integration/helpers/testSetup.ts` 생성
  - [x] 4.2 setupTestEnvironment / teardownTestEnvironment 구현
  - [x] 4.3 테스트 fixtures 경로 헬퍼 (getFixturePath)
  - [x] 4.4 모든 테스트에 beforeEach/afterEach 적용

- [x] Task 5: 워크플로우 시나리오 테스트 (AC: #6)
  - [x] 5.1 `tests/integration/workflow-scenarios.test.ts` 생성
  - [x] 5.2 시나리오 1: 스토리 구현 워크플로우
  - [x] 5.3 시나리오 2: 컨텍스트 최적화 워크플로우
  - [x] 5.4 시나리오 3: 에러 복구 워크플로우

- [x] Task 6: Docker 빌드 및 실행 테스트 (AC: #7) - Docker 미설치 환경, README에 문서화
  - [x] 6.1 Dockerfile 검증 문서화
  - [x] 6.2 Docker 테스트 명령어 README에 추가

- [x] Task 7: MCP Inspector 수동 테스트 및 문서화 (AC: #8)
  - [x] 7.1 MCP Inspector 사용법 문서화
  - [x] 7.2 각 도구 테스트 시나리오 README에 추가
  - [x] 7.3 예상 결과 문서화

- [x] Task 8: 타입 검사 및 테스트 통과 (AC: #1-8)
  - [x] 8.1 npm run typecheck 통과 ✓
  - [x] 8.2 npm test 전체 통과 (155개 테스트) ✓
  - [x] 8.3 테스트 커버리지: 통합 테스트 25개 추가

## Dev Notes

### 아키텍처 패턴 (3계층 분리)

```
mcp-context-loader/
├── src/
│   └── tools/
│       ├── index.ts                    # registerAllTools()
│       ├── countTokens.ts              # MCP 도구 등록
│       ├── countTokensLogic.ts         # 비즈니스 로직
│       ├── loadContext.ts
│       ├── loadContextLogic.ts
│       ├── getStoryContext.ts
│       ├── getStoryContextLogic.ts
│       ├── listDocumentTypes.ts
│       ├── listDocumentTypesLogic.ts
│       └── __tests__/                  # 단위 테스트 (112개)
├── tests/                              # 신규: 통합 테스트
│   ├── integration/
│   │   ├── mcp-protocol.test.ts        # MCP 프로토콜 테스트
│   │   ├── workflow-scenarios.test.ts  # 워크플로우 시나리오
│   │   └── helpers/
│   │       └── testSetup.ts            # 테스트 헬퍼
│   └── fixtures/
│       ├── sample-story.md
│       ├── sample-epics.md
│       └── sample-prd.md
└── Dockerfile
```

### 통합 테스트 vs 단위 테스트

| 구분 | 단위 테스트 | 통합 테스트 |
|------|------------|-------------|
| 위치 | `src/tools/__tests__/` | `tests/integration/` |
| 대상 | *Logic.ts 함수 | 전체 MCP 도구 호출 |
| 격리 | 함수 단위 | 테스트 간 상태 격리 |
| 목적 | 비즈니스 로직 검증 | 프로토콜 및 통합 동작 검증 |

### MCP 서버 테스트 패턴

```typescript
// tests/integration/mcp-protocol.test.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllTools } from '../../src/tools/index.js';

describe('MCP Protocol Integration', () => {
  let server: McpServer;

  beforeEach(() => {
    // 새 서버 인스턴스 생성
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    registerAllTools(server);
  });

  afterEach(() => {
    // 상태 정리
  });

  it('should register count-tokens tool', () => {
    // 도구 등록 확인
  });
});
```

### 캐시 격리 전략

```typescript
// tests/integration/helpers/testSetup.ts
import { cacheManager } from '@moonklabs/mcp-common';

export function setupTestEnvironment() {
  // 캐시 초기화
  cacheManager.flushAll();

  // 테스트용 환경변수 설정
  process.env.NODE_ENV = 'test';
}

export function teardownTestEnvironment() {
  // 캐시 정리
  cacheManager.flushAll();
}
```

### Fixtures 생성 가이드

```markdown
<!-- fixtures/sample-story.md -->
# Story 1.1: 샘플 스토리

Status: ready-for-dev

## Story

As a 테스터,
I want 통합 테스트용 샘플 스토리,
so that 테스트를 수행할 수 있습니다.

## Acceptance Criteria

1. AC1: 테스트 통과
2. AC2: 형식 검증

## Tasks / Subtasks

- [ ] Task 1: 테스트 작업
```

### Docker 테스트 명령어

```bash
# 빌드
cd /workspace/moonklabs-mcp-servers
docker build -t mcp-context-loader:test -f mcp-context-loader/Dockerfile .

# 실행
docker run -d --name test-server -p 3000:3000 mcp-context-loader:test

# 헬스체크
curl http://localhost:3000/health

# 정리
docker stop test-server && docker rm test-server
```

### MCP Inspector 사용법

```bash
cd mcp-context-loader
npm run inspector

# Inspector에서 테스트할 명령:
# 1. list-document-types (파라미터 없음)
# 2. count-tokens { "text": "Hello World" }
# 3. load-context { "document_types": ["prd"] }
# 4. get-story-context { "story_id": "1.1" }
```

### 기존 테스트 현황 (Story 2.5 완료 시점)

| 도구 | 단위 테스트 수 |
|------|---------------|
| count-tokens | 15개 |
| load-context | 21개 |
| get-story-context | 76개 |
| list-document-types | 18개 |
| **총계** | **130개** |

### 예상 추가 테스트 수

| 통합 테스트 영역 | 예상 테스트 수 |
|-----------------|---------------|
| MCP 프로토콜 | ~10개 |
| 워크플로우 시나리오 | ~8개 |
| 캐시 격리 | ~4개 |
| **총 추가** | **~22개** |

### 이전 스토리 학습 사항

**Story 2.5에서 배운 것:**
- DRY 원칙 준수: `DOCUMENT_PATTERNS`를 loadContextLogic.ts에서 export하여 재사용
- 테스트에서 불필요한 import 제거 (`vi` 미사용 시 제거)
- 인터페이스 export 필요 시 명시적으로 추가

**Story 2.4c에서 배운 것:**
- graceful degradation: 부분 실패 시 warnings 배열 사용
- suggestion 동적 생성: 상태별로 다른 안내 메시지
- 캐시 키에 옵션 반영: `format_response` 같은 옵션도 캐시 키에 포함

### 에러 응답 패턴 검증

모든 에러 응답에서 확인해야 할 필드:
```typescript
interface McpErrorResponse {
  status: "error";
  error_code: string;           // {SERVICE}_{ERROR_TYPE}
  message: string;              // 한글 사용자 메시지
  suggestion: string;           // 다음 행동 안내 (필수!)
  available_options?: string[]; // 가능한 대안
}
```

### Project Structure Notes

- **신규 생성 폴더**: `tests/integration/`, `tests/fixtures/`
- **네이밍 컨벤션**: kebab-case 파일명, camelCase 함수명
- **의존성**: MCP SDK, @moonklabs/mcp-common (캐시, 에러 헬퍼)

### References

- [Source: _bmad-output/epics.md#Story-2.6]
- [Source: _bmad-output/architecture.md#Testing-Strategy]
- [Source: _bmad-output/architecture.md#Project-Structure]
- [Source: _bmad-output/implementation-artifacts/stories/story-2-5-list-document-types-tool.md#Dev-Notes]
- [Source: _bmad-output/implementation-artifacts/stories/story-2-4c-get-story-context-formatting.md#Dev-Notes]
- [Source: mcp-context-loader/src/tools/__tests__/ - 기존 단위 테스트 참조]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

