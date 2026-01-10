/**
 * get-workflow-context MCP 도구
 *
 * 워크플로우 실행에 필요한 모든 컨텍스트를 가져옵니다.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getWorkflowContext as getWorkflowContextLogic } from './getWorkflowContextLogic.js';
import { getBmadRoot } from '../bmad/configResolver.js';

/**
 * 입력 스키마
 */
const GetWorkflowContextInputSchema = z.object({
  workflow_name: z.string().describe('Name of the workflow to load context for'),
  load_instructions: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to load instructions.xml file'),
  resolve_config: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to resolve config variables'),
});

/**
 * get-workflow-context 핸들러 함수
 */
async function handleGetWorkflowContext(
  args: z.infer<typeof GetWorkflowContextInputSchema>,
  projectRoot: string
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const { workflow_name, load_instructions, resolve_config } = args;

  try {
    const bmadRoot = getBmadRoot(projectRoot);

    const result = await getWorkflowContextLogic({
      bmadRoot,
      projectRoot,
      workflow_name,
      load_instructions,
      resolve_config,
    });

    // 결과 포맷팅
    let text = `# Workflow Context: ${result.workflow.name}\n\n`;

    text += `**Category**: ${result.workflow.category}\n`;
    text += `**Path**: \`${result.workflow.relativePath}\`\n`;

    if (result.workflow.description) {
      text += `**Description**: ${result.workflow.description}\n`;
    }

    if (result.workflow.standalone) {
      text += `**Type**: Standalone\n`;
    }

    if (result.workflow.author) {
      text += `**Author**: ${result.workflow.author}\n`;
    }

    text += `\n---\n\n`;

    // 해석된 변수들
    if (result.resolved_variables && Object.keys(result.resolved_variables).length > 0) {
      text += `## Resolved Variables\n\n`;
      for (const [key, value] of Object.entries(result.resolved_variables)) {
        text += `- **{${key}}**: \`${value}\`\n`;
      }
      text += `\n`;
    }

    // Instructions
    if (result.instructions) {
      text += `## Instructions\n\n`;
      text += '```xml\n';
      text += result.instructions;
      text += '\n```\n\n';
    }

    // Execution Guide
    text += `---\n\n`;
    text += result.execution_guide;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Failed to get workflow context: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * get-workflow-context 도구를 MCP 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 * @param projectRoot - 프로젝트 루트 경로
 */
export function registerGetWorkflowContextTool(
  server: McpServer,
  projectRoot: string
): void {
  server.registerTool(
    'get-workflow-context',
    {
      description:
        'Get execution context for a BMAD workflow including resolved variables, instructions, and execution guide.',
      inputSchema: GetWorkflowContextInputSchema,
    },
    // @ts-ignore - MCP SDK 타입 추론 한계로 인한 우회
    (args: z.infer<typeof GetWorkflowContextInputSchema>) =>
      handleGetWorkflowContext(args, projectRoot)
  );
}
