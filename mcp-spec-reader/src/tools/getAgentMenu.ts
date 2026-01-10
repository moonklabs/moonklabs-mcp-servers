/**
 * get-agent-menu MCP 도구
 *
 * BMAD 에이전트의 메뉴 정보를 조회합니다.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAgentMenu as getAgentMenuLogic } from './getAgentMenuLogic.js';
import { getBmadRoot } from '../bmad/configResolver.js';

/**
 * 입력 스키마
 */
const GetAgentMenuInputSchema = z.object({
  agent_name: z.string().describe('Name of the agent to load menu for'),
});

/**
 * get-agent-menu 핸들러 함수
 */
async function handleGetAgentMenu(
  args: z.infer<typeof GetAgentMenuInputSchema>,
  projectRoot: string
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const { agent_name } = args;

  try {
    const bmadRoot = getBmadRoot(projectRoot);

    const result = await getAgentMenuLogic({
      bmadRoot,
      agent_name,
    });

    // 결과 포맷팅
    let text = `# Agent Menu: ${result.agent.name}\n\n`;

    text += `**Title**: ${result.agent.title}`;
    if (result.agent.icon) {
      text += ` ${result.agent.icon}`;
    }
    text += '\n';

    if (result.agent.description) {
      text += `**Description**: ${result.agent.description}\n`;
    }

    text += `**Path**: \`${result.agent.path}\`\n`;

    // Persona
    if (result.persona) {
      text += `\n## Persona\n\n`;

      if (result.persona.role) {
        text += `**Role**: ${result.persona.role}\n`;
      }

      if (result.persona.identity) {
        text += `**Identity**: ${result.persona.identity}\n`;
      }

      if (result.persona.communication_style) {
        text += `**Communication Style**: ${result.persona.communication_style}\n`;
      }
    }

    // Menu Items
    text += `\n## Menu Items (${result.menu_items.length})\n\n`;

    for (const item of result.menu_items) {
      text += `### ${item.label}\n\n`;

      if (item.cmd) {
        text += `- **Command**: \`${item.cmd}\`\n`;
      }

      text += `- **Type**: ${item.type}\n`;

      if (item.workflow) {
        text += `- **Workflow**: \`${item.workflow}\`\n`;
      }

      if (item.exec) {
        text += `- **Execute**: \`${item.exec}\`\n`;
      }

      text += '\n';
    }

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Failed to get agent menu: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * get-agent-menu 도구를 MCP 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 * @param projectRoot - 프로젝트 루트 경로
 */
export function registerGetAgentMenuTool(server: McpServer, projectRoot: string): void {
  server.registerTool(
    'get-agent-menu',
    {
      description:
        'Get menu information for a BMAD agent including persona and available actions.',
      inputSchema: GetAgentMenuInputSchema,
    },
    // @ts-ignore - MCP SDK 타입 추론 한계로 인한 우회
    (args: z.infer<typeof GetAgentMenuInputSchema>) =>
      handleGetAgentMenu(args, projectRoot)
  );
}
