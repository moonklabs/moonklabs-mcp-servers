import { describe, it, expect, expectTypeOf } from 'vitest';
import type { MetricsSummary, ToolMetrics } from '../metrics.js';

describe('Metrics Types', () => {
  describe('MetricsSummary', () => {
    it('should have all required fields', () => {
      const summary: MetricsSummary = {
        total_calls: 100,
        successful_calls: 95,
        failed_calls: 5,
        success_rate: 95.0,
        cache_hits: 80,
        cache_misses: 20,
        cache_hit_rate: 80.0,
        avg_response_ms: 150.5,
        tools: {},
        started_at: Date.now(),
        updated_at: Date.now(),
      };

      expect(summary.total_calls).toBe(100);
      expect(summary.successful_calls).toBe(95);
      expect(summary.failed_calls).toBe(5);
      expect(summary.success_rate).toBe(95.0);
      expect(summary.cache_hits).toBe(80);
      expect(summary.cache_misses).toBe(20);
      expect(summary.cache_hit_rate).toBe(80.0);
      expect(summary.avg_response_ms).toBe(150.5);
    });

    it('should allow null for rate fields when no data', () => {
      const summary: MetricsSummary = {
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        success_rate: null,
        cache_hits: 0,
        cache_misses: 0,
        cache_hit_rate: null,
        avg_response_ms: null,
        tools: {},
        started_at: Date.now(),
        updated_at: Date.now(),
      };

      expect(summary.success_rate).toBeNull();
      expect(summary.cache_hit_rate).toBeNull();
      expect(summary.avg_response_ms).toBeNull();
    });

    it('should contain tools as Record<string, ToolMetrics>', () => {
      const toolMetrics: ToolMetrics = {
        name: 'test-tool',
        calls: 50,
        successes: 48,
        failures: 2,
        success_rate: 96.0,
        avg_response_ms: 120.5,
        min_response_ms: 50,
        max_response_ms: 300,
      };

      const summary: MetricsSummary = {
        total_calls: 50,
        successful_calls: 48,
        failed_calls: 2,
        success_rate: 96.0,
        cache_hits: 40,
        cache_misses: 10,
        cache_hit_rate: 80.0,
        avg_response_ms: 120.5,
        tools: {
          'test-tool': toolMetrics,
        },
        started_at: Date.now(),
        updated_at: Date.now(),
      };

      expect(summary.tools['test-tool']).toEqual(toolMetrics);
    });
  });

  describe('ToolMetrics', () => {
    it('should have all required fields', () => {
      const metrics: ToolMetrics = {
        name: 'read-spec',
        calls: 100,
        successes: 95,
        failures: 5,
        success_rate: 95.0,
        avg_response_ms: 200.0,
        min_response_ms: 50,
        max_response_ms: 500,
      };

      expect(metrics.name).toBe('read-spec');
      expect(metrics.calls).toBe(100);
      expect(metrics.successes).toBe(95);
      expect(metrics.failures).toBe(5);
      expect(metrics.success_rate).toBe(95.0);
      expect(metrics.avg_response_ms).toBe(200.0);
      expect(metrics.min_response_ms).toBe(50);
      expect(metrics.max_response_ms).toBe(500);
    });

    it('should allow null for rate and time fields when no data', () => {
      const metrics: ToolMetrics = {
        name: 'new-tool',
        calls: 0,
        successes: 0,
        failures: 0,
        success_rate: null,
        avg_response_ms: null,
        min_response_ms: null,
        max_response_ms: null,
      };

      expect(metrics.success_rate).toBeNull();
      expect(metrics.avg_response_ms).toBeNull();
      expect(metrics.min_response_ms).toBeNull();
      expect(metrics.max_response_ms).toBeNull();
    });

    it('should have correct type structure', () => {
      const metrics: ToolMetrics = {
        name: 'test',
        calls: 1,
        successes: 1,
        failures: 0,
        success_rate: 100,
        avg_response_ms: 100,
        min_response_ms: 100,
        max_response_ms: 100,
      };

      expect(typeof metrics.name).toBe('string');
      expect(typeof metrics.calls).toBe('number');
      // success_rate은 number | null 타입
      expectTypeOf<typeof metrics.success_rate>().toEqualTypeOf<number | null>();
    });
  });
});
