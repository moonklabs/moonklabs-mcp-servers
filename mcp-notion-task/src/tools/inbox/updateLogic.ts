/**
 * Inbox 수정 로직
 * 문서의 여러 속성을 한 번에 업데이트합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseInboxFromPage } from "../../utils/propertyParser.js";
import {
  buildTitleProperty,
  buildMultiSelectProperty,
  buildPeopleProperty,
} from "../../utils/propertyBuilder.js";
import { emailsToUserIds } from "../../utils/emailToUserId.js";
import type { InboxItem, UpdateInboxInput } from "../../notion/types.js";

/**
 * Inbox 문서를 수정합니다.
 * @param pageId 페이지 ID (UUID)
 * @param updates 수정할 속성들
 * @returns 업데이트된 InboxItem 객체
 */
export async function updateInbox(
  pageId: string,
  updates: UpdateInboxInput
): Promise<InboxItem> {
  const notion = getNotionClient();

  // 작성자 이메일 → UUID 변환
  let authorIds: string[] | undefined;
  if (updates.authors && updates.authors.length > 0) {
    const userMap = await emailsToUserIds(updates.authors);
    authorIds = Array.from(userMap.values());
  }

  // 업데이트할 속성 빌드
  const properties = buildUpdateProperties(updates, authorIds);

  if (Object.keys(properties).length === 0) {
    throw new Error("수정할 속성이 없습니다.");
  }

  const updatedPage = await notion.pages.update({
    page_id: pageId,
    properties,
  });

  return parseInboxFromPage(updatedPage as any);
}

/**
 * UpdateInboxInput을 Notion properties 객체로 변환
 * @param updates 수정할 속성들
 * @param authorIds 작성자 UUID 배열 (이메일에서 변환됨)
 */
function buildUpdateProperties(
  updates: UpdateInboxInput,
  authorIds?: string[]
): Record<string, any> {
  const props: Record<string, any> = {};

  if (updates.title !== undefined) {
    props["제목"] = buildTitleProperty(updates.title);
  }

  // 작성자 처리
  if (authorIds && authorIds.length > 0) {
    props["작성자"] = buildPeopleProperty(authorIds);
  }

  if (updates.tags !== undefined) {
    props["태그"] = buildMultiSelectProperty(updates.tags);
  }

  return props;
}
