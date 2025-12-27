/**
 * mcp-context-loader 설정 관리
 *
 * @moonklabs/mcp-common의 loadEnvConfig를 래핑하여
 * 서버별 추가 설정을 제공합니다.
 *
 * @module config
 *
 * @example
 * ```typescript
 * import { getConfig, getProjectRoot } from './config/index.js';
 *
 * const config = getConfig();
 * console.log(config.LOG_LEVEL);
 *
 * const projectRoot = getProjectRoot();
 * console.log(`Project root: ${projectRoot}`);
 * ```
 */

import { loadEnvConfig, type EnvConfig } from "@moonklabs/mcp-common";

/**
 * mcp-context-loader 서버 전용 설정
 */
export interface ContextLoaderConfig extends EnvConfig {
  /**
   * 프로젝트 루트 경로 (컨텍스트 파일 탐색용)
   * 환경변수: PROJECT_ROOT
   * 기본값: process.cwd()
   */
  PROJECT_ROOT: string;
}

/**
 * 환경변수를 로드하고 검증합니다.
 *
 * @returns 검증된 설정 객체
 * @throws 필수 환경변수 누락 시 에러
 *
 * @example
 * ```typescript
 * const config = getConfig();
 * console.log(config.LOG_LEVEL); // 'info'
 * console.log(config.CACHE_TTL_SECONDS); // 300
 * ```
 */
export function getConfig(): ContextLoaderConfig {
  // 기본 설정 로드 (공통 모듈 사용)
  const baseConfig = loadEnvConfig();

  // 서버별 추가 설정
  const projectRoot = process.env.PROJECT_ROOT || process.cwd();

  return {
    ...baseConfig,
    PROJECT_ROOT: projectRoot,
  };
}

/**
 * 프로젝트 루트 경로를 반환합니다.
 *
 * 컨텍스트 파일(PRD, Architecture, Stories 등)을 탐색할 때 사용합니다.
 *
 * @returns 프로젝트 루트 절대 경로
 */
export function getProjectRoot(): string {
  return getConfig().PROJECT_ROOT;
}

// Re-export common config for convenience
export { loadEnvConfig, type EnvConfig } from "@moonklabs/mcp-common";
