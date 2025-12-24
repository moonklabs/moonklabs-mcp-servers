/**
 * MCP 응답 포맷터 유틸리티
 * Task 객체를 사용자 친화적인 마크다운 형식으로 변환합니다.
 */

import type { Task } from "../notion/types.js";

/**
 * 단일 작업을 상세 마크다운으로 포맷팅
 */
export function formatTaskDetail(task: Task): string {
  const lines: string[] = [];

  lines.push(`## ${task.title}`);
  lines.push("");
  lines.push(`| 속성 | 값 |`);
  lines.push(`|------|-----|`);
  lines.push(`| ID | \`${task.id}\` |`);
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
  lines.push(`| 상태 | 제목 | 담당자 | 우선순위 | 마감일 |`);
  lines.push(`|------|------|--------|----------|--------|`);

  for (const task of tasks) {
    const status = task.status;
    const title = truncate(task.title, 30);
    const assignee = task.assignees[0] || "-";
    const priority = task.priority || "-";
    const dueDate = task.dueDate || "-";

    lines.push(`| ${status} | ${title} | ${assignee} | ${priority} | ${dueDate} |`);
  }

  lines.push("");
  lines.push(`_상세 조회: notion-task-get 도구를 사용하세요._`);

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
      const priority = task.priority ? `[${task.priority}]` : "";
      const dueDate = task.dueDate ? `~${task.dueDate}` : "";
      lines.push(`- ${priority} ${task.title} ${dueDate}`);
      lines.push(`  - ID: \`${task.id}\``);
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
