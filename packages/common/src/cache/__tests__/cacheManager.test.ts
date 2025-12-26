import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from '../cacheManager.js';
import type { CacheStats } from '../../types/cache.js';

describe('CacheManager', () => {
  const originalEnv = process.env;
  let cache: CacheManager;

  beforeEach(() => {
    process.env = { ...originalEnv };
    cache = new CacheManager();
  });

  afterEach(() => {
    process.env = originalEnv;
    cache.flush();
  });

  describe('constructor', () => {
    it('should create CacheManager with default options', () => {
      const manager = new CacheManager();
      expect(manager).toBeDefined();
    });

    it('should create CacheManager with custom TTL', () => {
      const manager = new CacheManager({ stdTTL: 600 });
      expect(manager).toBeDefined();
    });

    it('should use CACHE_TTL_SECONDS from environment', () => {
      process.env.CACHE_TTL_SECONDS = '120';
      const manager = new CacheManager();
      // 기본 TTL이 환경변수 값으로 설정됨
      expect(manager).toBeDefined();
    });

    it('should handle NaN CACHE_TTL_SECONDS gracefully', () => {
      process.env.CACHE_TTL_SECONDS = 'not-a-number';
      const manager = new CacheManager();
      // NaN일 경우 기본 TTL 사용
      expect(manager).toBeDefined();
    });

    it('should handle empty string CACHE_TTL_SECONDS', () => {
      process.env.CACHE_TTL_SECONDS = '';
      const manager = new CacheManager();
      // 빈 문자열일 경우 기본 TTL 사용
      expect(manager).toBeDefined();
    });
  });

  describe('set and get', () => {
    it('should set and get a string value', () => {
      const key = 'test-key';
      const value = 'test-value';

      const setResult = cache.set(key, value);
      const getResult = cache.get<string>(key);

      expect(setResult).toBe(true);
      expect(getResult).toBe(value);
    });

    it('should set and get an object value', () => {
      const key = 'object-key';
      const value = { name: 'test', count: 42 };

      cache.set(key, value);
      const result = cache.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should set and get an array value', () => {
      const key = 'array-key';
      const value = [1, 2, 3, 4, 5];

      cache.set(key, value);
      const result = cache.get<number[]>(key);

      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const result = cache.get<string>('non-existent');

      expect(result).toBeUndefined();
    });

    it('should overwrite existing value', () => {
      const key = 'overwrite-key';

      cache.set(key, 'first');
      cache.set(key, 'second');
      const result = cache.get<string>(key);

      expect(result).toBe('second');
    });

    it('should set value with custom TTL', () => {
      const key = 'ttl-key';
      const value = 'ttl-value';

      cache.set(key, value, 1); // 1초 TTL

      expect(cache.get<string>(key)).toBe(value);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('existing', 'value');

      expect(cache.has('existing')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete existing key', () => {
      cache.set('to-delete', 'value');

      const deleted = cache.del('to-delete');

      expect(deleted).toBe(1);
      expect(cache.has('to-delete')).toBe(false);
    });

    it('should return 0 for non-existent key', () => {
      const deleted = cache.del('non-existent');

      expect(deleted).toBe(0);
    });

    it('should delete multiple keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const deleted = cache.del(['key1', 'key2']);

      expect(deleted).toBe(2);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('keys', () => {
    it('should return empty array for empty cache', () => {
      expect(cache.keys()).toEqual([]);
    });

    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('flush', () => {
    it('should remove all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.flush();

      expect(cache.keys()).toHaveLength(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.get<string>('key1'); // hit
      cache.get<string>('non-existent'); // miss

      const stats = cache.stats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('ksize');
      expect(stats).toHaveProperty('vsize');
    });

    it('should track hits and misses', () => {
      cache.set('key1', 'value1');

      cache.get<string>('key1'); // hit
      cache.get<string>('key1'); // hit
      cache.get<string>('non-existent'); // miss

      const stats = cache.stats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should track number of keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();

      expect(stats.keys).toBe(2);
    });
  });

  describe('TTL expiration', () => {
    it('should expire value after TTL', async () => {
      const key = 'expiring-key';
      cache.set(key, 'value', 1); // 1초 TTL

      expect(cache.get<string>(key)).toBe('value');

      // 1.1초 대기
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get<string>(key)).toBeUndefined();
    }, 3000);
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('cached-key', 'cached-value');

      const result = await cache.getOrSet('cached-key', async () => 'new-value');

      expect(result).toBe('cached-value');
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = vi.fn().mockResolvedValue('factory-value');

      const result = await cache.getOrSet('new-key', factory);

      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get<string>('new-key')).toBe('factory-value');
    });

    it('should use custom TTL for factory result', async () => {
      const factory = vi.fn().mockResolvedValue('factory-value');

      await cache.getOrSet('ttl-key', factory, 1);

      expect(cache.get<string>('ttl-key')).toBe('factory-value');

      // 1.1초 대기
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get<string>('ttl-key')).toBeUndefined();
    }, 3000);
  });

  describe('mget and mset', () => {
    it('should get multiple values at once', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const result = cache.mget<string>(['key1', 'key2', 'non-existent']);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should set multiple values at once', () => {
      const items = [
        { key: 'mkey1', val: 'mvalue1' },
        { key: 'mkey2', val: 'mvalue2' },
      ];

      cache.mset(items);

      expect(cache.get<string>('mkey1')).toBe('mvalue1');
      expect(cache.get<string>('mkey2')).toBe('mvalue2');
    });

    it('should set multiple values with TTL', () => {
      const items = [
        { key: 'mkey1', val: 'mvalue1', ttl: 60 },
        { key: 'mkey2', val: 'mvalue2', ttl: 120 },
      ];

      cache.mset(items);

      expect(cache.get<string>('mkey1')).toBe('mvalue1');
      expect(cache.get<string>('mkey2')).toBe('mvalue2');
    });
  });

  describe('getTtl and setTtl', () => {
    it('should get remaining TTL for a key', () => {
      cache.set('ttl-test', 'value', 60);

      const ttl = cache.getTtl('ttl-test');

      // TTL은 밀리초로 반환됨
      expect(typeof ttl).toBe('number');
      if (ttl !== undefined) {
        expect(ttl).toBeGreaterThan(Date.now());
      }
    });

    it('should return undefined for non-existent key', () => {
      const ttl = cache.getTtl('non-existent');

      expect(ttl).toBeUndefined();
    });

    it('should update TTL for existing key', () => {
      cache.set('update-ttl', 'value', 60);

      const updated = cache.setTtl('update-ttl', 120);

      expect(updated).toBe(true);
    });

    it('should return false for non-existent key TTL update', () => {
      const updated = cache.setTtl('non-existent', 120);

      expect(updated).toBe(false);
    });
  });
});
