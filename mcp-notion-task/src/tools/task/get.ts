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
      description: "작업 속성 확인 시. 본문 제외, 메타데이터(상태, 우선순위 등)만 조회합니다.",
      inputSchema: z.object({
        id: z.string().describe("작업 ID (예: MKL-123) 또는 페이지 ID (UUID)"),
      }),
    },
    async ({ id }) => {
      try {
        const task = await getTask(id);
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
