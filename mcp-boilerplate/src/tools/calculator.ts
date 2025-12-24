/**
 * 계산기 도구 예제
 * 다양한 입력 스키마와 에러 처리를 보여줍니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { add, subtract, multiply, divide, calculate } from "./calculatorLogic.js";

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
          text: `${a} + ${b} = ${add(a, b)}`,
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
          text: `${a} - ${b} = ${subtract(a, b)}`,
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
          text: `${a} × ${b} = ${multiply(a, b)}`,
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
      try {
        const result = divide(a, b);
        return {
          content: [
            {
              type: "text",
              text: `${a} ÷ ${b} = ${result}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `오류: ${error instanceof Error ? error.message : '계산 오류'}`,
            },
          ],
          isError: true,
        };
      }
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
      try {
        const result = calculate(a, operator, b);

        const symbols: Record<string, string> = {
          "+": "+",
          "-": "-",
          "*": "×",
          "/": "÷",
        };

        return {
          content: [
            {
              type: "text",
              text: `${a} ${symbols[operator]} ${b} = ${result}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `오류: ${error instanceof Error ? error.message : '계산 오류'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
