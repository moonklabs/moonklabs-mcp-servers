#!/bin/bash
#
# moonklabs-mcp-servers 프로젝트 초기 설정 스크립트
#
# 사용법:
#   ./scripts/bootstrap.sh
#
# 수행 작업:
#   1. Node.js 버전 확인
#   2. 의존성 설치 (npm install)
#   3. packages/common 빌드
#   4. .env 파일 생성 (템플릿 복사)
#   5. Git hooks 설정 (있는 경우)
#

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${GREEN}moonklabs-mcp-servers 초기화 시작...${NC}"
echo ""

# 1. Node.js 버전 확인
echo -e "${YELLOW}[1/5] Node.js 버전 확인...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Node.js 20 이상이 필요합니다. 현재 버전: $(node -v)${NC}"
    exit 1
fi
echo -e "  Node.js $(node -v) 확인됨"

# 2. 의존성 설치
echo -e "${YELLOW}[2/5] 의존성 설치 중...${NC}"
npm install
echo -e "  ${GREEN}의존성 설치 완료${NC}"

# 3. packages/common 빌드
echo -e "${YELLOW}[3/5] packages/common 빌드 중...${NC}"
npm run build -w packages/common
echo -e "  ${GREEN}빌드 완료${NC}"

# 4. .env 파일 생성
echo -e "${YELLOW}[4/5] 환경 변수 파일 설정...${NC}"

ENV_CREATED=0
ENV_SKIPPED=0

# 각 MCP 서버의 .env.example 복사
for env_example in mcp-*/.env.example; do
    if [ -f "$env_example" ]; then
        dir=$(dirname "$env_example")
        env_file="$dir/.env"
        if [ ! -f "$env_file" ]; then
            cp "$env_example" "$env_file"
            echo -e "  ${GREEN}$env_file 생성됨${NC}"
            ENV_CREATED=$((ENV_CREATED + 1))
        else
            echo -e "  $env_file 이미 존재함 (건너뜀)"
            ENV_SKIPPED=$((ENV_SKIPPED + 1))
        fi
    fi
done

# 루트 .env.example이 있으면 복사
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "  ${GREEN}.env 생성됨${NC}"
    ENV_CREATED=$((ENV_CREATED + 1))
fi

if [ $ENV_CREATED -eq 0 ] && [ $ENV_SKIPPED -eq 0 ]; then
    echo -e "  ${YELLOW}⚠️ .env.example 파일이 없습니다${NC}"
fi

# 5. Git hooks 설정 (있는 경우)
echo -e "${YELLOW}[5/5] Git hooks 설정...${NC}"

if [ -d ".husky" ]; then
    # Husky가 설치되어 있는 경우
    npx husky install 2>/dev/null && echo -e "  ${GREEN}Husky hooks 설정됨${NC}" || echo -e "  ${YELLOW}Husky 설정 건너뜀${NC}"
elif [ -d ".githooks" ]; then
    # 커스텀 git hooks 디렉토리가 있는 경우
    git config core.hooksPath .githooks
    echo -e "  ${GREEN}Git hooks 경로 설정됨 (.githooks)${NC}"
else
    echo -e "  Git hooks 설정 없음 (건너뜀)"
fi

echo ""
echo -e "${GREEN}초기화 완료!${NC}"
echo ""
echo "다음 단계:"
echo "  1. 각 MCP 서버의 .env 파일을 편집하여 API 키를 설정하세요"
echo "  2. npm run dev -w mcp-<서버명> 으로 개발 서버를 시작하세요"
echo ""
