# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Moonklabs MCP 서버 모음** - 빠른 개발 생산성을 위한 MCP (Model Context Protocol) 서버 모노레포입니다.

### 핵심 원칙
- **boilerplate 기반 개발**: `mcp-boilerplate`를 복사하여 새 MCP 서버를 빠르게 생성
- **HTTP 서버 형태 제공**: 원격 접근을 위해 MCP를 HTTP 서버로 배포
- **Docker 배포**: 컨테이너화된 배포 방식 사용

### 새 MCP 서버 생성
```bash
cp -r mcp-boilerplate mcp-새서버이름
cd mcp-새서버이름
# package.json의 name 필드 수정
# 도구/리소스/프롬프트 구현
```

## 개발 명령어

### mcp-boilerplate

```bash
cd mcp-boilerplate

# 의존성 설치
npm install

# 개발 모드
npm run dev              # stdio 서버 (Claude Desktop 연동용)
npm run dev:http         # HTTP 서버 (watch 모드)

# 테스트
npm test                 # vitest 실행
npm run test:ui          # vitest UI 모드
npm run test:coverage    # 커버리지 리포트

# 단일 테스트 실행
npx vitest run src/tools/__tests__/calculator.test.ts

# 빌드 및 타입 검사
npm run build            # TypeScript 빌드
npm run typecheck        # 타입 검사만

# MCP Inspector로 테스트
npm run inspector
```

## 아키텍처

### MCP 서버 구조 (mcp-boilerplate)

```
src/
├── stdio.ts              # stdio transport 진입점 (Claude Desktop용)
├── http.ts               # HTTP transport 진입점 (원격 배포용)
├── tools/                # MCP 도구 (AI가 실행 가능한 함수)
│   ├── index.ts          # registerAllTools() - 도구 등록 헬퍼
│   ├── greet.ts          # 도구 등록 로직
│   ├── greetLogic.ts     # 순수 비즈니스 로직 (테스트 대상)
│   └── __tests__/        # 테스트 파일
├── resources/            # MCP 리소스 (AI가 읽을 수 있는 데이터)
│   ├── index.ts          # registerAllResources()
│   ├── files.ts          # 리소스 등록 로직
│   └── resourceLogic.ts  # 순수 비즈니스 로직
└── prompts/              # MCP 프롬프트 템플릿
    ├── index.ts          # registerAllPrompts()
    ├── templates.ts      # 프롬프트 등록 로직
    └── promptLogic.ts    # 순수 비즈니스 로직
```

### 핵심 패턴

1. **비즈니스 로직 분리**: `*Logic.ts` 파일에 순수 함수로 분리하여 테스트 용이성 확보
2. **등록 헬퍼 패턴**: 각 모듈의 `index.ts`에서 `registerAll*()` 함수로 서버에 등록
3. **Transport 분리**: stdio (로컬)와 HTTP (원격) 두 가지 transport 지원

### MCP SDK 사용법

도구 등록 시 Zod 스키마 사용:
```typescript
server.registerTool("tool-name", {
  description: "설명",
  inputSchema: z.object({ param: z.string() }),
}, async ({ param }) => ({
  content: [{ type: "text", text: result }],
}));
```

프롬프트 등록 시 `argsSchema` 사용 (주의: `arguments`가 아님):
```typescript
server.registerPrompt("prompt-name", {
  description: "설명",
  argsSchema: z.object({ param: z.string() }),
}, async ({ param }) => ({
  messages: [{ role: "user", content: { type: "text", text: result } }],
}));
```

## 테스트 구조

- Vitest 사용
- `__tests__` 폴더 패턴 (각 모듈 내 `__tests__/` 폴더)
- 비즈니스 로직 (`*Logic.ts`) 중심 테스트

## HTTP 서버 엔드포인트

- `POST /mcp` - MCP 요청 처리
- `GET /mcp` - SSE 스트림 연결
- `DELETE /mcp` - 세션 종료
- `GET /health` - 헬스 체크
