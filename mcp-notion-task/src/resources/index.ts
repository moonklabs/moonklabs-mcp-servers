/**
 * 리소스 모듈 엔트리포인트
 * 현재 이 MCP 서버에서는 리소스를 제공하지 않습니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * 모든 리소스를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllResources(server: McpServer): void {
  // 현재 리소스 없음
  // 필요 시 Notion 데이터베이스 스키마를 리소스로 제공 가능
}
