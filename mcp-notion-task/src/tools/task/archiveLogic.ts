/**
 * 작업 아카이브 로직
 * 작업을 아카이브 상태로 변경합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { resolveToPageId } from "../../utils/taskIdResolver.js";

/**
 * 작업을 아카이브합니다.
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @returns 성공 여부
 */
export async function archiveTask(id: string): Promise<{ success: boolean }> {
  const pageId = await resolveToPageId(id);
  const notion = getNotionClient();

  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });

  return { success: true };
}

/**
 * 아카이브된 작업을 복원합니다.
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @returns 성공 여부
 */
export async function unarchiveTask(id: string): Promise<{ success: boolean }> {
  const pageId = await resolveToPageId(id);
  const notion = getNotionClient();

  await notion.pages.update({
    page_id: pageId,
    archived: false,
  });

  return { success: true };
}
