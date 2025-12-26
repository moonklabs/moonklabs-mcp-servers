import { describe, it, expect } from 'vitest';
import {
  calculateSuccessRate,
  calculateCacheHitRate,
  calculateAverageMs,
  calculateMinMs,
  calculateMaxMs,
} from '../metricsCollectorLogic.js';

describe('metricsCollectorLogic', () => {
  describe('calculateSuccessRate', () => {
    it('should calculate success rate correctly', () => {
      expect(calculateSuccessRate(95, 100)).toBe(95);
      expect(calculateSuccessRate(48, 50)).toBe(96);
      expect(calculateSuccessRate(1, 3)).toBeCloseTo(33.33, 2);
    });

    it('should return null when total is 0', () => {
      expect(calculateSuccessRate(0, 0)).toBeNull();
    });

    it('should return 100 when all calls succeed', () => {
      expect(calculateSuccessRate(100, 100)).toBe(100);
    });

    it('should return 0 when all calls fail', () => {
      expect(calculateSuccessRate(0, 100)).toBe(0);
    });

    it('should handle decimal precision', () => {
      // 2/3 = 66.666... -> 66.67
      expect(calculateSuccessRate(2, 3)).toBeCloseTo(66.67, 2);
    });
  });

  describe('calculateCacheHitRate', () => {
    it('should calculate cache hit rate correctly', () => {
      expect(calculateCacheHitRate(80, 100)).toBe(80);
      expect(calculateCacheHitRate(40, 50)).toBe(80);
    });

    it('should return null when total is 0', () => {
      expect(calculateCacheHitRate(0, 0)).toBeNull();
    });

    it('should return 100 when all are hits', () => {
      expect(calculateCacheHitRate(50, 50)).toBe(100);
    });

    it('should return 0 when all are misses', () => {
      expect(calculateCacheHitRate(0, 50)).toBe(0);
    });

    it('should handle decimal precision', () => {
      // 1/3 = 33.333... -> 33.33
      expect(calculateCacheHitRate(1, 3)).toBeCloseTo(33.33, 2);
    });
  });

  describe('calculateAverageMs', () => {
    it('should calculate average correctly', () => {
      expect(calculateAverageMs([100, 200, 300])).toBe(200);
      expect(calculateAverageMs([50, 150])).toBe(100);
    });

    it('should return null for empty array', () => {
      expect(calculateAverageMs([])).toBeNull();
    });

    it('should handle single value', () => {
      expect(calculateAverageMs([150])).toBe(150);
    });

    it('should handle decimal precision', () => {
      // (100 + 200 + 201) / 3 = 167
      expect(calculateAverageMs([100, 200, 201])).toBeCloseTo(167, 0);
    });

    it('should handle zero values', () => {
      expect(calculateAverageMs([0, 0, 0])).toBe(0);
    });
  });

  describe('calculateMinMs', () => {
    it('should return minimum value', () => {
      expect(calculateMinMs([100, 50, 200])).toBe(50);
      expect(calculateMinMs([300, 100, 200])).toBe(100);
    });

    it('should return null for empty array', () => {
      expect(calculateMinMs([])).toBeNull();
    });

    it('should handle single value', () => {
      expect(calculateMinMs([150])).toBe(150);
    });

    it('should handle zero values', () => {
      expect(calculateMinMs([0, 100, 200])).toBe(0);
    });
  });

  describe('calculateMaxMs', () => {
    it('should return maximum value', () => {
      expect(calculateMaxMs([100, 50, 200])).toBe(200);
      expect(calculateMaxMs([300, 100, 200])).toBe(300);
    });

    it('should return null for empty array', () => {
      expect(calculateMaxMs([])).toBeNull();
    });

    it('should handle single value', () => {
      expect(calculateMaxMs([150])).toBe(150);
    });

    it('should handle zero values', () => {
      expect(calculateMaxMs([0, 0, 0])).toBe(0);
    });
  });
});
