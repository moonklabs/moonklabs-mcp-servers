# 통합 테스트 결과

## 개요

실제 Notion API를 호출하는 통합 테스트를 작성하여 14개 MCP 도구를 검증했습니다.

**최초 테스트 실행**: 2026-01-13
**최초 결과**: 20개 테스트 중 10개 통과, 10개 실패

**버그 수정 후**: 2026-01-13
**최종 결과**: 20개 테스트 중 20개 통과 ✅ **(100%)**

## 수정 완료 ✅

### 1. Notion status 타입 지원 (우선순위 1)
- ✅ `propertyBuilder.ts`: `buildStatusProperty()` 함수 추가
- ✅ `propertyParser.ts`: `parseStatus()` 함수 추가 (핵심 수정!)
  - status 속성을 parseSelect로 파싱하여 항상 기본값 반환되던 버그 수정
- ✅ `listLogic.ts`: status 필터링 `select` → `status`로 변경
- ✅ `createLogic.ts`: status 속성 생성 시 buildStatusProperty 사용
- ✅ `updateLogic.ts`: status 속성 업데이트 시 buildStatusProperty 사용
- ✅ `updateStatusLogic.ts`: status 속성 업데이트 시 buildStatusProperty 사용

### 2. Inbox userId → UUID 변환 (우선순위 2)
- ✅ `inbox/list.ts`: author 파라미터 UUID 변환 추가
- ✅ 통합 테스트에서 UUID 변환 적용

### 3. 통합 테스트 개선 (우선순위 3)
- ✅ 타임아웃 30초 → 60초 증가 (emailToUserId 캐시 워밍업 대응)
- ✅ 테스트 assertion 수정

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

## 개발 요약

### 통합 테스트 진행 과정

**1단계**: 최초 통합 테스트 작성 및 실행
- 14개 MCP 도구에 대한 20개 테스트 케이스 작성
- 실제 Notion API 호출로 전체 워크플로우 검증
- **결과**: 10/20 통과 (50%)

**2단계**: 버그 발견 및 수정
- 핵심 버그: `propertyParser.ts`에서 status 타입을 select로 파싱
- 6개 파일 수정으로 status 타입 완전 지원
- Inbox UUID 변환 누락 수정
- **결과**: 19/20 통과 (95%)

**3단계**: 최종 테스트 안정화
- updateInbox 테스트에서 존재하지 않는 사용자 제거
- **최종 결과**: 20/20 통과 (100%) ✅

---

## 발견된 버그 (수정 완료)

### 1. Notion 속성 타입 불일치 ✅

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

### 4. 테스트 안정화 ✅

**문제**: updateInbox 작성자 수정 시 Notion API `internal_server_error`

**원인**: workspace에 존재하지 않는 사용자 추가 시도

**해결**: 테스트를 한 명의 작성자로만 업데이트하도록 수정

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
