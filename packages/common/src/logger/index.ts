/**
 * Logger 모듈 re-export hub
 *
 * pino 기반 로거와 관련 타입/함수를 제공합니다.
 *
 * @module logger
 *
 * @example
 * ```typescript
 * import { logger, createLogger, type Logger } from '@moonklabs/mcp-common';
 *
 * // 기본 로거 사용
 * logger.info('Application started');
 *
 * // 서버별 로거 생성
 * const serverLogger = createLogger('mcp-context-loader');
 * serverLogger.info({ tool: 'load-context' }, 'Tool invoked');
 * ```
 */

export { createLogger, logger, type Logger, type LoggerOptions } from './pinoLogger.js';
