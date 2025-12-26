/**
 * API Mock 모듈 통합 Export
 *
 * Notion, Slack 등 외부 API mock 함수들을 re-export합니다.
 *
 * @module testing/mocks
 *
 * @example
 * ```typescript
 * import {
 *   mockNotionPage,
 *   mockNotionRateLimit,
 *   mockSlackMessage,
 *   cleanupNotionMocks,
 * } from '@moonklabs/mcp-common';
 * ```
 */

// Notion API Mocks
export {
  mockNotionPage,
  mockNotionPageBlocks,
  mockNotionDatabase,
  mockNotionRateLimit,
  mockNotionError,
  cleanupNotionMocks,
} from './notion.js';
export type {
  MockNotionPageOptions,
  MockNotionPageBlocksOptions,
  MockNotionDatabaseOptions,
  MockNotionErrorOptions,
} from './notion.js';

// Slack API Mocks (Phase 2 스텁)
export {
  mockSlackMessage,
  mockSlackRateLimit,
  mockSlackError,
  cleanupSlackMocks,
} from './slack.js';
export type { MockSlackMessageOptions } from './slack.js';
