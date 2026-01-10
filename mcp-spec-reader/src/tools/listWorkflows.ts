/**
 * list-workflows MCP 도구
 *
 * BMAD 워크플로우 목록을 조회합니다.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listWorkflows as listWorkflowsLogic } from './listWorkflowsLogic.js';
import { getBmadRoot } from '../bmad/configResolver.js';

/**
 * 입력 스키마
 */
const ListWorkflowsInputSchema = z.object({
  category: z.string().optional().describe('Filter by category (e.g., "4-implementation")'),
  standalone_only: z
    .boolean()
    .optional()
    .describe('Filter to only show standalone workflows'),
});

/**
 * list-workflows 핸들러 함수
 */
async function handleListWorkflows(
  args: z.infer<typeof ListWorkflowsInputSchema>,
  projectRoot: string
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const { category, standalone_only } = args;
  try {
    const bmadRoot = getBmadRoot(projectRoot);

    const result = await listWorkflowsLogic({
      bmadRoot,
      category,
      standalone_only,
    });

    // 결과 포맷팅
    let text = `Found ${result.total_count} workflow(s)\n\n`;

    if (result.categories.length > 0) {
      text += `**Categories**: ${result.categories.join(', ')}\n\n`;
    }

    if (result.workflows.length === 0) {
      text += 'No workflows found matching the criteria.';
    } else {
      text += '**Workflows**:\n';
      for (const workflow of result.workflows) {
        text += `\n- **${workflow.name}** (${workflow.category})`;
        if (workflow.standalone) {
          text += ' [standalone]';
        }
        text += '\n';
        if (workflow.description) {
          text += `  ${workflow.description}\n`;
        }
        text += `  Path: ${workflow.relativePath}\n`;
      }
    }

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Failed to list workflows: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * list-workflows 도구를 MCP 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 * @param projectRoot - 프로젝트 루트 경로
 */
export function registerListWorkflowsTool(
  server: McpServer,
  projectRoot: string
): void {
  server.registerTool(
    'list-workflows',
    {
      description:
        'List all available BMAD workflows in the _bmad directory. Workflows can be filtered by category or standalone status.',
      inputSchema: ListWorkflowsInputSchema,
    },
    // @ts-ignore - MCP SDK 타입 추론 한계로 인한 우회
    (args: z.infer<typeof ListWorkflowsInputSchema>) =>
      handleListWorkflows(args, projectRoot)
  );
}
