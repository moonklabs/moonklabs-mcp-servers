import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../metricsCollector.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const metrics = collector.getMetrics();

      expect(metrics.total_calls).toBe(0);
      expect(metrics.successful_calls).toBe(0);
      expect(metrics.failed_calls).toBe(0);
      expect(metrics.success_rate).toBeNull();
      expect(metrics.cache_hits).toBe(0);
      expect(metrics.cache_misses).toBe(0);
      expect(metrics.cache_hit_rate).toBeNull();
      expect(metrics.avg_response_ms).toBeNull();
      expect(Object.keys(metrics.tools)).toHaveLength(0);
      expect(metrics.started_at).toBeGreaterThan(0);
      expect(metrics.updated_at).toBeGreaterThan(0);
    });
  });

  describe('recordToolCall', () => {
    it('should record successful tool call', () => {
      collector.recordToolCall('read-spec', true, 100);

      const metrics = collector.getMetrics();
      expect(metrics.total_calls).toBe(1);
      expect(metrics.successful_calls).toBe(1);
      expect(metrics.failed_calls).toBe(0);
      expect(metrics.success_rate).toBe(100);
    });

    it('should record failed tool call', () => {
      collector.recordToolCall('read-spec', false, 50);

      const metrics = collector.getMetrics();
      expect(metrics.total_calls).toBe(1);
      expect(metrics.successful_calls).toBe(0);
      expect(metrics.failed_calls).toBe(1);
      expect(metrics.success_rate).toBe(0);
    });

    it('should track multiple tool calls', () => {
      collector.recordToolCall('read-spec', true, 100);
      collector.recordToolCall('read-spec', true, 200);
      collector.recordToolCall('read-spec', false, 50);

      const metrics = collector.getMetrics();
      expect(metrics.total_calls).toBe(3);
      expect(metrics.successful_calls).toBe(2);
      expect(metrics.failed_calls).toBe(1);
      expect(metrics.success_rate).toBeCloseTo(66.67, 2);
    });

    it('should track tool-specific metrics', () => {
      collector.recordToolCall('read-spec', true, 100);
      collector.recordToolCall('list-specs', true, 50);
      collector.recordToolCall('read-spec', true, 200);

      const metrics = collector.getMetrics();
      expect(Object.keys(metrics.tools)).toHaveLength(2);

      const readSpecMetrics = metrics.tools['read-spec'];
      expect(readSpecMetrics).toBeDefined();
      expect(readSpecMetrics.calls).toBe(2);
      expect(readSpecMetrics.successes).toBe(2);
      expect(readSpecMetrics.avg_response_ms).toBe(150);

      const listSpecsMetrics = metrics.tools['list-specs'];
      expect(listSpecsMetrics).toBeDefined();
      expect(listSpecsMetrics.calls).toBe(1);
    });

    it('should calculate average response time', () => {
      collector.recordToolCall('tool', true, 100);
      collector.recordToolCall('tool', true, 200);
      collector.recordToolCall('tool', true, 300);

      const metrics = collector.getMetrics();
      expect(metrics.avg_response_ms).toBe(200);
    });

    it('should track min and max response time per tool', () => {
      collector.recordToolCall('tool', true, 100);
      collector.recordToolCall('tool', true, 50);
      collector.recordToolCall('tool', true, 200);

      const toolMetrics = collector.getToolMetrics('tool');
      expect(toolMetrics).toBeDefined();
      expect(toolMetrics?.min_response_ms).toBe(50);
      expect(toolMetrics?.max_response_ms).toBe(200);
    });

    it('should update updated_at timestamp', () => {
      const initialMetrics = collector.getMetrics();
      const initialUpdatedAt = initialMetrics.updated_at;

      // 짧은 지연 후 호출
      collector.recordToolCall('tool', true, 100);

      const updatedMetrics = collector.getMetrics();
      expect(updatedMetrics.updated_at).toBeGreaterThanOrEqual(initialUpdatedAt);
    });

    it('should handle negative duration as 0', () => {
      collector.recordToolCall('tool', true, -100);

      const toolMetrics = collector.getToolMetrics('tool');
      expect(toolMetrics?.avg_response_ms).toBe(0);
      expect(toolMetrics?.min_response_ms).toBe(0);
    });
  });

  describe('recordCacheHit', () => {
    it('should record cache hit', () => {
      collector.recordCacheHit(true);

      const metrics = collector.getMetrics();
      expect(metrics.cache_hits).toBe(1);
      expect(metrics.cache_misses).toBe(0);
      expect(metrics.cache_hit_rate).toBe(100);
    });

    it('should record cache miss', () => {
      collector.recordCacheHit(false);

      const metrics = collector.getMetrics();
      expect(metrics.cache_hits).toBe(0);
      expect(metrics.cache_misses).toBe(1);
      expect(metrics.cache_hit_rate).toBe(0);
    });

    it('should track multiple cache operations', () => {
      collector.recordCacheHit(true);
      collector.recordCacheHit(true);
      collector.recordCacheHit(false);

      const metrics = collector.getMetrics();
      expect(metrics.cache_hits).toBe(2);
      expect(metrics.cache_misses).toBe(1);
      expect(metrics.cache_hit_rate).toBeCloseTo(66.67, 2);
    });
  });

  describe('getMetrics', () => {
    it('should return complete metrics summary', () => {
      collector.recordToolCall('read-spec', true, 100);
      collector.recordToolCall('list-specs', true, 50);
      collector.recordCacheHit(true);

      const metrics = collector.getMetrics();

      expect(metrics).toHaveProperty('total_calls');
      expect(metrics).toHaveProperty('successful_calls');
      expect(metrics).toHaveProperty('failed_calls');
      expect(metrics).toHaveProperty('success_rate');
      expect(metrics).toHaveProperty('cache_hits');
      expect(metrics).toHaveProperty('cache_misses');
      expect(metrics).toHaveProperty('cache_hit_rate');
      expect(metrics).toHaveProperty('avg_response_ms');
      expect(metrics).toHaveProperty('tools');
      expect(metrics).toHaveProperty('started_at');
      expect(metrics).toHaveProperty('updated_at');
    });
  });

  describe('getToolMetrics', () => {
    it('should return metrics for existing tool', () => {
      collector.recordToolCall('read-spec', true, 100);

      const toolMetrics = collector.getToolMetrics('read-spec');

      expect(toolMetrics).toBeDefined();
      expect(toolMetrics?.name).toBe('read-spec');
      expect(toolMetrics?.calls).toBe(1);
    });

    it('should return undefined for non-existing tool', () => {
      const toolMetrics = collector.getToolMetrics('non-existing');

      expect(toolMetrics).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset all metrics to initial state', () => {
      collector.recordToolCall('read-spec', true, 100);
      collector.recordCacheHit(true);

      collector.reset();

      const metrics = collector.getMetrics();
      expect(metrics.total_calls).toBe(0);
      expect(metrics.successful_calls).toBe(0);
      expect(metrics.cache_hits).toBe(0);
      expect(Object.keys(metrics.tools)).toHaveLength(0);
    });

    it('should reset started_at and updated_at', () => {
      const initialMetrics = collector.getMetrics();
      const initialStartedAt = initialMetrics.started_at;

      collector.recordToolCall('tool', true, 100);
      collector.reset();

      const resetMetrics = collector.getMetrics();
      expect(resetMetrics.started_at).toBeGreaterThanOrEqual(initialStartedAt);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tool name', () => {
      collector.recordToolCall('', true, 100);

      const metrics = collector.getMetrics();
      expect(metrics.total_calls).toBe(1);
      expect(metrics.tools['']).toBeDefined();
    });

    it('should handle very large duration values', () => {
      collector.recordToolCall('tool', true, Number.MAX_SAFE_INTEGER);

      const metrics = collector.getMetrics();
      expect(metrics.avg_response_ms).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle zero duration', () => {
      collector.recordToolCall('tool', true, 0);

      const toolMetrics = collector.getToolMetrics('tool');
      expect(toolMetrics?.avg_response_ms).toBe(0);
      expect(toolMetrics?.min_response_ms).toBe(0);
      expect(toolMetrics?.max_response_ms).toBe(0);
    });
  });
});
