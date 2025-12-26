/**
 * 메트릭스 관련 타입 정의
 *
 * MCP 서버의 도구 호출 횟수, 성공률, 캐시 히트율, 응답 시간 등을
 * 수집하고 조회하기 위한 타입들을 정의합니다.
 *
 * @module types/metrics
 */

/**
 * 도구별 상세 메트릭스
 *
 * 개별 도구의 호출 통계와 성능 지표를 제공합니다.
 *
 * @example
 * ```typescript
 * const toolMetrics: ToolMetrics = {
 *   name: 'read-spec',
 *   calls: 100,
 *   successes: 95,
 *   failures: 5,
 *   success_rate: 95.0,
 *   avg_response_ms: 150.5,
 *   min_response_ms: 50,
 *   max_response_ms: 500,
 * };
 * ```
 */
export interface ToolMetrics {
  /** 도구 이름 */
  name: string;
  /** 총 호출 횟수 */
  calls: number;
  /** 성공한 호출 횟수 */
  successes: number;
  /** 실패한 호출 횟수 */
  failures: number;
  /** 성공률 (0-100), 호출이 없으면 null */
  success_rate: number | null;
  /** 평균 응답 시간 (ms), 호출이 없으면 null */
  avg_response_ms: number | null;
  /** 최소 응답 시간 (ms), 호출이 없으면 null */
  min_response_ms: number | null;
  /** 최대 응답 시간 (ms), 호출이 없으면 null */
  max_response_ms: number | null;
}

/**
 * 전체 메트릭스 요약
 *
 * 서버의 전체 도구 호출 통계, 캐시 성능, 응답 시간을 요약합니다.
 *
 * @example
 * ```typescript
 * const summary: MetricsSummary = {
 *   total_calls: 500,
 *   successful_calls: 480,
 *   failed_calls: 20,
 *   success_rate: 96.0,
 *   cache_hits: 400,
 *   cache_misses: 100,
 *   cache_hit_rate: 80.0,
 *   avg_response_ms: 120.5,
 *   tools: { 'read-spec': toolMetrics },
 *   started_at: 1703548800000,
 *   updated_at: 1703552400000,
 * };
 * ```
 */
export interface MetricsSummary {
  /** 총 도구 호출 횟수 */
  total_calls: number;
  /** 성공한 호출 횟수 */
  successful_calls: number;
  /** 실패한 호출 횟수 */
  failed_calls: number;
  /** 성공률 (0-100), 호출이 없으면 null */
  success_rate: number | null;
  /** 캐시 히트 횟수 */
  cache_hits: number;
  /** 캐시 미스 횟수 */
  cache_misses: number;
  /** 캐시 히트율 (0-100), 캐시 조회가 없으면 null */
  cache_hit_rate: number | null;
  /** 평균 응답 시간 (ms), 호출이 없으면 null */
  avg_response_ms: number | null;
  /** 도구별 상세 메트릭스 */
  tools: Record<string, ToolMetrics>;
  /** 메트릭스 수집 시작 시간 (Unix timestamp in ms) */
  started_at: number;
  /** 마지막 업데이트 시간 (Unix timestamp in ms) */
  updated_at: number;
}
