/**
 * pino 로거 모듈
 *
 * 민감정보 마스킹 설정이 포함된 pino 로거를 제공합니다.
 * API 키, 토큰 등 민감한 정보가 로그에 노출되지 않도록 보호합니다.
 *
 * @module logger/pinoLogger
 *
 * @example
 * ```typescript
 * import { logger, createLogger } from '@moonklabs/mcp-common';
 *
 * // 기본 로거 사용
 * logger.info({ tool: 'get-story-context' }, 'Tool invoked');
 *
 * // 서버별 로거 생성
 * const serverLogger = createLogger('mcp-context-loader');
 * serverLogger.info({ story_id: 'Story-42' }, 'Processing');
 * ```
 */

import pino, { type Logger, type DestinationStream, type LoggerOptions as PinoLoggerOptions } from 'pino';

/**
 * 로거 생성 옵션
 */
export interface LoggerOptions {
  /** 커스텀 destination (테스트용) */
  destination?: DestinationStream;
  /** 로그 레벨 (기본: LOG_LEVEL 환경변수 또는 'info') */
  level?: string;
}

/**
 * 마스킹할 민감정보 필드 경로
 *
 * 이 경로에 해당하는 필드는 로그에서 [REDACTED]로 대체됩니다.
 */
const REDACT_PATHS = [
  // 최상위 민감 필드
  'notion_token',
  'api_key',
  'apiKey',
  'token',
  'authorization',
  'password',
  'secret',

  // 중첩 필드 패턴
  '*.token',
  '*.apiKey',
  '*.api_key',
  '*.password',
  '*.secret',
  '*.authorization',

  // HTTP 요청 헤더
  'req.headers.authorization',
  'req.headers.cookie',
  'request.headers.authorization',
];

/**
 * 기본 pino 옵션 생성
 *
 * @param serverName - 서버 이름 (모든 로그에 포함됨)
 * @param options - 추가 옵션
 * @returns pino 로거 옵션
 */
function createPinoOptions(serverName: string, options?: LoggerOptions): PinoLoggerOptions {
  // 환경변수에서 로그 레벨 읽기 (직접 접근 - 로거는 config보다 먼저 초기화될 수 있음)
  const logLevel = options?.level ?? process.env.LOG_LEVEL ?? 'info';
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const baseOptions: PinoLoggerOptions = {
    level: logLevel,
    // 민감정보 마스킹 설정
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    // 기본 필드 추가
    base: {
      server: serverName,
    },
    // 타임스탬프 포맷
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // 개발 환경에서는 pino-pretty 사용 (destination이 제공되지 않은 경우에만)
  if (nodeEnv === 'development' && !options?.destination) {
    baseOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  return baseOptions;
}

/**
 * 서버별 로거 생성 팩토리
 *
 * 각 MCP 서버는 이 함수로 고유한 로거를 생성해야 합니다.
 * 생성된 로거는 모든 로그에 서버 이름을 포함합니다.
 *
 * @param serverName - 서버 이름 (예: 'mcp-context-loader', 'mcp-spec-reader')
 * @param options - 추가 옵션 (테스트용 destination 등)
 * @returns pino 로거 인스턴스
 *
 * @example
 * ```typescript
 * const logger = createLogger('mcp-context-loader');
 * logger.info({ tool: 'load-context' }, 'Tool started');
 * // 출력: {"level":"info","time":"...","server":"mcp-context-loader","tool":"load-context","msg":"Tool started"}
 * ```
 */
export function createLogger(serverName: string, options?: LoggerOptions): Logger {
  // serverName 유효성 검증
  const trimmedName = serverName.trim();
  if (!trimmedName) {
    throw new Error('serverName은 비어있을 수 없습니다');
  }

  const pinoOptions = createPinoOptions(trimmedName, options);

  // destination이 제공된 경우 (테스트용)
  if (options?.destination) {
    return pino(pinoOptions, options.destination);
  }

  return pino(pinoOptions);
}

/**
 * 기본 로거 인스턴스
 *
 * packages/common에서 직접 사용하기 위한 기본 로거입니다.
 * 각 MCP 서버는 createLogger()로 고유한 로거를 생성해야 합니다.
 *
 * @example
 * ```typescript
 * import { logger } from '@moonklabs/mcp-common';
 * logger.info('Common module initialized');
 * ```
 */
export const logger = createLogger('mcp-common');

/**
 * Logger 타입 re-export
 */
export type { Logger } from 'pino';
