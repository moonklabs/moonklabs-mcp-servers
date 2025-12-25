# mcp-notion-task Docker 설정 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** mcp-notion-task를 Docker 컨테이너로 실행할 수 있도록 Dockerfile, .dockerignore, docker-compose.yml 생성

**Architecture:** 멀티스테이지 빌드로 이미지 크기 최소화. 빌드 스테이지에서 TypeScript 컴파일, 프로덕션 스테이지에서 런타임만 포함. HTTP 서버 모드로 실행.

**Tech Stack:** Node.js 20 Alpine, Docker, docker-compose

---

## Task 1: .dockerignore 생성

**Files:**
- Create: `mcp-notion-task/.dockerignore`

**Step 1: .dockerignore 파일 생성**

```
node_modules
dist
.env
.env.*
*.log
.git
.gitignore
*.md
!README.md
.vscode
.idea
coverage
.nyc_output
```

**Step 2: 파일 생성 확인**

Run: `cat mcp-notion-task/.dockerignore`
Expected: 위 내용 출력

**Step 3: 커밋**

```bash
git add mcp-notion-task/.dockerignore
git commit -m "chore(mcp-notion-task): .dockerignore 추가"
```

---

## Task 2: Dockerfile 생성

**Files:**
- Create: `mcp-notion-task/Dockerfile`

**Step 1: Dockerfile 생성**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# HTTP 서버 실행
CMD ["node", "dist/http.js"]
```

**Step 2: Dockerfile 문법 확인**

Run: `docker build --check mcp-notion-task/ 2>&1 || echo "check 옵션 미지원 - 빌드 테스트로 확인"`
Expected: 문법 오류 없음

**Step 3: 커밋**

```bash
git add mcp-notion-task/Dockerfile
git commit -m "feat(mcp-notion-task): Dockerfile 추가 (멀티스테이지 빌드)"
```

---

## Task 3: docker-compose.yml 생성

**Files:**
- Create: `mcp-notion-task/docker-compose.yml`

**Step 1: docker-compose.yml 생성**

```yaml
services:
  mcp-notion-task:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
      - NOTION_API_TOKEN=${NOTION_API_TOKEN}
      - TASK_DATABASE_ID=${TASK_DATABASE_ID}
      - SPRINT_DATABASE_ID=${SPRINT_DATABASE_ID}
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

**Step 2: docker-compose 문법 확인**

Run: `cd mcp-notion-task && docker compose config --quiet 2>&1 || echo "config 확인 완료"`
Expected: 오류 없음

**Step 3: 커밋**

```bash
git add mcp-notion-task/docker-compose.yml
git commit -m "feat(mcp-notion-task): docker-compose.yml 추가"
```

---

## Task 4: Docker 빌드 및 실행 테스트

**Files:**
- 없음 (검증 단계)

**Step 1: Docker 이미지 빌드**

Run: `cd mcp-notion-task && docker build -t mcp-notion-task:test .`
Expected: "Successfully built" 또는 "Successfully tagged mcp-notion-task:test"

**Step 2: 이미지 크기 확인**

Run: `docker images mcp-notion-task:test --format "{{.Size}}"`
Expected: 200MB 이하 (Alpine + node_modules)

**Step 3: 컨테이너 실행 테스트 (환경변수 없이 - 실패 예상)**

Run: `docker run --rm mcp-notion-task:test 2>&1 | head -5`
Expected: 환경변수 누락 오류 메시지 (정상 동작 - 조기 검증 작동 확인)

**Step 4: 테스트 이미지 정리**

Run: `docker rmi mcp-notion-task:test`
Expected: "Untagged: mcp-notion-task:test"

---

## Task 5: README 업데이트

**Files:**
- Modify: `mcp-notion-task/README.md` (Docker 섹션)

**Step 1: README에 Docker 사용법 추가/업데이트**

README.md의 "HTTP 서버 배포" 섹션을 다음으로 교체:

```markdown
### Docker 배포

```bash
# 이미지 빌드
docker build -t mcp-notion-task .

# 컨테이너 실행
docker run -d -p 3000:3000 \
  -e NOTION_API_TOKEN=secret_xxx \
  -e TASK_DATABASE_ID=xxx \
  -e SPRINT_DATABASE_ID=xxx \
  --name mcp-notion-task \
  mcp-notion-task

# 또는 docker-compose 사용
docker compose up -d

# 헬스체크
curl http://localhost:3000/health

# 로그 확인
docker logs mcp-notion-task
```
```

**Step 2: 커밋**

```bash
git add mcp-notion-task/README.md
git commit -m "docs(mcp-notion-task): Docker 배포 가이드 업데이트"
```

---

## Task 6: 최종 커밋 및 푸시

**Step 1: 변경사항 확인**

Run: `git status`
Expected: clean 또는 커밋된 상태

**Step 2: 푸시**

Run: `git push`
Expected: 성공

---

## 사용 방법 요약

```bash
# 빌드
cd mcp-notion-task
docker build -t mcp-notion-task .

# 실행 (환경변수 직접 전달)
docker run -p 3000:3000 \
  -e NOTION_API_TOKEN=secret_xxx \
  -e TASK_DATABASE_ID=xxx \
  -e SPRINT_DATABASE_ID=xxx \
  mcp-notion-task

# 실행 (docker-compose + .env 파일)
docker compose up -d

# 헬스체크
curl http://localhost:3000/health
```
