# Moonklabs MCP Servers - 프로젝트 개요

## 요약

**Moonklabs MCP Servers**는 Model Context Protocol (MCP) 서버 모노레포입니다. AI 어시스턴트(Claude 등)가 외부 도구와 데이터에 접근할 수 있도록 하는 MCP 서버들을 제공합니다.

## 저장소 구조

| 속성 | 값 |
|------|-----|
| **타입** | Monorepo |
| **Parts** | 2개 (mcp-boilerplate, mcp-notion-task) |
| **주 언어** | TypeScript |
| **런타임** | Node.js 20+ |
| **아키텍처** | 3계층 패턴 (index → tool → toolLogic) |

## 기술 스택 요약

| 카테고리 | 기술 |
|----------|------|
| Language | TypeScript 5.7+ |
| Runtime | Node.js 20+ |
| Framework | Express 4.21 |
| MCP SDK | @modelcontextprotocol/sdk 1.0 |
| Validation | Zod 3.25 |
| Testing | Vitest 2.0 |

## Parts 개요

### mcp-boilerplate

새 MCP 서버를 빠르게 시작하기 위한 **보일러플레이트 템플릿**입니다.

- **용도:** 새 MCP 서버 생성 시 복사하여 사용
- **포함:** 도구(greet, calculator), 리소스, 프롬프트 예제
- **Transport:** stdio (Claude Desktop), HTTP (원격)

### mcp-notion-task

Notion **MKL작업 데이터베이스**를 관리하는 MCP 서버입니다.

- **용도:** Notion 작업 CRUD
- **도구:** 9개 (get, list, mySprint, create, update, updateStatus, addLog, getContent, archive)
- **외부 연동:** Notion API, @tryfabric/martian (마크다운 변환)
- **Transport:** stdio, HTTP

## 관련 문서

- [소스 트리 분석](./source-tree-analysis.md)
- [개발 가이드](./development-guide.md)
- [mcp-boilerplate README](../mcp-boilerplate/README.md)
- [mcp-notion-task README](../mcp-notion-task/README.md)

## 시작하기

```bash
# 기존 서버 실행
cd mcp-notion-task
npm install
npm run dev          # stdio 모드
npm run dev:http     # HTTP 모드 (포트 3000)

# 새 서버 생성
cp -r mcp-boilerplate mcp-새서버이름
cd mcp-새서버이름
# package.json 수정 후 개발 시작
```

---

*Generated: 2025-12-25 | Scan Level: Quick*
