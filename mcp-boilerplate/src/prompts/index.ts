/**
 * 프롬프트 모듈 엔트리포인트
 * 모든 프롬프트를 서버에 등록하는 헬퍼 함수를 제공합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPromptTemplates } from "./templates.js";

/**
 * 모든 프롬프트를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllPrompts(server: McpServer): void {
  registerPromptTemplates(server);
}

export { registerPromptTemplates };
