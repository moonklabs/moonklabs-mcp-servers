/**
 * 진행 로그 추가 도구
 * notion-task-add-log
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addTaskLogAfterChangelog } from "./addLogLogic.js";
import { formatSuccess, formatError } from "../../utils/responseFormatter.js";
import type { LogType, LOG_TYPE_ICONS } from "../../notion/types.js";

/**
 * 진행 로그 추가 도구를 등록합니다.
 */
export function registerAddLogTool(server: McpServer): void {
  server.registerTool(
    "notion-task-add-log",
    {
      description:
        "작업에 진행 로그를 추가합니다. Markdown 형식으로 작성할 수 있으며, Changelog 섹션에 자동으로 타임스탬프와 함께 기록됩니다.",
      inputSchema: z.object({
        pageId: z.string().describe("작업 페이지 ID"),
        content: z
          .string()
          .describe("로그 내용 (Markdown 형식, 예: '- API 구현 완료\\n- 테스트 작성 중')"),
        author: z
          .string()
          .describe("작성자 이름 또는 이메일 (예: '홍길동' 또는 'user@example.com')"),
        logType: z
          .enum(["progress", "blocker", "decision", "note"])
          .default("progress")
          .describe(
            "로그 타입: progress(🔄 진행), blocker(🚧 블로커), decision(✅ 결정), note(📌 메모)"
          ),
      }),
    },
    async ({ pageId, content, author, logType }) => {
      try {
        const result = await addTaskLogAfterChangelog(
          pageId,
          content,
          author,
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
