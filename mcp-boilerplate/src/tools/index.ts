/**
 * 도구 모듈 엔트리포인트
 * 모든 도구를 서버에 등록하는 헬퍼 함수를 제공합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGreetTools } from "./greet.js";
import { registerCalculatorTools } from "./calculator.js";

/**
 * 모든 도구를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllTools(server: McpServer): void {
  registerGreetTools(server);
  registerCalculatorTools(server);
}

export { registerGreetTools, registerCalculatorTools };
