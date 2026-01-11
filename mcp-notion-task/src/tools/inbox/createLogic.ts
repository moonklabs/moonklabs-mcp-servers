/**
 * Inbox 생성 로직
 * 새 문서를 생성합니다.
 */

import { getNotionClient, getInboxDatabaseId } from "../../notion/client.js";
import { parseInboxFromPage } from "../../utils/propertyParser.js";
import { markdownToBlocks } from "../../utils/markdownToBlocks.js";
import { emailsToUserIds } from "../../utils/emailToUserId.js";
import type { CreateInboxInput, InboxItem } from "../../notion/types.js";

/**
 * 새 Inbox 아이템을 생성합니다.
 */
export async function createInbox(input: CreateInboxInput): Promise<InboxItem> {
  const notion = getNotionClient();
  const databaseId = getInboxDatabaseId();

  // 작성자 이메일 → UUID 변환
  let authorIds: string[] = [];
  if (input.authors && input.authors.length > 0) {
    const userMap = await emailsToUserIds(input.authors);
    authorIds = Array.from(userMap.values());
  }

  // 페이지 속성 빌드
  const properties: any = {
    제목: {
      title: [{ text: { content: input.title } }],
    },
  };

  if (authorIds.length > 0) {
    properties["작성자"] = {
      people: authorIds.map((id) => ({ id })),
    };
  }

  if (input.tags && input.tags.length > 0) {
    properties["태그"] = {
      multi_select: input.tags.map((tag) => ({ name: tag })),
    };
  }

  // 본문 블록 빌드 (옵션)
  const children = input.content ? markdownToBlocks(input.content) : [];

  // 페이지 생성
  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
    children,
  });

  return parseInboxFromPage(page as any);
}
