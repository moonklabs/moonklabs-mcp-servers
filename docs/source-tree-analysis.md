# 소스 트리 분석

## 전체 구조

```
moonklabs-mcp-servers/
├── README.md                      # 사용자용 README (MCP 서버 목록)
├── CLAUDE.md                      # Claude Code 설정
├── docs/                          # 프로젝트 문서
│   ├── index.md                   # 문서 인덱스
│   ├── project-overview.md        # 프로젝트 개요
│   ├── source-tree-analysis.md    # 이 파일
│   ├── development-guide.md       # 개발 가이드
│   ├── plans/                     # 구현 계획서
│   └── prompts/                   # 세션 프롬프트
├── mcp-boilerplate/               # [Part] MCP 서버 보일러플레이트
└── mcp-notion-task/               # [Part] Notion MCP 서버
```

## Part: mcp-boilerplate

MCP 서버 개발을 위한 **템플릿 프로젝트**입니다.

```
mcp-boilerplate/
├── package.json                   # 패키지 설정 (name: mcp-boilerplate)
├── tsconfig.json                  # TypeScript 설정
├── vitest.config.ts               # Vitest 테스트 설정
├── src/
│   ├── stdio.ts                   # ★ stdio transport 진입점 (Claude Desktop용)
│   ├── http.ts                    # ★ HTTP transport 진입점 (원격 배포용)
│   ├── tools/                     # MCP 도구 정의
│   │   ├── index.ts               # registerAllTools() - 도구 등록 헬퍼
│   │   ├── greet.ts               # 인사 도구 예제
│   │   ├── greetLogic.ts          # 인사 비즈니스 로직
│   │   ├── calculator.ts          # 계산기 도구 예제
│   │   ├── calculatorLogic.ts     # 계산기 비즈니스 로직
│   │   └── __tests__/             # 도구 테스트
│   ├── resources/                 # MCP 리소스 정의
│   │   ├── index.ts               # registerAllResources()
│   │   ├── files.ts               # 파일 리소스 예제
│   │   ├── resourceLogic.ts       # 리소스 비즈니스 로직
│   │   └── __tests__/
│   └── prompts/                   # MCP 프롬프트 템플릿
│       ├── index.ts               # registerAllPrompts()
│       ├── templates.ts           # 프롬프트 템플릿 예제
│       ├── promptLogic.ts         # 프롬프트 비즈니스 로직
│       └── __tests__/
└── dist/                          # 빌드 출력 (gitignore)
```

### 핵심 패턴

- **3계층 구조:** `index.ts` (등록) → `tool.ts` (스키마) → `toolLogic.ts` (순수 로직)
- **Transport 분리:** stdio (로컬), HTTP (원격)

## Part: mcp-notion-task

Notion MKL작업 데이터베이스 CRUD를 위한 **프로덕션 MCP 서버**입니다.

```
mcp-notion-task/
├── package.json                   # 패키지 설정 (name: mcp-notion-task)
├── tsconfig.json                  # TypeScript 설정
├── vitest.config.ts               # Vitest 테스트 설정
├── .env.example                   # 환경변수 예제
├── Dockerfile                     # Docker 빌드 (멀티스테이지)
├── docker-compose.yml             # Docker Compose 설정
├── CLAUDE.md                      # Claude Code 프로젝트 설정
├── README.md                      # 프로젝트 README
├── src/
│   ├── stdio.ts                   # ★ stdio transport 진입점
│   ├── http.ts                    # ★ HTTP transport 진입점
│   ├── config/
│   │   └── index.ts               # 환경변수 관리 (조기 검증)
│   ├── notion/
│   │   ├── client.ts              # Notion 클라이언트 싱글톤
│   │   └── types.ts               # Task, TaskStatus 타입 정의
│   ├── tools/
│   │   ├── index.ts               # registerAllTools() - 9개 도구 등록
│   │   └── task/                  # 작업 관련 도구들
│   │       ├── get.ts / getLogic.ts           # 작업 상세 조회
│   │       ├── list.ts / listLogic.ts         # 작업 목록 조회
│   │       ├── mySprint.ts / mySprintLogic.ts # 내 스프린트 작업
│   │       ├── create.ts / createLogic.ts     # 작업 생성
│   │       ├── update.ts / updateLogic.ts     # 작업 수정
│   │       ├── updateStatus.ts / updateStatusLogic.ts # 상태 변경
│   │       ├── addLog.ts / addLogLogic.ts     # 진행 로그 추가
│   │       ├── getContent.ts / getContentLogic.ts # 페이지 내용 조회
│   │       └── archive.ts / archiveLogic.ts   # 작업 보관
│   ├── utils/
│   │   ├── propertyBuilder.ts     # Notion 속성 빌더
│   │   ├── propertyParser.ts      # Notion 응답 → Task 파싱
│   │   ├── responseFormatter.ts   # Task → 마크다운 포맷팅
│   │   ├── markdownToBlocks.ts    # 마크다운 ↔ Notion 블록 변환
│   │   └── __tests__/             # 유틸리티 테스트
│   ├── resources/                 # (boilerplate에서 복사, 현재 미사용)
│   └── prompts/                   # (boilerplate에서 복사, 현재 미사용)
└── dist/                          # 빌드 출력
```

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `config/index.ts` | 환경변수 로드 및 조기 검증 |
| `notion/client.ts` | Notion API 클라이언트 싱글톤 |
| `tools/index.ts` | 9개 MCP 도구 등록 |
| `utils/markdownToBlocks.ts` | @tryfabric/martian 래퍼 |

---

*Generated: 2025-12-25 | Scan Level: Quick*
