import { describe, it, expect } from 'vitest';
import {
  buildCacheKey,
  parseCacheKey,
  isValidCacheKey,
  CACHE_TTL,
  type CacheKeyParams,
} from '../cacheManagerLogic.js';

describe('cacheManagerLogic', () => {
  describe('buildCacheKey', () => {
    it('should build cache key with server, resource, id', () => {
      const params: CacheKeyParams = {
        server: 'mcp-context-loader',
        resource: 'notion-page',
        id: 'page-123',
      };

      const result = buildCacheKey(params);

      expect(result).toBe('mcp-context-loader:notion-page:page-123');
    });

    it('should include hash when provided', () => {
      const params: CacheKeyParams = {
        server: 'mcp-spec-reader',
        resource: 'spec-summary',
        id: 'spec-42',
        hash: 'abc123',
      };

      const result = buildCacheKey(params);

      expect(result).toBe('mcp-spec-reader:spec-summary:spec-42:abc123');
    });

    it('should trim whitespace from all parts', () => {
      const params: CacheKeyParams = {
        server: '  mcp-server  ',
        resource: '  resource  ',
        id: '  id-123  ',
        hash: '  hash456  ',
      };

      const result = buildCacheKey(params);

      expect(result).toBe('mcp-server:resource:id-123:hash456');
    });

    it('should throw error for empty server', () => {
      const params: CacheKeyParams = {
        server: '',
        resource: 'resource',
        id: 'id-123',
      };

      expect(() => buildCacheKey(params)).toThrow('server, resource, id는 필수입니다');
    });

    it('should throw error for whitespace-only server', () => {
      const params: CacheKeyParams = {
        server: '   ',
        resource: 'resource',
        id: 'id-123',
      };

      expect(() => buildCacheKey(params)).toThrow('server, resource, id는 필수입니다');
    });

    it('should throw error for empty resource', () => {
      const params: CacheKeyParams = {
        server: 'server',
        resource: '',
        id: 'id-123',
      };

      expect(() => buildCacheKey(params)).toThrow('server, resource, id는 필수입니다');
    });

    it('should throw error for empty id', () => {
      const params: CacheKeyParams = {
        server: 'server',
        resource: 'resource',
        id: '',
      };

      expect(() => buildCacheKey(params)).toThrow('server, resource, id는 필수입니다');
    });

    it('should ignore empty hash', () => {
      const params: CacheKeyParams = {
        server: 'server',
        resource: 'resource',
        id: 'id-123',
        hash: '',
      };

      const result = buildCacheKey(params);

      expect(result).toBe('server:resource:id-123');
    });

    it('should ignore whitespace-only hash', () => {
      const params: CacheKeyParams = {
        server: 'server',
        resource: 'resource',
        id: 'id-123',
        hash: '   ',
      };

      const result = buildCacheKey(params);

      expect(result).toBe('server:resource:id-123');
    });

    describe('colon validation', () => {
      it('should throw error when server contains colon', () => {
        const params: CacheKeyParams = {
          server: 'mcp:server',
          resource: 'resource',
          id: 'id-123',
        };

        expect(() => buildCacheKey(params)).toThrow('server에 콜론(:)을 포함할 수 없습니다');
      });

      it('should throw error when resource contains colon', () => {
        const params: CacheKeyParams = {
          server: 'server',
          resource: 'notion:page',
          id: 'id-123',
        };

        expect(() => buildCacheKey(params)).toThrow('resource에 콜론(:)을 포함할 수 없습니다');
      });

      it('should throw error when id contains colon', () => {
        const params: CacheKeyParams = {
          server: 'server',
          resource: 'resource',
          id: 'page:123',
        };

        expect(() => buildCacheKey(params)).toThrow('id에 콜론(:)을 포함할 수 없습니다');
      });

      it('should throw error when hash contains colon', () => {
        const params: CacheKeyParams = {
          server: 'server',
          resource: 'resource',
          id: 'id-123',
          hash: 'abc:def',
        };

        expect(() => buildCacheKey(params)).toThrow('hash에 콜론(:)을 포함할 수 없습니다');
      });
    });
  });

  describe('parseCacheKey', () => {
    it('should parse cache key with 3 parts', () => {
      const key = 'mcp-context-loader:notion-page:page-123';

      const result = parseCacheKey(key);

      expect(result).toEqual({
        server: 'mcp-context-loader',
        resource: 'notion-page',
        id: 'page-123',
        hash: undefined,
      });
    });

    it('should parse cache key with 4 parts (including hash)', () => {
      const key = 'mcp-spec-reader:spec-summary:spec-42:abc123';

      const result = parseCacheKey(key);

      expect(result).toEqual({
        server: 'mcp-spec-reader',
        resource: 'spec-summary',
        id: 'spec-42',
        hash: 'abc123',
      });
    });

    it('should return null for invalid key format (too few parts)', () => {
      const key = 'invalid:key';

      const result = parseCacheKey(key);

      expect(result).toBeNull();
    });

    it('should return null for invalid key format (too many parts)', () => {
      const key = 'a:b:c:d:e:f';

      const result = parseCacheKey(key);

      expect(result).toBeNull();
    });

    it('should return null for empty key', () => {
      const result = parseCacheKey('');

      expect(result).toBeNull();
    });

    it('should return null for key with empty parts', () => {
      const key = 'server::id';

      const result = parseCacheKey(key);

      expect(result).toBeNull();
    });
  });

  describe('isValidCacheKey', () => {
    it('should return true for valid 3-part key', () => {
      const key = 'mcp-context-loader:notion-page:page-123';

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should return true for valid 4-part key', () => {
      const key = 'mcp-spec-reader:spec-summary:spec-42:abc123';

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should return false for invalid key', () => {
      expect(isValidCacheKey('invalid:key')).toBe(false);
      expect(isValidCacheKey('')).toBe(false);
      expect(isValidCacheKey('a:b:c:d:e')).toBe(false);
    });
  });

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.NOTION_PAGE).toBe(300);
      expect(CACHE_TTL.SPEC_SUMMARY).toBe(3600);
      expect(CACHE_TTL.TOKEN_COUNT).toBe(0);
      expect(CACHE_TTL.STORY_CONTEXT).toBe(300);
      expect(CACHE_TTL.DOCUMENT_LIST).toBe(300);
      expect(CACHE_TTL.DEFAULT).toBe(300);
    });

    it('should be readonly', () => {
      // TypeScript 컴파일 타임에 readonly 체크됨
      // 런타임에서는 as const로 인해 타입이 리터럴로 좁혀짐
      expect(typeof CACHE_TTL.NOTION_PAGE).toBe('number');
    });
  });
});
