/**
 * BMAD 워크플로우 및 관련 파일 파싱
 *
 * workflow.yaml, instructions.xml, checklist.md 등을 로드하고 파싱합니다.
 */

import { readFile } from 'fs/promises';
import { load as yamlLoad } from 'js-yaml';
import { join, dirname } from 'path';

/**
 * workflow.yaml 파싱 결과
 */
export interface WorkflowConfig {
  name: string;
  description?: string;
  author?: string;
  standalone?: boolean;
  config_source?: string;
  installed_path?: string;
  instructions?: string;
  validation?: string;
  template?: string | false;
  [key: string]: unknown; // 기타 변수들
}

/**
 * 워크플로우 전체 정보 (파일 경로 포함)
 */
export interface WorkflowInfo {
  name: string;
  path: string;           // 워크플로우 디렉토리 절대 경로
  relativePath: string;   // _bmad 루트 기준 상대 경로
  config: WorkflowConfig;
  instructions?: string;  // instructions.xml 또는 .md 내용
  validation?: string;    // checklist.md 내용
  template?: string;      // template.md 내용
}

/**
 * workflow.yaml 파일을 읽고 파싱합니다.
 *
 * @param workflowPath - workflow.yaml 파일의 절대 경로
 * @returns 파싱된 워크플로우 설정
 */
export async function parseWorkflowYaml(workflowPath: string): Promise<WorkflowConfig> {
  const content = await readFile(workflowPath, 'utf-8');
  const parsed = yamlLoad(content) as WorkflowConfig;

  if (!parsed.name) {
    throw new Error(`Invalid workflow.yaml: 'name' field is required in ${workflowPath}`);
  }

  return parsed;
}

/**
 * 워크플로우 디렉토리에서 모든 관련 파일을 로드합니다.
 *
 * @param workflowDir - 워크플로우 디렉토리 절대 경로
 * @param options - 로드 옵션
 * @returns 완전한 워크플로우 정보
 */
export async function loadWorkflow(
  workflowDir: string,
  options: {
    loadInstructions?: boolean;
    loadValidation?: boolean;
    loadTemplate?: boolean;
  } = {}
): Promise<WorkflowInfo> {
  const { loadInstructions = true, loadValidation = false, loadTemplate = false } = options;

  // workflow.yaml 로드
  const workflowYamlPath = join(workflowDir, 'workflow.yaml');
  const config = await parseWorkflowYaml(workflowYamlPath);

  const result: WorkflowInfo = {
    name: config.name,
    path: workflowDir,
    relativePath: '', // configResolver에서 설정
    config,
  };

  // instructions 로드 (xml 또는 md)
  if (loadInstructions && config.instructions) {
    // instructions 경로는 변수일 수 있음 ({installed_path}/instructions.xml)
    // 여기서는 일단 instructions.xml, instructions.md를 시도
    const instructionsXml = join(workflowDir, 'instructions.xml');
    const instructionsMd = join(workflowDir, 'instructions.md');

    try {
      result.instructions = await readFile(instructionsXml, 'utf-8');
    } catch {
      try {
        result.instructions = await readFile(instructionsMd, 'utf-8');
      } catch {
        // instructions 없으면 무시
      }
    }
  }

  // validation (checklist.md) 로드
  if (loadValidation && config.validation) {
    const checklistPath = join(workflowDir, 'checklist.md');
    try {
      result.validation = await readFile(checklistPath, 'utf-8');
    } catch {
      // validation 없으면 무시
    }
  }

  // template 로드
  if (loadTemplate && config.template && typeof config.template === 'string') {
    const templatePath = join(workflowDir, 'template.md');
    try {
      result.template = await readFile(templatePath, 'utf-8');
    } catch {
      // template 없으면 무시
    }
  }

  return result;
}

/**
 * 주어진 디렉토리가 워크플로우 디렉토리인지 확인합니다.
 * (workflow.yaml 파일이 있는지 체크)
 *
 * @param dirPath - 확인할 디렉토리 경로
 * @returns workflow.yaml 존재 여부
 */
export async function isWorkflowDirectory(dirPath: string): Promise<boolean> {
  try {
    await readFile(join(dirPath, 'workflow.yaml'), 'utf-8');
    return true;
  } catch {
    return false;
  }
}
