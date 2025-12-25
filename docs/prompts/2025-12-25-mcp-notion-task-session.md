# mcp-notion-task 구현 세션 프롬프트

> 2025-12-25 세션에서 사용된 프롬프트 모음

## 1. 기능 구현

### MCP 서버 구현 시작
```
/feature-dev:feature-dev 현재플랜 /home/node/.claude/plans/dynamic-squishing-adleman.md 구현
```

### 구현 옵션 선택 (질문에 대한 답변)
```
# Notion API 토큰 준비 여부
예, 이미 있음

# 데이터베이스 스키마
플랜 기준으로 구현

# 마크다운 변환 라이브러리
@tryfabric/martian 사용

# 아키텍처 선택
최소 변경 (추천)
```

---

## 2. 문서화

### 프로젝트 초기화 (CLAUDE.md 생성)
```
/init
```

### 커밋 및 푸시
```
commit push
```

### README 추가
```
readme 추가
```

### 루트 README 추가
```
root 프로젝트의 readme 를 추가
```

### README 개선 요청
```
이 readme 는 사용자에게 사용가능한 mcp 서버를 소개하는 것 위주로 하고, 신규 제작은 boilerplate 를 링크로 참고하도록 개선해줘
```

---

## 3. Docker 설정

### Docker 구성 요청
```
notion mcp 를 실행할 docker 를 확인하고 만들어줘
```

### 계획 작성 스킬 호출
```
/superpowers:write-plan
```

### 계획 실행 스킬 호출
```
/superpowers:execute-plan
```

### 진행 확인
```
go
```

---

## 4. 프롬프트 정리

### 프롬프트 모음 요청
```
지금까지 내가 보낸 프롬프트를 정리해서 prompts 폴더에 넣어줘
```

---

## 세션 요약

| 단계 | 작업 | 주요 프롬프트 |
|------|------|---------------|
| 1 | MCP 서버 구현 | `/feature-dev:feature-dev` |
| 2 | 문서화 | `/init`, `readme 추가` |
| 3 | Docker 설정 | `/superpowers:write-plan`, `/superpowers:execute-plan` |

## 참고

- 계획 파일: `docs/plans/2025-12-25-mcp-notion-task-docker.md`
- 프로젝트: `mcp-notion-task/`
