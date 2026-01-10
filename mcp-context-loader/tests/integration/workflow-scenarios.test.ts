/**
 * 워크플로우 시나리오 통합 테스트
 *
 * 실제 사용 패턴을 시뮬레이션하여 도구 조합 사용을 검증합니다.
 * AC: #5, #6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  TEST_TIMEOUT,
} from './helpers/testSetup.js';

describe('Workflow Scenarios', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Scenario 1: Story Implementation Workflow', () => {
    it('should complete full story context loading workflow', async () => {
      // Step 1: list-document-types로 사용 가능한 유형 확인
      const { listDocumentTypes } = await import('../../src/tools/listDocumentTypesLogic.js');
      const docTypes = listDocumentTypes();

      expect(docTypes).toHaveLength(6);
      expect(docTypes.map(d => d.type)).toContain('story');
      expect(docTypes.map(d => d.type)).toContain('architecture');

      // Step 2: count-tokens로 텍스트 토큰 수 확인
      // countTokens는 동기 함수로 { token_count, model } 반환 (status 필드 없음)
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');
      const tokenResult = countTokens('Sample context text for testing');

      expect(tokenResult.token_count).toBeGreaterThan(0);
      expect(tokenResult.model).toBe('gpt-4');
    });

    it('should handle document types correctly', async () => {
      const { listDocumentTypes } = await import('../../src/tools/listDocumentTypesLogic.js');
      const docTypes = listDocumentTypes();

      // 각 유형에 필수 필드가 포함되어야 함
      for (const docType of docTypes) {
        expect(docType.type).toBeDefined();
        expect(docType.description).toBeDefined();
        expect(docType.description.length).toBeGreaterThan(0);
        expect(docType.example).toBeDefined();
        expect(docType.glob_pattern).toBeDefined();
      }
    });
  });

  describe('Scenario 2: Context Optimization Workflow', () => {
    it('should count tokens for optimization decision', async () => {
      // countTokens는 동기 함수로 { token_count, model } 반환
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');

      // 긴 텍스트의 토큰 수 확인
      const longText = 'This is a sample text. '.repeat(100);
      const result = countTokens(longText);

      expect(result.token_count).toBeGreaterThan(100);
      expect(result.model).toBe('gpt-4');

      // 짧은 텍스트의 토큰 수 확인
      const shortText = 'Short text.';
      const shortResult = countTokens(shortText);

      expect(shortResult.token_count).toBeLessThan(result.token_count);
    });

    it('should support multiple token counting models', async () => {
      // countTokens는 동기 함수
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');

      const text = 'Test text for token counting';

      // gpt-4 모델
      const gpt4Result = countTokens(text, 'gpt-4');
      expect(gpt4Result.token_count).toBeGreaterThan(0);
      expect(gpt4Result.model).toBe('gpt-4');

      // gpt-3.5-turbo 모델
      const gpt35Result = countTokens(text, 'gpt-3.5-turbo');
      expect(gpt35Result.token_count).toBeGreaterThan(0);
      expect(gpt35Result.model).toBe('gpt-3.5-turbo');
    });
  });

  describe('Scenario 3: Error Recovery Workflow', () => {
    it('should provide helpful error message for invalid story_id', async () => {
      const { getStoryContext } = await import('../../src/tools/getStoryContextLogic.js');

      // Step 1: 잘못된 story_id로 시도
      // getStoryContext는 { success: boolean, data?, error? } 반환
      const errorResult = await getStoryContext({ storyId: 'invalid-id' });

      expect(errorResult.success).toBe(false);
      if (!errorResult.success && errorResult.error) {
        expect(errorResult.error.error_code).toBe('STORY_NOT_FOUND');
        expect(errorResult.error.suggestion).toBeDefined();

        // suggestion에 도움이 되는 정보가 포함되어야 함
        expect(errorResult.error.suggestion.length).toBeGreaterThan(10);
      }
    });

    it('should accept various story_id formats', async () => {
      const { normalizeStoryId } = await import('../../src/tools/getStoryContextLogic.js');

      // normalizeStoryId는 "story-" 접두사를 추가하는 정규화 함수
      // "1.2" → "story-1.2", "Story-1.2" → "story-1.2"
      expect(normalizeStoryId('1.2')).toBe('story-1.2');
      expect(normalizeStoryId('Story-1.2')).toBe('story-1.2');
      expect(normalizeStoryId('story-1-2')).toBe('story-1-2');
      expect(normalizeStoryId('1-2')).toBe('story-1-2');
    });
  });

  describe('Scenario 4: Cache Behavior Workflow', () => {
    it('should return consistent results for same input', async () => {
      // countTokens는 동기 함수
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');

      const text = 'Consistent text for testing';

      // 첫 번째 호출
      const result1 = countTokens(text);

      // 두 번째 호출 (동일 입력)
      const result2 = countTokens(text);

      // 결과가 일관되어야 함
      expect(result1.token_count).toBe(result2.token_count);
      expect(result1.model).toBe(result2.model);
    });

    it('should handle list-document-types caching correctly', async () => {
      const { listDocumentTypes } = await import('../../src/tools/listDocumentTypesLogic.js');

      // 첫 번째 호출
      const result1 = listDocumentTypes();

      // 두 번째 호출
      const result2 = listDocumentTypes();

      // 결과가 동일해야 함
      expect(result1).toEqual(result2);
      expect(result1.length).toBe(6);
    });
  });
}, TEST_TIMEOUT);

describe('E2E Tool Scenarios', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('count-tokens E2E', () => {
    it('should count tokens for various text lengths', async () => {
      // countTokens는 동기 함수
      const { countTokens } = await import('../../src/tools/countTokensLogic.js');

      // 빈 텍스트
      const emptyResult = countTokens('');
      expect(emptyResult.token_count).toBe(0);

      // 짧은 텍스트
      const shortResult = countTokens('Hello');
      expect(shortResult.token_count).toBeGreaterThan(0);

      // 긴 텍스트
      const longResult = countTokens('Hello World '.repeat(50));
      expect(longResult.token_count).toBeGreaterThan(shortResult.token_count);
    });
  });

  describe('list-document-types E2E', () => {
    it('should return all 6 document types with metadata', async () => {
      const { listDocumentTypes } = await import('../../src/tools/listDocumentTypesLogic.js');
      const result = listDocumentTypes();

      expect(result).toHaveLength(6);

      // 예상되는 문서 유형들
      const expectedTypes = ['prd', 'architecture', 'epic', 'story', 'project-context', 'brainstorming'];
      const actualTypes = result.map(d => d.type);

      for (const type of expectedTypes) {
        expect(actualTypes).toContain(type);
      }
    });

    it('should include glob_pattern for each type', async () => {
      const { listDocumentTypes } = await import('../../src/tools/listDocumentTypesLogic.js');
      const result = listDocumentTypes();

      for (const docType of result) {
        expect(docType.glob_pattern).toBeDefined();
        expect(docType.glob_pattern.length).toBeGreaterThan(0);
        // glob 패턴 또는 정확한 파일 경로가 존재해야 함
        // epic 타입은 정확한 경로 (_bmad-output/epics.md)를 사용하므로 와일드카드가 없음
        expect(docType.glob_pattern).toMatch(/\.(md|txt)/);
      }
    });
  });
}, TEST_TIMEOUT);
