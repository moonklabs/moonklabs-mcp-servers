import { describe, it, expect, beforeEach, afterEach, expectTypeOf } from 'vitest';
import {
  loadEnvConfig,
  resetEnvConfigCache,
  type EnvConfig,
} from '../index.js';
import {
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_NODE_ENV,
} from '../defaults.js';

describe('Config Module', () => {
  describe('loadEnvConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // 환경변수 격리
      process.env = { ...originalEnv };
      // 테스트용 환경변수 초기화
      delete process.env.NODE_ENV;
      delete process.env.LOG_LEVEL;
      delete process.env.NOTION_API_KEY;
      delete process.env.NOTION_PAGE_IDS;
      delete process.env.CACHE_TTL_SECONDS;
      // 캐시 초기화 (중요!)
      resetEnvConfigCache();
    });

    afterEach(() => {
      process.env = originalEnv;
      resetEnvConfigCache();
    });

    it('should return EnvConfig with default values when environment variables are not set', () => {
      const config = loadEnvConfig();

      expect(config.NODE_ENV).toBe('development');
      expect(config.LOG_LEVEL).toBe('info');
      expect(config.CACHE_TTL_SECONDS).toBe(300);
    });

    it('should return EnvConfig type', () => {
      const config = loadEnvConfig();

      expectTypeOf(config).toMatchTypeOf<EnvConfig>();
    });

    it('should use provided NODE_ENV value', () => {
      process.env.NODE_ENV = 'production';

      const config = loadEnvConfig();

      expect(config.NODE_ENV).toBe('production');
    });

    it('should use provided LOG_LEVEL value', () => {
      process.env.LOG_LEVEL = 'debug';

      const config = loadEnvConfig();

      expect(config.LOG_LEVEL).toBe('debug');
    });

    it('should accept valid NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test'] as const;

      for (const env of validEnvs) {
        resetEnvConfigCache();
        process.env.NODE_ENV = env;
        const config = loadEnvConfig();
        expect(config.NODE_ENV).toBe(env);
      }
    });

    it('should accept valid LOG_LEVEL values', () => {
      const validLevels = ['debug', 'info', 'warn', 'error'] as const;

      for (const level of validLevels) {
        resetEnvConfigCache();
        process.env.LOG_LEVEL = level;
        const config = loadEnvConfig();
        expect(config.LOG_LEVEL).toBe(level);
      }
    });

    it('should throw error for invalid NODE_ENV value', () => {
      process.env.NODE_ENV = 'invalid-env';

      expect(() => loadEnvConfig()).toThrow('환경변수 설정이 올바르지 않습니다');
    });

    it('should throw error for invalid LOG_LEVEL value', () => {
      process.env.LOG_LEVEL = 'invalid-level';

      expect(() => loadEnvConfig()).toThrow('환경변수 설정이 올바르지 않습니다');
    });

    it('should coerce CACHE_TTL_SECONDS string to number', () => {
      process.env.CACHE_TTL_SECONDS = '600';

      const config = loadEnvConfig();

      expect(config.CACHE_TTL_SECONDS).toBe(600);
      expect(typeof config.CACHE_TTL_SECONDS).toBe('number');
    });

    it('should throw error for non-numeric CACHE_TTL_SECONDS', () => {
      process.env.CACHE_TTL_SECONDS = 'not-a-number';

      expect(() => loadEnvConfig()).toThrow('환경변수 설정이 올바르지 않습니다');
    });

    it('should throw error for CACHE_TTL_SECONDS less than 1', () => {
      process.env.CACHE_TTL_SECONDS = '0';

      expect(() => loadEnvConfig()).toThrow('환경변수 설정이 올바르지 않습니다');
    });

    it('should throw error for negative CACHE_TTL_SECONDS', () => {
      process.env.CACHE_TTL_SECONDS = '-1';

      expect(() => loadEnvConfig()).toThrow('환경변수 설정이 올바르지 않습니다');
    });

    it('should treat empty NOTION_API_KEY as undefined', () => {
      process.env.NOTION_API_KEY = '';

      const config = loadEnvConfig();

      expect(config.NOTION_API_KEY).toBeUndefined();
    });

    it('should treat empty NOTION_PAGE_IDS as undefined', () => {
      process.env.NOTION_PAGE_IDS = '';

      const config = loadEnvConfig();

      expect(config.NOTION_PAGE_IDS).toBeUndefined();
    });

    it('should cache config and return same instance', () => {
      const config1 = loadEnvConfig();
      const config2 = loadEnvConfig();

      expect(config1).toBe(config2);
    });

    it('should reload config after cache reset', () => {
      process.env.LOG_LEVEL = 'debug';
      const config1 = loadEnvConfig();

      resetEnvConfigCache();
      process.env.LOG_LEVEL = 'warn';
      const config2 = loadEnvConfig();

      expect(config1.LOG_LEVEL).toBe('debug');
      expect(config2.LOG_LEVEL).toBe('warn');
    });

    it('should handle optional NOTION_API_KEY', () => {
      // 설정되지 않은 경우
      let config = loadEnvConfig();
      expect(config.NOTION_API_KEY).toBeUndefined();

      // 설정된 경우
      resetEnvConfigCache();
      process.env.NOTION_API_KEY = 'secret_abc123';
      config = loadEnvConfig();
      expect(config.NOTION_API_KEY).toBe('secret_abc123');
    });

    it('should handle optional NOTION_PAGE_IDS', () => {
      // 설정되지 않은 경우
      let config = loadEnvConfig();
      expect(config.NOTION_PAGE_IDS).toBeUndefined();

      // 설정된 경우 (콤마 구분)
      resetEnvConfigCache();
      process.env.NOTION_PAGE_IDS = 'page1,page2,page3';
      config = loadEnvConfig();
      expect(config.NOTION_PAGE_IDS).toBe('page1,page2,page3');
    });

    it('should include all required fields in EnvConfig', () => {
      const config = loadEnvConfig();

      // 필수 필드 존재 확인
      expect(config).toHaveProperty('NODE_ENV');
      expect(config).toHaveProperty('LOG_LEVEL');
      expect(config).toHaveProperty('CACHE_TTL_SECONDS');
    });
  });

  describe('defaults', () => {
    it('should have DEFAULT_CACHE_TTL_SECONDS equal to 300', () => {
      expect(DEFAULT_CACHE_TTL_SECONDS).toBe(300);
    });

    it('should have DEFAULT_LOG_LEVEL equal to "info"', () => {
      expect(DEFAULT_LOG_LEVEL).toBe('info');
    });

    it('should have DEFAULT_NODE_ENV equal to "development"', () => {
      expect(DEFAULT_NODE_ENV).toBe('development');
    });

    it('should have readonly DEFAULT_CACHE_TTL_SECONDS', () => {
      expectTypeOf(DEFAULT_CACHE_TTL_SECONDS).toMatchTypeOf<300>();
    });

    it('should have readonly DEFAULT_LOG_LEVEL', () => {
      expectTypeOf(DEFAULT_LOG_LEVEL).toMatchTypeOf<'info'>();
    });

    it('should have readonly DEFAULT_NODE_ENV', () => {
      expectTypeOf(DEFAULT_NODE_ENV).toMatchTypeOf<'development'>();
    });
  });

  describe('EnvConfig type', () => {
    it('should have correct NODE_ENV type', () => {
      const config = loadEnvConfig();

      expectTypeOf(config.NODE_ENV).toMatchTypeOf<'development' | 'production' | 'test'>();
    });

    it('should have correct LOG_LEVEL type', () => {
      const config = loadEnvConfig();

      expectTypeOf(config.LOG_LEVEL).toMatchTypeOf<'debug' | 'info' | 'warn' | 'error'>();
    });

    it('should have correct CACHE_TTL_SECONDS type', () => {
      const config = loadEnvConfig();

      expectTypeOf(config.CACHE_TTL_SECONDS).toMatchTypeOf<number>();
    });

    it('should have correct optional NOTION_API_KEY type', () => {
      const config = loadEnvConfig();

      expectTypeOf(config.NOTION_API_KEY).toMatchTypeOf<string | undefined>();
    });

    it('should have correct optional NOTION_PAGE_IDS type', () => {
      const config = loadEnvConfig();

      expectTypeOf(config.NOTION_PAGE_IDS).toMatchTypeOf<string | undefined>();
    });
  });
});
