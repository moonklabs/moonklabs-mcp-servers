/**
 * 작업 상태 변경 로직
 * 페이지의 상태 속성만 빠르게 업데이트합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseTaskFromPage } from "../../utils/propertyParser.js";
import { buildSelectProperty } from "../../utils/propertyBuilder.js";
import { resolveToPageId } from "../../utils/taskIdResolver.js";
import type { Task, TaskStatus } from "../../notion/types.js";

/**
 * 작업 상태를 변경합니다.
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @param status 새 상태
 * @returns 업데이트된 Task 객체
 */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<Task> {
  const pageId = await resolveToPageId(id);
  const notion = getNotionClient();

  const updatedPage = await notion.pages.update({
    page_id: pageId,
    properties: {
      "상태": buildSelectProperty(status),
    },
  });

  return parseTaskFromPage(updatedPage as any);
}
