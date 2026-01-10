/**
 * 진행 로그 추가 로직
 * 작업 페이지에 로그를 추가합니다.
 *
 * 참고: Notion API의 blocks.children.append는 'after' 파라미터를 지원하지 않습니다.
 * 따라서 로그는 항상 페이지 끝에 추가됩니다.
 */

import { getNotionClient } from "../../notion/client.js";
import { createLogBlocks } from "../../utils/markdownToBlocks.js";
import { resolveToPageId } from "../../utils/taskIdResolver.js";
import type { LogType } from "../../notion/types.js";

/**
 * 작업 페이지에 진행 로그를 추가합니다.
 * 로그는 페이지 끝에 추가됩니다.
 *
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @param content 로그 내용 (Markdown)
 * @param author 작성자 이름/이메일
 * @param logType 로그 타입
 */
export async function addTaskLog(
  id: string,
  content: string,
  author: string,
  logType: LogType = "progress"
): Promise<{ success: boolean; blockCount: number }> {
  const pageId = await resolveToPageId(id);
  const notion = getNotionClient();

  // 로그 블록 생성
  const logBlocks = createLogBlocks(content, author, logType);

  // 페이지 끝에 블록 추가
  await notion.blocks.children.append({
    block_id: pageId,
    children: logBlocks,
  });

  return {
    success: true,
    blockCount: logBlocks.length,
  };
}

// 이전 함수명 호환성을 위해 alias 제공
export const addTaskLogAfterChangelog = addTaskLog;
