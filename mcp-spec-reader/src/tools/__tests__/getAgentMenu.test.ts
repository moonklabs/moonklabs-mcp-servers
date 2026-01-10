/**
 * get-agent-menu 도구 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { getAgentMenu } from '../getAgentMenuLogic.js';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const BMAD_ROOT = join(PROJECT_ROOT, '_bmad');

describe('getAgentMenu', () => {
  it('dev 에이전트 메뉴를 가져올 수 있다', async () => {
    const result = await getAgentMenu({
      bmadRoot: BMAD_ROOT,
      agent_name: 'dev',
    });

    expect(result.agent.name).toBe('dev');
    expect(result.agent.title).toBe('Developer Agent');
    expect(result.agent.icon).toBe('💻');
  });

  it('persona 정보를 가져올 수 있다', async () => {
    const result = await getAgentMenu({
      bmadRoot: BMAD_ROOT,
      agent_name: 'dev',
    });

    expect(result.persona).toBeDefined();
    expect(result.persona?.role).toBe('Senior Software Engineer');
    expect(result.persona?.identity).toContain('Executes approved stories');
  });

  it('메뉴 아이템을 가져올 수 있다', async () => {
    const result = await getAgentMenu({
      bmadRoot: BMAD_ROOT,
      agent_name: 'dev',
    });

    expect(result.menu_items.length).toBeGreaterThan(0);

    // dev-story 메뉴 아이템 찾기
    const devStoryItem = result.menu_items.find((item) =>
      item.label.includes('[DS]')
    );
    expect(devStoryItem).toBeDefined();
    expect(devStoryItem?.type).toBe('workflow');
    expect(devStoryItem?.workflow).toContain('dev-story');

    // code-review 메뉴 아이템 찾기
    const codeReviewItem = result.menu_items.find((item) =>
      item.label.includes('[CR]')
    );
    expect(codeReviewItem).toBeDefined();
    expect(codeReviewItem?.type).toBe('workflow');

    // party-mode 메뉴 아이템 찾기 (exec 타입)
    const partyModeItem = result.menu_items.find((item) =>
      item.label.includes('[PM]')
    );
    expect(partyModeItem).toBeDefined();
    expect(partyModeItem?.type).toBe('exec');
  });

  it('존재하지 않는 에이전트는 에러를 던진다', async () => {
    await expect(
      getAgentMenu({
        bmadRoot: BMAD_ROOT,
        agent_name: 'nonexistent-agent',
      })
    ).rejects.toThrow('Agent not found');
  });
});
