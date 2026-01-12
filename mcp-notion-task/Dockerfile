# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 모노레포 루트 의존성 복사 및 설치
COPY package*.json ./
COPY tsconfig.json ./
COPY packages ./packages
RUN npm install && npm cache clean --force

# mcp-notion-task 소스 복사
COPY mcp-notion-task/package.json ./mcp-notion-task/
COPY mcp-notion-task/tsconfig.json ./mcp-notion-task/
COPY mcp-notion-task/src ./mcp-notion-task/src

# 빌드
WORKDIR /app/mcp-notion-task
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# 모노레포 루트 의존성 복사 및 프로덕션 설치
COPY package*.json ./
COPY mcp-notion-task/package.json ./mcp-notion-task/
COPY packages ./packages
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# mcp-notion-task로 이동
WORKDIR /app/mcp-notion-task

# 빌드된 파일 복사
COPY --from=builder /app/mcp-notion-task/dist ./dist

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3434
ENV HOST=0.0.0.0

# 포트 노출
EXPOSE 3434

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3434/health || exit 1

# HTTP 서버 실행
CMD ["node", "dist/http.js"]
