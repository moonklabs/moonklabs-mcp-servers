/**
 * @moonklabs/mcp-common
 *
 * MCP 서버들이 공유하는 공통 모듈 패키지
 * - types: 공통 타입 정의 (Story 1.2)
 * - errors: 에러 응답 헬퍼 (Story 1.3)
 * - config: 설정 관리 (Story 1.4)
 * - logger: 로깅 시스템 (Story 1.5)
 * - cache: 캐싱 레이어 (Story 1.6)
 * - metrics: 메트릭스 수집 (Story 1.7)
 * - testing: 테스트 유틸리티 (Story 1.8)
 */

// Types - 공통 타입 정의 (Story 1.2)
export * from './types/index.js';

// Errors - 에러 응답 헬퍼 (Story 1.3)
export * from './errors/index.js';

// Config - 설정 관리 (Story 1.4)
export * from './config/index.js';

// Logger - 로깅 시스템 (Story 1.5)
export * from './logger/index.js';

// Cache - 캐싱 레이어 (Story 1.6)
export * from './cache/index.js';

// Metrics - 메트릭스 수집 (Story 1.7)
export * from './metrics/index.js';

// Testing - 테스트 유틸리티 (Story 1.8)
export * from './testing/index.js';

// 패키지 정보
// ⚠️ SYNC: package.json의 version과 동기화 필요
export const VERSION = '0.1.0';
