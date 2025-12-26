/**
 * 캐시 관련 타입 정의
 *
 * 캐싱 레이어에서 사용하는 타입들을 정의합니다.
 * node-cache (Phase 1) → Redis (Phase 2+) 마이그레이션을 고려한 설계입니다.
 *
 * @module types/cache
 */

/**
 * 캐시 키 형식
 *
 * 형식: {server}:{resource}:{id}:{hash}
 * 예: spec-reader:notion:page123:abc123
 *
 * Template Literal Type으로 형식을 강제합니다.
 */
export type CacheKey = `${string}:${string}:${string}:${string}`;

/**
 * 캐시 키 세그먼트
 *
 * 캐시 키를 구성하는 각 부분입니다.
 */
export interface CacheKeySegments {
  /** 서버 이름 (예: spec-reader, context-loader) */
  server: string;
  /** 리소스 타입 (예: notion, file, story) */
  resource: string;
  /** 리소스 ID (예: page123, story-42) */
  id: string;
  /** 내용 해시 또는 버전 (예: abc123, v1) */
  hash: string;
}

/**
 * 캐시 옵션
 *
 * @example
 * ```typescript
 * const options: CacheOptions = {
 *   ttl: 300,        // 5분
 *   checkperiod: 60  // 1분마다 만료 체크
 * };
 * ```
 */
export interface CacheOptions {
  /** Time-To-Live (초 단위) */
  ttl: number;
  /** 만료 체크 주기 (초 단위) */
  checkperiod?: number;
  /** 최대 캐시 항목 수 */
  maxKeys?: number;
  /** TTL 갱신 시 자동 연장 여부 */
  useClones?: boolean;
  /** 통계 수집 여부 */
  enableStats?: boolean;
}

/**
 * 캐시 항목
 *
 * @template T - 캐시된 데이터의 타입
 *
 * @example
 * ```typescript
 * const entry: CacheEntry<NotionPage> = {
 *   value: { id: "page-123", title: "PRD" },
 *   timestamp: Date.now(),
 *   ttl: 300
 * };
 * ```
 */
export interface CacheEntry<T> {
  /** 캐시된 값 */
  value: T;
  /** 캐시 저장 시간 (Unix timestamp in ms) */
  timestamp: number;
  /** Time-To-Live (초 단위) */
  ttl: number;
  /** 캐시 히트 횟수 (통계용) */
  hits?: number;
  /** 마지막 접근 시간 (Unix timestamp in ms) */
  lastAccessed?: number;
}

/**
 * 캐시 통계 정보
 *
 * @example
 * ```typescript
 * const stats: CacheStats = {
 *   hits: 150,
 *   misses: 30,
 *   keys: 25,
 *   ksize: 1024,
 *   vsize: 51200
 * };
 * console.log(`Hit rate: ${stats.hits / (stats.hits + stats.misses) * 100}%`);
 * ```
 */
export interface CacheStats {
  /** 캐시 히트 횟수 */
  hits: number;
  /** 캐시 미스 횟수 */
  misses: number;
  /** 현재 캐시 키 수 */
  keys: number;
  /** 키 크기 (bytes) */
  ksize: number;
  /** 값 크기 (bytes) */
  vsize: number;
}

/**
 * 캐시 설정 결과
 *
 * set 작업의 결과를 나타냅니다.
 */
export interface CacheSetResult {
  /** 성공 여부 */
  success: boolean;
  /** 기존 값 덮어쓰기 여부 */
  overwritten: boolean;
  /** 설정된 TTL */
  ttl: number;
}

/**
 * 캐시 무효화 결과
 *
 * invalidate 작업의 결과를 나타냅니다.
 */
export interface CacheInvalidateResult {
  /** 삭제된 키 수 */
  deletedCount: number;
  /** 삭제된 키 목록 */
  deletedKeys: string[];
}

/**
 * 기본 TTL 값 (초 단위)
 *
 * Architecture 문서의 §Data Architecture를 참조합니다.
 *
 * @deprecated CACHE_TTL from cache 모듈을 사용하세요.
 * @see {@link ../cache/cacheManagerLogic.js} CACHE_TTL
 */
export const DEFAULT_TTL = {
  /** Notion 페이지 (자주 변경) */
  NOTION_PAGE: 300, // 5분
  /** 스펙 요약 (LLM 비용 절약) */
  SPEC_SUMMARY: 3600, // 1시간
  /** 토큰 수 (불변) */
  TOKEN_COUNT: 0, // 무제한 (0 = no expiry)
  /** 스토리 컨텍스트 */
  STORY_CONTEXT: 300, // 5분
  /** 문서 목록 */
  DOCUMENT_LIST: 300, // 5분
} as const;

// buildCacheKey, parseCacheKey 함수는 cache/cacheManagerLogic.ts로 이동
// Story 1.6에서 더 유연한 버전으로 구현됨 (hash 선택적, 3-4파트 지원)
