/**
 * 공통 타입 정의 모듈
 *
 * 모든 MCP 서버에서 사용하는 공통 타입들을 re-export합니다.
 *
 * @example
 * ```typescript
 * import type { McpResponse, McpErrorResponse, CacheOptions } from '@moonklabs/mcp-common';
 * import { isMcpError, buildCacheKey, DEFAULT_TTL } from '@moonklabs/mcp-common';
 * ```
 *
 * @module types
 */

// MCP 응답 타입
export type {
  McpResponse,
  McpErrorResponse,
  McpToolContent,
  McpToolResult,
  McpResult,
  ErrorCode,
} from './mcp.js';

export { isMcpResponse, isMcpError } from './mcp.js';

// Notion API 타입
export type {
  NotionPage,
  NotionBlock,
  NotionBlockType,
  NotionDatabase,
  NotionDatabaseProperty,
  NotionPropertyType,
  NotionApiError,
} from './notion.js';

export { isNotionApiError } from './notion.js';

// 캐시 관련 타입
export type {
  CacheKey,
  CacheKeySegments,
  CacheOptions,
  CacheEntry,
  CacheStats,
  CacheSetResult,
  CacheInvalidateResult,
} from './cache.js';

export { DEFAULT_TTL } from './cache.js';

// buildCacheKey, parseCacheKey는 cache 모듈에서 export
// import { buildCacheKey, parseCacheKey } from '@moonklabs/mcp-common';

// 메트릭스 관련 타입
export type { MetricsSummary, ToolMetrics } from './metrics.js';
