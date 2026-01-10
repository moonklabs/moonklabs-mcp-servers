/**
 * mcp-spec-reader 설정 관리
 *
 * @moonklabs/mcp-common의 loadEnvConfig를 래핑하여
 * Notion API 연동에 필요한 설정을 제공합니다.
 *
 * @module config
 *
 * @example
 * ```typescript
 * import { getConfig, validateNotionApiKey } from './config/index.js';
 *
 * const config = getConfig();
 * console.log(config.LOG_LEVEL);
 *
 * validateNotionApiKey(); // NOTION_API_KEY 필수 검증
 * ```
 */

import { loadEnvConfig, type EnvConfig, createMcpError } from "@moonklabs/mcp-common";

/**
 * mcp-spec-reader 서버 전용 설정
 * EnvConfig를 확장하되, NOTION_PAGE_IDS는 파싱된 배열로 오버라이드
 */
export interface SpecReaderConfig extends Omit<EnvConfig, "NOTION_PAGE_IDS"> {
  /**
   * Notion API 키 (필수)
   * 환경변수: NOTION_API_KEY
   */
  NOTION_API_KEY: string;

  /**
   * 접근 허용할 Notion 페이지 ID 목록 (파싱된 배열)
   * 환경변수: NOTION_PAGE_IDS (콤마 구분)
   * 기본값: undefined (모든 페이지 허용)
   */
  NOTION_PAGE_IDS?: string[];
}

/**
 * NOTION_API_KEY 환경변수를 검증합니다.
 *
 * @throws NOTION_API_KEY 환경변수가 설정되지 않은 경우 에러
 *
 * @example
 * ```typescript
 * validateNotionApiKey(); // 없으면 에러
 * ```
 */
export function validateNotionApiKey(): void {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "NOTION_API_KEY 환경변수가 설정되지 않았습니다. " +
        "Notion Integration Token을 생성하고 .env 파일에 NOTION_API_KEY를 설정하세요."
    );
  }
}

/**
 * 환경변수를 로드하고 검증합니다.
 *
 * @returns 검증된 설정 객체
 * @throws NOTION_API_KEY 필수 환경변수 누락 시 에러
 *
 * @example
 * ```typescript
 * const config = getConfig();
 * console.log(config.LOG_LEVEL); // 'info'
 * console.log(config.NOTION_API_KEY); // 'secret_xxx'
 * ```
 */
export function getConfig(): SpecReaderConfig {
  // 기본 설정 로드 (공통 모듈 사용)
  const baseConfig = loadEnvConfig();

  // NOTION_API_KEY 필수 검증
  validateNotionApiKey();

  // Notion 페이지 ID 파싱 (콤마 구분)
  const pageIdsRaw = process.env.NOTION_PAGE_IDS;
  const pageIds = pageIdsRaw
    ? pageIdsRaw.split(",").map((id) => id.trim()).filter(Boolean)
    : undefined;

  // NOTION_PAGE_IDS를 제외한 baseConfig 사용
  const { NOTION_PAGE_IDS: _unused, ...restConfig } = baseConfig;

  return {
    ...restConfig,
    NOTION_API_KEY: process.env.NOTION_API_KEY!,
    NOTION_PAGE_IDS: pageIds,
  };
}

/**
 * Notion API 키가 유효한 형식인지 검증합니다.
 * Notion API 키는 'secret_' 접두사로 시작합니다.
 *
 * @param apiKey 검증할 API 키
 * @returns 유효한 형식이면 true
 */
export function isValidNotionApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith("secret_") && apiKey.length > 10;
}

// Re-export common config for convenience
export { loadEnvConfig, type EnvConfig, createMcpError } from "@moonklabs/mcp-common";
