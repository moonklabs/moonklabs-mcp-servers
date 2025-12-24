/**
 * 리소스 모듈 엔트리포인트
 * 모든 리소스를 서버에 등록하는 헬퍼 함수를 제공합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFileResources } from "./files.js";

/**
 * 모든 리소스를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllResources(server: McpServer): void {
  registerFileResources(server);
}

export { registerFileResources };
