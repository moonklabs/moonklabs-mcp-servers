# Moonklabs MCP Servers

Moonklabs 팀을 위한 MCP (Model Context Protocol) 서버 모음입니다.

## 사용 가능한 서버

### mcp-notion-task

Notion MKL작업 데이터베이스 관리를 위한 MCP 서버입니다.

| 도구 | 설명 |
|------|------|
| `get-task` | 작업 상세 조회 |
| `list-tasks` | 작업 목록 조회 (상태, 담당자, 스프린트 필터) |
| `get-my-sprint-tasks` | 내 스프린트 작업 조회 |
| `get-task-content` | 작업 페이지 본문 조회 |
| `create-task` | 새 작업 생성 |
| `update-task` | 작업 수정 |
| `update-task-status` | 작업 상태 변경 |
| `add-task-log` | 진행 로그 추가 |
| `archive-task` | 작업 보관 |

**설정 방법:** [mcp-notion-task README](./mcp-notion-task/README.md) 참고

---

## 사용 방법

### Claude Desktop 연동

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "notion-task": {
      "command": "node",
      "args": ["/path/to/mcp-notion-task/dist/stdio.js"],
      "env": {
        "NOTION_API_TOKEN": "secret_xxx",
        "TASK_DATABASE_ID": "xxx",
        "SPRINT_DATABASE_ID": "xxx"
      }
    }
  }
}
```

### HTTP 서버 접속

각 서버는 HTTP 모드로 실행하여 원격 접속이 가능합니다.

```bash
cd mcp-notion-task
npm run start:http  # http://localhost:3000
```

| 엔드포인트 | 설명 |
|------------|------|
| `POST /mcp` | MCP 요청 처리 |
| `GET /mcp` | SSE 스트림 연결 |
| `GET /health` | 헬스 체크 |

---

## 개발자 가이드

새 MCP 서버를 만들려면 [mcp-boilerplate](./mcp-boilerplate/README.md)를 참고하세요.

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - 서버 테스트 도구

## 라이선스

MIT
