# Story 3.1: mcp-spec-reader 프로젝트 생성

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 개발자,
I want mcp-spec-reader 서버의 기본 구조가 설정되어,
So that Notion 연동 도구들을 구현할 준비가 됩니다.

## Acceptance Criteria

1. **AC1**: mcp-boilerplate가 mcp-spec-reader로 복사됨
2. **AC2**: @notionhq/client 의존성이 설치됨
3. **AC3**: @moonklabs/mcp-common 의존성이 연결됨 (`import { createMcpError, logger } from '@moonklabs/mcp-common'` 동작 확인)
4. **AC4**: NOTION_API_KEY 환경변수 검증이 동작함 (없을 시 명확한 에러 메시지)
5. **AC5**: stdio/HTTP 양쪽 transport 지원 (`npm run dev` → stdio, `npm run dev:http` → HTTP 포트 3002)
6. **AC6**: 기본 greet/calculator 도구 삭제, 빈 registerAllTools 유지
7. **AC7**: Notion 클라이언트 초기화 로직 구현 (src/notion/client.ts)

## Tasks / Subtasks

- [x] Task 1: mcp-boilerplate 복사 및 기본 설정 (AC: #1, #3)
  - [x] 1.1 `cp -r mcp-boilerplate mcp-spec-reader`
  - [x] 1.2 package.json name을 `mcp-spec-reader`로 변경
  - [x] 1.3 package.json description 수정
  - [x] 1.4 package.json에 `@moonklabs/mcp-common` 의존성 추가 (`"@moonklabs/mcp-common": "*"`)
  - [x] 1.5 tsconfig.json에서 paths 설정 확인

- [x] Task 2: Notion 클라이언트 의존성 추가 (AC: #2)
  - [x] 2.1 package.json에 `@notionhq/client` 추가
  - [x] 2.2 `npm install` 실행

- [x] Task 3: stdio.ts / http.ts 수정 (AC: #3, #5)
  - [x] 3.1 SERVER_NAME을 `mcp-spec-reader`로 변경
  - [x] 3.2 `loadEnvConfig()` 호출 추가 (환경변수 조기 검증)
  - [x] 3.3 `createLogger()` 호출 추가 (pino 로거 초기화)
  - [x] 3.4 HTTP 서버 포트를 **3002**로 변경

- [x] Task 4: 도구 정리 및 구조 설정 (AC: #6)
  - [x] 4.1 src/tools/greet.ts 삭제
  - [x] 4.2 src/tools/calculator.ts 삭제
  - [x] 4.3 src/tools/greetLogic.ts 삭제
  - [x] 4.4 src/tools/calculatorLogic.ts 삭제
  - [x] 4.5 src/tools/index.ts에서 빈 registerAllTools 유지
  - [x] 4.6 src/tools/__tests__/.gitkeep 생성
  - [x] 4.7 불필요한 보일러플레이트 삭제 (prompts/templates.ts, resources/files.ts)

- [x] Task 5: 환경변수 설정 (AC: #4)
  - [x] 5.1 .env.example 생성 (NOTION_API_KEY, NOTION_PAGE_IDS, LOG_LEVEL, CACHE_TTL)
  - [x] 5.2 src/config/index.ts 생성 (getConfig, validateNotionApiKey 래퍼)
  - [x] 5.3 NOTION_API_KEY 필수 검증 로직 추가
  - [x] 5.4 환경변수 검증 단위 테스트 작성 (14개 테스트)

- [x] Task 6: Notion 클라이언트 초기화 (AC: #7)
  - [x] 6.1 src/notion/client.ts 생성
  - [x] 6.2 `getNotionClient()` 함수 구현 (싱글톤 패턴)
  - [x] 6.3 Notion 연결 테스트 헬퍼 함수 추가 (`testNotionConnection()`)
  - [x] 6.4 src/notion/__tests__/client.test.ts 작성 (nock 모킹, 9개 테스트)

- [x] Task 7: Docker 및 문서화
  - [x] 7.1 Dockerfile 생성 (멀티스테이지 빌드)
  - [x] 7.2 .dockerignore 생성
  - [x] 7.3 README.md 작성 (도구 목록, Notion 설정 가이드, 사용법)

- [x] Task 8: 빌드/테스트 검증
  - [x] 8.1 `npm install` 성공 확인
  - [x] 8.2 `npm run build -w mcp-spec-reader` 성공 확인
  - [x] 8.3 `npm run typecheck -w mcp-spec-reader` 성공 확인
  - [x] 8.4 vitest.config.ts 확인 및 `npm test -w mcp-spec-reader` 동작 확인 (23개 테스트 통과)

## Dev Notes

### Architecture Compliance

**3계층 분리 패턴 필수:**
```
src/tools/
├── index.ts          # registerAllTools()
├── toolName.ts       # MCP 도구 등록 + 응답 포맷팅
└── toolNameLogic.ts  # 순수 비즈니스 로직 (테스트 대상)
```

**서버 시작 순서 (project-context.md 참조):**
```typescript
async function main() {
  const config = loadEnvConfig(); // 1. 설정 로드 (조기 검증)
  const server = new McpServer(...); // 2. 서버 생성
  registerAllTools(server); // 3. 도구 등록
}
```

### Import 규칙

```typescript
// ✅ packages/common은 패키지명으로
import { createMcpError, logger, loadEnvConfig } from '@moonklabs/mcp-common';

// ✅ 같은 서버 내는 상대 경로 + .js 확장자
import { getConfig } from './config/index.js';
import { getNotionClient } from './notion/client.js';

// ❌ 절대 금지: 상대 경로로 common 접근
import { logger } from '../../packages/common';
```

### NodeNext 모듈 해결

모든 import에 `.js` 확장자 필수:
```typescript
import { registerAllTools } from './tools/index.js';
```

### 포트 할당

| 서버 | 포트 |
|------|------|
| mcp-notion-task | 3000 |
| mcp-context-loader | 3001 |
| **mcp-spec-reader** | **3002** |
| mcp-slack-bugfix | 3003 (예정) |

### Notion 클라이언트 초기화 패턴

```typescript
// src/notion/client.ts
import { Client } from '@notionhq/client';

let notionClient: Client | null = null;

export function getNotionClient(): Client {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error('NOTION_API_KEY 환경변수가 설정되지 않았습니다');
    }
    notionClient = new Client({ auth: apiKey });
  }
  return notionClient;
}

// 테스트용 리셋 함수
export function resetNotionClient(): void {
  notionClient = null;
}
```

### 에러 응답 패턴 (createMcpError)

모든 에러 응답에 suggestion 필드 필수:
```typescript
import { createMcpError } from '@moonklabs/mcp-common';

// 예시: 환경변수 누락 에러
createMcpError({
  errorCode: 'NOTION_API_KEY_MISSING',
  message: 'NOTION_API_KEY 환경변수가 설정되지 않았습니다',
  suggestion: 'Notion Integration Token을 생성하고 .env 파일에 NOTION_API_KEY를 설정하세요',
  details: { requiredEnvVars: ['NOTION_API_KEY'] }
});
```

### nock 기반 Notion API 모킹

```typescript
// src/notion/__tests__/client.test.ts
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import nock from 'nock';
import { getNotionClient, resetNotionClient } from '../client.js';

describe('Notion Client', () => {
  beforeEach(() => {
    nock.cleanAll();
    resetNotionClient();
    process.env.NOTION_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    nock.cleanAll();
    delete process.env.NOTION_API_KEY;
  });

  it('should create client with API key', () => {
    const client = getNotionClient();
    expect(client).toBeDefined();
  });

  it('should throw error without API key', () => {
    delete process.env.NOTION_API_KEY;
    expect(() => getNotionClient()).toThrow('NOTION_API_KEY');
  });
});
```

### Project Structure Notes

```
mcp-spec-reader/
├── src/
│   ├── stdio.ts              # stdio transport 진입점
│   ├── http.ts               # HTTP transport 진입점
│   ├── config/
│   │   ├── index.ts          # 환경변수 관리
│   │   └── __tests__/
│   │       └── config.test.ts
│   ├── notion/               # 신규: Notion 클라이언트
│   │   ├── client.ts         # getNotionClient() 싱글톤
│   │   └── __tests__/
│   │       └── client.test.ts
│   ├── tools/
│   │   ├── index.ts          # registerAllTools() - 빈 상태
│   │   └── __tests__/
│   │       └── .gitkeep
│   ├── resources/
│   │   └── index.ts
│   └── prompts/
│       └── index.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── Dockerfile
├── .dockerignore
├── .env.example
└── README.md
```

### .env.example 내용

```bash
# mcp-spec-reader 환경변수

# Notion API 키 (필수)
# https://www.notion.so/my-integrations에서 생성
NOTION_API_KEY=secret_xxx

# 접근 허용할 Notion 페이지 ID (콤마 구분, 선택)
NOTION_PAGE_IDS=page_id_1,page_id_2

# 로그 레벨 (debug, info, warn, error)
LOG_LEVEL=info

# 캐시 TTL (초)
CACHE_TTL=300
```

### 이전 스토리 학습 사항 (Epic 1 + Epic 2)

**Story 2.1에서 배운 것:**
- TypeScript 빌드 시 메모리 부족 가능 → NODE_OPTIONS="--max-old-space-size=4096" 사용
- prompts/templates.ts의 argsSchema 타입 추론 무한 루프 → 불필요한 보일러플레이트 삭제
- npm workspace:* 문법은 pnpm 전용 → "*"로 변경
- __tests__ 폴더에 .gitkeep 추가 필수

**Epic 1 Retrospective에서 배운 것:**
- NodeNext 모듈 해결: ESM 환경에서 `.js` 확장자 필수
- TDD 사이클: 테스트 먼저 작성 후 구현
- nock 기반 테스트: beforeEach에서 `nock.cleanAll()` 필수
- 환경변수 검증: Zod 스키마로 조기 검증
- 메모리 효율성: 배열 대신 집계값 사용

### 의존성 버전 참조 (mcp-context-loader 기준)

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@moonklabs/mcp-common": "*",
    "@notionhq/client": "^2.2.0",
    "express": "^4.21.0",
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@vitest/ui": "^2.0.0",
    "nock": "^13.5.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

### References

- [Source: _bmad-output/epics.md#Story-3.1] - 원본 스토리 정의
- [Source: _bmad-output/architecture.md] - 아키텍처 제약사항
- [Source: _bmad-output/implementation-artifacts/stories/story-2.1.md] - 유사 스토리 참조
- [Source: _bmad-output/implementation-artifacts/epic-1-retrospective.md] - Epic 1 학습 사항
- [Source: mcp-boilerplate/] - 복사할 보일러플레이트
- [Source: packages/common/] - 공통 모듈 (Epic 1 완료)
- [Source: @notionhq/client documentation] - Notion API 클라이언트

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript 타입 에러 2개 해결:
  - `SpecReaderConfig extends EnvConfig` → `extends Omit<EnvConfig, "NOTION_PAGE_IDS">` (NOTION_PAGE_IDS 타입 불일치 해결)
  - `testNotionConnection` 반환값 `response.name` → `response.name ?? undefined` (null → undefined 변환)

### Completion Notes List

1. mcp-boilerplate를 mcp-spec-reader로 복사하고 package.json 설정 완료
2. @notionhq/client 및 nock 의존성 추가
3. stdio.ts, http.ts에 SERVER_NAME, loadEnvConfig(), createLogger() 적용, 포트 3002 설정
4. 불필요한 보일러플레이트 도구(greet, calculator, files, templates) 삭제
5. 환경변수 설정: .env.example, config/index.ts (getConfig, validateNotionApiKey, isValidNotionApiKeyFormat)
6. Notion 클라이언트 싱글톤: notion/client.ts (getNotionClient, resetNotionClient, testNotionConnection)
7. Docker 멀티스테이지 빌드 및 README.md 문서화
8. 테스트 23개 모두 통과 (config 14개 + notion/client 9개)

### Senior Developer Review (AI)

**Review Date:** 2025-12-31
**Reviewer:** Claude Opus 4.5

**Issues Found & Fixed:**
1. ✅ [HIGH] dist/ 폴더에 구 boilerplate 빌드 파일 존재 → `rm -rf dist/` 후 재빌드로 해결
2. ✅ [HIGH] .gitignore 파일 누락 → .gitignore 파일 생성
3. ✅ [MEDIUM] http.ts의 unused variable (lastEventId) → 주석 처리 및 향후 사용 설명 추가

**Verified:**
- 타입체크 통과
- 빌드 성공
- 테스트 23개 모두 통과
- dist/ 폴더 깨끗함 (index.js만 존재)

### File List

**생성된 파일:**
- mcp-spec-reader/package.json
- mcp-spec-reader/tsconfig.json
- mcp-spec-reader/vitest.config.ts
- mcp-spec-reader/.env.example
- mcp-spec-reader/.gitignore (코드 리뷰에서 추가)
- mcp-spec-reader/Dockerfile
- mcp-spec-reader/.dockerignore
- mcp-spec-reader/README.md
- mcp-spec-reader/src/stdio.ts
- mcp-spec-reader/src/http.ts
- mcp-spec-reader/src/config/index.ts
- mcp-spec-reader/src/config/__tests__/config.test.ts
- mcp-spec-reader/src/notion/client.ts
- mcp-spec-reader/src/notion/__tests__/client.test.ts
- mcp-spec-reader/src/tools/index.ts
- mcp-spec-reader/src/tools/__tests__/.gitkeep
- mcp-spec-reader/src/resources/index.ts
- mcp-spec-reader/src/resources/__tests__/.gitkeep
- mcp-spec-reader/src/prompts/index.ts
- mcp-spec-reader/src/prompts/__tests__/.gitkeep

