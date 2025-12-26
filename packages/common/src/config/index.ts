/**
 * 설정 관리 모듈
 *
 * 환경변수를 Zod 스키마로 검증하고 타입 안전하게 로드합니다.
 *
 * @module config
 *
 * @example
 * ```typescript
 * import { loadEnvConfig, DEFAULT_CACHE_TTL_SECONDS } from '@moonklabs/mcp-common';
 *
 * const config = loadEnvConfig();
 * console.log(config.NODE_ENV);
 * console.log(config.CACHE_TTL_SECONDS);
 * ```
 */

// 환경변수 로드 및 타입
export { loadEnvConfig, envSchema, resetEnvConfigCache, type EnvConfig } from './environment.js';

// 기본값 상수
export {
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_NODE_ENV,
} from './defaults.js';
