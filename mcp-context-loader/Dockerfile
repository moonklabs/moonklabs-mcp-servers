# mcp-context-loader Dockerfile
# 멀티스테이지 빌드로 최적화된 프로덕션 이미지 생성

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 (캐시 최적화)
COPY package*.json ./
COPY tsconfig.json ./

# 워크스페이스 의존성 복사 (packages/common)
COPY packages/common/package*.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/

# mcp-context-loader 의존성 복사
COPY mcp-context-loader/package*.json ./mcp-context-loader/
COPY mcp-context-loader/tsconfig.json ./mcp-context-loader/

# 의존성 설치
RUN npm ci --workspace=packages/common --workspace=mcp-context-loader

# 소스 코드 복사
COPY packages/common/src ./packages/common/src
COPY mcp-context-loader/src ./mcp-context-loader/src

# 빌드
RUN npm run build --workspace=packages/common
RUN npm run build --workspace=mcp-context-loader

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
COPY packages/common/package*.json ./packages/common/
COPY mcp-context-loader/package*.json ./mcp-context-loader/

RUN npm ci --omit=dev --workspace=packages/common --workspace=mcp-context-loader

# 빌드된 파일 복사
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/mcp-context-loader/dist ./mcp-context-loader/dist

# 환경변수 설정
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info

# 포트 노출
EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# 시작 명령 (HTTP 모드)
WORKDIR /app/mcp-context-loader
CMD ["node", "dist/http.js"]
