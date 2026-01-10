/**
 * 단일 작업 조회 로직
 * 작업 ID (MKL-123) 또는 페이지 ID로 작업 상세 정보를 조회합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseTaskFromPage } from "../../utils/propertyParser.js";
import { resolveToPageId } from "../../utils/taskIdResolver.js";
import type { Task } from "../../notion/types.js";

/**
 * 작업을 조회합니다.
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @returns Task 객체
 * @throws 페이지를 찾을 수 없는 경우 에러
 */
export async function getTask(id: string): Promise<Task> {
  const pageId = await resolveToPageId(id);
  const notion = getNotionClient();

  const page = await notion.pages.retrieve({
    page_id: pageId,
  });

  // archived 페이지도 조회 가능하지만, 상태 표시
  return parseTaskFromPage(page as any);
}
