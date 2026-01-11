/**
 * Inbox 상세 조회 도구
 * notion-inbox-get
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getInbox } from "./getLogic.js";
import { formatInboxDetail, formatError } from "../../utils/responseFormatter.js";

/**
 * Inbox 상세 조회 도구를 등록합니다.
 */
export function registerInboxGetTool(server: McpServer): void {
  server.registerTool(
    "notion-inbox-get",
    {
      description: "Inbox(문서) 상세 조회. 속성과 본문을 포함하여 조회합니다.",
      inputSchema: z.object({
        pageId: z.string().describe("Notion 페이지 ID (UUID)"),
      }),
    },
    async ({ pageId }) => {
      try {
        const detail = await getInbox(pageId);

        // 속성 정보
        const formatted = formatInboxDetail(detail);

        // 본문 추가
        const response = [
          formatted,
          "",
          "## 본문",
          "",
          detail.content || "(본문 없음)",
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
                error instanceof Error ? error.message : "Inbox 상세 조회 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
