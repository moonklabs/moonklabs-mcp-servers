/**
 * Inbox 생성 도구
 * notion-inbox-create
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createInbox } from "./createLogic.js";
import { formatInboxDetail, formatError } from "../../utils/responseFormatter.js";
import { userIdToEmail } from "../../utils/userIdToEmail.js";

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
        userIds: z
          .array(z.string())
          .optional()
          .describe("작성자 사용자 ID 배열 (이메일 앞부분, 예: ['hong', 'kim']). 미지정 시 작성자 없음"),
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
    async ({ title, userIds, tags, content }) => {
      try {
        // userId를 이메일로 변환
        const resolvedAuthors = userIds?.map((id) => userIdToEmail(id));

        const item = await createInbox({
          title,
          authors: resolvedAuthors,
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
