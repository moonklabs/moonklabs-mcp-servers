/**
 * BMAD config.yaml 변수 해석
 *
 * workflow.yaml에서 사용되는 변수들을 실제 값으로 치환합니다.
 * - {project-root}: 프로젝트 루트 경로
 * - {config_source}: config.yaml 파일 경로
 * - {config_source}:key: config.yaml의 특정 키 값
 * - {installed_path}: 워크플로우 디렉토리 경로
 */

import { readFile } from 'fs/promises';
import { load as yamlLoad } from 'js-yaml';
import { join, resolve } from 'path';

/**
 * 변수 해석 컨텍스트
 */
export interface ResolveContext {
  projectRoot: string;      // 프로젝트 루트 절대 경로
  bmadRoot: string;         // BMAD 루트 (_bmad) 절대 경로
  configPath?: string;      // config.yaml 절대 경로
  workflowDir?: string;     // 현재 워크플로우 디렉토리 (installed_path용)
  configData?: Record<string, unknown>; // 로드된 config.yaml 데이터
}

/**
 * config.yaml을 로드하고 파싱합니다.
 *
 * @param configPath - config.yaml 파일 경로
 * @returns 파싱된 config 데이터
 */
export async function loadConfig(configPath: string): Promise<Record<string, unknown>> {
  const content = await readFile(configPath, 'utf-8');
  const parsed = yamlLoad(content) as Record<string, unknown>;
  return parsed;
}

/**
 * 문자열 내의 변수를 재귀적으로 해석합니다.
 *
 * @param value - 해석할 문자열
 * @param context - 변수 해석 컨텍스트
 * @param depth - 재귀 깊이 (무한 루프 방지)
 * @returns 해석된 문자열
 */
export function resolveVariable(
  value: string,
  context: ResolveContext,
  depth = 0
): string {
  // 무한 루프 방지 (최대 10회 재귀)
  if (depth > 10) {
    throw new Error(`Variable resolution depth exceeded for: ${value}`);
  }

  let resolved = value;

  // {project-root} 치환
  if (resolved.includes('{project-root}')) {
    resolved = resolved.replace(/{project-root}/g, context.projectRoot);
  }

  // {config_source} 치환
  if (resolved.includes('{config_source}:')) {
    // {config_source}:key 형태
    const match = resolved.match(/{config_source}:(\w+)/);
    if (match) {
      const key = match[1];
      if (context.configData && key in context.configData) {
        const configValue = context.configData[key];
        if (typeof configValue === 'string') {
          // 재귀적으로 해석 (config 값에도 변수가 있을 수 있음)
          const resolvedConfigValue = resolveVariable(configValue, context, depth + 1);
          resolved = resolved.replace(`{config_source}:${key}`, resolvedConfigValue);
        } else {
          // string이 아니면 그대로
          resolved = resolved.replace(`{config_source}:${key}`, String(configValue));
        }
      }
    }
  } else if (resolved.includes('{config_source}')) {
    // {config_source} 단독 (파일 경로 자체)
    if (context.configPath) {
      resolved = resolved.replace(/{config_source}/g, context.configPath);
    }
  }

  // {installed_path} 치환
  if (resolved.includes('{installed_path}')) {
    if (context.workflowDir) {
      resolved = resolved.replace(/{installed_path}/g, context.workflowDir);
    }
  }

  return resolved;
}

/**
 * 객체 내 모든 문자열 값의 변수를 해석합니다.
 *
 * @param obj - 해석할 객체
 * @param context - 변수 해석 컨텍스트
 * @returns 변수가 해석된 새 객체
 */
export function resolveObject<T extends Record<string, unknown>>(
  obj: T,
  context: ResolveContext
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      resolved[key] = resolveVariable(value, context);
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        typeof item === 'string' ? resolveVariable(item, context) : item
      );
    } else if (value !== null && typeof value === 'object') {
      resolved[key] = resolveObject(value as Record<string, unknown>, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * BMAD 루트 경로를 찾습니다.
 *
 * @param projectRoot - 프로젝트 루트 경로
 * @param bmadRoot - BMAD 루트 폴더 이름 (기본값: "_bmad")
 * @returns BMAD 루트 절대 경로
 */
export function getBmadRoot(projectRoot: string, bmadRoot = '_bmad'): string {
  return join(projectRoot, bmadRoot);
}

/**
 * config.yaml 기본 경로를 찾습니다.
 *
 * @param bmadRoot - BMAD 루트 절대 경로
 * @returns config.yaml 절대 경로
 */
export function getDefaultConfigPath(bmadRoot: string): string {
  return join(bmadRoot, 'bmm', 'config.yaml');
}

/**
 * ResolveContext를 생성합니다.
 *
 * @param options - 컨텍스트 옵션
 * @returns 생성된 ResolveContext
 */
export async function createResolveContext(options: {
  projectRoot: string;
  bmadRoot?: string;
  configPath?: string;
  workflowDir?: string;
}): Promise<ResolveContext> {
  const bmadRoot = options.bmadRoot || getBmadRoot(options.projectRoot);
  const configPath = options.configPath || getDefaultConfigPath(bmadRoot);

  const context: ResolveContext = {
    projectRoot: options.projectRoot,
    bmadRoot,
    configPath,
    workflowDir: options.workflowDir,
  };

  // config.yaml 로드
  try {
    context.configData = await loadConfig(configPath);
  } catch (error) {
    // config.yaml 로드 실패 시 경고만 출력
    console.warn(`Failed to load config.yaml from ${configPath}:`, error);
  }

  return context;
}
