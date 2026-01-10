/**
 * list-workflows 도구 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { listWorkflows } from '../listWorkflowsLogic.js';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const BMAD_ROOT = join(PROJECT_ROOT, '_bmad');

describe('listWorkflows', () => {
  it('모든 워크플로우를 조회할 수 있다', async () => {
    const result = await listWorkflows({ bmadRoot: BMAD_ROOT });

    expect(result.total_count).toBeGreaterThan(0);
    expect(result.workflows.length).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it('dev-story 워크플로우가 포함되어 있다', async () => {
    const result = await listWorkflows({ bmadRoot: BMAD_ROOT });

    const devStory = result.workflows.find((w) => w.name === 'dev-story');
    expect(devStory).toBeDefined();
    expect(devStory?.category).toBe('4-implementation');
    expect(devStory?.standalone).toBe(true);
  });

  it('카테고리로 필터링할 수 있다', async () => {
    const result = await listWorkflows({
      bmadRoot: BMAD_ROOT,
      category: '4-implementation',
    });

    expect(result.workflows.length).toBeGreaterThan(0);
    expect(result.workflows.every((w) => w.category === '4-implementation')).toBe(true);
  });

  it('standalone 워크플로우만 필터링할 수 있다', async () => {
    const result = await listWorkflows({
      bmadRoot: BMAD_ROOT,
      standalone_only: true,
    });

    expect(result.workflows.every((w) => w.standalone === true)).toBe(true);
  });

  it('존재하지 않는 카테고리로 필터링하면 빈 결과가 나온다', async () => {
    const result = await listWorkflows({
      bmadRoot: BMAD_ROOT,
      category: 'nonexistent-category',
    });

    expect(result.total_count).toBe(0);
    expect(result.workflows.length).toBe(0);
  });
});
