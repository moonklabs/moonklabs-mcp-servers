/**
 * 캐시 모듈
 *
 * 로컬 메모리 캐시 관리 기능을 제공합니다.
 * Phase 1에서는 node-cache 기반, Phase 2+에서 Redis로 전환 가능합니다.
 *
 * @module cache
 *
 * @example
 * ```typescript
 * import {
 *   CacheManager,
 *   buildCacheKey,
 *   parseCacheKey,
 *   CACHE_TTL
 * } from '@moonklabs/mcp-common';
 *
 * // 캐시 매니저 생성
 * const cache = new CacheManager();
 *
 * // 캐시 키 생성
 * const key = buildCacheKey({
 *   server: 'mcp-context-loader',
 *   resource: 'notion-page',
 *   id: 'page-123',
 * });
 *
 * // 값 저장 및 조회
 * cache.set(key, data, CACHE_TTL.NOTION_PAGE);
 * const cached = cache.get(key);
 * ```
 */

// cacheManagerLogic - 순수 함수
export {
  buildCacheKey,
  parseCacheKey,
  isValidCacheKey,
  CACHE_TTL,
  type CacheKeyParams,
  type ParsedCacheKey,
  type CacheTTLType,
} from './cacheManagerLogic.js';

// cacheManager - 클래스
// CacheStats는 types/cache.ts에서 이미 export됨
export { CacheManager, type CacheManagerOptions, type CacheSetItem } from './cacheManager.js';
