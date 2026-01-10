/**
 * get-agent-menu 도구 비즈니스 로직
 *
 * BMAD 에이전트의 메뉴 정보를 조회합니다.
 */

import { readdir } from 'fs/promises';
import { join } from 'path';
import { parseAgentFile, type AgentInfo, type MenuItem } from '../bmad/agentParser.js';

/**
 * get-agent-menu 응답
 */
export interface GetAgentMenuResponse {
  agent: {
    name: string;
    description?: string;
    title: string;
    icon?: string;
    path: string;
  };
  persona?: {
    role?: string;
    identity?: string;
    communication_style?: string;
  };
  menu_items: Array<{
    cmd?: string;
    label: string;
    workflow?: string;
    exec?: string;
    type: 'workflow' | 'exec' | 'action' | 'other';
  }>;
}

/**
 * 메뉴 아이템 타입을 결정합니다.
 *
 * @param item - 메뉴 아이템
 * @returns 타입 문자열
 */
function determineMenuItemType(item: MenuItem): 'workflow' | 'exec' | 'action' | 'other' {
  if (item.workflow) return 'workflow';
  if (item.exec) return 'exec';
  if (item.action) return 'action';
  return 'other';
}

/**
 * 에이전트 파일을 검색합니다.
 *
 * @param agentsDir - 에이전트 디렉토리
 * @param agentName - 에이전트 이름
 * @returns 에이전트 파일 경로 또는 null
 */
async function findAgentFile(
  agentsDir: string,
  agentName: string
): Promise<string | null> {
  try {
    const entries = await readdir(agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.md')) continue;

      const fullPath = join(agentsDir, entry.name);

      // 파일명에서 확장자를 제거한 이름과 비교
      const baseName = entry.name.replace('.md', '');
      if (baseName === agentName) {
        return fullPath;
      }

      // 또는 파일을 읽어서 name 필드 확인
      try {
        const agentInfo = await parseAgentFile(fullPath);
        if (agentInfo.name === agentName) {
          return fullPath;
        }
      } catch {
        // 파싱 실패 시 무시
      }
    }
  } catch (error) {
    console.warn(`Failed to scan agents directory ${agentsDir}:`, error);
  }

  return null;
}

/**
 * 에이전트 메뉴 정보를 가져옵니다.
 *
 * @param options - 조회 옵션
 * @returns 에이전트 메뉴 정보
 */
export async function getAgentMenu(options: {
  bmadRoot: string;
  agent_name: string;
}): Promise<GetAgentMenuResponse> {
  const { bmadRoot, agent_name } = options;

  // 1. 에이전트 파일 찾기
  const agentsDir = join(bmadRoot, 'bmm/agents');
  const agentFilePath = await findAgentFile(agentsDir, agent_name);

  if (!agentFilePath) {
    throw new Error(`Agent not found: ${agent_name}`);
  }

  // 2. 에이전트 파일 파싱
  const agentInfo: AgentInfo = await parseAgentFile(agentFilePath);

  // 3. 메뉴 아이템 변환
  const menu_items = agentInfo.menu.map((item) => ({
    cmd: item.cmd,
    label: item.label,
    workflow: item.workflow,
    exec: item.exec,
    type: determineMenuItemType(item),
  }));

  // 4. 응답 구성
  return {
    agent: {
      name: agentInfo.name,
      description: agentInfo.description,
      title: agentInfo.agent.title,
      icon: agentInfo.agent.icon,
      path: agentFilePath,
    },
    persona: agentInfo.persona
      ? {
          role: agentInfo.persona.role,
          identity: agentInfo.persona.identity,
          communication_style: agentInfo.persona.communication_style,
        }
      : undefined,
    menu_items,
  };
}
