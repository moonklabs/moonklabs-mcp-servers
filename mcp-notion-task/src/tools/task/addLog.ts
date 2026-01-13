/**
 * 진행 로그 추가 도구
 * notion-task-add-log
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addTaskLogAfterChangelog } from "./addLogLogic.js";
import { formatSuccess, formatError } from "../../utils/responseFormatter.js";
import { getUserIdFromHeader } from "../../utils/headerUtils.js";
import type { LogType, LOG_TYPE_ICONS } from "../../notion/types.js";

/**
 * 진행 로그 추가 도구를 등록합니다.
 */
export function registerAddLogTool(server: McpServer): void {
  server.registerTool(
    "notion-task-add-log",
    {
      description:
        "작업 중 진행상황 기록.",
      inputSchema: z.object({
        id: z.string().describe("작업 ID (예: MKL-123) 또는 페이지 ID (UUID)"),
        content: z
          .string()
          .describe("로그 내용 (Markdown 형식, 예: '- API 구현 완료\\n- 테스트 작성 중')"),
        author: z
          .string()
          .optional()
          .describe("작성자 이름 또는 사용자 ID. 미지정 시 X-User-Id 헤더에서 읽음"),
        logType: z
          .enum(["progress", "blocker", "decision", "note"])
          .default("progress")
          .describe(
            "로그 타입: progress(🔄 진행), blocker(🚧 블로커), decision(✅ 결정), note(📌 메모)"
          ),
      }),
    },
    async ({ id, content, author, logType }, extra) => {
      try {
        // author 파라미터 → X-User-Id 헤더 fallback
        const resolvedAuthor = author || getUserIdFromHeader(extra);

        if (!resolvedAuthor) {
          return {
            content: [
              {
                type: "text",
                text: formatError("author 파라미터 또는 X-User-Id 헤더가 필요합니다."),
              },
            ],
            isError: true,
          };
        }

        const result = await addTaskLogAfterChangelog(
          id,
          content,
          resolvedAuthor,
          logType as LogType
        );

        const icons: Record<LogType, string> = {
          progress: "🔄 진행",
          blocker: "🚧 블로커",
          decision: "✅ 결정",
          note: "📌 메모",
        };

        return {
          content: [
            {
              type: "text",
              text: formatSuccess(
                `${icons[logType as LogType]} 로그가 추가되었습니다. (${result.blockCount}개 블록)`
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
                error instanceof Error ? error.message : "로그 추가 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
