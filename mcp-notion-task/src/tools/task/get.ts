/**
 * 단일 작업 조회 도구
 * notion-task-get
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTask } from "./getLogic.js";
import { formatTaskDetail, formatError } from "../../utils/responseFormatter.js";

/**
 * 단일 작업 조회 도구를 등록합니다.
 */
export function registerGetTool(server: McpServer): void {
  server.registerTool(
    "notion-task-get",
    {
      description: "작업 상세 정보를 조회합니다. 페이지 ID로 특정 작업의 모든 속성을 확인할 수 있습니다.",
      inputSchema: z.object({
        pageId: z.string().describe("조회할 작업의 Notion 페이지 ID"),
      }),
    },
    async ({ pageId }) => {
      try {
        const task = await getTask(pageId);
        const formatted = formatTaskDetail(task);

        return {
          content: [
            {
              type: "text",
              text: formatted,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "작업 조회 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
