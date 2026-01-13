# 통합 테스트 결과

## 개요

실제 Notion API를 호출하는 통합 테스트를 작성하여 14개 MCP 도구를 검증했습니다.

**테스트 실행**: 2026-01-13
**결과**: 20개 테스트 중 10개 통과, 10개 실패

## 테스트 통과 (✓)

### Task 도구
| 테스트 | 결과 | 소요 시간 |
|--------|------|-----------|
| listTasks: 전체 목록 조회 | ✓ | 1.8초 |
| getTask: 페이지 ID로 조회 | ✓ | 1.7초 |
| getTask: MKL-XXX 형식으로 조회 | ✓ | 4.0초 |
| getTaskContent: 본문 조회 | ✓ | 3.8초 |
| getHelpContent: 도움말 조회 | ✓ | 즉시 |

### Inbox 도구
| 테스트 | 결과 | 소요 시간 |
|--------|------|-----------|
| listInbox: 전체 목록 조회 | ✓ | 0.8초 |
| listInbox: 태그 필터링 | ✓ | 0.6초 |
| getInbox: 페이지 ID로 상세 조회 | ✓ | 1.9초 |
| createInbox: 새 Inbox 생성 | ✓ | 1.1초 |
| updateInbox: 제목 및 태그 수정 | ✓ | 1.3초 |

## 테스트 실패 (✗)

### 1. Notion 속성 타입 불일치

**실패 테스트**:
- `listTasks: 상태 필터링`
- `createTask: 새 작업 생성`

**에러 메시지**:
```
The property type in the database does not match the property type of the filter provided:
database property status does not match filter select
```

```
상태 is expected to be status.
```

**원인**:
Notion 데이터베이스의 "상태" 속성이 `status` 타입인데, 코드는 `select` 타입으로 가정함.

**실제 속성 타입**:
```json
{
  "type": "status",
  "status": {
    "options": [
      {"id": "not-started", "name": "시작 전"},
      {"id": "in-progress", "name": "진행 중"},
      {"id": "done", "name": "완료"},
      ...
    ]
  }
}
```

**수정 필요 파일**:
- `src/tools/task/listLogic.ts`: `buildFilter()` 함수에서 status 필터링 방식 변경
- `src/utils/propertyBuilder.ts`: `buildStatus()` 함수 수정

**수정 방법**:
```typescript
// 현재 (잘못됨)
{
  property: "상태",
  select: { equals: "진행 중" }
}

// 수정 후
{
  property: "상태",
  status: { equals: "진행 중" }
}
```

### 2. userId → UUID 변환 누락

**실패 테스트**:
- `listInbox: 작성자 필터링`
- `updateInbox: 작성자 수정` (타임아웃)

**에러 메시지**:
```
body.filter.people.contains should be a valid uuid, instead was `"dosunyun"`.
```

**원인**:
Inbox 도구에서 userId를 UUID로 변환하지 않고 직접 전달함.

**수정 필요 파일**:
- `src/tools/inbox/listLogic.ts`: author 파라미터를 UUID로 변환
- `src/tools/inbox/updateLogic.ts`: authors 파라미터를 UUID로 변환

**수정 방법**:
```typescript
// 수정 전
const result = await listInbox({ author: "dosunyun" }, ...);

// 수정 후
const email = userIdToEmail("dosunyun");
const authorId = await emailToUserId(email);
const result = await listInbox({ author: authorId }, ...);
```

### 3. 타임아웃 (10초 초과)

**실패 테스트**:
- `listTasks: 담당자 필터링`
- `getMySprintTasks: 스프린트 작업 조회`

**원인**:
`emailToUserId()` 함수가 데이터베이스 쿼리를 포함하여 시간이 오래 걸림. 특히 스프린트 작업 조회 시 복잡한 필터링으로 인해 지연 발생.

**수정 필요**:
- 타임아웃 값 증가: `it("테스트", async () => {...}, 30000)` (30초)
- 또는 캐시 워밍업 로직 추가

### 4. 테스트 의존성 문제

**실패 테스트**:
- `updateTask: 제목 및 속성 수정`
- `updateTaskStatus: 상태 변경`
- `addTaskLogAfterChangelog: 로그 추가`
- `archiveTask: 작업 보관`

**에러 메시지**:
```
expected undefined to be defined
```

**원인**:
`createTask` 테스트가 실패하여 `testTaskId`가 undefined로 남음. 이후 수정/삭제 테스트들이 모두 실패.

**해결 방법**:
1. createTask 버그 수정 (status 타입 문제)
2. 또는 기존 작업을 사용하도록 테스트 수정

## 권장 수정 순서

1. **우선순위 1**: Notion status 타입 지원 추가
   - `propertyBuilder.ts` 수정
   - `listLogic.ts` 수정
   - `createLogic.ts` 수정

2. **우선순위 2**: Inbox userId → UUID 변환
   - `inbox/listLogic.ts` 수정
   - `inbox/updateLogic.ts` 수정

3. **우선순위 3**: 타임아웃 조정
   - 통합 테스트 타임아웃 30초로 증가

## 실행 방법

```bash
# 전체 통합 테스트
npm run test:integration

# 특정 파일만 테스트
npx vitest run src/__tests__/integration/task.integration.test.ts

# watch 모드
npx vitest watch src/__tests__/integration/
```

## 자동 정리

생성된 테스트 데이터는 `afterAll()` 훅에서 자동으로 archive 처리됩니다.
