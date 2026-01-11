/**
 * Inbox 상세 조회 로직
 * 단일 문서의 속성과 본문을 조회합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { parseInboxFromPage } from "../../utils/propertyParser.js";
import { blocksToMarkdown } from "../../utils/markdownToBlocks.js";
import type { InboxItem } from "../../notion/types.js";

/**
 * Inbox 아이템 상세 정보 (속성 + 본문)
 */
export interface InboxDetail extends InboxItem {
  content: string; // Markdown 형식 본문
}

/**
 * 단일 Inbox 아이템을 조회합니다.
 */
export async function getInbox(pageId: string): Promise<InboxDetail> {
  const notion = getNotionClient();

  // 페이지 속성 조회
  const page = await notion.pages.retrieve({ page_id: pageId });

  // 속성 파싱
  const item = parseInboxFromPage(page as any);

  // 페이지 본문 조회
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100, // 전체 블록 조회
  });

  // 블록을 마크다운으로 변환
  const content = blocksToMarkdown(blocks.results as any[]);

  return {
    ...item,
    content,
  };
}
