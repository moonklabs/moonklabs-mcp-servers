/**
 * 프롬프트 모듈 엔트리포인트
 * 현재 이 MCP 서버에서는 프롬프트를 제공하지 않습니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * 모든 프롬프트를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllPrompts(server: McpServer): void {
  // 현재 프롬프트 없음
  // 필요 시 데일리 스탠드업, 작업 리포트 등 프롬프트 추가 가능
}
