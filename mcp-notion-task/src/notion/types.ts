/**
 * Notion 작업 관련 타입 정의
 * MKL작업 데이터베이스의 스키마에 맞춘 타입들입니다.
 */

/**
 * 작업 상태
 * MKL작업 데이터베이스의 상태 선택 옵션
 */
export type TaskStatus =
  | "시작 전"
  | "일시중지"
  | "진행 중"
  | "완료"
  | "보관됨"
  | "상담완료";

/**
 * 이슈 타입
 */
export type IssueType =
  | "버그"
  | "개선"
  | "고객요청"
  | "작업"
  | "미팅"
  | "CS";

/**
 * 우선순위
 */
export type Priority = "낮음" | "중간" | "높음";

/**
 * 로그 타입
 */
export type LogType = "progress" | "blocker" | "decision" | "note";

/**
 * 로그 타입 아이콘 매핑
 */
export const LOG_TYPE_ICONS: Record<LogType, string> = {
  progress: "🔄 진행",
  blocker: "🚧 블로커",
  decision: "✅ 결정",
  note: "📌 메모",
};

/**
 * 작업 엔티티 (Notion 페이지를 파싱한 결과)
 */
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignees: string[];           // 담당자(정) 이메일 목록
  subAssignees: string[];        // 담당자(부) 이메일 목록
  sprintId?: string;             // 스프린트 페이지 ID
  sprintName?: string;           // 스프린트 이름 (조회 시 조인)
  projectId?: string;            // 프로젝트 페이지 ID
  issueType?: IssueType;
  priority?: Priority;
  dueDate?: string;              // YYYY-MM-DD 형식
  estimatedDays?: number;        // 예정기간 (일)
  tags: string[];
  memo?: string;                 // 메모
  createdTime: string;           // ISO 8601
  lastEditedTime: string;        // ISO 8601
}

/**
 * 작업 생성 입력 (필수 + 선택 속성)
 */
export interface CreateTaskInput {
  title: string;
  status?: TaskStatus;
  assignees?: string[];          // 담당자 이메일 배열
  sprintId?: string;
  issueType?: IssueType;
  priority?: Priority;
  dueDate?: string;
  estimatedDays?: number;
  tags?: string[];
  memo?: string;
  content?: string;              // 초기 본문 (Markdown)
}

/**
 * 작업 업데이트 입력 (모든 속성 선택)
 */
export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
  assignees?: string[];
  subAssignees?: string[];
  sprintId?: string;
  projectId?: string;
  issueType?: IssueType;
  priority?: Priority;
  dueDate?: string;
  estimatedDays?: number;
  tags?: string[];
  memo?: string;
}

/**
 * 작업 목록 조회 필터
 */
export interface TaskListFilter {
  status?: TaskStatus;
  assignee?: string;             // 담당자 이메일
  includeSubAssignee?: boolean;  // 담당자(부)도 포함할지
  sprintId?: string;
  projectId?: string;
  priority?: Priority;
  issueType?: IssueType;
}

/**
 * 작업 목록 조회 정렬 기준
 */
export type TaskSortBy =
  | "created_time"
  | "last_edited_time"
  | "due_date"
  | "priority";

/**
 * 진행 로그 입력
 */
export interface AddLogInput {
  pageId: string;
  content: string;               // Markdown 형식
  author: string;                // 작성자 이름 또는 이메일
  logType?: LogType;
}
