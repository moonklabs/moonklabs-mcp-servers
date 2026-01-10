/**
 * 도구 모듈 엔트리포인트
 * 모든 Notion Task 도구를 서버에 등록합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// 핵심 도구
import { registerMySprintTool } from "./task/mySprint.js";
import { registerUpdateStatusTool } from "./task/updateStatus.js";
import { registerUpdateTool } from "./task/update.js";
import { registerAddLogTool } from "./task/addLog.js";
import { registerGetContentTool } from "./task/getContent.js";

// 보조 도구
import { registerGetTool } from "./task/get.js";
import { registerListTool } from "./task/list.js";
import { registerCreateTool } from "./task/create.js";
import { registerArchiveTool } from "./task/archive.js";

// 도움말 도구
import { registerHelpTool } from "./task/help.js";

/**
 * 모든 도구를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllTools(server: McpServer): void {
  // 핵심 도구 (주요 유즈케이스)
  registerMySprintTool(server);      // notion-task-my-sprint
  registerUpdateStatusTool(server);  // notion-task-update-status
  registerUpdateTool(server);        // notion-task-update
  registerAddLogTool(server);        // notion-task-add-log
  registerGetContentTool(server);    // notion-task-get-content

  // 보조 도구
  registerGetTool(server);           // notion-task-get
  registerListTool(server);          // notion-task-list
  registerCreateTool(server);        // notion-task-create
  registerArchiveTool(server);       // notion-task-archive

  // 도움말 도구
  registerHelpTool(server);          // notion-task-help
}

// 개별 등록 함수들도 export
export {
  registerMySprintTool,
  registerUpdateStatusTool,
  registerUpdateTool,
  registerAddLogTool,
  registerGetContentTool,
  registerGetTool,
  registerListTool,
  registerCreateTool,
  registerArchiveTool,
  registerHelpTool,
};
