/**
 * list-workflows 도구 비즈니스 로직
 *
 * _bmad 디렉토리에서 모든 워크플로우를 스캔하고 목록을 반환합니다.
 */

import { readdir, stat } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { parseWorkflowYaml, isWorkflowDirectory } from '../bmad/parser.js';

/**
 * 워크플로우 목록 아이템
 */
export interface WorkflowListItem {
  name: string;
  description?: string;
  category: string;
  path: string;
  relativePath: string;
  standalone?: boolean;
  author?: string;
}

/**
 * list-workflows 응답
 */
export interface ListWorkflowsResponse {
  workflows: WorkflowListItem[];
  total_count: number;
  categories: string[];
}

/**
 * 재귀적으로 디렉토리를 탐색하여 workflow.yaml이 있는 디렉토리를 찾습니다.
 *
 * @param dir - 탐색할 디렉토리
 * @param bmadRoot - BMAD 루트 경로 (상대 경로 계산용)
 * @param results - 누적 결과 배열
 */
async function findWorkflowDirectories(
  dir: string,
  bmadRoot: string,
  results: string[] = []
): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // workflow.yaml이 있는지 확인
        if (await isWorkflowDirectory(fullPath)) {
          results.push(fullPath);
        }

        // 하위 디렉토리도 재귀 탐색
        await findWorkflowDirectories(fullPath, bmadRoot, results);
      }
    }
  } catch (error) {
    // 접근 권한 등의 문제로 실패해도 계속 진행
    console.warn(`Failed to scan directory ${dir}:`, error);
  }

  return results;
}

/**
 * 워크플로우 경로에서 카테고리를 추출합니다.
 *
 * 예: _bmad/bmm/workflows/4-implementation/dev-story → "4-implementation"
 *
 * @param relativePath - BMAD 루트 기준 상대 경로
 * @returns 카테고리 문자열
 */
function extractCategory(relativePath: string): string {
  const parts = relativePath.split('/');

  // workflows 디렉토리 다음 경로가 카테고리
  const workflowsIndex = parts.indexOf('workflows');
  if (workflowsIndex !== -1 && workflowsIndex + 1 < parts.length) {
    return parts[workflowsIndex + 1];
  }

  // workflows가 없으면 상위 디렉토리 이름을 카테고리로
  return parts[parts.length - 2] || 'unknown';
}

/**
 * BMAD 워크플로우 목록을 조회합니다.
 *
 * @param options - 조회 옵션
 * @returns 워크플로우 목록
 */
export async function listWorkflows(options: {
  bmadRoot: string;
  category?: string;
  standalone_only?: boolean;
}): Promise<ListWorkflowsResponse> {
  const { bmadRoot, category, standalone_only } = options;

  // 1. 모든 워크플로우 디렉토리 찾기
  const workflowDirs = await findWorkflowDirectories(bmadRoot, bmadRoot);

  // 2. 각 워크플로우 파싱
  const workflows: WorkflowListItem[] = [];

  for (const workflowDir of workflowDirs) {
    try {
      const workflowYamlPath = join(workflowDir, 'workflow.yaml');
      const config = await parseWorkflowYaml(workflowYamlPath);

      const relativePath = relative(bmadRoot, workflowDir);
      const workflowCategory = extractCategory(relativePath);

      // 필터링
      if (category && workflowCategory !== category) {
        continue;
      }

      if (standalone_only && !config.standalone) {
        continue;
      }

      workflows.push({
        name: config.name,
        description: config.description,
        category: workflowCategory,
        path: workflowDir,
        relativePath,
        standalone: config.standalone,
        author: config.author,
      });
    } catch (error) {
      console.warn(`Failed to parse workflow in ${workflowDir}:`, error);
    }
  }

  // 3. 카테고리 목록 추출
  const categories = Array.from(new Set(workflows.map((w) => w.category))).sort();

  return {
    workflows,
    total_count: workflows.length,
    categories,
  };
}
