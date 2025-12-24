/**
 * 계산기 도구 예제
 * 다양한 입력 스키마와 에러 처리를 보여줍니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * 계산기 도구들을 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerCalculatorTools(server: McpServer): void {
  // 덧셈
  server.registerTool(
    "add",
    {
      description: "두 숫자를 더합니다.",
      inputSchema: z.object({
        a: z.number().describe("첫 번째 숫자"),
        b: z.number().describe("두 번째 숫자"),
      }),
    },
    async ({ a, b }) => ({
      content: [
        {
          type: "text",
          text: `${a} + ${b} = ${a + b}`,
        },
      ],
    })
  );

  // 뺄셈
  server.registerTool(
    "subtract",
    {
      description: "첫 번째 숫자에서 두 번째 숫자를 뺍니다.",
      inputSchema: z.object({
        a: z.number().describe("첫 번째 숫자"),
        b: z.number().describe("두 번째 숫자"),
      }),
    },
    async ({ a, b }) => ({
      content: [
        {
          type: "text",
          text: `${a} - ${b} = ${a - b}`,
        },
      ],
    })
  );

  // 곱셈
  server.registerTool(
    "multiply",
    {
      description: "두 숫자를 곱합니다.",
      inputSchema: z.object({
        a: z.number().describe("첫 번째 숫자"),
        b: z.number().describe("두 번째 숫자"),
      }),
    },
    async ({ a, b }) => ({
      content: [
        {
          type: "text",
          text: `${a} × ${b} = ${a * b}`,
        },
      ],
    })
  );

  // 나눗셈 (에러 처리 예제)
  server.registerTool(
    "divide",
    {
      description: "첫 번째 숫자를 두 번째 숫자로 나눕니다.",
      inputSchema: z.object({
        a: z.number().describe("피제수 (나눠지는 수)"),
        b: z.number().describe("제수 (나누는 수)"),
      }),
    },
    async ({ a, b }) => {
      if (b === 0) {
        return {
          content: [
            {
              type: "text",
              text: "오류: 0으로 나눌 수 없습니다.",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `${a} ÷ ${b} = ${a / b}`,
          },
        ],
      };
    }
  );

  // 복합 계산 (여러 연산)
  server.registerTool(
    "calculate",
    {
      description: "수식을 계산합니다. 지원 연산: +, -, *, /",
      inputSchema: z.object({
        a: z.number().describe("첫 번째 숫자"),
        operator: z.enum(["+", "-", "*", "/"]).describe("연산자"),
        b: z.number().describe("두 번째 숫자"),
      }),
    },
    async ({ a, operator, b }) => {
      let result: number;
      let symbol: string;

      switch (operator) {
        case "+":
          result = a + b;
          symbol = "+";
          break;
        case "-":
          result = a - b;
          symbol = "-";
          break;
        case "*":
          result = a * b;
          symbol = "×";
          break;
        case "/":
          if (b === 0) {
            return {
              content: [{ type: "text", text: "오류: 0으로 나눌 수 없습니다." }],
              isError: true,
            };
          }
          result = a / b;
          symbol = "÷";
          break;
      }

      return {
        content: [
          {
            type: "text",
            text: `${a} ${symbol} ${b} = ${result}`,
          },
        ],
      };
    }
  );
}
