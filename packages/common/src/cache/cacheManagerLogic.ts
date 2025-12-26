/**
 * 캐시 관리 순수 함수 모듈
 *
 * 캐시 키 생성, 파싱, 검증 등의 순수 함수를 제공합니다.
 * 이 모듈의 함수들은 상태를 가지지 않아 테스트가 용이합니다.
 *
 * @module cache/cacheManagerLogic
 *
 * @example
 * ```typescript
 * import { buildCacheKey, parseCacheKey, CACHE_TTL } from '@moonklabs/mcp-common';
 *
 * // 캐시 키 생성
 * const key = buildCacheKey({
 *   server: 'mcp-context-loader',
 *   resource: 'notion-page',
 *   id: 'page-123',
 * });
 * // 결과: 'mcp-context-loader:notion-page:page-123'
 *
 * // 캐시 키 파싱
 * const params = parseCacheKey(key);
 * // 결과: { server: 'mcp-context-loader', resource: 'notion-page', id: 'page-123' }
 * ```
 */

/**
 * 캐시 키 생성 파라미터
 */
export interface CacheKeyParams {
  /** MCP 서버 이름 (예: 'mcp-context-loader') */
  server: string;
  /** 리소스 타입 (예: 'notion-page', 'spec-summary') */
  resource: string;
  /** 고유 식별자 (예: 페이지 ID, 스펙 ID) */
  id: string;
  /** 선택적 해시값 (예: 내용 해시, 버전) */
  hash?: string;
}

/**
 * 캐시 키 파싱 결과
 */
export interface ParsedCacheKey {
  server: string;
  resource: string;
  id: string;
  hash?: string;
}

/**
 * 캐시 TTL 상수 (초 단위)
 *
 * 각 리소스 타입별 권장 TTL 값을 정의합니다.
 * 0은 무제한(만료 없음)을 의미합니다.
 */
export const CACHE_TTL = {
  /** Notion 페이지 캐시 TTL (5분) */
  NOTION_PAGE: 300,
  /** 스펙 요약 캐시 TTL (1시간) */
  SPEC_SUMMARY: 3600,
  /** 토큰 수 캐시 TTL (무제한) */
  TOKEN_COUNT: 0,
  /** 스토리 컨텍스트 캐시 TTL (5분) */
  STORY_CONTEXT: 300,
  /** 문서 목록 캐시 TTL (5분) */
  DOCUMENT_LIST: 300,
  /** 기본 TTL (5분) */
  DEFAULT: 300,
} as const;

/**
 * 캐시 TTL 타입
 */
export type CacheTTLType = (typeof CACHE_TTL)[keyof typeof CACHE_TTL];

/**
 * 캐시 키 구분자
 */
const KEY_SEPARATOR = ':';

/**
 * 캐시 키 파트에 구분자가 포함되어 있는지 검증
 *
 * @param value - 검증할 값
 * @param fieldName - 필드 이름 (에러 메시지용)
 * @throws {Error} 값에 콜론이 포함되어 있으면 에러
 */
function validateNoSeparator(value: string, fieldName: string): void {
  if (value.includes(KEY_SEPARATOR)) {
    throw new Error(`${fieldName}에 콜론(:)을 포함할 수 없습니다`);
  }
}

/**
 * 유효한 캐시 키 파트 수 (최소 3, 최대 4)
 */
const MIN_KEY_PARTS = 3;
const MAX_KEY_PARTS = 4;

/**
 * 캐시 키 생성
 *
 * 서버, 리소스, ID, 선택적 해시를 조합하여 캐시 키를 생성합니다.
 * 모든 필수 파라미터는 공백을 제거하고 검증합니다.
 *
 * @param params - 캐시 키 파라미터
 * @returns 생성된 캐시 키 (형식: `{server}:{resource}:{id}` 또는 `{server}:{resource}:{id}:{hash}`)
 * @throws {Error} server, resource, id 중 하나라도 비어있으면 에러
 *
 * @example
 * ```typescript
 * // 해시 없이
 * buildCacheKey({ server: 'mcp-loader', resource: 'page', id: '123' });
 * // 결과: 'mcp-loader:page:123'
 *
 * // 해시 포함
 * buildCacheKey({ server: 'mcp-loader', resource: 'page', id: '123', hash: 'abc' });
 * // 결과: 'mcp-loader:page:123:abc'
 * ```
 */
export function buildCacheKey(params: CacheKeyParams): string {
  const { server, resource, id, hash } = params;

  // 필수 필드 검증 (trim 후 빈 문자열 체크)
  const trimmedServer = server.trim();
  const trimmedResource = resource.trim();
  const trimmedId = id.trim();

  if (!trimmedServer || !trimmedResource || !trimmedId) {
    throw new Error('server, resource, id는 필수입니다');
  }

  // 콜론 포함 여부 검증
  validateNoSeparator(trimmedServer, 'server');
  validateNoSeparator(trimmedResource, 'resource');
  validateNoSeparator(trimmedId, 'id');

  // 캐시 키 조립
  const parts = [trimmedServer, trimmedResource, trimmedId];

  // hash가 있고 빈 문자열이 아닌 경우에만 추가
  const trimmedHash = hash?.trim();
  if (trimmedHash) {
    validateNoSeparator(trimmedHash, 'hash');
    parts.push(trimmedHash);
  }

  return parts.join(KEY_SEPARATOR);
}

/**
 * 캐시 키 파싱
 *
 * 캐시 키 문자열을 파싱하여 개별 컴포넌트로 분리합니다.
 *
 * @param key - 파싱할 캐시 키
 * @returns 파싱된 캐시 키 객체, 유효하지 않으면 null
 *
 * @example
 * ```typescript
 * parseCacheKey('mcp-loader:page:123');
 * // 결과: { server: 'mcp-loader', resource: 'page', id: '123', hash: undefined }
 *
 * parseCacheKey('mcp-loader:page:123:abc');
 * // 결과: { server: 'mcp-loader', resource: 'page', id: '123', hash: 'abc' }
 *
 * parseCacheKey('invalid');
 * // 결과: null
 * ```
 */
export function parseCacheKey(key: string): ParsedCacheKey | null {
  if (!key) {
    return null;
  }

  const parts = key.split(KEY_SEPARATOR);

  // 파트 수 검증 (3개 또는 4개)
  if (parts.length < MIN_KEY_PARTS || parts.length > MAX_KEY_PARTS) {
    return null;
  }

  // 빈 파트가 있는지 검증
  if (parts.some((part) => !part)) {
    return null;
  }

  const [server, resource, id, hash] = parts;

  return {
    server,
    resource,
    id,
    hash: hash || undefined,
  };
}

/**
 * 캐시 키 유효성 검사
 *
 * 주어진 문자열이 유효한 캐시 키 형식인지 검사합니다.
 *
 * @param key - 검사할 캐시 키
 * @returns 유효하면 true, 아니면 false
 *
 * @example
 * ```typescript
 * isValidCacheKey('mcp-loader:page:123'); // true
 * isValidCacheKey('invalid'); // false
 * ```
 */
export function isValidCacheKey(key: string): boolean {
  return parseCacheKey(key) !== null;
}
