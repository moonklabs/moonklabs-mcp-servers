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
 * @param pageId 페이지 ID
 * @param maxBlocks 최대 블록 수 (기본값: 50, 최대: 200)
 */
export async function getInbox(
  pageId: string,
  maxBlocks: number = 50
): Promise<InboxDetail> {
  const notion = getNotionClient();

  // 페이지 속성 조회
  const page = await notion.pages.retrieve({ page_id: pageId });

  // 속성 파싱
  const item = parseInboxFromPage(page as any);

  // 첫 번째 레벨 블록 조회
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  // 재귀적으로 모든 블록 수집 (제한 적용)
  const { blocks: allBlocks, truncated, totalCount } = await collectAllBlocks(
    response.results,
    notion,
    maxBlocks
  );

  // 블록을 마크다운으로 변환
  let content = blocksToMarkdown(allBlocks as any[]);

  // 제한 초과 시 안내 메시지 추가
  if (truncated) {
    const remaining = totalCount - maxBlocks;
    content += `\n\n---\n_⚠️ 본문이 길어 ${maxBlocks}개 블록까지만 표시됩니다. (총 ${totalCount}개 중 ${remaining}개 생략)_`;
  }

  return {
    ...item,
    content,
  };
}

/**
 * 재귀적으로 모든 블록을 수집합니다.
 * 중첩된 블록(toggle, callout 내부 등)도 포함합니다.
 * @param blocks 수집할 블록 배열
 * @param notion Notion 클라이언트
 * @param maxBlocks 최대 수집 블록 수
 * @param collected 현재까지 수집된 블록 수 (재귀 호출 시 사용)
 * @returns 수집된 블록, 제한 초과 여부, 총 블록 수
 */
async function collectAllBlocks(
  blocks: any[],
  notion: ReturnType<typeof getNotionClient>,
  maxBlocks: number = 50,
  collected: { count: number; totalCount: number } = { count: 0, totalCount: 0 }
): Promise<{ blocks: any[]; truncated: boolean; totalCount: number }> {
  const result: any[] = [];
  let truncated = false;

  for (const block of blocks) {
    collected.totalCount++;

    // 제한에 도달하면 중단
    if (collected.count >= maxBlocks) {
      truncated = true;
      continue; // 총 개수만 계속 카운트
    }

    result.push(block);
    collected.count++;

    // 자식 블록이 있는 경우 재귀 조회
    if (block.has_children && collected.count < maxBlocks) {
      const childResponse = await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      });

      const childResult = await collectAllBlocks(
        childResponse.results,
        notion,
        maxBlocks,
        collected
      );

      result.push(...childResult.blocks);
      if (childResult.truncated) {
        truncated = true;
      }
    }
  }

  return { blocks: result, truncated, totalCount: collected.totalCount };
}
