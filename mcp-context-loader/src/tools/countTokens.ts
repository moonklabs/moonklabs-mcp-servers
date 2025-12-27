/**
 * count-tokens MCP 도구 등록
 *
 * 텍스트의 토큰 수를 계산하는 MCP 도구입니다.
 * AI 에이전트가 컨텍스트 윈도우 한도를 초과하지 않도록 계획하는 데 사용됩니다.
 *
 * @module tools/countTokens
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createMcpError } from "@moonklabs/mcp-common";
import {
  countTokens,
  SUPPORTED_MODELS,
  isSupportedModel,
} from "./countTokensLogic.js";

/**
 * count-tokens 도구를 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 *
 * @example
 * ```typescript
 * import { registerCountTokensTool } from "./countTokens.js";
 *
 * const server = new McpServer({ name: "my-server", version: "1.0.0" });
 * registerCountTokensTool(server);
 * ```
 */
export function registerCountTokensTool(server: McpServer): void {
  server.registerTool(
    "count-tokens",
    {
      description:
        "텍스트의 토큰 수를 계산합니다. AI 에이전트가 컨텍스트 윈도우 한도를 초과하지 않도록 계획하는 데 사용합니다.",
      inputSchema: z.object({
        text: z.string().describe("토큰 수를 계산할 텍스트"),
        model: z
          .string()
          .optional()
          .describe(
            "토크나이저 모델 (기본: gpt-4). 지원 모델: gpt-4, gpt-3.5-turbo, gpt-4o, claude"
          ),
      }),
    },
    async ({ text, model }) => {
      const actualModel = model ?? "gpt-4";

      // 지원하지 않는 모델 에러 처리
      if (!isSupportedModel(actualModel)) {
        const error = createMcpError(
          "UNSUPPORTED_MODEL",
          `지원하지 않는 모델입니다: ${actualModel}`,
          "기본 모델 gpt-4를 사용하거나 지원 모델 목록을 확인하세요",
          { available_options: [...SUPPORTED_MODELS] }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(error, null, 2),
            },
          ],
          isError: true,
        };
      }

      // 토큰 수 계산
      try {
        const result = countTokens(text, actualModel);

        // 성공 응답
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        // 예기치 않은 에러 처리
        const error = createMcpError(
          "INTERNAL_ERROR",
          `토큰 계산 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`,
          "다시 시도하거나, 다른 텍스트로 시도해 보세요"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(error, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
