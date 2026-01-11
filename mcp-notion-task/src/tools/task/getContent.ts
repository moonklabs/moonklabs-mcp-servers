/**
 * 작업 본문 조회 도구
 * notion-task-get-content
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTaskContent } from "./getContentLogic.js";
import { formatError } from "../../utils/responseFormatter.js";

/**
 * 작업 본문 조회 도구를 등록합니다.
 */
export function registerGetContentTool(server: McpServer): void {
  server.registerTool(
    "notion-task-get-content",
    {
      description:
        "작업 상세 내용 확인 시. 진행 로그, 본문을 Markdown 형식으로 조회합니다.",
      inputSchema: z.object({
        id: z.string().describe("작업 ID (예: MKL-123) 또는 페이지 ID (UUID)"),
        maxBlocks: z
          .number()
          .min(1)
          .max(200)
          .default(50)
          .describe("최대 블록 수 (기본값: 50, 최대: 200)"),
      }),
    },
    async ({ id, maxBlocks }) => {
      try {
        const markdown = await getTaskContent(id, maxBlocks);

        if (!markdown.trim()) {
          return {
            content: [
              {
                type: "text",
                text: "본문이 비어있습니다.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: markdown,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "본문 조회 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
