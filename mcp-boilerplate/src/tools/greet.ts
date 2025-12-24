/**
 * 인사 도구 예제
 * MCP 도구의 기본 사용법을 보여줍니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createGreetMessage, createMultiGreetMessages } from "./greetLogic.js";

/**
 * 인사 도구들을 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerGreetTools(server: McpServer): void {
  // 기본 인사 도구
  server.registerTool(
    "greet",
    {
      description: "이름을 입력받아 인사말을 반환합니다.",
      inputSchema: z.object({
        name: z.string().describe("인사할 대상의 이름"),
      }),
    },
    async ({ name }) => ({
      content: [
        {
          type: "text",
          text: createGreetMessage(name),
        },
      ],
    })
  );

  // 다중 인사 도구 (스트리밍 예제)
  server.registerTool(
    "multi-greet",
    {
      description: "여러 번 인사하며 각 인사 사이에 지연이 있습니다.",
      inputSchema: z.object({
        name: z.string().describe("인사할 대상의 이름"),
        count: z.number().min(1).max(5).default(3).describe("인사 횟수 (1-5)"),
      }),
    },
    async ({ name, count }) => {
      const greetings = createMultiGreetMessages(name, count);

      return {
        content: [
          {
            type: "text",
            text: greetings.join("\n"),
          },
        ],
      };
    }
  );
}
