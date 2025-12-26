/**
 * 캐시 관리 클래스 모듈
 *
 * node-cache를 래핑하여 타입 안전한 캐시 인터페이스를 제공합니다.
 * Phase 1에서는 로컬 메모리 캐시를 사용하며, Phase 2+에서 Redis로 전환 가능합니다.
 *
 * @module cache/cacheManager
 *
 * @example
 * ```typescript
 * import { CacheManager } from '@moonklabs/mcp-common';
 *
 * const cache = new CacheManager();
 *
 * // 값 저장
 * cache.set('key', { data: 'value' }, 300);
 *
 * // 값 조회
 * const value = cache.get<{ data: string }>('key');
 *
 * // 캐시 또는 팩토리
 * const result = await cache.getOrSet('key', async () => fetchData(), 300);
 * ```
 */

import NodeCache from 'node-cache';
import { CACHE_TTL } from './cacheManagerLogic.js';
import type { CacheStats } from '../types/cache.js';

// CacheStats 타입은 types/cache.ts에서 정의됨

/**
 * CacheManager 생성자 옵션
 */
export interface CacheManagerOptions {
  /** 기본 TTL (초). 0이면 만료 없음. 기본값: CACHE_TTL_SECONDS 환경변수 또는 300 */
  stdTTL?: number;
  /** TTL 체크 주기 (초). 기본값: 60 */
  checkperiod?: number;
  /**
   * 값 복제 여부. 기본값: false (참조 반환)
   *
   * @warning false일 때 캐시된 객체를 직접 수정하면 캐시 내부 데이터도 변경됩니다.
   * 캐시 무결성이 중요한 경우 true로 설정하거나, 반환값을 수정하지 마세요.
   */
  useClones?: boolean;
  /** 만료된 키 자동 삭제 여부. 기본값: true */
  deleteOnExpire?: boolean;
}

/**
 * mset용 아이템 인터페이스
 */
export interface CacheSetItem<T> {
  key: string;
  val: T;
  ttl?: number;
}

/**
 * 캐시 관리자 클래스
 *
 * node-cache를 래핑하여 타입 안전한 캐시 인터페이스를 제공합니다.
 *
 * @example
 * ```typescript
 * const cache = new CacheManager({ stdTTL: 600 });
 *
 * // 기본 사용
 * cache.set('user:123', userData);
 * const user = cache.get<UserData>('user:123');
 *
 * // 통계 확인
 * const stats = cache.stats();
 * console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
 * ```
 */
export class CacheManager {
  private cache: NodeCache;

  /**
   * CacheManager 생성자
   *
   * @param options - 캐시 옵션
   */
  constructor(options?: CacheManagerOptions) {
    // 환경변수에서 기본 TTL 읽기 (NaN 체크 포함)
    const envTTL = process.env.CACHE_TTL_SECONDS
      ? parseInt(process.env.CACHE_TTL_SECONDS, 10)
      : undefined;
    const validEnvTTL = envTTL !== undefined && !Number.isNaN(envTTL) ? envTTL : undefined;

    const defaultTTL = options?.stdTTL ?? validEnvTTL ?? CACHE_TTL.DEFAULT;

    this.cache = new NodeCache({
      stdTTL: defaultTTL,
      checkperiod: options?.checkperiod ?? 60,
      useClones: options?.useClones ?? false,
      deleteOnExpire: options?.deleteOnExpire ?? true,
    });
  }

  /**
   * 캐시에서 값 조회
   *
   * @param key - 캐시 키
   * @returns 캐시된 값 또는 undefined
   *
   * @example
   * ```typescript
   * const value = cache.get<string>('my-key');
   * if (value !== undefined) {
   *   console.log('Cache hit:', value);
   * }
   * ```
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * 캐시에 값 저장
   *
   * @param key - 캐시 키
   * @param value - 저장할 값
   * @param ttl - TTL (초). 생략시 기본 TTL 사용
   * @returns 저장 성공 여부
   *
   * @example
   * ```typescript
   * cache.set('user:123', userData, 300); // 5분 TTL
   * cache.set('config', config); // 기본 TTL 사용
   * ```
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * 캐시에 키 존재 여부 확인
   *
   * @param key - 캐시 키
   * @returns 존재하면 true
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 캐시에서 키 삭제
   *
   * @param key - 삭제할 키 (단일 또는 배열)
   * @returns 삭제된 키 수
   *
   * @example
   * ```typescript
   * cache.del('single-key');
   * cache.del(['key1', 'key2', 'key3']);
   * ```
   */
  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  /**
   * 캐시의 모든 키 조회
   *
   * @returns 모든 키 배열
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * 캐시 전체 삭제
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * 캐시 통계 조회
   *
   * @returns 캐시 통계 정보
   *
   * @example
   * ```typescript
   * const stats = cache.stats();
   * console.log(`Hit rate: ${stats.hits / (stats.hits + stats.misses)}`);
   * ```
   */
  stats(): CacheStats {
    const nodeStats = this.cache.getStats();
    return {
      hits: nodeStats.hits,
      misses: nodeStats.misses,
      keys: nodeStats.keys,
      ksize: nodeStats.ksize,
      vsize: nodeStats.vsize,
    };
  }

  /**
   * 캐시에서 값 조회, 없으면 팩토리 함수 실행 후 캐시
   *
   * 캐시 히트 시 바로 반환, 미스 시 팩토리 함수를 실행하고
   * 결과를 캐시에 저장한 후 반환합니다.
   *
   * @param key - 캐시 키
   * @param factory - 캐시 미스 시 실행할 팩토리 함수
   * @param ttl - TTL (초). 생략시 기본 TTL 사용
   * @returns 캐시된 값 또는 팩토리 함수 결과
   * @throws factory 함수에서 발생한 에러는 그대로 전파됩니다.
   *         에러 발생 시 캐시에 값이 저장되지 않습니다.
   *
   * @example
   * ```typescript
   * const userData = await cache.getOrSet(
   *   'user:123',
   *   async () => await fetchUserFromDB(123),
   *   300
   * );
   * ```
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * 여러 키의 값을 한 번에 조회
   *
   * @param keys - 조회할 키 배열
   * @returns 키-값 객체 (존재하는 키만 포함)
   *
   * @example
   * ```typescript
   * const values = cache.mget<string>(['key1', 'key2', 'key3']);
   * // 결과: { key1: 'value1', key2: 'value2' } (key3이 없으면 제외)
   * ```
   */
  mget<T>(keys: string[]): Record<string, T> {
    return this.cache.mget<T>(keys);
  }

  /**
   * 여러 키-값 쌍을 한 번에 저장
   *
   * @param items - 저장할 아이템 배열
   * @returns 저장 성공 여부
   *
   * @example
   * ```typescript
   * cache.mset([
   *   { key: 'key1', val: 'value1', ttl: 60 },
   *   { key: 'key2', val: 'value2' },
   * ]);
   * ```
   */
  mset<T>(items: CacheSetItem<T>[]): boolean {
    return this.cache.mset(items);
  }

  /**
   * 키의 남은 TTL 조회
   *
   * @param key - 캐시 키
   * @returns 만료 시각 (밀리초) 또는 undefined (키가 없거나 만료됨)
   *
   * @example
   * ```typescript
   * const expireAt = cache.getTtl('key');
   * if (expireAt) {
   *   const remainingMs = expireAt - Date.now();
   *   console.log(`남은 시간: ${remainingMs}ms`);
   * }
   * ```
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * 키의 TTL 업데이트
   *
   * @param key - 캐시 키
   * @param ttl - 새 TTL (초)
   * @returns 업데이트 성공 여부
   *
   * @example
   * ```typescript
   * // 캐시 수명 연장
   * cache.setTtl('key', 600);
   * ```
   */
  setTtl(key: string, ttl: number): boolean {
    return this.cache.ttl(key, ttl);
  }
}
