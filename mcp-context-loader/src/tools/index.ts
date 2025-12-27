/**
 * 도구 모듈 엔트리포인트
 *
 * 모든 MCP 도구를 서버에 등록하는 헬퍼 함수를 제공합니다.
 * 새 도구 추가 시 이 파일에서 import하고 registerAllTools에서 호출하세요.
 *
 * @module tools
 *
 * @example
 * ```typescript
 * // 새 도구 추가 방법:
 * // 1. src/tools/myTool.ts 생성 (도구 등록)
 * // 2. src/tools/myToolLogic.ts 생성 (비즈니스 로직)
 * // 3. 아래에 import 추가
 * // 4. registerAllTools에서 호출
 *
 * import { registerMyTool } from "./myTool.js";
 *
 * export function registerAllTools(server: McpServer): void {
 *   registerMyTool(server);
 * }
 * ```
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// 도구 import
import { registerCountTokensTool } from "./countTokens.js";
import { registerLoadContextTool } from "./loadContext.js";

/**
 * 모든 도구를 서버에 등록합니다.
 *
 * @param server MCP 서버 인스턴스
 */
export function registerAllTools(server: McpServer): void {
  // 도구 등록
  registerCountTokensTool(server);
  registerLoadContextTool(server);
}
