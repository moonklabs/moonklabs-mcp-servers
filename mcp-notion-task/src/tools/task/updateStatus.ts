/**
 * 작업 상태 변경 도구
 * notion-task-update-status
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { updateTaskStatus } from "./updateStatusLogic.js";
import { formatSuccess, formatError } from "../../utils/responseFormatter.js";
import type { TaskStatus } from "../../notion/types.js";

/**
 * 작업 상태 변경 도구를 등록합니다.
 */
export function registerUpdateStatusTool(server: McpServer): void {
  server.registerTool(
    "notion-task-update-status",
    {
      description:
        "작업 완료/시작 시 상태만 빠르게 변경. 다른 속성 수정은 update 사용.",
      inputSchema: z.object({
        pageId: z.string().describe("작업 페이지 ID"),
        status: z
          .enum(["시작 전", "일시중지", "진행 중", "완료", "보관됨", "상담완료"])
          .describe("새 상태"),
      }),
    },
    async ({ pageId, status }) => {
      try {
        const task = await updateTaskStatus(pageId, status as TaskStatus);

        return {
          content: [
            {
              type: "text",
              text: formatSuccess(
                `"${task.title}" 상태가 "${status}"(으)로 변경되었습니다.`
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "상태 변경 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
