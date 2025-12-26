/**
 * 테스트 Fixtures 통합 Export
 *
 * Story, Notion 등 테스트 데이터 팩토리 함수들을 re-export합니다.
 *
 * @module testing/fixtures
 *
 * @example
 * ```typescript
 * import {
 *   createMockStory,
 *   createMockEpic,
 *   createMockNotionPage,
 *   createMockNotionBlock,
 * } from '@moonklabs/mcp-common';
 * ```
 */

// Story Fixtures
export {
  createMockStory,
  createMockEpic,
  createMockStories,
} from './stories.js';
export type {
  MockStory,
  MockEpic,
  CreateMockStoryOptions,
  CreateMockEpicOptions,
} from './stories.js';

// Notion Fixtures
export {
  createMockNotionPage,
  createMockNotionBlock,
  createMockNotionBlocks,
} from './notion.js';
export type {
  MockNotionPage,
  CreateMockNotionPageOptions,
} from './notion.js';
