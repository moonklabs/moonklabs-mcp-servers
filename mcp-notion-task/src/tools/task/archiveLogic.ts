/**
 * 작업 아카이브 로직
 * 작업을 아카이브 상태로 변경합니다.
 */

import { getNotionClient } from "../../notion/client.js";

/**
 * 작업을 아카이브합니다.
 * @param pageId 작업 페이지 ID
 * @returns 성공 여부
 */
export async function archiveTask(pageId: string): Promise<{ success: boolean }> {
  const notion = getNotionClient();

  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });

  return { success: true };
}

/**
 * 아카이브된 작업을 복원합니다.
 * @param pageId 작업 페이지 ID
 * @returns 성공 여부
 */
export async function unarchiveTask(pageId: string): Promise<{ success: boolean }> {
  const notion = getNotionClient();

  await notion.pages.update({
    page_id: pageId,
    archived: false,
  });

  return { success: true };
}
