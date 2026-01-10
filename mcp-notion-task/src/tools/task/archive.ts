/**
 * 작업 아카이브 도구
 * notion-task-archive
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { archiveTask } from "./archiveLogic.js";
import { formatSuccess, formatError } from "../../utils/responseFormatter.js";

/**
 * 작업 아카이브 도구를 등록합니다.
 */
export function registerArchiveTool(server: McpServer): void {
  server.registerTool(
    "notion-task-archive",
    {
      description:
        "오래된 작업 정리 시. 아카이브하면 기본 목록에서 제외되지만, 복원 가능합니다.",
      inputSchema: z.object({
        id: z.string().describe("작업 ID (예: MKL-123) 또는 페이지 ID (UUID)"),
      }),
    },
    async ({ id }) => {
      try {
        await archiveTask(id);

        return {
          content: [
            {
              type: "text",
              text: formatSuccess("작업이 아카이브되었습니다."),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "아카이브 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
