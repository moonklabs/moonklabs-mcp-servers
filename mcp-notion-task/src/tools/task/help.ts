/**
 * Help 도구
 * notion-task-help
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getHelpContent } from "./helpLogic.js";

/**
 * Help 도구를 등록합니다.
 */
export function registerHelpTool(server: McpServer): void {
  server.registerTool(
    "notion-task-help",
    {
      description:
        "사용 가능한 도구와 워크플로우를 안내합니다. 처음 사용 시 또는 사용법 확인 시 호출하세요.",
      inputSchema: z.object({
        topic: z
          .enum(["all", "workflow", "status", "sprint"])
          .optional()
          .describe(
            "조회할 주제 (선택): all=전체 도구 목록, workflow=작업 흐름, status=상태값 설명, sprint=스프린트 사용법. 미지정 시 기본 개요 제공"
          ),
      }),
    },
    async ({ topic }) => {
      const content = getHelpContent(topic);

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }
  );
}
