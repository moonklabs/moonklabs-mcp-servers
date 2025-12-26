import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Writable } from 'stream';
import { createLogger, logger, type LoggerOptions } from '../index.js';

/**
 * 로그 출력을 캡처하기 위한 헬퍼 함수
 */
function createLogCapture(): { stream: Writable; logs: string[] } {
  const logs: string[] = [];
  const stream = new Writable({
    write(chunk, encoding, callback) {
      logs.push(chunk.toString());
      callback();
    },
  });
  return { stream, logs };
}

describe('Logger Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // 테스트 환경 설정
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createLogger', () => {
    it('should create a logger with server name', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test-server', { destination: stream });

      testLogger.info('test message');

      // 로그가 생성되었는지 확인
      expect(logs.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.server).toBe('test-server');
      expect(logEntry.msg).toBe('test message');
    });

    it('should include server field in all logs', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('my-mcp-server', { destination: stream });

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');

      expect(logs.length).toBe(3);
      logs.forEach((log) => {
        const logEntry = JSON.parse(log);
        expect(logEntry.server).toBe('my-mcp-server');
      });
    });

    it('should have all log level methods', () => {
      const { stream } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
      expect(typeof testLogger.error).toBe('function');
      expect(typeof testLogger.fatal).toBe('function');
    });

    it('should log objects with additional fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test-server', { destination: stream });

      testLogger.info({ tool: 'get-story-context', story_id: 'Story-42' }, 'Tool invoked');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.tool).toBe('get-story-context');
      expect(logEntry.story_id).toBe('Story-42');
      expect(logEntry.msg).toBe('Tool invoked');
    });

    it('should throw error for empty serverName', () => {
      expect(() => createLogger('')).toThrow('serverName은 비어있을 수 없습니다');
    });

    it('should throw error for whitespace-only serverName', () => {
      expect(() => createLogger('   ')).toThrow('serverName은 비어있을 수 없습니다');
    });

    it('should trim serverName whitespace', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('  trimmed-server  ', { destination: stream });

      testLogger.info('test');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.server).toBe('trimmed-server');
    });
  });

  describe('Sensitive data masking (redact)', () => {
    it('should mask notion_token field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ notion_token: 'secret_abc123' }, 'API call');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.notion_token).toBe('[REDACTED]');
    });

    it('should mask api_key field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ api_key: 'sk-1234567890' }, 'API call');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.api_key).toBe('[REDACTED]');
    });

    it('should mask apiKey field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ apiKey: 'api-key-value' }, 'Request');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.apiKey).toBe('[REDACTED]');
    });

    it('should mask token field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ token: 'bearer-token-123' }, 'Auth');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.token).toBe('[REDACTED]');
    });

    it('should mask authorization field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ authorization: 'Bearer xyz' }, 'Request');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.authorization).toBe('[REDACTED]');
    });

    it('should mask nested *.token fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ config: { token: 'nested-token' } }, 'Config');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.config.token).toBe('[REDACTED]');
    });

    it('should mask nested *.apiKey fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ client: { apiKey: 'nested-api-key' } }, 'Client config');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.client.apiKey).toBe('[REDACTED]');
    });

    it('should mask req.headers.authorization', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info(
        { req: { headers: { authorization: 'Bearer secret' } } },
        'Request'
      );

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.req.headers.authorization).toBe('[REDACTED]');
    });

    it('should mask nested *.authorization fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info({ config: { authorization: 'Bearer nested' } }, 'Config');

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.config.authorization).toBe('[REDACTED]');
    });

    it('should NOT mask non-sensitive fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info(
        {
          story_id: 'Story-42',
          token_count: 1500,
          cached: true,
        },
        'Normal log'
      );

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.story_id).toBe('Story-42');
      expect(logEntry.token_count).toBe(1500);
      expect(logEntry.cached).toBe(true);
    });

    it('should mask multiple sensitive fields at once', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.info(
        {
          notion_token: 'secret1',
          api_key: 'secret2',
          normal_field: 'visible',
        },
        'Multi-field'
      );

      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.notion_token).toBe('[REDACTED]');
      expect(logEntry.api_key).toBe('[REDACTED]');
      expect(logEntry.normal_field).toBe('visible');
    });
  });

  describe('Log levels', () => {
    it('should respect log level setting', () => {
      const { stream, logs } = createLogCapture();
      // warn 레벨로 설정하면 debug, info는 출력되지 않아야 함
      const testLogger = createLogger('test', { destination: stream, level: 'warn' });

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      // warn과 error만 출력되어야 함
      expect(logs.length).toBe(2);
      expect(JSON.parse(logs[0]).level).toBe(40); // warn
      expect(JSON.parse(logs[1]).level).toBe(50); // error
    });

    it('should default to info level', () => {
      delete process.env.LOG_LEVEL;
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      testLogger.debug('debug message');
      testLogger.info('info message');

      // debug는 출력되지 않고 info만 출력
      expect(logs.length).toBe(1);
      expect(JSON.parse(logs[0]).msg).toBe('info message');
    });
  });

  describe('Default logger', () => {
    it('should export a default logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('Logger with different log levels', () => {
    it('should log debug messages when level is debug', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream, level: 'debug' });

      testLogger.debug({ detail: 'verbose' }, 'Debug info');

      expect(logs.length).toBe(1);
      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.detail).toBe('verbose');
    });

    it('should log error with error object', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createLogger('test', { destination: stream });

      const error = new Error('Test error');
      testLogger.error({ err: error }, 'Error occurred');

      expect(logs.length).toBe(1);
      const logEntry = JSON.parse(logs[0]);
      expect(logEntry.err.message).toBe('Test error');
    });
  });
});
