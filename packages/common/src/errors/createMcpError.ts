/**
 * MCP 에러 응답 헬퍼
 *
 * 일관된 에러 응답 생성을 위한 헬퍼 함수입니다.
 * suggestion 필드를 필수로 요구하여 사용자에게 다음 행동을 안내합니다.
 *
 * @module errors/createMcpError
 */

import type { McpErrorResponse, McpToolResult, ErrorCode } from '../types/index.js';

/**
 * createMcpError 옵션 타입
 *
 * @property available_options - 가능한 대안 목록 (선택)
 * @property retry_after - Rate Limit 시 대기 시간 (초, 선택)
 */
export interface CreateMcpErrorOptions {
  /** 가능한 대안 목록 (선택) */
  available_options?: unknown;
  /** Rate Limit 시 대기 시간 (초) */
  retry_after?: number;
}

/**
 * MCP 에러 응답 생성 헬퍼
 *
 * 모든 에러 응답에 suggestion 필드를 필수로 포함합니다.
 * suggestion이 빈 문자열이면 런타임 에러를 발생시킵니다.
 *
 * @param code - 에러 코드 ({SERVICE}_{ERROR_TYPE} 형식, ErrorCode 타입 권장)
 * @param message - 사용자에게 표시할 에러 메시지 (한글)
 * @param suggestion - 다음 행동 안내 (필수!)
 * @param options - 추가 옵션 (available_options, retry_after)
 * @returns McpErrorResponse 객체
 * @throws Error - suggestion이 빈 문자열인 경우
 *
 * @example
 * ```typescript
 * const error = createMcpError(
 *   'STORY_NOT_FOUND',
 *   'Story-999를 찾을 수 없습니다',
 *   'list-specs로 사용 가능한 스토리 목록을 확인하세요',
 *   { available_options: ['Story-41', 'Story-42'] }
 * );
 * ```
 */
export function createMcpError(
  code: ErrorCode,
  message: string,
  suggestion: string,
  options?: CreateMcpErrorOptions
): McpErrorResponse {
  // suggestion 필수 검증 (빈 문자열, 공백만 있는 경우 거부)
  if (!suggestion || suggestion.trim() === '') {
    throw new Error('suggestion은 필수입니다. 빈 문자열은 허용되지 않습니다.');
  }

  // 기본 에러 응답 객체 생성
  const errorResponse: McpErrorResponse = {
    status: 'error',
    error_code: code,
    message,
    suggestion,
  };

  // 옵션 필드 추가 (undefined가 아닌 경우에만)
  if (options?.available_options !== undefined) {
    errorResponse.available_options = options.available_options;
  }

  if (options?.retry_after !== undefined) {
    errorResponse.retry_after = options.retry_after;
  }

  return errorResponse;
}

/**
 * McpErrorResponse를 McpToolResult로 변환
 *
 * MCP SDK의 도구 핸들러에서 에러를 반환할 때 사용합니다.
 *
 * @param error - McpErrorResponse 객체
 * @returns McpToolResult 객체 (isError: true)
 *
 * @example
 * ```typescript
 * const error = createMcpError('STORY_NOT_FOUND', '...', '...');
 * return toMcpToolResult(error);
 * ```
 */
export function toMcpToolResult(error: McpErrorResponse): McpToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(error, null, 2),
      },
    ],
    isError: true,
  };
}
