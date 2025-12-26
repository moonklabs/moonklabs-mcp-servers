/**
 * 에러 헬퍼 모듈
 *
 * MCP 서버에서 일관된 에러 응답을 생성하기 위한 헬퍼입니다.
 *
 * @module errors
 *
 * @example
 * ```typescript
 * import { createMcpError, ERROR_CODES, toMcpToolResult } from '@moonklabs/mcp-common';
 *
 * const error = createMcpError(
 *   ERROR_CODES.STORY_NOT_FOUND,
 *   'Story를 찾을 수 없습니다',
 *   '목록을 확인하세요'
 * );
 *
 * // MCP 도구에서 반환
 * return toMcpToolResult(error);
 * ```
 */

// 에러 코드 상수
export { ERROR_CODES, type ErrorCodeValue } from './errorCodes.js';

// 에러 생성 헬퍼
export {
  createMcpError,
  toMcpToolResult,
  type CreateMcpErrorOptions,
} from './createMcpError.js';
