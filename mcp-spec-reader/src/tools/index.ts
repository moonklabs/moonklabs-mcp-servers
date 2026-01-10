/**
 * 도구 모듈 엔트리포인트
 * 모든 도구를 서버에 등록하는 헬퍼 함수를 제공합니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListWorkflowsTool } from "./listWorkflows.js";
import { registerGetWorkflowContextTool } from "./getWorkflowContext.js";
import { registerGetAgentMenuTool } from "./getAgentMenu.js";
import { join } from "path";

// 프로젝트 루트 경로 (mcp-spec-reader -> workspace root)
const PROJECT_ROOT = join(process.cwd(), '..');

/**
 * 모든 도구를 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerAllTools(server: McpServer): void {
  // BMAD 워크플로우 도구
  registerListWorkflowsTool(server, PROJECT_ROOT);
  registerGetWorkflowContextTool(server, PROJECT_ROOT);
  registerGetAgentMenuTool(server, PROJECT_ROOT);

  // Notion 스펙 도구들은 Story 3.2부터 구현 예정
  // - list-specs: Notion 데이터베이스의 스펙 문서 목록 조회
  // - read-spec: Notion 페이지 내용을 Markdown으로 변환
  // - summarize-spec: 긴 스펙 문서 요약 (Phase 1.5)
  // - get-spec-section: 특정 섹션만 로드
}
