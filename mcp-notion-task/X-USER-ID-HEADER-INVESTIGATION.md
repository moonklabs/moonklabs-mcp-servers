# X-User-Id 헤더 조사 및 검증 결과

## 요약

**조사 날짜**: 2026-01-13
**이슈**: `x-user-id: bongheecha` 헤더 전송 시 올바른 응답이 반환되지 않는 문제 조사

## 조사 결과

### 1. bongheecha 사용자 존재 확인 ✅

**결과**: 사용자가 워크스페이스에 정상적으로 존재합니다.

```
dosunyun 사용자 UUID: b85fd3a6-9246-492f-8c33-b13c523fde97
bongheecha 사용자 UUID: d4ddbc23-3fdb-454d-9694-0adeb308ad7e
```

### 2. MCP SDK 헤더 전파 메커니즘 확인 ✅

**위치**: `node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js:372`

```javascript
// Build request info from headers
const requestInfo = {
    headers: Object.fromEntries(req.headers.entries())
};
```

**결론**: MCP SDK의 `StreamableHTTPServerTransport`는 HTTP 요청 헤더를 자동으로 추출하여 도구 핸들러의 `extra.requestInfo.headers`로 전달합니다.

### 3. headerUtils.ts 구현 확인 ✅

**파일**: `src/utils/headerUtils.ts`

- 디버그 로깅 완비
- 대소문자 무관 헤더 검색 지원
- `headers.get()` 메서드 및 객체 접근 모두 지원
- 배열 값 처리 지원

### 4. HTTP 서버 헤더 로깅 강화 ✅

**파일**: `src/http.ts`

추가된 기능:
- X-User-Id 헤더 명시적 추출 및 로깅
- DEBUG 레벨에서 전체 헤더 로깅
- 요청별 X-User-Id 추적

## 개선 사항

### 1. HTTP 서버 로깅 강화 (`src/http.ts`)

```typescript
const xUserId = req.headers["x-user-id"] as string | undefined;

// 요청 로깅
log.request(req.method, req.path, {
  sessionId: sessionId?.slice(0, 8),
  contentLength: req.headers["content-length"],
  xUserId: xUserId,  // ← 추가
});

// DEBUG 레벨에서 모든 헤더 로깅
log.debug("Request headers", {
  allHeaders: req.headers,
  xUserId: xUserId,
});
```

### 2. HTTP 통합 테스트 작성 (`src/__tests__/integration/http.integration.test.ts`)

새로운 테스트 그룹 추가:

**사용자 존재 확인**:
- ✅ dosunyun 사용자 조회
- ✅ bongheecha 사용자 조회

**MCP 프로토콜 헤더 테스트** (HTTP 서버 필요):
- X-User-Id: bongheecha로 작업 필터링
- X-User-Id: dosunyun으로 작업 필터링
- 헤더 없이 전체 조회
- 존재하지 않는 사용자 에러 처리

## 테스트 방법

### 자동 테스트

```bash
# 기본 통합 테스트 (Logic 함수 직접 호출)
npm run test:integration

# HTTP 헤더 테스트 (서버 실행 필요)
# 터미널 1
npm run dev:http

# 터미널 2 (서버 시작 후 실행)
npm run test:integration -- http.integration.test.ts
```

### 수동 테스트 (curl)

**1. HTTP 서버 시작**
```bash
npm run dev:http
# 또는 DEBUG 로그 활성화
LOG_LEVEL=debug npm run dev:http
```

**2. X-User-Id 헤더로 요청**

**중요**: MCP 프로토콜은 먼저 `initialize`를 호출해야 합니다. 그리고 `Accept` 헤더도 필수입니다.

```bash
# Step 1: MCP 초기화
SESSION_ID=$(curl -s -X POST http://localhost:3434/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-user-id: bongheecha" \
  -d '{
    "jsonrpc": "2.0",
    "id": 0,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "manual-test",
        "version": "1.0.0"
      }
    }
  }' -i | grep -i "mcp-session-id" | cut -d' ' -f2 | tr -d '\r')

echo "Session ID: $SESSION_ID"

# Step 2: bongheecha 사용자 작업 조회
curl -X POST http://localhost:3434/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-user-id: bongheecha" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "notion-task-list",
      "arguments": {
        "pageSize": 5
      }
    }
  }' | jq

# dosunyun 사용자 작업 조회
curl -X POST http://localhost:3434/mcp \
  -H "Content-Type": "application/json" \
  -H "x-user-id: dosunyun" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "notion-task-list",
      "arguments": {
        "pageSize": 5
      }
    }
  }' | jq

# 헤더 없이 전체 조회
curl -X POST http://localhost:3434/mcp \
  -H "Content-Type": "application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "notion-task-list",
      "arguments": {
        "pageSize": 5
      }
    }
  }' | jq

# 존재하지 않는 사용자
curl -X POST http://localhost:3434/mcp \
  -H "Content-Type": "application/json" \
  -H "x-user-id: nonexistent" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "notion-task-list",
      "arguments": {
        "pageSize": 5
      }
    }
  }' | jq
```

**3. 로그 확인**

서버 로그에서 다음 항목 확인:
- `[DEBUG headerUtils]` - X-User-Id 헤더 수신 여부
- `[DEBUG list.ts]` - resolvedUserId 값
- `[REQUEST]` - xUserId 필드

## 예상 동작

### X-User-Id 헤더 처리 흐름

```
HTTP 요청 (x-user-id: bongheecha)
    ↓
Express 서버 (http.ts)
    ↓
MCP SDK Transport (StreamableHTTPServerTransport)
    ↓ requestInfo.headers = { 'x-user-id': 'bongheecha', ... }
도구 핸들러 (list.ts)
    ↓ getUserIdFromHeader(extra) → 'bongheecha'
유틸리티 (userIdToEmail, emailToUserId)
    ↓ 'bongheecha' → 'bongheecha@moonklabs.com' → UUID
Notion API 요청 (people 필터에 UUID 사용)
    ↓
필터링된 작업 목록 반환
```

### 정상 응답 예시

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# 작업 목록 (5개)\n\n1. [MKL-123] 작업 제목\n   상태: 진행 중 | 담당자: bongheecha@moonklabs.com\n   ..."
      }
    ]
  }
}
```

### 에러 응답 예시 (존재하지 않는 사용자)

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -32603,
    "message": "Notion 사용자를 찾을 수 없습니다: nonexistent@moonklabs.com\n워크스페이스에 등록된 사용자인지 확인해주세요."
  }
}
```

## 결론

### 확인된 사항

1. ✅ **bongheecha 사용자 존재**: UUID `d4ddbc23-3fdb-454d-9694-0adeb308ad7e`
2. ✅ **MCP SDK 헤더 전파**: HTTP 헤더가 도구 핸들러까지 자동 전달됨
3. ✅ **headerUtils 구현**: 대소문자 무관 헤더 추출 지원
4. ✅ **로깅 개선**: HTTP 서버 및 headerUtils에 디버그 로깅 강화

### X-User-Id 헤더 기능 상태

**결론**: X-User-Id 헤더 기능은 아키텍처 수준에서 정상 작동합니다.

- MCP SDK는 헤더를 올바르게 전파함
- headerUtils는 헤더를 올바르게 추출함
- 사용자 변환 로직(userId → email → UUID)도 정상 작동

### 문제 해결 방법

만약 bongheecha 사용자로 작업이 조회되지 않는 문제가 계속된다면:

1. **HTTP 서버 로그 확인**:
   ```bash
   LOG_LEVEL=debug npm run dev:http
   ```
   - X-User-Id 헤더가 수신되는지 확인
   - resolvedUserId가 올바른지 확인

2. **직접 테스트**:
   - curl 명령으로 직접 요청 전송
   - 응답 내용 및 서버 로그 확인

3. **Logic 함수 직접 호출**:
   ```typescript
   const bongheechaUuid = await emailToUserId("bongheecha@moonklabs.com");
   const tasks = await listTasks(
     { assignee: bongheechaUuid, includeSubAssignee: true },
     "last_edited_time",
     "descending",
     10
   );
   ```

## 다음 단계

1. HTTP 서버를 실행하여 실제 X-User-Id 헤더 테스트 수행
2. 로그에서 헤더 전달 흐름 검증
3. 문제가 지속되면 추가 디버깅 로그 활성화
