/**
 * 메트릭스 수집 클래스
 *
 * MCP 서버의 도구 호출 통계, 캐시 히트율, 응답 시간 등을 수집합니다.
 *
 * @module metrics/metricsCollector
 *
 * @example
 * ```typescript
 * import { MetricsCollector } from '@moonklabs/mcp-common';
 *
 * const collector = new MetricsCollector();
 *
 * // 도구 호출 기록
 * collector.recordToolCall('read-spec', true, 150);
 * collector.recordToolCall('list-specs', false, 50);
 *
 * // 캐시 히트/미스 기록
 * collector.recordCacheHit(true);
 * collector.recordCacheHit(false);
 *
 * // 메트릭스 조회
 * const metrics = collector.getMetrics();
 * console.log(metrics.success_rate); // 50
 * console.log(metrics.cache_hit_rate); // 50
 *
 * // 특정 도구 메트릭스 조회
 * const toolMetrics = collector.getToolMetrics('read-spec');
 *
 * // 리셋
 * collector.reset();
 * ```
 */

import type { MetricsSummary, ToolMetrics } from '../types/metrics.js';
import {
  calculateSuccessRate,
  calculateCacheHitRate,
} from './metricsCollectorLogic.js';

/**
 * 내부 도구별 데이터 구조
 *
 * 메모리 효율성을 위해 duration 배열 대신 집계값만 저장합니다.
 */
interface InternalToolData {
  name: string;
  calls: number;
  successes: number;
  failures: number;
  /** duration 합계 (평균 계산용) */
  totalDuration: number;
  /** 최소 응답 시간 */
  minDuration: number | null;
  /** 최대 응답 시간 */
  maxDuration: number | null;
}

/**
 * 메트릭스 수집기 클래스
 *
 * 도구 호출, 캐시 히트/미스, 응답 시간 등의 메트릭스를 수집하고 요약합니다.
 */
export class MetricsCollector {
  private totalCalls = 0;
  private successfulCalls = 0;
  private failedCalls = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  /** duration 합계 (메모리 효율성을 위해 배열 대신 집계값 사용) */
  private totalDuration = 0;
  private tools: Map<string, InternalToolData> = new Map();
  private startedAt: number;
  private updatedAt: number;

  constructor() {
    const now = Date.now();
    this.startedAt = now;
    this.updatedAt = now;
  }

  /**
   * 도구 호출 기록
   *
   * @param toolName - 도구 이름
   * @param success - 성공 여부
   * @param durationMs - 응답 시간 (밀리초)
   */
  recordToolCall(toolName: string, success: boolean, durationMs: number): void {
    // 음수 duration은 0으로 처리
    const safeDuration = Math.max(0, durationMs);

    this.totalCalls++;
    if (success) {
      this.successfulCalls++;
    } else {
      this.failedCalls++;
    }

    // 메모리 효율성: 배열 대신 합계만 저장
    this.totalDuration += safeDuration;
    this.updatedAt = Date.now();

    // 도구별 메트릭스 업데이트
    let toolData = this.tools.get(toolName);
    if (!toolData) {
      toolData = {
        name: toolName,
        calls: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        minDuration: null,
        maxDuration: null,
      };
      this.tools.set(toolName, toolData);
    }

    toolData.calls++;
    if (success) {
      toolData.successes++;
    } else {
      toolData.failures++;
    }

    // 집계값 업데이트 (메모리 효율적)
    toolData.totalDuration += safeDuration;
    toolData.minDuration =
      toolData.minDuration === null
        ? safeDuration
        : Math.min(toolData.minDuration, safeDuration);
    toolData.maxDuration =
      toolData.maxDuration === null
        ? safeDuration
        : Math.max(toolData.maxDuration, safeDuration);
  }

  /**
   * 캐시 히트/미스 기록
   *
   * @param hit - true: 캐시 히트, false: 캐시 미스
   */
  recordCacheHit(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    this.updatedAt = Date.now();
  }

  /**
   * 전체 메트릭스 요약 조회
   *
   * @returns 메트릭스 요약
   */
  getMetrics(): MetricsSummary {
    const toolsRecord: Record<string, ToolMetrics> = {};

    for (const [name, data] of this.tools) {
      toolsRecord[name] = {
        name: data.name,
        calls: data.calls,
        successes: data.successes,
        failures: data.failures,
        success_rate: calculateSuccessRate(data.successes, data.calls),
        avg_response_ms: this.calculateAvg(data.totalDuration, data.calls),
        min_response_ms: data.minDuration,
        max_response_ms: data.maxDuration,
      };
    }

    return {
      total_calls: this.totalCalls,
      successful_calls: this.successfulCalls,
      failed_calls: this.failedCalls,
      success_rate: calculateSuccessRate(this.successfulCalls, this.totalCalls),
      cache_hits: this.cacheHits,
      cache_misses: this.cacheMisses,
      cache_hit_rate: calculateCacheHitRate(this.cacheHits, this.cacheHits + this.cacheMisses),
      avg_response_ms: this.calculateAvg(this.totalDuration, this.totalCalls),
      tools: toolsRecord,
      started_at: this.startedAt,
      updated_at: this.updatedAt,
    };
  }

  /**
   * 평균 계산 헬퍼 (0으로 나누기 방지)
   */
  private calculateAvg(total: number, count: number): number | null {
    if (count === 0) return null;
    return Math.round((total / count) * 100) / 100;
  }

  /**
   * 특정 도구의 메트릭스 조회
   *
   * @param toolName - 도구 이름
   * @returns 도구 메트릭스 또는 undefined (존재하지 않는 경우)
   */
  getToolMetrics(toolName: string): ToolMetrics | undefined {
    const data = this.tools.get(toolName);
    if (!data) {
      return undefined;
    }

    return {
      name: data.name,
      calls: data.calls,
      successes: data.successes,
      failures: data.failures,
      success_rate: calculateSuccessRate(data.successes, data.calls),
      avg_response_ms: this.calculateAvg(data.totalDuration, data.calls),
      min_response_ms: data.minDuration,
      max_response_ms: data.maxDuration,
    };
  }

  /**
   * 모든 메트릭스 초기화
   */
  reset(): void {
    this.totalCalls = 0;
    this.successfulCalls = 0;
    this.failedCalls = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalDuration = 0;
    this.tools.clear();

    const now = Date.now();
    this.startedAt = now;
    this.updatedAt = now;
  }
}
