/**
 * 단일 작업 조회 로직
 * 페이지 ID로 작업 상세 정보를 조회합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseTaskFromPage } from "../../utils/propertyParser.js";
import type { Task } from "../../notion/types.js";

/**
 * 페이지 ID로 작업을 조회합니다.
 * @param pageId Notion 페이지 ID
 * @returns Task 객체
 * @throws 페이지를 찾을 수 없는 경우 에러
 */
export async function getTask(pageId: string): Promise<Task> {
  const notion = getNotionClient();

  const page = await notion.pages.retrieve({
    page_id: pageId,
  });

  // archived 페이지도 조회 가능하지만, 상태 표시
  return parseTaskFromPage(page as any);
}
