/**
 * 작업 본문 조회 로직
 * 페이지의 블록 콘텐츠를 Markdown으로 변환하여 반환합니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { blocksToMarkdown } from "../../utils/markdownToBlocks.js";

/**
 * 작업 페이지의 본문을 Markdown으로 조회합니다.
 * @param pageId 작업 페이지 ID
 * @returns Markdown 문자열
 */
export async function getTaskContent(pageId: string): Promise<string> {
  const notion = getNotionClient();

  // 첫 번째 레벨 블록 조회
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  // 재귀적으로 모든 블록 수집
  const allBlocks = await collectAllBlocks(response.results, notion);

  // Markdown으로 변환
  return blocksToMarkdown(allBlocks);
}

/**
 * 재귀적으로 모든 블록을 수집합니다.
 * 중첩된 블록(toggle, callout 내부 등)도 포함합니다.
 */
async function collectAllBlocks(
  blocks: any[],
  notion: ReturnType<typeof getNotionClient>
): Promise<any[]> {
  const result: any[] = [];

  for (const block of blocks) {
    result.push(block);

    // 자식 블록이 있는 경우 재귀 조회
    if (block.has_children) {
      const childResponse = await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      });

      const childBlocks = await collectAllBlocks(childResponse.results, notion);
      result.push(...childBlocks);
    }
  }

  return result;
}
