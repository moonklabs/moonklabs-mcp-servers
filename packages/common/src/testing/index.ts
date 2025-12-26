/**
 * 테스트 유틸리티 모듈
 *
 * MCP 서버 테스트를 위한 assertion 헬퍼, API mock, fixtures를 제공합니다.
 * 외부 API 의존성 없이 일관된 테스트를 작성할 수 있습니다.
 *
 * @module testing
 *
 * @example
 * ```typescript
 * import {
 *   // Assertions
 *   assertMcpSuccess,
 *   assertMcpError,
 *   assertMcpContent,
 *
 *   // Notion Mocks
 *   mockNotionPage,
 *   mockNotionRateLimit,
 *   cleanupNotionMocks,
 *
 *   // Fixtures
 *   createMockStory,
 *   createMockNotionPage,
 * } from '@moonklabs/mcp-common';
 *
 * describe('My Tool', () => {
 *   beforeEach(() => {
 *     cleanupNotionMocks();
 *   });
 *
 *   it('should fetch story successfully', async () => {
 *     const scope = mockNotionPage({ pageId: 'page-123', title: 'Story' });
 *     const result = await myTool.execute();
 *     assertMcpSuccess(result, 'Story');
 *     scope.done();
 *   });
 * });
 * ```
 */

// Assertions
export {
  assertMcpSuccess,
  assertMcpError,
  assertMcpContent,
} from './assertions.js';

// Mocks
export {
  // Notion
  mockNotionPage,
  mockNotionPageBlocks,
  mockNotionDatabase,
  mockNotionRateLimit,
  mockNotionError,
  cleanupNotionMocks,
  // Slack (Phase 2)
  mockSlackMessage,
  mockSlackRateLimit,
  mockSlackError,
  cleanupSlackMocks,
} from './mocks/index.js';
export type {
  MockNotionPageOptions,
  MockNotionPageBlocksOptions,
  MockNotionDatabaseOptions,
  MockNotionErrorOptions,
  MockSlackMessageOptions,
} from './mocks/index.js';

// Fixtures
export {
  createMockStory,
  createMockEpic,
  createMockStories,
  createMockNotionPage,
  createMockNotionBlock,
  createMockNotionBlocks,
} from './fixtures/index.js';
export type {
  MockStory,
  MockEpic,
  CreateMockStoryOptions,
  CreateMockEpicOptions,
  MockNotionPage,
  CreateMockNotionPageOptions,
} from './fixtures/index.js';
