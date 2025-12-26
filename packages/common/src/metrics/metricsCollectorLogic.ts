/**
 * 메트릭스 수집 순수 함수 모듈
 *
 * 성공률, 캐시 히트율, 평균 응답 시간 등의 계산 로직을 제공합니다.
 * 이 모듈의 함수들은 상태를 가지지 않아 테스트가 용이합니다.
 *
 * @module metrics/metricsCollectorLogic
 *
 * @example
 * ```typescript
 * import { calculateSuccessRate, calculateCacheHitRate, calculateAverageMs } from '@moonklabs/mcp-common';
 *
 * // 성공률 계산
 * const successRate = calculateSuccessRate(95, 100); // 95
 *
 * // 캐시 히트율 계산
 * const hitRate = calculateCacheHitRate(80, 100); // 80
 *
 * // 평균 응답 시간 계산
 * const avgMs = calculateAverageMs([100, 200, 150]); // 150
 * ```
 */

/**
 * 성공률 계산 (0-100)
 *
 * 성공한 호출 수를 전체 호출 수로 나누어 백분율로 반환합니다.
 *
 * @param success - 성공한 호출 수
 * @param total - 전체 호출 수
 * @returns 성공률 (0-100), total이 0이면 null (0으로 나누기 방지)
 *
 * @example
 * ```typescript
 * calculateSuccessRate(95, 100); // 95
 * calculateSuccessRate(0, 0);    // null
 * calculateSuccessRate(1, 3);    // 33.33
 * ```
 */
export function calculateSuccessRate(success: number, total: number): number | null {
  if (total === 0) {
    return null;
  }
  return Math.round((success / total) * 100 * 100) / 100;
}

/**
 * 캐시 히트율 계산 (0-100)
 *
 * 캐시 히트 수를 전체 캐시 조회 수로 나누어 백분율로 반환합니다.
 *
 * @param hits - 캐시 히트 수
 * @param total - 전체 캐시 조회 수 (히트 + 미스)
 * @returns 캐시 히트율 (0-100), total이 0이면 null
 *
 * @example
 * ```typescript
 * calculateCacheHitRate(80, 100); // 80
 * calculateCacheHitRate(0, 0);    // null
 * ```
 */
export function calculateCacheHitRate(hits: number, total: number): number | null {
  if (total === 0) {
    return null;
  }
  return Math.round((hits / total) * 100 * 100) / 100;
}

/**
 * 평균 응답 시간 계산 (ms)
 *
 * 응답 시간 배열의 평균을 계산합니다.
 *
 * @param durations - 응답 시간 배열 (ms)
 * @returns 평균 응답 시간 (ms), 배열이 비어있으면 null
 *
 * @example
 * ```typescript
 * calculateAverageMs([100, 200, 300]); // 200
 * calculateAverageMs([]);              // null
 * ```
 */
export function calculateAverageMs(durations: number[]): number | null {
  if (durations.length === 0) {
    return null;
  }
  const sum = durations.reduce((a, b) => a + b, 0);
  return Math.round((sum / durations.length) * 100) / 100;
}

/**
 * 최소 응답 시간 계산 (ms)
 *
 * reduce를 사용하여 대량 배열에서도 콜 스택 초과 없이 안전하게 동작합니다.
 *
 * @param durations - 응답 시간 배열 (ms)
 * @returns 최소 응답 시간 (ms), 배열이 비어있으면 null
 *
 * @example
 * ```typescript
 * calculateMinMs([100, 50, 200]); // 50
 * calculateMinMs([]);             // null
 * ```
 */
export function calculateMinMs(durations: number[]): number | null {
  if (durations.length === 0) {
    return null;
  }
  // 스프레드 연산자 대신 reduce 사용 (대량 배열 안전)
  return durations.reduce((min, d) => (d < min ? d : min), durations[0]);
}

/**
 * 최대 응답 시간 계산 (ms)
 *
 * reduce를 사용하여 대량 배열에서도 콜 스택 초과 없이 안전하게 동작합니다.
 *
 * @param durations - 응답 시간 배열 (ms)
 * @returns 최대 응답 시간 (ms), 배열이 비어있으면 null
 *
 * @example
 * ```typescript
 * calculateMaxMs([100, 50, 200]); // 200
 * calculateMaxMs([]);             // null
 * ```
 */
export function calculateMaxMs(durations: number[]): number | null {
  if (durations.length === 0) {
    return null;
  }
  // 스프레드 연산자 대신 reduce 사용 (대량 배열 안전)
  return durations.reduce((max, d) => (d > max ? d : max), durations[0]);
}
