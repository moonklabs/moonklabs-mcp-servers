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

  // 디버그 로깅
  console.log('[DEBUG headerUtils] getUserIdFromHeader called', {
    hasHeaders: !!headers,
    headerType: typeof headers,
    headerKeys: headers ? Object.keys(headers) : null,
    allHeaders: headers,
  });

  if (!headers) return undefined;

  // headers.get() 메서드 또는 headers['x-user-id'] 형식 지원
  let value: string | string[] | null | undefined;

  if (typeof headers.get === 'function') {
    value = headers.get('x-user-id');
    console.log('[DEBUG headerUtils] Using headers.get() method, value:', value);
  } else if (typeof headers === 'object') {
    // 대소문자 무관 검색
    const headerKey = Object.keys(headers).find(
      k => k.toLowerCase() === 'x-user-id'
    );
    value = headerKey ? (headers as Record<string, string | string[]>)[headerKey] : undefined;
    console.log('[DEBUG headerUtils] Using object access, key:', headerKey, 'value:', value);
  }

  // 배열이면 첫 번째 값, 아니면 그대로 반환
  if (Array.isArray(value)) {
    return value[0] || undefined;
  }

  const result = value || undefined;
  console.log('[DEBUG headerUtils] Final result:', result);
  return result;
}
