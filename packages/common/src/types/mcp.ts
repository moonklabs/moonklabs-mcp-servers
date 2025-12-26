/**
 * MCP 응답 타입 정의
 *
 * 모든 MCP 서버에서 사용하는 표준 응답 형식을 정의합니다.
 * Architecture 문서의 §API Patterns를 참조합니다.
 *
 * @module types/mcp
 */

/**
 * MCP 성공 응답 타입
 *
 * @template T - 응답 데이터의 타입
 *
 * @example
 * ```typescript
 * const response: McpResponse<{ items: string[] }> = {
 *   status: "success",
 *   data: { items: ["a", "b", "c"] },
 *   token_count: 150,
 *   cached: false
 * };
 * ```
 */
export interface McpResponse<T> {
  /** 응답 상태 - 항상 "success" */
  status: 'success';
  /** 응답 데이터 */
  data: T;
  /** 응답에 포함된 총 토큰 수 */
  token_count: number;
  /** 캐시에서 반환된 응답인지 여부 */
  cached: boolean;
}

/**
 * 알려진 에러 코드 타입
 *
 * 서비스별 에러 코드를 정의합니다.
 * 형식: {SERVICE}_{ERROR_TYPE}
 */
export type ErrorCode =
  | 'NOTION_RATE_LIMIT'
  | 'NOTION_NOT_FOUND'
  | 'NOTION_UNAUTHORIZED'
  | 'STORY_NOT_FOUND'
  | 'TOKEN_LIMIT_EXCEEDED'
  | 'CACHE_MISS'
  | 'INVALID_INPUT'
  | 'CONFIG_ERROR'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | (string & {}); // 확장 가능한 문자열 타입

/**
 * MCP 에러 응답 타입
 *
 * 모든 에러 응답에는 suggestion 필드가 필수입니다.
 * 사용자에게 다음 행동을 안내하는 것이 중요합니다.
 *
 * @example
 * ```typescript
 * const error: McpErrorResponse = {
 *   status: "error",
 *   error_code: "STORY_NOT_FOUND",
 *   message: "Story-999를 찾을 수 없습니다",
 *   suggestion: "list-specs로 사용 가능한 스토리 목록을 확인하세요",
 *   available_options: ["Story-41", "Story-42"]
 * };
 * ```
 */
export interface McpErrorResponse {
  /** 응답 상태 - 항상 "error" */
  status: 'error';
  /** 에러 코드 - {SERVICE}_{ERROR_TYPE} 형식 */
  error_code: ErrorCode;
  /** 사용자에게 표시할 에러 메시지 (한글) */
  message: string;
  /** 다음 행동 안내 (필수!) */
  suggestion: string;
  /** 가능한 대안 목록 (선택) */
  available_options?: unknown;
  /** Rate Limit 시 대기 시간 (초) */
  retry_after?: number;
}

/**
 * MCP 도구 결과 콘텐츠 타입
 *
 * MCP SDK에서 사용하는 콘텐츠 형식입니다.
 */
export interface McpToolContent {
  /** 콘텐츠 타입 */
  type: 'text' | 'image' | 'resource';
  /** 텍스트 콘텐츠 (type: "text"인 경우) */
  text?: string;
  /** 이미지 데이터 (type: "image"인 경우) */
  data?: string;
  /** 이미지 MIME 타입 (type: "image"인 경우) */
  mimeType?: string;
  /** 리소스 URI (type: "resource"인 경우) */
  uri?: string;
}

/**
 * MCP 도구 결과 타입
 *
 * MCP SDK의 도구 핸들러가 반환하는 결과 형식입니다.
 *
 * @example
 * ```typescript
 * const result: McpToolResult = {
 *   content: [{ type: "text", text: JSON.stringify(response) }],
 *   isError: false
 * };
 * ```
 */
export interface McpToolResult {
  /** 결과 콘텐츠 배열 */
  content: McpToolContent[];
  /** 에러 여부 (선택) */
  isError?: boolean;
}

/**
 * MCP 응답 유니온 타입
 *
 * 성공 또는 에러 응답을 나타냅니다.
 */
export type McpResult<T> = McpResponse<T> | McpErrorResponse;

/**
 * 타입 가드: McpResponse인지 확인
 *
 * status 필드만 확인합니다. 완전한 런타임 검증이 아닌
 * TypeScript 타입 좁히기(narrowing)를 위한 가드입니다.
 *
 * @param result - 확인할 응답 객체 (null/undefined 안전)
 * @returns status가 'success'인 경우 true
 *
 * @example
 * ```typescript
 * const result: McpResult<Data> = await fetchData();
 * if (isMcpResponse(result)) {
 *   console.log(result.data); // 타입 안전하게 data 접근
 * }
 * ```
 */
export function isMcpResponse<T>(result: McpResult<T> | null | undefined): result is McpResponse<T> {
  return result != null && result.status === 'success';
}

/**
 * 타입 가드: McpErrorResponse인지 확인
 *
 * status 필드만 확인합니다. 완전한 런타임 검증이 아닌
 * TypeScript 타입 좁히기(narrowing)를 위한 가드입니다.
 *
 * @param result - 확인할 응답 객체 (null/undefined 안전)
 * @returns status가 'error'인 경우 true
 *
 * @example
 * ```typescript
 * const result: McpResult<Data> = await fetchData();
 * if (isMcpError(result)) {
 *   console.error(result.message, result.suggestion);
 * }
 * ```
 */
export function isMcpError<T>(result: McpResult<T> | null | undefined): result is McpErrorResponse {
  return result != null && result.status === 'error';
}
