import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  McpResponse,
  McpErrorResponse,
  McpToolResult,
  McpResult,
  ErrorCode,
} from '../mcp.js';
import { isMcpResponse, isMcpError } from '../mcp.js';

describe('MCP Types', () => {
  describe('McpResponse', () => {
    it('should have correct structure for success response', () => {
      const response: McpResponse<{ items: string[] }> = {
        status: 'success',
        data: { items: ['a', 'b', 'c'] },
        token_count: 150,
        cached: false,
      };

      expect(response.status).toBe('success');
      expect(response.data.items).toHaveLength(3);
      expect(response.token_count).toBe(150);
      expect(response.cached).toBe(false);
    });

    it('should support generic data types', () => {
      interface CustomData {
        id: string;
        name: string;
      }

      const response: McpResponse<CustomData> = {
        status: 'success',
        data: { id: '123', name: 'test' },
        token_count: 50,
        cached: true,
      };

      expectTypeOf(response.data).toEqualTypeOf<CustomData>();
      expect(response.data.id).toBe('123');
    });

    it('should type-check status as literal "success"', () => {
      const response: McpResponse<null> = {
        status: 'success',
        data: null,
        token_count: 0,
        cached: false,
      };

      expectTypeOf(response.status).toEqualTypeOf<'success'>();
    });
  });

  describe('McpErrorResponse', () => {
    it('should have required suggestion field', () => {
      const error: McpErrorResponse = {
        status: 'error',
        error_code: 'STORY_NOT_FOUND',
        message: 'Story-999를 찾을 수 없습니다',
        suggestion: 'list-specs로 사용 가능한 스토리 목록을 확인하세요',
      };

      expect(error.status).toBe('error');
      expect(error.error_code).toBe('STORY_NOT_FOUND');
      expect(error.suggestion).toBeDefined();
    });

    it('should support optional available_options', () => {
      const error: McpErrorResponse = {
        status: 'error',
        error_code: 'STORY_NOT_FOUND',
        message: 'Story를 찾을 수 없습니다',
        suggestion: '사용 가능한 스토리를 확인하세요',
        available_options: ['Story-41', 'Story-42'],
      };

      expect(error.available_options).toEqual(['Story-41', 'Story-42']);
    });

    it('should support optional retry_after for rate limits', () => {
      const error: McpErrorResponse = {
        status: 'error',
        error_code: 'NOTION_RATE_LIMIT',
        message: 'API 요청 한도를 초과했습니다',
        suggestion: '30초 후에 다시 시도하세요',
        retry_after: 30,
      };

      expect(error.retry_after).toBe(30);
    });

    it('should accept known error codes', () => {
      const errorCodes: ErrorCode[] = [
        'NOTION_RATE_LIMIT',
        'NOTION_NOT_FOUND',
        'STORY_NOT_FOUND',
        'TOKEN_LIMIT_EXCEEDED',
      ];

      errorCodes.forEach((code) => {
        const error: McpErrorResponse = {
          status: 'error',
          error_code: code,
          message: 'Test error',
          suggestion: 'Test suggestion',
        };
        expect(error.error_code).toBe(code);
      });
    });

    it('should accept custom error codes', () => {
      const error: McpErrorResponse = {
        status: 'error',
        error_code: 'CUSTOM_ERROR_CODE',
        message: 'Custom error',
        suggestion: 'Custom suggestion',
      };

      expect(error.error_code).toBe('CUSTOM_ERROR_CODE');
    });
  });

  describe('McpToolResult', () => {
    it('should have content array', () => {
      const result: McpToolResult = {
        content: [{ type: 'text', text: 'Hello, world!' }],
      };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('Hello, world!');
    });

    it('should support optional isError flag', () => {
      const errorResult: McpToolResult = {
        content: [{ type: 'text', text: 'Error occurred' }],
        isError: true,
      };

      expect(errorResult.isError).toBe(true);
    });

    it('should support image content type', () => {
      const result: McpToolResult = {
        content: [
          {
            type: 'image',
            data: 'base64encodeddata',
            mimeType: 'image/png',
          },
        ],
      };

      expect(result.content[0].type).toBe('image');
      expect(result.content[0].mimeType).toBe('image/png');
    });
  });

  describe('Type Guards', () => {
    it('isMcpResponse should return true for success response', () => {
      const result: McpResult<string> = {
        status: 'success',
        data: 'test',
        token_count: 10,
        cached: false,
      };

      expect(isMcpResponse(result)).toBe(true);
      expect(isMcpError(result)).toBe(false);

      if (isMcpResponse(result)) {
        expectTypeOf(result.data).toEqualTypeOf<string>();
      }
    });

    it('isMcpError should return true for error response', () => {
      const result: McpResult<string> = {
        status: 'error',
        error_code: 'TEST_ERROR',
        message: 'Test error',
        suggestion: 'Test suggestion',
      };

      expect(isMcpError(result)).toBe(true);
      expect(isMcpResponse(result)).toBe(false);

      if (isMcpError(result)) {
        expectTypeOf(result.error_code).toEqualTypeOf<ErrorCode>();
      }
    });

    it('isMcpResponse should return false for null/undefined', () => {
      expect(isMcpResponse(null)).toBe(false);
      expect(isMcpResponse(undefined)).toBe(false);
    });

    it('isMcpError should return false for null/undefined', () => {
      expect(isMcpError(null)).toBe(false);
      expect(isMcpError(undefined)).toBe(false);
    });

    it('should handle empty objects safely', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isMcpResponse({} as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isMcpError({} as any)).toBe(false);
    });
  });
});
