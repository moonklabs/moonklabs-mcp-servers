/**
 * 작업 정보 수정 로직
 * 작업의 여러 속성을 한 번에 업데이트합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseTaskFromPage } from "../../utils/propertyParser.js";
import {
  buildTitleProperty,
  buildSelectProperty,
  buildMultiSelectProperty,
  buildDateProperty,
  buildNumberProperty,
  buildRelationProperty,
  buildRichTextProperty,
  buildProperties,
} from "../../utils/propertyBuilder.js";
import type { Task, UpdateTaskInput } from "../../notion/types.js";

/**
 * 작업 정보를 수정합니다.
 * @param pageId 작업 페이지 ID
 * @param updates 수정할 속성들
 * @returns 업데이트된 Task 객체
 */
export async function updateTask(
  pageId: string,
  updates: UpdateTaskInput
): Promise<Task> {
  const notion = getNotionClient();

  // 업데이트할 속성 빌드
  const properties = buildUpdateProperties(updates);

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
 */
function buildUpdateProperties(updates: UpdateTaskInput): Record<string, any> {
  const props: Record<string, any> = {};

  if (updates.title !== undefined) {
    props["작업 이름"] = buildTitleProperty(updates.title);
  }

  if (updates.status !== undefined) {
    props["상태"] = buildSelectProperty(updates.status);
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

  // 담당자 관련은 People 타입이므로 별도 처리 필요
  // Notion API에서 email → user_id 변환 필요
  // 일단 user_id 직접 전달 가정

  return props;
}
