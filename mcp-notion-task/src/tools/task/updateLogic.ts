/**
 * 작업 정보 수정 로직
 * 작업의 여러 속성을 한 번에 업데이트합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseTaskFromPage } from "../../utils/propertyParser.js";
import {
  buildTitleProperty,
  buildSelectProperty,
  buildStatusProperty,
  buildMultiSelectProperty,
  buildDateProperty,
  buildNumberProperty,
  buildRelationProperty,
  buildRichTextProperty,
  buildPeopleProperty,
  buildProperties,
} from "../../utils/propertyBuilder.js";
import { resolveToPageId } from "../../utils/taskIdResolver.js";
import { emailsToUserIds } from "../../utils/emailToUserId.js";
import type { Task, UpdateTaskInput } from "../../notion/types.js";

/**
 * 작업 정보를 수정합니다.
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @param updates 수정할 속성들
 * @returns 업데이트된 Task 객체
 */
export async function updateTask(
  id: string,
  updates: UpdateTaskInput
): Promise<Task> {
  const pageId = await resolveToPageId(id);
  const notion = getNotionClient();

  // 담당자 이메일 → UUID 변환
  let assigneeIds: string[] | undefined;
  if (updates.assignees && updates.assignees.length > 0) {
    const userMap = await emailsToUserIds(updates.assignees);
    assigneeIds = Array.from(userMap.values());
  }

  // 업데이트할 속성 빌드
  const properties = buildUpdateProperties(updates, assigneeIds);

  if (Object.keys(properties).length === 0) {
    throw new Error("수정할 속성이 없습니다.");
  }

  const updatedPage = await notion.pages.update({
    page_id: pageId,
    properties,
  });

  return parseTaskFromPage(updatedPage as any);
}

/**
 * UpdateTaskInput을 Notion properties 객체로 변환
 * @param updates 수정할 속성들
 * @param assigneeIds 담당자 UUID 배열 (이메일에서 변환됨)
 */
function buildUpdateProperties(
  updates: UpdateTaskInput,
  assigneeIds?: string[]
): Record<string, any> {
  const props: Record<string, any> = {};

  if (updates.title !== undefined) {
    props["작업 이름"] = buildTitleProperty(updates.title);
  }

  if (updates.status !== undefined) {
    props["상태"] = buildStatusProperty(updates.status);
  }

  if (updates.issueType !== undefined) {
    props["이슈구분"] = buildSelectProperty(updates.issueType);
  }

  if (updates.priority !== undefined) {
    props["우선순위"] = buildSelectProperty(updates.priority);
  }

  if (updates.dueDate !== undefined) {
    props["마감일"] = buildDateProperty(updates.dueDate);
  }

  if (updates.estimatedDays !== undefined) {
    props["예정기간"] = buildNumberProperty(updates.estimatedDays);
  }

  if (updates.tags !== undefined) {
    props["태그"] = buildMultiSelectProperty(updates.tags);
  }

  if (updates.memo !== undefined) {
    props["메모"] = buildRichTextProperty(updates.memo);
  }

  if (updates.sprintId !== undefined) {
    props["스프린트"] = buildRelationProperty([updates.sprintId]);
  }

  if (updates.projectId !== undefined) {
    props["프로젝트"] = buildRelationProperty([updates.projectId]);
  }

  // 담당자 처리
  if (assigneeIds && assigneeIds.length > 0) {
    props["담당자"] = buildPeopleProperty(assigneeIds);
  }

  return props;
}
