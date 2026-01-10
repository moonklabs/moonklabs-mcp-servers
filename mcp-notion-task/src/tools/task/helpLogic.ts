/**
 * Help 도구 로직
 * 사용 가능한 도구와 워크플로우를 안내합니다.
 */

type HelpTopic = "all" | "workflow" | "status" | "sprint";

/**
 * 도구 목록 가이드
 */
function getToolsGuide(): string {
  return `# Notion Task MCP 도구 목록

## 핵심 도구 (자주 사용)

### 1. notion-task-my-sprint
- **용도**: 작업 시작 전 오늘 할 일 확인
- **사용**: 이메일 + 스프린트 번호로 조회
- **예시**: email="user@moonklabs.com", sprintNumber=50

### 2. notion-task-update-status
- **용도**: 작업 완료/시작 시 상태만 빠르게 변경
- **사용**: pageId + status (다른 속성은 update 사용)
- **상태값**: 시작 전, 일시중지, 진행 중, 완료, 보관됨, 상담완료

### 3. notion-task-add-log
- **용도**: 작업 중 진행상황 기록
- **특징**: 타임스탬프 자동 추가됨, Markdown 형식 지원
- **파라미터**: pageId, content, author, logType (progress/blocker/decision/note)

### 4. notion-task-get-content
- **용도**: 작업 페이지의 전체 본문 조회
- **사용**: 진행 로그, 상세 설명 확인 시
- **반환**: Markdown 형식

### 5. notion-task-update
- **용도**: 여러 속성 동시 수정 (제목, 상태, 마감일, 우선순위 등)
- **사용**: 작업 정보 전체 업데이트 시
- **파라미터**: 11개 옵션 사용 가능

## 보조 도구

### 6. notion-task-get
- **용도**: 작업 상세 정보 조회 (속성만, 본문 제외)
- **사용**: pageId로 특정 작업 확인

### 7. notion-task-list
- **용도**: 작업 목록 조회
- **사용**: 다양한 필터 (상태, 담당자, 스프린트, 우선순위 등)
- **정렬**: 생성일, 수정일, 마감일, 우선순위

### 8. notion-task-create
- **용도**: 새 작업 생성
- **특징**: 기본 템플릿으로 본문 초기화
- **파라미터**: title(필수), 나머지 선택

### 9. notion-task-archive
- **용도**: 작업 아카이브
- **특징**: 기본 목록에서 제외, 복원 가능
`;
}

/**
 * 워크플로우 가이드
 */
function getWorkflowGuide(): string {
  return `# 일반적인 워크플로우

## 하루 시작

\`\`\`
1. 오늘 할 일 확인
   → notion-task-my-sprint
   파라미터: email, sprintNumber

2. 작업 상세 내용 확인 (필요시)
   → notion-task-get-content
   파라미터: pageId
\`\`\`

## 작업 진행

\`\`\`
3. 작업 시작
   → notion-task-update-status
   파라미터: pageId, status="진행 중"

4. 진행 중 로그 기록 (중요 진행상황, 블로커 등)
   → notion-task-add-log
   파라미터: pageId, content (Markdown), author, logType

5. 작업 정보 수정 (마감일, 우선순위 등)
   → notion-task-update
   파라미터: pageId, 수정할 속성들
\`\`\`

## 작업 완료

\`\`\`
6. 작업 완료 처리
   → notion-task-update-status
   파라미터: pageId, status="완료"

7. 최종 로그 기록 (선택)
   → notion-task-add-log
   파라미터: pageId, content="작업 완료", author
\`\`\`

## 작업 보관

\`\`\`
8. 오래된 작업 정리
   → notion-task-archive
   파라미터: pageId
\`\`\`

---

## 상태 전환 흐름

\`\`\`
시작 전 ──────→ 진행 중 ──────→ 완료
          ↘              ↗
            일시중지

보관됨 (archive 후)
상담완료 (CS 작업 전용)
\`\`\`
`;
}

/**
 * 상태값 가이드
 */
function getStatusGuide(): string {
  return `# 작업 상태 (TaskStatus)

## 상태 종류

| 상태 | 설명 | 사용 시점 |
|------|------|-----------|
| **시작 전** | 아직 작업하지 않음 | 작업 생성 직후 (기본값) |
| **진행 중** | 현재 작업 중 | 작업 시작 시 |
| **일시중지** | 잠시 중단됨 | 블로커 발생, 다른 작업 우선 처리 |
| **완료** | 작업 완료됨 | 작업 종료 시 |
| **보관됨** | 아카이브됨 | 오래된 작업 정리 시 |
| **상담완료** | CS 작업 완료 | CS 문의 처리 완료 시 |

## 상태 변경 도구

- **빠른 변경**: \`notion-task-update-status\` (상태만)
- **종합 수정**: \`notion-task-update\` (상태 + 다른 속성)

## 필터링

\`\`\`typescript
// 진행 중인 작업만 조회
notion-task-list({ status: "진행 중" })

// 내 스프린트에서 완료된 작업 조회
notion-task-my-sprint({
  email: "user@moonklabs.com",
  sprintNumber: 50,
  status: "완료"
})
\`\`\`
`;
}

/**
 * 스프린트 관련 가이드
 */
function getSprintGuide(): string {
  return `# 스프린트 작업 관리

## 스프린트 번호 체계

- 스프린트는 **숫자**로 관리됩니다 (예: 50, 51, 52)
- Notion 스프린트 데이터베이스의 이름은 "스프린트 {number}" 형식
- 예: "스프린트 50", "스프린트 51"

## 내 스프린트 작업 조회

\`\`\`typescript
notion-task-my-sprint({
  email: "user@moonklabs.com",  // 필수: 담당자 이메일
  sprintNumber: 50,              // 필수: 스프린트 번호
  status: "진행 중",             // 선택: 상태 필터
  includeSubAssignee: true       // 선택: 담당자(부) 포함 (기본값: true)
})
\`\`\`

### includeSubAssignee 옵션

- \`true\`: 담당자(정) + 담당자(부) 모두 조회 (기본값)
- \`false\`: 담당자(정)만 조회

## 스프린트별 작업 목록 조회

\`\`\`typescript
notion-task-list({
  sprintId: "page-id-here",  // 스프린트 페이지 ID
  status: "시작 전",
  sortBy: "priority",
  sortDirection: "descending"
})
\`\`\`

## 작업 생성 시 스프린트 지정

\`\`\`typescript
notion-task-create({
  title: "새 작업",
  sprintId: "page-id-here",  // 스프린트 페이지 ID
  priority: "높음",
  dueDate: "2025-01-15"
})
\`\`\`

## 주의사항

- **스프린트 번호 검색**: \`notion-task-my-sprint\`는 스프린트 번호로 자동 검색
- **스프린트 ID 사용**: 다른 도구는 스프린트 페이지 ID 필요
- **정확한 매칭**: "스프린트 5" ≠ "스프린트 50" (equals 필터 사용)
`;
}

/**
 * 기본 개요 가이드
 */
function getOverviewGuide(): string {
  return `# Notion Task MCP - 도움말

Notion Task(MKL작업) 관리를 위한 MCP 서버입니다.

## 빠른 시작

1. **오늘 할 일 확인**
   \`\`\`
   notion-task-my-sprint
   → 이메일 + 스프린트 번호 입력
   \`\`\`

2. **작업 시작**
   \`\`\`
   notion-task-update-status
   → pageId + status="진행 중"
   \`\`\`

3. **진행 로그 기록**
   \`\`\`
   notion-task-add-log
   → pageId + content + author
   \`\`\`

## 더 알아보기

- \`topic: "all"\` - 전체 도구 목록
- \`topic: "workflow"\` - 일반적인 작업 흐름
- \`topic: "status"\` - 상태값 설명
- \`topic: "sprint"\` - 스프린트 관련 사용법

## 도구 수

총 **10개** 도구:
- 핵심: 5개 (my-sprint, update-status, add-log, get-content, update)
- 보조: 4개 (get, list, create, archive)
- 도움말: 1개 (help)
`;
}

/**
 * Help 도구 로직
 * @param topic 조회할 주제 (선택)
 * @returns 마크다운 형식의 가이드
 */
export function getHelpContent(topic?: HelpTopic): string {
  switch (topic) {
    case "all":
      return getToolsGuide();
    case "workflow":
      return getWorkflowGuide();
    case "status":
      return getStatusGuide();
    case "sprint":
      return getSprintGuide();
    default:
      return getOverviewGuide();
  }
}
