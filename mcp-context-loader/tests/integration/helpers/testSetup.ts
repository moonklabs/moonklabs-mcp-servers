/**
 * 통합 테스트 설정 헬퍼
 *
 * 테스트 환경 초기화 및 정리 함수를 제공합니다.
 * 모든 통합 테스트에서 beforeEach/afterEach에 사용됩니다.
 */

import { join, resolve } from 'path';

// 테스트 fixtures 경로
export const FIXTURES_PATH = resolve(__dirname, '../../fixtures');

/**
 * 테스트 환경 설정
 * beforeEach에서 호출하여 각 테스트 전에 상태를 초기화합니다.
 */
export function setupTestEnvironment(): void {
  // 테스트 환경변수 설정
  process.env.NODE_ENV = 'test';

  // 캐시 초기화 - 현재 mcp-context-loader에는 공유 캐시가 없으므로
  // 개별 함수에서 캐시를 관리합니다.
  // 필요 시 여기에 캐시 초기화 로직 추가
}

/**
 * 테스트 환경 정리
 * afterEach에서 호출하여 각 테스트 후에 상태를 정리합니다.
 */
export function teardownTestEnvironment(): void {
  // 환경변수 복원 (필요 시)
  // 임시 파일 정리 (필요 시)
}

/**
 * Fixture 파일 경로를 반환합니다.
 *
 * @param filename - fixture 파일명
 * @returns 절대 경로
 *
 * @example
 * ```typescript
 * const storyPath = getFixturePath('sample-story.md');
 * // => '/path/to/tests/fixtures/sample-story.md'
 * ```
 */
export function getFixturePath(filename: string): string {
  return join(FIXTURES_PATH, filename);
}

/**
 * 테스트용 작업 디렉토리를 반환합니다.
 * get-story-context 등의 도구가 파일을 찾을 때 사용됩니다.
 *
 * @returns fixtures 폴더 경로
 */
export function getTestWorkingDirectory(): string {
  return FIXTURES_PATH;
}

/**
 * 테스트 타임아웃 설정 (밀리초)
 * 통합 테스트는 단위 테스트보다 더 긴 시간이 필요할 수 있습니다.
 */
export const TEST_TIMEOUT = 10000; // 10초
