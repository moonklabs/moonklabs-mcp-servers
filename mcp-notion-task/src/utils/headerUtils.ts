/**
 * HTTP 헤더 유틸리티
 * MCP SDK의 RequestHandlerExtra에서 HTTP 헤더를 추출합니다.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RequestHandlerExtra = any;

/**
 * HTTP 헤더에서 X-User-Id를 추출합니다.
 * @param extra MCP 요청 핸들러 extra 파라미터
 * @returns userId 또는 undefined
 */
export function getUserIdFromHeader(extra?: RequestHandlerExtra): string | undefined {
  const headers = extra?.requestInfo?.headers;
  if (!headers) return undefined;

  // headers.get() 메서드 또는 headers['x-user-id'] 형식 지원
  let value: string | string[] | null | undefined;

  if (typeof headers.get === 'function') {
    value = headers.get('x-user-id');
  } else if (typeof headers === 'object') {
    value = (headers as Record<string, string | string[]>)['x-user-id'];
  }

  // 배열이면 첫 번째 값, 아니면 그대로 반환
  if (Array.isArray(value)) {
    return value[0] || undefined;
  }

  return value || undefined;
}
