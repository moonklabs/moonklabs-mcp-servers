# Story 2.1: mcp-context-loader 프로젝트 생성

Status: done

## Story

As a 개발자,
I want mcp-context-loader 서버의 기본 구조가 설정되어,
So that 컨텍스트 로딩 도구들을 구현할 준비가 됩니다.

## Acceptance Criteria

1. **Given** mcp-boilerplate가 복사됨
   **When** package.json과 설정 파일들을 수정함
   **Then** `npm run dev -w mcp-context-loader`로 서버 시작 가능

2. **And** @moonklabs/mcp-common 의존성이 연결됨
   - `import { createMcpError, logger } from '@moonklabs/mcp-common'` 동작 확인

3. **And** stdio/HTTP 양쪽 transport 지원
   - `npm run dev` → stdio transport
   - `npm run dev:http` → HTTP transport (포트 3001)

4. **And** 기본 greet/calculator 도구 삭제, 빈 registerAllTools 유지

5. **And** 환경변수 검증 동작
   - `.env` 파일 없이 시작 시 명확한 에러 메시지

## Tasks / Subtasks

- [x] Task 1: mcp-boilerplate 복사 및 기본 설정 (AC: #1)
  - [x] `cp -r mcp-boilerplate mcp-context-loader`
  - [x] package.json name을 `mcp-context-loader`로 변경
  - [x] package.json에 `@moonklabs/mcp-common` 의존성 추가 (`"@moonklabs/mcp-common": "*"`)
  - [x] tsconfig.json에서 paths 설정 확인
  - [x] 루트 package.json workspaces에 `mcp-context-loader` 추가 (wildcard `mcp-*`로 이미 포함됨)

- [x] Task 2: stdio.ts / http.ts 수정 (AC: #2, #3)
  - [x] SERVER_NAME을 `mcp-context-loader`로 변경
  - [x] `loadEnvConfig()` 호출 추가 (환경변수 조기 검증)
  - [x] `createLogger()` 호출 추가 (pino 로거 초기화)
  - [x] HTTP 서버 포트를 3001로 변경 (mcp-notion-task와 충돌 방지)

- [x] Task 3: 도구 정리 및 구조 설정 (AC: #4)
  - [x] src/tools/greet.ts 삭제
  - [x] src/tools/calculator.ts 삭제
  - [x] src/tools/greetLogic.ts 삭제
  - [x] src/tools/calculatorLogic.ts 삭제
  - [x] src/tools/index.ts에서 빈 registerAllTools 유지
  - [x] src/tools/__tests__/.gitkeep 생성
  - [x] 불필요한 보일러플레이트 삭제 (prompts/templates.ts, resources/files.ts)

- [x] Task 4: 환경변수 설정 (AC: #5)
  - [x] .env.example 생성 (필수 환경변수 문서화)
  - [x] src/config/index.ts 생성 (getConfig, getProjectRoot 래퍼)
  - [x] 환경변수 검증 단위 테스트 작성

- [x] Task 5: Docker 및 문서화
  - [x] Dockerfile 생성 (멀티스테이지 빌드)
  - [x] .dockerignore 생성
  - [x] README.md 작성 (도구 목록, 설치, 사용법)

- [x] Task 6: 빌드/테스트 검증
  - [x] `npm install` 성공 확인
  - [x] `npm run build -w mcp-context-loader` 성공 확인
  - [x] `npm run typecheck -w mcp-context-loader` 성공 확인
  - [x] vitest.config.ts 확인 및 `npm test -w mcp-context-loader` 동작 확인

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

// ✅ 같은 서버 내는 상대 경로
import { getConfig } from './config/index.js';

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
| mcp-spec-reader | 3002 (예정) |

### Project Structure Notes

```
mcp-context-loader/
├── src/
│   ├── stdio.ts              # stdio transport 진입점
│   ├── http.ts               # HTTP transport 진입점
│   ├── config/
│   │   ├── index.ts          # 환경변수 관리
│   │   └── __tests__/
│   │       └── config.test.ts
│   ├── tools/
│   │   ├── index.ts          # registerAllTools()
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

### References

- [Source: _bmad-output/project-context.md] - 전체 구현 규칙
- [Source: _bmad-output/epics.md#Story-2.1] - 원본 스토리 정의
- [Source: mcp-boilerplate/] - 복사할 보일러플레이트
- [Source: packages/common/] - 공통 모듈 (Epic 1 완료)

### Previous Epic Learnings (Epic 1)

1. **NodeNext 모듈 해결**: ESM 환경에서 `.js` 확장자 필수
2. **TDD 사이클**: 테스트 먼저 작성 후 구현
3. **nock 기반 테스트**: beforeEach에서 `nock.cleanAll()` 필수
4. **환경변수 검증**: Zod 스키마로 조기 검증

### .env.example 내용

```bash
# mcp-context-loader 환경변수

# 로그 레벨 (debug, info, warn, error)
LOG_LEVEL=info

# 프로젝트 루트 경로 (컨텍스트 파일 탐색용)
PROJECT_ROOT=.

# 캐시 TTL (초)
CACHE_TTL=300
```

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- TypeScript 빌드 시 메모리 부족 오류 발생 → NODE_OPTIONS="--max-old-space-size=4096" 사용
- prompts/templates.ts의 argsSchema 타입 추론 무한 루프 → 불필요한 보일러플레이트 삭제로 해결
- npm workspace:* 문법은 pnpm 전용 → "*"로 변경

### Completion Notes List

1. mcp-boilerplate 복사 후 package.json name 및 의존성 수정
2. stdio.ts/http.ts에 loadEnvConfig(), createLogger() 추가
3. 불필요한 보일러플레이트 도구/리소스/프롬프트 삭제
4. src/config/index.ts에 getConfig(), getProjectRoot() 구현
5. Dockerfile 멀티스테이지 빌드 설정
6. 빌드/타입체크/테스트 모두 통과

### File List

**생성/수정된 파일:**
- mcp-context-loader/package.json
- mcp-context-loader/src/stdio.ts
- mcp-context-loader/src/http.ts
- mcp-context-loader/src/config/index.ts
- mcp-context-loader/src/config/__tests__/config.test.ts
- mcp-context-loader/src/tools/index.ts
- mcp-context-loader/src/resources/index.ts
- mcp-context-loader/src/prompts/index.ts
- mcp-context-loader/.env.example
- mcp-context-loader/Dockerfile
- mcp-context-loader/.dockerignore
- mcp-context-loader/README.md

**생성된 .gitkeep 파일:**
- mcp-context-loader/src/tools/__tests__/.gitkeep
- mcp-context-loader/src/prompts/__tests__/.gitkeep
- mcp-context-loader/src/resources/__tests__/.gitkeep

**삭제된 파일:**
- mcp-context-loader/src/tools/greet.ts
- mcp-context-loader/src/tools/greetLogic.ts
- mcp-context-loader/src/tools/calculator.ts
- mcp-context-loader/src/tools/calculatorLogic.ts
- mcp-context-loader/src/tools/__tests__/greet.test.ts
- mcp-context-loader/src/tools/__tests__/calculator.test.ts
- mcp-context-loader/src/prompts/templates.ts
- mcp-context-loader/src/prompts/__tests__/templates.test.ts
- mcp-context-loader/src/prompts/promptLogic.ts
- mcp-context-loader/src/resources/files.ts
- mcp-context-loader/src/resources/__tests__/files.test.ts
- mcp-context-loader/src/resources/resourceLogic.ts

## Senior Developer Review (AI)

**Reviewer:** claude-opus-4-5-20251101
**Date:** 2025-12-27
**Outcome:** Approved (with fixes applied)

### Issues Found and Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | `promptLogic.ts` 삭제 누락 | 삭제 완료 |
| HIGH | `resourceLogic.ts` 삭제 누락 | 삭제 완료 |
| MEDIUM | dist 폴더 stale 파일 | clean rebuild 완료 |
| MEDIUM | __tests__ 폴더 .gitkeep 누락 | 추가 완료 |

### Verification

- [x] 빌드 성공: `npm run build`
- [x] 타입체크 통과: `npm run typecheck`
- [x] 테스트 통과: 4 tests passed
- [x] 모든 HIGH/MEDIUM 이슈 수정됨
