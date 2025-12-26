/**
 * Vitest 워크스페이스 설정
 *
 * 모노레포 전체의 테스트를 통합 실행합니다.
 * 각 패키지별로 개별 vitest.config.ts가 있으면 해당 설정을 사용합니다.
 *
 * @example
 * ```bash
 * # 전체 워크스페이스 테스트 실행
 * npx vitest run
 *
 * # 특정 패키지만 실행
 * npx vitest run --project @moonklabs/mcp-common
 * ```
 */
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // 공통 패키지
  'packages/common',
  // MCP 서버들 (향후 추가될 패키지 자동 포함)
  'mcp-*',
]);
