/**
 * BMAD agentParser 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { parseAgentFile } from '../agentParser.js';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const BMAD_ROOT = join(PROJECT_ROOT, '_bmad');
const DEV_AGENT_PATH = join(BMAD_ROOT, 'bmm/agents/dev.md');

describe('BMAD agentParser', () => {
  describe('parseAgentFile', () => {
    it('dev.md 에이전트 파일을 파싱할 수 있다', async () => {
      const agentInfo = await parseAgentFile(DEV_AGENT_PATH);

      expect(agentInfo.name).toBe('dev');
      expect(agentInfo.description).toBe('Developer Agent');
      expect(agentInfo.filePath).toBe(DEV_AGENT_PATH);

      // agent 태그 속성
      expect(agentInfo.agent.id).toBe('dev.agent.yaml');
      expect(agentInfo.agent.name).toBe('Amelia');
      expect(agentInfo.agent.title).toBe('Developer Agent');
      expect(agentInfo.agent.icon).toBe('💻');
    });

    it('persona 섹션을 파싱한다', async () => {
      const agentInfo = await parseAgentFile(DEV_AGENT_PATH);

      expect(agentInfo.persona).toBeDefined();
      expect(agentInfo.persona?.role).toBe('Senior Software Engineer');
      expect(agentInfo.persona?.identity).toContain('Executes approved stories');
      expect(agentInfo.persona?.communication_style).toContain('Ultra-succinct');
      expect(agentInfo.persona?.principles).toContain('Story File is the single source');
    });

    it('menu 섹션을 파싱한다', async () => {
      const agentInfo = await parseAgentFile(DEV_AGENT_PATH);

      expect(agentInfo.menu.length).toBeGreaterThanOrEqual(4);

      // 첫 번째 메뉴 아이템
      const firstItem = agentInfo.menu[0];
      expect(firstItem.cmd).toBe('*menu');
      expect(firstItem.label).toBe('[M] Redisplay Menu Options');

      // dev-story 메뉴 아이템
      const devStoryItem = agentInfo.menu.find((item) => item.label.includes('[DS]'));
      expect(devStoryItem).toBeDefined();
      expect(devStoryItem?.cmd).toContain('dev-story');
      expect(devStoryItem?.workflow).toContain('dev-story/workflow.yaml');

      // code-review 메뉴 아이템
      const codeReviewItem = agentInfo.menu.find((item) => item.label.includes('[CR]'));
      expect(codeReviewItem).toBeDefined();
      expect(codeReviewItem?.workflow).toContain('code-review/workflow.yaml');

      // party-mode 메뉴 아이템 (exec 속성)
      const partyModeItem = agentInfo.menu.find((item) => item.label.includes('[PM]'));
      expect(partyModeItem).toBeDefined();
      expect(partyModeItem?.exec).toContain('party-mode/workflow.md');
    });

    it('activation 섹션을 추출한다', async () => {
      const agentInfo = await parseAgentFile(DEV_AGENT_PATH);

      expect(agentInfo.activation).toBeDefined();
      expect(agentInfo.activation).toContain('<step n="1">');
      expect(agentInfo.activation).toContain('menu-handlers');
    });

    it('유효하지 않은 에이전트 파일은 에러를 던진다', async () => {
      const invalidPath = join(PROJECT_ROOT, 'nonexistent.md');
      await expect(parseAgentFile(invalidPath)).rejects.toThrow();
    });
  });
});
