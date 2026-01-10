/**
 * get-workflow-context 도구 비즈니스 로직
 *
 * 워크플로우 실행에 필요한 모든 컨텍스트를 제공합니다.
 */

import { readdir } from 'fs/promises';
import { join, relative } from 'path';
import { loadWorkflow, isWorkflowDirectory, type WorkflowInfo } from '../bmad/parser.js';
import {
  createResolveContext,
  resolveObject,
  type ResolveContext,
} from '../bmad/configResolver.js';

/**
 * get-workflow-context 응답
 */
export interface GetWorkflowContextResponse {
  workflow: {
    name: string;
    description?: string;
    category: string;
    path: string;
    relativePath: string;
    standalone?: boolean;
    author?: string;
    config: Record<string, unknown>;
  };
  resolved_variables?: Record<string, string>;
  instructions?: string;
  execution_guide: string;
}

/**
 * 재귀적으로 워크플로우를 검색합니다.
 *
 * @param dir - 검색할 디렉토리
 * @param targetName - 찾고자 하는 워크플로우 이름
 * @returns 워크플로우 디렉토리 절대 경로 또는 null
 */
async function findWorkflowByName(
  dir: string,
  targetName: string
): Promise<string | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = join(dir, entry.name);

      // workflow.yaml이 있는지 확인
      if (await isWorkflowDirectory(fullPath)) {
        const workflowYaml = join(fullPath, 'workflow.yaml');
        try {
          const { parseWorkflowYaml } = await import('../bmad/parser.js');
          const config = await parseWorkflowYaml(workflowYaml);
          if (config.name === targetName) {
            return fullPath;
          }
        } catch {
          // 파싱 실패 시 무시
        }
      }

      // 하위 디렉토리 재귀 탐색
      const found = await findWorkflowByName(fullPath, targetName);
      if (found) return found;
    }
  } catch (error) {
    // 접근 권한 등의 문제로 실패해도 계속 진행
    console.warn(`Failed to scan directory ${dir}:`, error);
  }

  return null;
}

/**
 * 워크플로우 경로에서 카테고리를 추출합니다.
 *
 * @param relativePath - BMAD 루트 기준 상대 경로
 * @returns 카테고리 문자열
 */
function extractCategory(relativePath: string): string {
  const parts = relativePath.split('/');
  const workflowsIndex = parts.indexOf('workflows');
  if (workflowsIndex !== -1 && workflowsIndex + 1 < parts.length) {
    return parts[workflowsIndex + 1];
  }
  return parts[parts.length - 2] || 'unknown';
}

/**
 * 실행 가이드 텍스트를 생성합니다.
 *
 * @param workflow - 워크플로우 정보
 * @param resolvedVariables - 해석된 변수들
 * @returns 실행 가이드 문자열
 */
function generateExecutionGuide(
  workflow: WorkflowInfo,
  resolvedVariables?: Record<string, string>
): string {
  let guide = `# Workflow Execution Guide: ${workflow.name}\n\n`;

  if (workflow.config.description) {
    guide += `**Description**: ${workflow.config.description}\n\n`;
  }

  if (workflow.config.standalone) {
    guide += `**Type**: Standalone workflow (can be executed independently)\n\n`;
  }

  guide += `## Configuration\n\n`;
  guide += `- **Workflow Path**: \`${workflow.path}\`\n`;

  if (workflow.config.config_source) {
    guide += `- **Config Source**: \`${workflow.config.config_source}\`\n`;
  }

  if (workflow.config.instructions) {
    guide += `- **Instructions**: \`${workflow.config.instructions}\`\n`;
  }

  if (resolvedVariables && Object.keys(resolvedVariables).length > 0) {
    guide += `\n## Resolved Variables\n\n`;
    for (const [key, value] of Object.entries(resolvedVariables)) {
      guide += `- **{${key}}**: \`${value}\`\n`;
    }
  }

  guide += `\n## Execution Steps\n\n`;
  guide += `1. Load the workflow configuration from \`${workflow.path}/workflow.yaml\`\n`;
  guide += `2. Resolve all template variables using the config source\n`;
  guide += `3. Load instructions from the specified path\n`;
  guide += `4. Execute the workflow according to the instructions\n`;

  return guide;
}

/**
 * 워크플로우 실행 컨텍스트를 가져옵니다.
 *
 * @param options - 조회 옵션
 * @returns 워크플로우 실행 컨텍스트
 */
export async function getWorkflowContext(options: {
  bmadRoot: string;
  projectRoot: string;
  workflow_name: string;
  load_instructions?: boolean;
  resolve_config?: boolean;
}): Promise<GetWorkflowContextResponse> {
  const {
    bmadRoot,
    projectRoot,
    workflow_name,
    load_instructions = true,
    resolve_config = true,
  } = options;

  // 1. 워크플로우 찾기
  const workflowDir = await findWorkflowByName(bmadRoot, workflow_name);
  if (!workflowDir) {
    throw new Error(`Workflow not found: ${workflow_name}`);
  }

  // 2. 워크플로우 로드
  const workflowInfo = await loadWorkflow(workflowDir, {
    loadInstructions: load_instructions,
    loadValidation: false,
    loadTemplate: false,
  });

  // 3. 상대 경로 및 카테고리 추출
  const relativePath = relative(bmadRoot, workflowDir);
  const category = extractCategory(relativePath);

  // 4. 변수 해석 (선택)
  let resolvedVariables: Record<string, string> | undefined;
  let resolvedConfig = workflowInfo.config;

  if (resolve_config) {
    try {
      const resolveContext = await createResolveContext({
        projectRoot,
        workflowDir,
      });

      // config 객체 전체를 해석
      resolvedConfig = resolveObject(
        workflowInfo.config as Record<string, unknown>,
        resolveContext
      ) as typeof workflowInfo.config;

      // 주요 변수들 추출
      resolvedVariables = {
        'project-root': resolveContext.projectRoot,
        'config_source': resolveContext.configPath || '',
        'installed_path': workflowDir,
      };

      // config에서 추가 변수들 추출
      for (const [key, value] of Object.entries(resolvedConfig)) {
        if (typeof value === 'string' && !['name', 'description', 'author'].includes(key)) {
          resolvedVariables[key] = value;
        }
      }
    } catch (error) {
      console.warn('Failed to resolve config variables:', error);
    }
  }

  // 5. 실행 가이드 생성
  const execution_guide = generateExecutionGuide(workflowInfo, resolvedVariables);

  return {
    workflow: {
      name: workflowInfo.name,
      description: workflowInfo.config.description,
      category,
      path: workflowDir,
      relativePath,
      standalone: workflowInfo.config.standalone,
      author: workflowInfo.config.author,
      config: resolvedConfig,
    },
    resolved_variables: resolvedVariables,
    instructions: workflowInfo.instructions,
    execution_guide,
  };
}
