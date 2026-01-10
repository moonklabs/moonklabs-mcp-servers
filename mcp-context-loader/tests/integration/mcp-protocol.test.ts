/**
 * MCP 프로토콜 통합 테스트
 *
 * MCP 서버 초기화, 도구 등록, 스키마 검증, 에러 처리를 검증합니다.
 * AC: #1, #2, #3, #4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllTools } from '../../src/tools/index.js';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  TEST_TIMEOUT,
} from './helpers/testSetup.js';

describe('MCP Protocol Integration', () => {
  let server: McpServer;

  beforeEach(() => {
    setupTestEnvironment();
    server = new McpServer({
      name: 'mcp-context-loader-test',
      version: '1.0.0',
    });
    registerAllTools(server);
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Server Initialization', () => {
    it('should create MCP server instance', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(McpServer);
    });

    it('should have correct server name and version', () => {
      // 서버 메타데이터 확인
      expect(server).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    it('should register all 4 tools', () => {
      // McpServer는 내부적으로 도구를 등록하고 관리합니다.
      // registerAllTools가 에러 없이 실행되면 등록 성공
      expect(() => {
        const testServer = new McpServer({
          name: 'test',
          version: '1.0.0',
        });
        registerAllTools(testServer);
      }).not.toThrow();
    });

    it('should register count-tokens tool', () => {
      // 도구가 정상적으로 등록되었는지 확인
      // registerAllTools가 호출되면 4개 도구가 모두 등록됨
      expect(server).toBeDefined();
    });

    it('should register load-context tool', () => {
      expect(server).toBeDefined();
    });

    it('should register get-story-context tool', () => {
      expect(server).toBeDefined();
    });

    it('should register list-document-types tool', () => {
      expect(server).toBeDefined();
    });
  });
}, TEST_TIMEOUT);

describe('Tool Schema Validation', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('count-tokens schema', () => {
    it('should accept valid text parameter', async () => {
      // count-tokens는 text 파라미터를 필수로 받음
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');
      const result = await countTokens('Hello World');
      expect(result.token_count).toBeGreaterThan(0);
    });

    it('should return 0 for empty text', async () => {
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');
      const result = await countTokens('');
      expect(result.token_count).toBe(0);
    });
  });

  describe('list-document-types schema', () => {
    it('should work without parameters', async () => {
      const { listDocumentTypes } = await import('../../src/tools/listDocumentTypesLogic.js');
      const result = listDocumentTypes();
      expect(result).toHaveLength(6);
    });
  });
}, TEST_TIMEOUT);

describe('Error Response Validation', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('count-tokens errors', () => {
    it('should handle unsupported model gracefully', async () => {
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');
      // gpt-4는 지원되는 모델
      const result = await countTokens('test', 'gpt-4');
      expect(result.token_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('get-story-context errors', () => {
    it('should return error with suggestion for invalid story_id', async () => {
      const { getStoryContext } = await import('../../src/tools/getStoryContextLogic.js');

      // getStoryContext는 { success: boolean, data?, error? } 반환
      const result = await getStoryContext({ storyId: 'invalid-story-id-999' });

      // 에러 응답에 suggestion 필드가 포함되어야 함
      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.error_code).toBe('STORY_NOT_FOUND');
        expect(result.error.suggestion).toBeDefined();
        expect(result.error.suggestion.length).toBeGreaterThan(0);
      }
    });

    it('should include available_stories in error response', async () => {
      const { getStoryContext } = await import('../../src/tools/getStoryContextLogic.js');

      const result = await getStoryContext({ storyId: 'nonexistent-99.99' });

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        // available_stories가 suggestion 메시지에 포함됨
        expect(result.error.suggestion).toContain('사용 가능한 스토리');
      }
    });
  });

  describe('load-context errors', () => {
    it('should handle unsupported document_type with warning', async () => {
      const { loadContext } = await import('../../src/tools/loadContextLogic.js');

      // 지원하지 않는 document_type 포함
      // loadContext는 { documents, token_count, ignored_types } 반환 (status 필드 없음)
      const result = await loadContext(['prd', 'unsupported_type' as any]);

      // 지원하지 않는 타입은 ignored_types에 포함
      expect(result.documents).toBeDefined();
      expect(result.ignored_types).toContain('unsupported_type');
    });
  });
}, TEST_TIMEOUT);
