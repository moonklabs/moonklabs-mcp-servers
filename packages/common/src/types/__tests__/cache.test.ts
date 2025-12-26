import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  CacheKey,
  CacheKeySegments,
  CacheOptions,
  CacheEntry,
  CacheStats,
} from '../cache.js';
import { DEFAULT_TTL } from '../cache.js';

// buildCacheKey, parseCacheKey 함수는 cache/cacheManagerLogic.ts로 이동
// 해당 테스트는 cache/__tests__/cacheManagerLogic.test.ts에서 수행

describe('Cache Types', () => {
  describe('CacheKey', () => {
    it('should accept valid cache key format', () => {
      const key: CacheKey = 'spec-reader:notion:page123:abc123';
      expect(key).toBe('spec-reader:notion:page123:abc123');
    });

    it('should be a template literal type with 4 segments', () => {
      // Type check: CacheKey는 4개의 콜론으로 구분된 세그먼트를 가져야 함
      const validKey: CacheKey = 'server:resource:id:hash';
      expectTypeOf(validKey).toMatchTypeOf<`${string}:${string}:${string}:${string}`>();
    });
  });

  describe('CacheKeySegments', () => {
    it('should have all required fields', () => {
      const segments: CacheKeySegments = {
        server: 'spec-reader',
        resource: 'notion',
        id: 'page123',
        hash: 'abc123',
      };

      expect(segments.server).toBe('spec-reader');
      expect(segments.resource).toBe('notion');
      expect(segments.id).toBe('page123');
      expect(segments.hash).toBe('abc123');
    });
  });

  describe('CacheOptions', () => {
    it('should require ttl field', () => {
      const options: CacheOptions = {
        ttl: 300,
      };

      expect(options.ttl).toBe(300);
    });

    it('should accept optional fields', () => {
      const options: CacheOptions = {
        ttl: 300,
        checkperiod: 60,
        maxKeys: 1000,
        useClones: true,
        enableStats: true,
      };

      expect(options.checkperiod).toBe(60);
      expect(options.maxKeys).toBe(1000);
      expect(options.useClones).toBe(true);
      expect(options.enableStats).toBe(true);
    });
  });

  describe('CacheEntry', () => {
    it('should support generic value type', () => {
      interface CustomData {
        id: string;
        name: string;
      }

      const entry: CacheEntry<CustomData> = {
        value: { id: '123', name: 'test' },
        timestamp: Date.now(),
        ttl: 300,
      };

      expectTypeOf(entry.value).toEqualTypeOf<CustomData>();
      expect(entry.value.id).toBe('123');
    });

    it('should have required fields', () => {
      const entry: CacheEntry<string> = {
        value: 'cached data',
        timestamp: 1703548800000,
        ttl: 300,
      };

      expect(entry.value).toBe('cached data');
      expect(entry.timestamp).toBe(1703548800000);
      expect(entry.ttl).toBe(300);
    });

    it('should accept optional stats fields', () => {
      const entry: CacheEntry<string> = {
        value: 'cached data',
        timestamp: Date.now(),
        ttl: 300,
        hits: 5,
        lastAccessed: Date.now(),
      };

      expect(entry.hits).toBe(5);
      expect(entry.lastAccessed).toBeDefined();
    });
  });

  describe('CacheStats', () => {
    it('should have all statistics fields', () => {
      const stats: CacheStats = {
        hits: 150,
        misses: 30,
        keys: 25,
        ksize: 1024,
        vsize: 51200,
      };

      expect(stats.hits).toBe(150);
      expect(stats.misses).toBe(30);
      expect(stats.keys).toBe(25);
      expect(stats.ksize).toBe(1024);
      expect(stats.vsize).toBe(51200);
    });

    it('should calculate hit rate correctly', () => {
      const stats: CacheStats = {
        hits: 80,
        misses: 20,
        keys: 10,
        ksize: 100,
        vsize: 1000,
      };

      const hitRate = stats.hits / (stats.hits + stats.misses);
      expect(hitRate).toBe(0.8);
    });
  });

  describe('DEFAULT_TTL', () => {
    it('should have predefined TTL values', () => {
      expect(DEFAULT_TTL.NOTION_PAGE).toBe(300);
      expect(DEFAULT_TTL.SPEC_SUMMARY).toBe(3600);
      expect(DEFAULT_TTL.TOKEN_COUNT).toBe(0);
      expect(DEFAULT_TTL.STORY_CONTEXT).toBe(300);
      expect(DEFAULT_TTL.DOCUMENT_LIST).toBe(300);
    });

    it('should be readonly', () => {
      expectTypeOf(DEFAULT_TTL).toMatchTypeOf<{
        readonly NOTION_PAGE: 300;
        readonly SPEC_SUMMARY: 3600;
        readonly TOKEN_COUNT: 0;
        readonly STORY_CONTEXT: 300;
        readonly DOCUMENT_LIST: 300;
      }>();
    });
  });

  // buildCacheKey, parseCacheKey 테스트는 cache/__tests__/cacheManagerLogic.test.ts에서 수행
  // Story 1.6에서 함수가 cache 모듈로 이동됨
});
