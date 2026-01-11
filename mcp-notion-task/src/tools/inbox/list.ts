/**
 * Inbox 목록 조회 도구
 * notion-inbox-list
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listInbox } from "./listLogic.js";
import { formatInboxList, formatError } from "../../utils/responseFormatter.js";
import type { InboxSortBy } from "../../notion/types.js";

/**
 * Inbox 목록 조회 도구를 등록합니다.
 */
export function registerInboxListTool(server: McpServer): void {
  server.registerTool(
    "notion-inbox-list",
    {
      description:
        "Inbox(문서) 목록 조회. 작성자, 태그로 필터링 가능하며 정렬을 지원합니다.",
      inputSchema: z.object({
        author: z
          .string()
          .optional()
          .describe("작성자 이메일 주소"),
        tag: z
          .string()
          .optional()
          .describe("태그 (하나)"),
        sortBy: z
          .enum(["created_time", "last_edited_time"])
          .default("last_edited_time")
          .describe("정렬 기준 (기본: 최종 편집 시간)"),
        sortDirection: z
          .enum(["ascending", "descending"])
          .default("descending")
          .describe("정렬 방향 (기본: 내림차순)"),
        pageSize: z
          .number()
          .min(1)
          .max(100)
          .default(20)
          .describe("조회할 문서 수 (기본: 20, 최대: 100)"),
      }),
    },
    async ({ author, tag, sortBy, sortDirection, pageSize }) => {
      try {
        const items = await listInbox(
          {
            author,
            tag,
          },
          sortBy as InboxSortBy,
          sortDirection,
          pageSize
        );

        const formatted = formatInboxList(items);

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
                error instanceof Error ? error.message : "Inbox 목록 조회 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
