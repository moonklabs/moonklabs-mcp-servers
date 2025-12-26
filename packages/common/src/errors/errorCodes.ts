/**
 * 에러 코드 상수 정의
 *
 * 모든 MCP 서버에서 사용하는 표준 에러 코드입니다.
 * 형식: {SERVICE}_{ERROR_TYPE}
 *
 * @module errors/errorCodes
 */

/**
 * 표준 에러 코드 상수
 *
 * @example
 * ```typescript
 * import { ERROR_CODES } from '@moonklabs/mcp-common';
 *
 * const error = createMcpError(
 *   ERROR_CODES.STORY_NOT_FOUND,
 *   'Story를 찾을 수 없습니다',
 *   '목록을 확인하세요'
 * );
 * ```
 */
export const ERROR_CODES = {
  /** Notion API 속도 제한 */
  NOTION_RATE_LIMIT: 'NOTION_RATE_LIMIT',
  /** Notion 리소스를 찾을 수 없음 */
  NOTION_NOT_FOUND: 'NOTION_NOT_FOUND',
  /** Notion API 인증 실패 */
  NOTION_UNAUTHORIZED: 'NOTION_UNAUTHORIZED',
  /** 스토리를 찾을 수 없음 */
  STORY_NOT_FOUND: 'STORY_NOT_FOUND',
  /** 토큰 제한 초과 */
  TOKEN_LIMIT_EXCEEDED: 'TOKEN_LIMIT_EXCEEDED',
  /** 캐시 미스 */
  CACHE_MISS: 'CACHE_MISS',
  /** 잘못된 입력 */
  INVALID_INPUT: 'INVALID_INPUT',
  /** 설정 오류 */
  CONFIG_ERROR: 'CONFIG_ERROR',
  /** 검증 오류 */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** 내부 오류 */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * 에러 코드 값 타입
 *
 * ERROR_CODES 객체의 값들로 구성된 유니온 타입입니다.
 */
export type ErrorCodeValue = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
