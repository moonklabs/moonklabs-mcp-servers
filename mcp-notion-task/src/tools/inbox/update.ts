/**
 * Inbox 수정 도구
 * notion-inbox-update
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { updateInbox } from "./updateLogic.js";
import { formatInboxDetail, formatError } from "../../utils/responseFormatter.js";

/**
 * Inbox 수정 도구를 등록합니다.
 */
export function registerInboxUpdateTool(server: McpServer): void {
  server.registerTool(
    "notion-inbox-update",
    {
      description:
        "Inbox(문서) 수정 시. 제목, 작성자, 태그를 한 번에 업데이트합니다.",
      inputSchema: z.object({
        id: z.string().describe("페이지 ID (UUID)"),
        title: z.string().optional().describe("새 제목"),
        authors: z
          .array(z.string())
          .optional()
          .describe("작성자 이메일 배열 (기존 작성자를 대체)"),
        tags: z
          .array(z.string())
          .optional()
          .describe("태그 배열 (기존 태그를 대체)"),
      }),
    },
    async ({ id, title, authors, tags }) => {
      try {
        const item = await updateInbox(id, {
          title,
          authors,
          tags,
        });

        const formatted = formatInboxDetail(item);

        const response = [
          `✅ Inbox 문서가 수정되었습니다.\n`,
          formatted,
        ].join("\n");

        return {
          content: [
            {
              type: "text",
              text: response,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "Inbox 수정 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
