# 통합 테스트 시나리오

## 목적
세션 기반 기본 필터링 기능의 end-to-end 동작 검증

## 사전 준비

### 1. 환경 변수 설정
```bash
# .env 파일에 추가
AUTH_REQUIRED=false  # 미인증 테스트용
# 또는
AUTH_USERS=test-token:user1@moonklabs.com:테스터1,test-token2:user2@moonklabs.com:테스터2
AUTH_REQUIRED=true   # 인증 테스트용
```

### 2. 서버 시작
```bash
npm run build
npm run dev:http  # 또는 node dist/http.js
```

## 테스트 케이스

### TC1: 미인증 + 기본값 (useSessionUser=true) → 전체 조회

**예상 결과**: 세션이 없으므로 전체 작업 반환

```bash
SESSION=$(curl -si -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  | grep -i "^mcp-session-id:" | awk '{print $2}' | tr -d '\r\n')

echo "Session: $SESSION"

curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"notion-task-list",
      "arguments":{"pageSize":3}
    }
  }' | grep "^data:" | sed 's/^data: //' | jq -r '.result.content[0].text'
```

**검증**: "총 N개의 작업" 메시지와 다양한 담당자의 작업들이 보여야 함

---

### TC2: 미인증 + useSessionUser=false → 전체 조회

**예상 결과**: 명시적으로 false 지정, 전체 작업 반환

```bash
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"notion-task-list",
      "arguments":{"useSessionUser":false,"pageSize":3}
    }
  }' | grep "^data:" | sed 's/^data: //' | jq -r '.result.content[0].text'
```

**검증**: TC1과 동일한 결과

---

### TC3: 인증 + 기본값 (useSessionUser=true) → 세션 사용자 작업만

**사전 조건**: `AUTH_USERS` 설정 및 `AUTH_REQUIRED=true`

**예상 결과**: 세션 사용자(user1@moonklabs.com)의 작업만 반환

```bash
# 인증 세션 생성
AUTH_SESSION=$(curl -si -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer test-token" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  | grep -i "^mcp-session-id:" | awk '{print $2}' | tr -d '\r\n')

echo "Authenticated Session: $AUTH_SESSION"

# 기본 조회 (파라미터 없음)
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $AUTH_SESSION" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"notion-task-list",
      "arguments":{"pageSize":5}
    }
  }' | grep "^data:" | sed 's/^data: //' | jq -r '.result.content[0].text'
```

**검증**:
- 담당자가 모두 `user1@moonklabs.com`이어야 함
- 다른 사용자의 작업은 보이지 않아야 함

---

### TC4: 인증 + useSessionUser=false → 전체 조회

**예상 결과**: 명시적으로 false 지정, 전체 작업 반환

```bash
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $AUTH_SESSION" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"notion-task-list",
      "arguments":{"useSessionUser":false,"pageSize":5}
    }
  }' | grep "^data:" | sed 's/^data: //' | jq -r '.result.content[0].text'
```

**검증**: 다양한 담당자의 작업들이 보여야 함

---

### TC5: 인증 + assignee 지정 → 해당 사용자 작업만

**예상 결과**: assignee가 우선순위 최상위, 해당 사용자 작업만 반환

```bash
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $AUTH_SESSION" \
  -d '{
    "jsonrpc":"2.0",
    "id":4,
    "method":"tools/call",
    "params":{
      "name":"notion-task-list",
      "arguments":{"assignee":"user2@moonklabs.com","pageSize":5}
    }
  }' | grep "^data:" | sed 's/^data: //' | jq -r '.result.content[0].text'
```

**검증**:
- 담당자가 모두 `user2@moonklabs.com`이어야 함
- 세션 사용자(user1)와 다른 사용자의 작업이어야 함

---

## 테스트 매트릭스

| TC | 인증 | assignee | useSessionUser | 예상 결과 |
|----|------|----------|----------------|-----------|
| 1 | X | - | true (기본) | 전체 조회 |
| 2 | X | - | false | 전체 조회 |
| 3 | O | - | true (기본) | **세션 사용자만** |
| 4 | O | - | false | 전체 조회 |
| 5 | O | user2 | true (기본) | **user2만** |

## 성공 기준

- [ ] TC1: 전체 조회 확인
- [ ] TC2: 전체 조회 확인
- [ ] TC3: 세션 사용자만 조회 확인 ⭐ (핵심)
- [ ] TC4: 전체 조회 확인
- [ ] TC5: 지정된 사용자만 조회 확인 ⭐ (핵심)

## 추가 검증 항목

- [ ] 세션 ID가 올바르게 생성되는가?
- [ ] Authorization 헤더가 올바르게 파싱되는가?
- [ ] 이메일 → UUID 변환이 정상 동작하는가?
- [ ] 에러 메시지가 명확한가?
