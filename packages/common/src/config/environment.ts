/**
 * 환경변수 관리 모듈
 *
 * Zod 스키마를 사용하여 환경변수를 검증하고 타입 안전하게 로드합니다.
 *
 * ⚠️ 중요: 환경변수에 직접 접근하지 마세요!
 * 항상 loadEnvConfig()를 통해 환경변수에 접근하세요.
 *
 * ```typescript
 * // ✅ 올바른 접근
 * import { loadEnvConfig } from '@moonklabs/mcp-common';
 * const config = loadEnvConfig();
 * console.log(config.LOG_LEVEL);
 *
 * // ❌ 금지 (코드 리뷰에서 거부)
 * const logLevel = process.env.LOG_LEVEL;
 * ```
 *
 * @module config/environment
 */

import { z } from 'zod';
import {
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_NODE_ENV,
} from './defaults.js';

/**
 * 환경변수 스키마
 *
 * 모든 환경변수를 Zod로 검증합니다.
 * - 열거형 필드는 허용된 값만 수락
 * - 숫자 필드는 문자열에서 자동 변환 (z.coerce.number())
 * - 선택적 필드는 undefined 허용
 */
export const envSchema = z.object({
  /**
   * 실행 환경
   * @default 'development'
   */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default(DEFAULT_NODE_ENV),

  /**
   * 로그 레벨
   * @default 'info'
   */
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default(DEFAULT_LOG_LEVEL),

  /**
   * Notion API 토큰
   * mcp-spec-reader에서 필수
   * 빈 문자열은 undefined로 처리됩니다.
   */
  NOTION_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  /**
   * Notion 접근 허용 페이지 ID 목록 (콤마 구분)
   * 보안을 위해 접근 범위 제한
   * 빈 문자열은 undefined로 처리됩니다.
   */
  NOTION_PAGE_IDS: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  /**
   * 기본 캐시 TTL (초)
   * @default 300
   * @minimum 1
   */
  CACHE_TTL_SECONDS: z.coerce.number().min(1, 'CACHE_TTL_SECONDS는 1 이상이어야 합니다').default(DEFAULT_CACHE_TTL_SECONDS),
});

/**
 * 환경변수 설정 타입
 *
 * Zod 스키마에서 추론된 타입입니다.
 * 모든 필드가 타입 안전하게 정의됩니다.
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 캐시된 환경변수 설정
 * loadEnvConfig()가 호출될 때마다 재파싱하지 않도록 캐싱합니다.
 */
let cachedConfig: EnvConfig | null = null;

/**
 * 환경변수 로드 및 검증
 *
 * process.env를 Zod 스키마로 검증하고 타입 안전한 EnvConfig 객체를 반환합니다.
 * 검증 실패 시 명확한 에러 메시지와 함께 예외를 발생시킵니다.
 *
 * ⚠️ 주의: 이 함수를 통해서만 환경변수에 접근하세요.
 * 직접 process.env 접근은 코드 리뷰에서 거부됩니다.
 *
 * @returns 검증된 환경변수 설정 객체
 * @throws Error - 환경변수 검증 실패 시
 *
 * @example
 * ```typescript
 * import { loadEnvConfig } from '@moonklabs/mcp-common';
 *
 * const config = loadEnvConfig();
 * console.log(config.NODE_ENV);        // 'development' | 'production' | 'test'
 * console.log(config.LOG_LEVEL);       // 'debug' | 'info' | 'warn' | 'error'
 * console.log(config.CACHE_TTL_SECONDS); // number (기본: 300)
 * ```
 */
export function loadEnvConfig(): EnvConfig {
  // 캐시된 설정이 있으면 반환 (성능 최적화)
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // 에러 메시지 포맷팅
    const formatted = result.error.format();
    console.error('환경변수 검증 실패:', JSON.stringify(formatted, null, 2));
    throw new Error('환경변수 설정이 올바르지 않습니다');
  }

  // 결과 캐싱
  cachedConfig = result.data;
  return result.data;
}

/**
 * 환경변수 캐시 초기화
 *
 * 테스트에서 환경변수를 변경한 후 다시 로드할 때 사용합니다.
 * 프로덕션 코드에서는 사용하지 마세요.
 *
 * @internal
 */
export function resetEnvConfigCache(): void {
  cachedConfig = null;
}
