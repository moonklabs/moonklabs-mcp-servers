/**
 * 설정 기본값 상수
 *
 * 환경변수가 설정되지 않았을 때 사용되는 기본값을 정의합니다.
 * 모든 상수는 as const로 정의되어 타입 추론이 정확합니다.
 *
 * @module config/defaults
 */

/**
 * 기본 캐시 TTL (초)
 *
 * Notion API Rate Limit을 고려하여 5분(300초)으로 설정.
 * 자주 변경되지 않는 문서에 적합한 TTL입니다.
 */
export const DEFAULT_CACHE_TTL_SECONDS = 300 as const;

/**
 * 기본 로그 레벨
 *
 * 프로덕션 환경에서는 info 레벨로 설정하여
 * 중요한 이벤트만 로깅합니다.
 */
export const DEFAULT_LOG_LEVEL = 'info' as const;

/**
 * 기본 Node 환경
 *
 * 개발 환경에서 실행 중임을 기본으로 가정합니다.
 */
export const DEFAULT_NODE_ENV = 'development' as const;
