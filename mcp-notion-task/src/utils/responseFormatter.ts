/**
 * MCP 응답 포맷터 유틸리티
 * Task 객체를 사용자 친화적인 마크다운 형식으로 변환합니다.
 */

import type { Task, InboxItem } from "../notion/types.js";

/**
 * 단일 작업을 상세 마크다운으로 포맷팅
 */
export function formatTaskDetail(task: Task): string {
  const lines: string[] = [];

  lines.push(`## ${task.taskId ? `[${task.taskId}] ` : ""}${task.title}`);
  lines.push("");
  lines.push(`| 속성 | 값 |`);
  lines.push(`|------|-----|`);
  if (task.taskId) {
    lines.push(`| 작업ID | \`${task.taskId}\` |`);
  }
  lines.push(`| 페이지ID | \`${task.id}\` |`);
  lines.push(`| 상태 | ${task.status} |`);
  lines.push(`| 담당자(정) | ${task.assignees.join(", ") || "미지정"} |`);

  if (task.subAssignees.length > 0) {
    lines.push(`| 담당자(부) | ${task.subAssignees.join(", ")} |`);
  }

  if (task.issueType) {
    lines.push(`| 이슈 타입 | ${task.issueType} |`);
  }

  if (task.priority) {
    lines.push(`| 우선순위 | ${task.priority} |`);
  }

  if (task.dueDate) {
    lines.push(`| 마감일 | ${task.dueDate} |`);
  }

  if (task.estimatedDays !== undefined) {
    lines.push(`| 예정기간 | ${task.estimatedDays}일 |`);
  }

  if (task.tags.length > 0) {
    lines.push(`| 태그 | ${task.tags.join(", ")} |`);
  }

  if (task.memo) {
    lines.push(`| 메모 | ${task.memo} |`);
  }

  lines.push("");
  lines.push(`_마지막 수정: ${formatDateTime(task.lastEditedTime)}_`);

  return lines.join("\n");
}

/**
 * 작업 목록을 간결한 테이블로 포맷팅
 */
export function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "조회된 작업이 없습니다.";
  }

  const lines: string[] = [];

  lines.push(`총 ${tasks.length}개의 작업이 조회되었습니다.`);
  lines.push("");
  lines.push(`| 작업ID | 상태 | 제목 | 담당자 | 우선순위 | 마감일 |`);
  lines.push(`|--------|------|------|--------|----------|--------|`);

  for (const task of tasks) {
    const taskId = task.taskId || task.id.slice(0, 8); // 작업ID 없으면 페이지ID 앞 8자
    const status = task.status;
    const title = truncate(task.title, 30);
    const assignee = task.assignees[0] || "-";
    const priority = task.priority || "-";
    const dueDate = task.dueDate || "-";

    lines.push(`| \`${taskId}\` | ${status} | ${title} | ${assignee} | ${priority} | ${dueDate} |`);
  }

  lines.push("");
  lines.push(`_💡 작업ID로 조회/수정/상태변경 가능 (페이지ID는 notion-task-get으로 확인)_`);

  return lines.join("\n");
}

/**
 * 작업 목록을 ID 포함 간결한 형식으로 포맷팅 (스프린트 조회용)
 */
export function formatSprintTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "조회된 작업이 없습니다.";
  }

  const lines: string[] = [];

  lines.push(`총 ${tasks.length}개의 작업:`);
  lines.push("");

  // 상태별 그룹화
  const grouped = groupByStatus(tasks);

  for (const [status, statusTasks] of Object.entries(grouped)) {
    lines.push(`### ${status} (${statusTasks.length}개)`);

    for (const task of statusTasks) {
      const taskId = task.taskId ? `[${task.taskId}]` : "";
      const priority = task.priority ? `[${task.priority}]` : "";
      const dueDate = task.dueDate ? `~${task.dueDate}` : "";
      lines.push(`- ${taskId} ${priority} ${task.title} ${dueDate}`);
      lines.push(`  - 페이지ID: \`${task.id}\``);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * 상태별로 작업 그룹화
 */
function groupByStatus(tasks: Task[]): Record<string, Task[]> {
  const result: Record<string, Task[]> = {};

  // 상태 우선순위 순서
  const statusOrder = ["진행 중", "시작 전", "일시중지", "완료", "보관됨", "상담완료"];

  for (const status of statusOrder) {
    const filtered = tasks.filter((t) => t.status === status);
    if (filtered.length > 0) {
      result[status] = filtered;
    }
  }

  return result;
}

/**
 * 성공 메시지 포맷팅
 */
export function formatSuccess(message: string): string {
  return `✅ ${message}`;
}

/**
 * 에러 메시지 포맷팅
 */
export function formatError(message: string): string {
  return `❌ 오류: ${message}`;
}

/**
 * 문자열을 지정 길이로 자르기
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * ISO 날짜/시간을 한국어 형식으로 변환
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Inbox (문서) 포맷팅 함수
// ============================================================================

/**
 * 단일 Inbox 아이템을 상세 마크다운으로 포맷팅
 */
export function formatInboxDetail(item: InboxItem): string {
  const lines: string[] = [];

  lines.push(`## ${item.title}`);
  lines.push("");
  lines.push(`| 속성 | 값 |`);
  lines.push(`|------|-----|`);
  lines.push(`| 페이지ID | \`${item.id}\` |`);
  lines.push(`| 작성자 | ${item.authors.join(", ") || "미지정"} |`);

  if (item.tags.length > 0) {
    lines.push(`| 태그 | ${item.tags.join(", ")} |`);
  }

  if (item.createdBy) {
    lines.push(`| 생성자 | ${item.createdBy} |`);
  }

  lines.push(`| 생성일시 | ${formatDateTime(item.createdTime)} |`);
  lines.push(`| 수정일시 | ${formatDateTime(item.lastEditedTime)} |`);

  return lines.join("\n");
}

/**
 * Inbox 아이템 목록을 마크다운 테이블로 포맷팅
 */
export function formatInboxList(items: InboxItem[]): string {
  if (items.length === 0) {
    return "조회된 문서가 없습니다.";
  }

  const lines: string[] = [];

  lines.push(`총 ${items.length}개의 문서가 조회되었습니다.\n`);
  lines.push(`| 제목 | 작성자 | 태그 | 수정일시 |`);
  lines.push(`|------|--------|------|----------|`);

  for (const item of items) {
    const title = truncate(item.title, 40);
    const authors = truncate(item.authors.join(", ") || "미지정", 20);
    const tags = item.tags.length > 0 ? truncate(item.tags.join(", "), 20) : "-";
    const edited = formatDateTime(item.lastEditedTime);

    lines.push(`| ${title} | ${authors} | ${tags} | ${edited} |`);
  }

  lines.push("");
  lines.push(`_💡 페이지ID로 상세 조회 가능 (notion-inbox-get)_`);

  return lines.join("\n");
}
