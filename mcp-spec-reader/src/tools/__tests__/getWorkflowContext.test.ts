/**
 * get-workflow-context 도구 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { getWorkflowContext } from '../getWorkflowContextLogic.js';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const BMAD_ROOT = join(PROJECT_ROOT, '_bmad');

describe('getWorkflowContext', () => {
  it('dev-story 워크플로우 컨텍스트를 가져올 수 있다', async () => {
    const result = await getWorkflowContext({
      bmadRoot: BMAD_ROOT,
      projectRoot: PROJECT_ROOT,
      workflow_name: 'dev-story',
      load_instructions: true,
      resolve_config: true,
    });

    expect(result.workflow.name).toBe('dev-story');
    expect(result.workflow.category).toBe('4-implementation');
    expect(result.workflow.standalone).toBe(true);
    expect(result.workflow.config).toBeDefined();
  });

  it('instructions를 로드할 수 있다', async () => {
    const result = await getWorkflowContext({
      bmadRoot: BMAD_ROOT,
      projectRoot: PROJECT_ROOT,
      workflow_name: 'dev-story',
      load_instructions: true,
      resolve_config: false,
    });

    expect(result.instructions).toBeDefined();
    expect(result.instructions).toContain('<workflow>');
  });

  it('instructions 로드를 생략할 수 있다', async () => {
    const result = await getWorkflowContext({
      bmadRoot: BMAD_ROOT,
      projectRoot: PROJECT_ROOT,
      workflow_name: 'dev-story',
      load_instructions: false,
      resolve_config: false,
    });

    expect(result.instructions).toBeUndefined();
  });

  it('config 변수를 해석할 수 있다', async () => {
    const result = await getWorkflowContext({
      bmadRoot: BMAD_ROOT,
      projectRoot: PROJECT_ROOT,
      workflow_name: 'dev-story',
      load_instructions: false,
      resolve_config: true,
    });

    expect(result.resolved_variables).toBeDefined();
    expect(result.resolved_variables?.['project-root']).toBe(PROJECT_ROOT);
    expect(result.resolved_variables?.['installed_path']).toContain('dev-story');
  });

  it('실행 가이드를 생성한다', async () => {
    const result = await getWorkflowContext({
      bmadRoot: BMAD_ROOT,
      projectRoot: PROJECT_ROOT,
      workflow_name: 'dev-story',
      load_instructions: false,
      resolve_config: true,
    });

    expect(result.execution_guide).toBeDefined();
    expect(result.execution_guide).toContain('Workflow Execution Guide');
    expect(result.execution_guide).toContain('dev-story');
  });

  it('존재하지 않는 워크플로우는 에러를 던진다', async () => {
    await expect(
      getWorkflowContext({
        bmadRoot: BMAD_ROOT,
        projectRoot: PROJECT_ROOT,
        workflow_name: 'nonexistent-workflow',
        load_instructions: false,
        resolve_config: false,
      })
    ).rejects.toThrow('Workflow not found');
  });
});
