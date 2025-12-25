# Moonklabs MCP Servers - 문서 인덱스

> AI 개발 어시스턴트를 위한 프로젝트 레퍼런스

## 프로젝트 개요

| 속성 | 값 |
|------|-----|
| **타입** | Monorepo (2 parts) |
| **주 언어** | TypeScript |
| **런타임** | Node.js 20+ |
| **아키텍처** | 3계층 패턴 (index → tool → toolLogic) |

## Quick Reference

### mcp-boilerplate

- **타입:** MCP 서버 보일러플레이트
- **용도:** 새 MCP 서버 생성 시 템플릿
- **경로:** `/mcp-boilerplate`

### mcp-notion-task

- **타입:** Notion MCP 서버
- **용도:** MKL작업 데이터베이스 CRUD
- **경로:** `/mcp-notion-task`
- **도구:** 9개 (get, list, mySprint, create, update, updateStatus, addLog, getContent, archive)

---

## 생성된 문서

### 핵심 문서

- [프로젝트 개요](./project-overview.md) - 전체 프로젝트 요약
- [소스 트리 분석](./source-tree-analysis.md) - 디렉토리 구조 및 핵심 파일
- [개발 가이드](./development-guide.md) - 빠른 시작, 스크립트, 아키텍처 패턴

### Part별 문서

- [mcp-boilerplate README](../mcp-boilerplate/README.md)
- [mcp-notion-task README](../mcp-notion-task/README.md)
- [mcp-notion-task CLAUDE.md](../mcp-notion-task/CLAUDE.md)

### 기타 문서

- [plans/](./plans/) - 구현 계획서
- [prompts/](./prompts/) - 세션 프롬프트

---

## 기존 문서

| 문서 | 설명 |
|------|------|
| [README.md](../README.md) | 사용자용 루트 README |
| [CLAUDE.md](../CLAUDE.md) | Claude Code 전역 설정 |

---

## 시작하기

### 기존 서버 실행

```bash
cd mcp-notion-task
npm install
cp .env.example .env   # 환경변수 설정
npm run dev            # stdio 모드
```

### 새 서버 생성

```bash
cp -r mcp-boilerplate mcp-새서버이름
cd mcp-새서버이름
# package.json의 name 필드 수정
npm install && npm run dev
```

---

*Generated: 2025-12-25 | Mode: initial_scan | Scan Level: Quick*
