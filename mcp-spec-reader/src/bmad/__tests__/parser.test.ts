/**
 * BMAD parser 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { parseWorkflowYaml, loadWorkflow, isWorkflowDirectory } from '../parser.js';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const BMAD_ROOT = join(PROJECT_ROOT, '_bmad');
const DEV_STORY_PATH = join(BMAD_ROOT, 'bmm/workflows/4-implementation/dev-story');

describe('BMAD Parser', () => {
  describe('parseWorkflowYaml', () => {
    it('dev-story workflow.yaml을 파싱할 수 있다', async () => {
      const workflowPath = join(DEV_STORY_PATH, 'workflow.yaml');
      const config = await parseWorkflowYaml(workflowPath);

      expect(config.name).toBe('dev-story');
      expect(config.description).toBeDefined();
      expect(config.standalone).toBe(true);
      expect(config.config_source).toBeDefined();
      expect(config.instructions).toBeDefined();
    });

    it('name 필드가 없으면 에러를 던진다', async () => {
      // 유효하지 않은 파일 경로 (존재하지 않음)
      const invalidPath = join(PROJECT_ROOT, 'nonexistent.yaml');
      await expect(parseWorkflowYaml(invalidPath)).rejects.toThrow();
    });
  });

  describe('loadWorkflow', () => {
    it('워크플로우 전체 정보를 로드할 수 있다', async () => {
      const workflowInfo = await loadWorkflow(DEV_STORY_PATH, {
        loadInstructions: true,
        loadValidation: false,
        loadTemplate: false,
      });

      expect(workflowInfo.name).toBe('dev-story');
      expect(workflowInfo.path).toBe(DEV_STORY_PATH);
      expect(workflowInfo.config).toBeDefined();
      expect(workflowInfo.instructions).toBeDefined();
      expect(workflowInfo.instructions).toContain('<workflow>');
    });

    it('instructions 로드를 생략할 수 있다', async () => {
      const workflowInfo = await loadWorkflow(DEV_STORY_PATH, {
        loadInstructions: false,
      });

      expect(workflowInfo.instructions).toBeUndefined();
    });
  });

  describe('isWorkflowDirectory', () => {
    it('dev-story 디렉토리는 워크플로우 디렉토리다', async () => {
      const result = await isWorkflowDirectory(DEV_STORY_PATH);
      expect(result).toBe(true);
    });

    it('일반 디렉토리는 워크플로우 디렉토리가 아니다', async () => {
      const result = await isWorkflowDirectory(PROJECT_ROOT);
      expect(result).toBe(false);
    });
  });
});
