/**
 * Inbox 생성 도구
 * notion-inbox-create
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createInbox } from "./createLogic.js";
import { formatInboxDetail, formatError } from "../../utils/responseFormatter.js";

/**
 * Inbox 생성 도구를 등록합니다.
 */
export function registerInboxCreateTool(server: McpServer): void {
  server.registerTool(
    "notion-inbox-create",
    {
      description: "새 Inbox(문서)를 생성합니다. 제목, 작성자, 태그, 본문을 지정할 수 있습니다.",
      inputSchema: z.object({
        title: z.string().describe("문서 제목"),
        authors: z
          .array(z.string())
          .optional()
          .describe("작성자 이메일 배열"),
        tags: z
          .array(z.string())
          .optional()
          .describe("태그 배열"),
        content: z
          .string()
          .optional()
          .describe("초기 본문 (Markdown 형식)"),
      }),
    },
    async ({ title, authors, tags, content }) => {
      try {
        const item = await createInbox({
          title,
          authors,
          tags,
          content,
        });

        const formatted = formatInboxDetail(item);

        const response = [
          "✅ Inbox 문서가 생성되었습니다.\n",
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
                error instanceof Error ? error.message : "Inbox 생성 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
