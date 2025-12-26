import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  createMcpError,
  toMcpToolResult,
  ERROR_CODES,
  type CreateMcpErrorOptions,
} from '../index.js';
import type { McpErrorResponse, McpToolResult } from '../../types/index.js';

describe('Error Helpers', () => {
  describe('createMcpError', () => {
    it('should create a valid McpErrorResponse with required fields', () => {
      const error = createMcpError(
        'STORY_NOT_FOUND',
        'Story-999를 찾을 수 없습니다',
        'list-specs로 사용 가능한 스토리 목록을 확인하세요'
      );

      expect(error.status).toBe('error');
      expect(error.error_code).toBe('STORY_NOT_FOUND');
      expect(error.message).toBe('Story-999를 찾을 수 없습니다');
      expect(error.suggestion).toBe('list-specs로 사용 가능한 스토리 목록을 확인하세요');
    });

    it('should return McpErrorResponse type', () => {
      const error = createMcpError(
        'NOTION_NOT_FOUND',
        '페이지를 찾을 수 없습니다',
        '페이지 ID를 확인하세요'
      );

      expectTypeOf(error).toMatchTypeOf<McpErrorResponse>();
    });

    it('should include available_options when provided', () => {
      const error = createMcpError(
        'STORY_NOT_FOUND',
        'Story를 찾을 수 없습니다',
        '다른 스토리를 선택하세요',
        { available_options: ['Story-41', 'Story-42', 'Story-43'] }
      );

      expect(error.available_options).toEqual(['Story-41', 'Story-42', 'Story-43']);
    });

    it('should include retry_after when provided', () => {
      const error = createMcpError(
        'NOTION_RATE_LIMIT',
        'API 호출 제한에 도달했습니다',
        '잠시 후 다시 시도하세요',
        { retry_after: 60 }
      );

      expect(error.retry_after).toBe(60);
    });

    it('should include both available_options and retry_after when provided', () => {
      const error = createMcpError(
        'NOTION_RATE_LIMIT',
        '제한에 도달했습니다',
        '대기 후 재시도하세요',
        { available_options: ['option1'], retry_after: 30 }
      );

      expect(error.available_options).toEqual(['option1']);
      expect(error.retry_after).toBe(30);
    });

    it('should throw error when suggestion is empty string', () => {
      expect(() =>
        createMcpError('INVALID_INPUT', '잘못된 입력입니다', '')
      ).toThrow('suggestion은 필수입니다');
    });

    it('should throw error when suggestion is whitespace only', () => {
      expect(() =>
        createMcpError('INVALID_INPUT', '잘못된 입력입니다', '   ')
      ).toThrow('suggestion은 필수입니다');
    });

    it('should not have undefined optional fields when not provided', () => {
      const error = createMcpError(
        'CACHE_MISS',
        '캐시에서 찾을 수 없습니다',
        '데이터를 다시 요청하세요'
      );

      expect(error).not.toHaveProperty('available_options');
      expect(error).not.toHaveProperty('retry_after');
    });

    it('should handle complex available_options objects', () => {
      const error = createMcpError(
        'VALIDATION_ERROR',
        '검증 실패',
        '입력값을 확인하세요',
        {
          available_options: {
            valid_fields: ['name', 'email'],
            invalid_fields: ['age'],
          },
        }
      );

      expect(error.available_options).toEqual({
        valid_fields: ['name', 'email'],
        invalid_fields: ['age'],
      });
    });
  });

  describe('toMcpToolResult', () => {
    it('should convert McpErrorResponse to McpToolResult', () => {
      const error = createMcpError(
        'STORY_NOT_FOUND',
        'Story를 찾을 수 없습니다',
        '목록을 확인하세요'
      );

      const result = toMcpToolResult(error);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });

    it('should return McpToolResult type', () => {
      const error = createMcpError(
        'CACHE_MISS',
        '캐시 미스',
        '다시 시도하세요'
      );

      const result = toMcpToolResult(error);

      expectTypeOf(result).toMatchTypeOf<McpToolResult>();
    });

    it('should include error JSON in content text', () => {
      const error = createMcpError(
        'NOTION_NOT_FOUND',
        '페이지 없음',
        '페이지 ID 확인'
      );

      const result = toMcpToolResult(error);
      const parsedContent = JSON.parse(result.content[0].text!);

      expect(parsedContent.status).toBe('error');
      expect(parsedContent.error_code).toBe('NOTION_NOT_FOUND');
      expect(parsedContent.message).toBe('페이지 없음');
      expect(parsedContent.suggestion).toBe('페이지 ID 확인');
    });

    it('should preserve optional fields in JSON output', () => {
      const error = createMcpError(
        'NOTION_RATE_LIMIT',
        'Rate limit',
        '대기 후 재시도',
        { retry_after: 120, available_options: ['alt1'] }
      );

      const result = toMcpToolResult(error);
      const parsedContent = JSON.parse(result.content[0].text!);

      expect(parsedContent.retry_after).toBe(120);
      expect(parsedContent.available_options).toEqual(['alt1']);
    });
  });

  describe('ERROR_CODES', () => {
    it('should have NOTION_RATE_LIMIT code', () => {
      expect(ERROR_CODES.NOTION_RATE_LIMIT).toBe('NOTION_RATE_LIMIT');
    });

    it('should have NOTION_NOT_FOUND code', () => {
      expect(ERROR_CODES.NOTION_NOT_FOUND).toBe('NOTION_NOT_FOUND');
    });

    it('should have STORY_NOT_FOUND code', () => {
      expect(ERROR_CODES.STORY_NOT_FOUND).toBe('STORY_NOT_FOUND');
    });

    it('should have TOKEN_LIMIT_EXCEEDED code', () => {
      expect(ERROR_CODES.TOKEN_LIMIT_EXCEEDED).toBe('TOKEN_LIMIT_EXCEEDED');
    });

    it('should have CACHE_MISS code', () => {
      expect(ERROR_CODES.CACHE_MISS).toBe('CACHE_MISS');
    });

    it('should have INVALID_INPUT code', () => {
      expect(ERROR_CODES.INVALID_INPUT).toBe('INVALID_INPUT');
    });

    it('should have CONFIG_ERROR code', () => {
      expect(ERROR_CODES.CONFIG_ERROR).toBe('CONFIG_ERROR');
    });

    it('should have NOTION_UNAUTHORIZED code', () => {
      expect(ERROR_CODES.NOTION_UNAUTHORIZED).toBe('NOTION_UNAUTHORIZED');
    });

    it('should have VALIDATION_ERROR code', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });

    it('should have INTERNAL_ERROR code', () => {
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });

    it('should be readonly (as const)', () => {
      expectTypeOf(ERROR_CODES).toMatchTypeOf<{
        readonly NOTION_RATE_LIMIT: 'NOTION_RATE_LIMIT';
        readonly NOTION_NOT_FOUND: 'NOTION_NOT_FOUND';
        readonly NOTION_UNAUTHORIZED: 'NOTION_UNAUTHORIZED';
        readonly STORY_NOT_FOUND: 'STORY_NOT_FOUND';
        readonly TOKEN_LIMIT_EXCEEDED: 'TOKEN_LIMIT_EXCEEDED';
        readonly CACHE_MISS: 'CACHE_MISS';
        readonly INVALID_INPUT: 'INVALID_INPUT';
        readonly CONFIG_ERROR: 'CONFIG_ERROR';
        readonly VALIDATION_ERROR: 'VALIDATION_ERROR';
        readonly INTERNAL_ERROR: 'INTERNAL_ERROR';
      }>();
    });
  });

  describe('CreateMcpErrorOptions type', () => {
    it('should accept available_options only', () => {
      const options: CreateMcpErrorOptions = {
        available_options: ['a', 'b'],
      };

      expect(options.available_options).toEqual(['a', 'b']);
    });

    it('should accept retry_after only', () => {
      const options: CreateMcpErrorOptions = {
        retry_after: 30,
      };

      expect(options.retry_after).toBe(30);
    });

    it('should accept both fields', () => {
      const options: CreateMcpErrorOptions = {
        available_options: { items: [1, 2, 3] },
        retry_after: 60,
      };

      expect(options.available_options).toEqual({ items: [1, 2, 3] });
      expect(options.retry_after).toBe(60);
    });
  });
});
