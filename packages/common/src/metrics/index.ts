/**
 * 메트릭스 수집 모듈
 *
 * MCP 서버의 도구 호출 통계, 캐시 히트율, 응답 시간 등을 수집합니다.
 *
 * @module metrics
 *
 * @example
 * ```typescript
 * import { MetricsCollector } from '@moonklabs/mcp-common';
 *
 * const collector = new MetricsCollector();
 *
 * // 도구 호출 기록
 * collector.recordToolCall('read-spec', true, 150);
 *
 * // 캐시 히트 기록
 * collector.recordCacheHit(true);
 *
 * // 메트릭스 조회
 * const metrics = collector.getMetrics();
 * console.log(metrics.success_rate); // 100
 * ```
 */

// 메트릭스 수집기 클래스
export { MetricsCollector } from './metricsCollector.js';

// 순수 계산 함수들 (테스트 및 재사용용)
export {
  calculateSuccessRate,
  calculateCacheHitRate,
  calculateAverageMs,
  calculateMinMs,
  calculateMaxMs,
} from './metricsCollectorLogic.js';

// 타입은 types 모듈에서 re-export
// import type { MetricsSummary, ToolMetrics } from '@moonklabs/mcp-common';
