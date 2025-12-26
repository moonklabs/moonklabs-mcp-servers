import { describe, it, expect } from 'vitest';
import { VERSION } from '../index.js';

describe('@moonklabs/mcp-common', () => {
  describe('VERSION', () => {
    it('should export VERSION constant', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
    });

    it('should be 0.1.0', () => {
      expect(VERSION).toBe('0.1.0');
    });
  });

  describe('package structure', () => {
    it('should be importable', async () => {
      // 동적 import로 패키지 구조 검증
      const module = await import('../index.js');
      expect(module).toBeDefined();
      expect(module.VERSION).toBe('0.1.0');
    });
  });
});
