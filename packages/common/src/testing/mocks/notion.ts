/**
 * Notion API Mock 함수
 *
 * nock 기반으로 Notion API HTTP 요청을 모킹합니다.
 * 테스트에서 외부 API 의존성 없이 Notion 관련 코드를 테스트할 수 있습니다.
 *
 * @module testing/mocks/notion
 *
 * @remarks
 * **Mocks vs Fixtures 차이점**
 *
 * - **Mocks** (이 모듈): nock 기반 HTTP 인터셉터. 통합 테스트용.
 * - **Fixtures** (`fixtures/notion.ts`): 순수 객체 팩토리. 단위 테스트용.
 *
 * API 클라이언트 테스트에는 Mocks를, 비즈니스 로직 테스트에는 Fixtures를 사용하세요.
 *
 * @example
 * ```typescript
 * import { mockNotionPage, mockNotionRateLimit, mockNotionError } from '@moonklabs/mcp-common';
 * import nock from 'nock';
 *
 * beforeEach(() => {
 *   nock.cleanAll();
 * });
 *
 * afterEach(() => {
 *   nock.cleanAll();
 * });
 *
 * test('Notion 페이지 조회', async () => {
 *   const scope = mockNotionPage({ pageId: 'page-123', title: 'Test Page' });
 *
 *   // API 호출 테스트
 *   const result = await fetchNotionPage('page-123');
 *
 *   scope.done(); // 모든 mock이 호출되었는지 확인
 * });
 *
 * test('Rate Limit 처리', async () => {
 *   mockNotionRateLimit(30);
 *
 *   // Rate limit 응답 처리 테스트
 * });
 * ```
 */

import nock from 'nock';
import type { NotionBlock } from '../../types/notion.js';

/** Notion API 기본 URL */
const NOTION_API_BASE = 'https://api.notion.com';

/**
 * Notion 페이지 모킹 옵션
 */
export interface MockNotionPageOptions {
  /** 페이지 ID */
  pageId: string;
  /** 페이지 제목 (기본값: 'Mock Page') */
  title?: string;
  /** 페이지 속성 (커스텀) */
  properties?: Record<string, unknown>;
  /** 아이콘 */
  icon?: { type: 'emoji'; emoji: string } | null;
  /** 커버 이미지 */
  cover?: { type: 'external'; external: { url: string } } | null;
}

/**
 * Notion 페이지 블록 모킹 옵션
 */
export interface MockNotionPageBlocksOptions {
  /** 페이지/블록 ID */
  blockId: string;
  /** 블록 목록 */
  blocks: NotionBlock[];
  /** 다음 페이지 커서 (페이지네이션) */
  nextCursor?: string | null;
  /** 더 많은 결과가 있는지 여부 */
  hasMore?: boolean;
}

/**
 * Notion 데이터베이스 모킹 옵션
 */
export interface MockNotionDatabaseOptions {
  /** 데이터베이스 ID */
  databaseId: string;
  /** 데이터베이스에 포함된 페이지 목록 */
  pages?: Array<{
    id: string;
    properties?: Record<string, unknown>;
  }>;
  /** 다음 페이지 커서 (페이지네이션) */
  nextCursor?: string | null;
  /** 더 많은 결과가 있는지 여부 */
  hasMore?: boolean;
}

/**
 * Notion API 에러 모킹 옵션
 */
export interface MockNotionErrorOptions {
  /** HTTP 상태 코드 */
  statusCode: number;
  /** Notion 에러 코드 */
  errorCode: string;
  /** 에러 메시지 */
  message?: string;
  /** 특정 경로에만 적용 (기본값: 모든 경로) */
  path?: string | RegExp;
}

/**
 * Notion 페이지 조회 Mock 설정
 *
 * GET /v1/pages/{pageId} 엔드포인트를 모킹합니다.
 *
 * @param options - 모킹 옵션
 * @returns nock.Scope - 테스트 후 scope.done()으로 모든 mock 호출 확인
 *
 * @example
 * ```typescript
 * const scope = mockNotionPage({
 *   pageId: 'page-123',
 *   title: 'My Story',
 *   properties: { Status: { select: { name: 'In Progress' } } }
 * });
 *
 * // API 호출 후
 * scope.done();
 * ```
 */
export function mockNotionPage(options: MockNotionPageOptions): nock.Scope {
  const {
    pageId,
    title = 'Mock Page',
    properties,
    icon = null,
    cover = null,
  } = options;

  const defaultProperties = {
    title: {
      id: 'title',
      type: 'title',
      title: [{ type: 'text', text: { content: title }, plain_text: title }],
    },
  };

  return nock(NOTION_API_BASE)
    .get(`/v1/pages/${pageId}`)
    .reply(200, {
      object: 'page',
      id: pageId,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      archived: false,
      icon,
      cover,
      properties: properties ?? defaultProperties,
      parent: { type: 'workspace', workspace: true },
      url: `https://www.notion.so/${pageId.replace(/-/g, '')}`,
    });
}

/**
 * Notion 페이지 블록 조회 Mock 설정
 *
 * GET /v1/blocks/{blockId}/children 엔드포인트를 모킹합니다.
 * 페이지 내용(블록들)을 조회할 때 사용합니다.
 *
 * @param options - 모킹 옵션
 * @returns nock.Scope
 *
 * @example
 * ```typescript
 * const scope = mockNotionPageBlocks({
 *   blockId: 'page-123',
 *   blocks: [
 *     { id: 'block-1', type: 'paragraph', content: 'Hello World', has_children: false },
 *     { id: 'block-2', type: 'heading_1', content: 'Title', has_children: false },
 *   ],
 * });
 *
 * // API 호출 후
 * scope.done();
 * ```
 */
export function mockNotionPageBlocks(options: MockNotionPageBlocksOptions): nock.Scope {
  const {
    blockId,
    blocks,
    nextCursor = null,
    hasMore = false,
  } = options;

  // NotionBlock을 Notion API 응답 형태로 변환
  const results = blocks.map((block) => ({
    object: 'block',
    id: block.id,
    type: block.type,
    created_time: block.created_time ?? new Date().toISOString(),
    last_edited_time: block.last_edited_time ?? new Date().toISOString(),
    has_children: block.has_children,
    archived: false,
    // 블록 타입별 콘텐츠 구조
    [block.type]: {
      rich_text: [
        {
          type: 'text',
          text: { content: block.content },
          plain_text: block.content,
        },
      ],
    },
  }));

  return nock(NOTION_API_BASE)
    .get(`/v1/blocks/${blockId}/children`)
    .reply(200, {
      object: 'list',
      results,
      next_cursor: nextCursor,
      has_more: hasMore,
    });
}

/**
 * Notion 데이터베이스 쿼리 Mock 설정
 *
 * POST /v1/databases/{databaseId}/query 엔드포인트를 모킹합니다.
 *
 * @param options - 모킹 옵션
 * @returns nock.Scope
 *
 * @example
 * ```typescript
 * const scope = mockNotionDatabase({
 *   databaseId: 'db-123',
 *   pages: [
 *     { id: 'page-1', properties: { Name: { title: [{ text: { content: 'Item 1' } }] } } },
 *     { id: 'page-2', properties: { Name: { title: [{ text: { content: 'Item 2' } }] } } },
 *   ],
 * });
 * ```
 */
export function mockNotionDatabase(options: MockNotionDatabaseOptions): nock.Scope {
  const {
    databaseId,
    pages = [],
    nextCursor = null,
    hasMore = false,
  } = options;

  const results = pages.map((page) => ({
    object: 'page',
    id: page.id,
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString(),
    archived: false,
    properties: page.properties ?? {},
    parent: { type: 'database_id', database_id: databaseId },
    url: `https://www.notion.so/${page.id.replace(/-/g, '')}`,
  }));

  return nock(NOTION_API_BASE)
    .post(`/v1/databases/${databaseId}/query`)
    .reply(200, {
      object: 'list',
      results,
      next_cursor: nextCursor,
      has_more: hasMore,
    });
}

/**
 * Notion Rate Limit (429) Mock 설정
 *
 * 모든 Notion API 요청에 대해 429 응답을 반환합니다.
 * Retry-After 헤더가 포함됩니다.
 *
 * @param retryAfter - 재시도까지 대기 시간 (초, 기본값: 60)
 * @returns nock.Scope
 *
 * @example
 * ```typescript
 * mockNotionRateLimit(30);
 *
 * // 이제 모든 Notion API 호출은 429 응답을 반환합니다
 * ```
 */
export function mockNotionRateLimit(retryAfter = 60): nock.Scope {
  return nock(NOTION_API_BASE)
    .persist()
    .get(/.*/)
    .reply(429, { message: 'Rate limited' }, { 'Retry-After': String(retryAfter) })
    .post(/.*/)
    .reply(429, { message: 'Rate limited' }, { 'Retry-After': String(retryAfter) });
}

/**
 * Notion API 에러 Mock 설정
 *
 * 특정 에러 응답을 반환하도록 설정합니다.
 *
 * @param options - 에러 모킹 옵션
 * @returns nock.Scope
 *
 * @example
 * ```typescript
 * // 404 Not Found
 * mockNotionError({
 *   statusCode: 404,
 *   errorCode: 'object_not_found',
 *   message: 'Could not find page with ID: page-123'
 * });
 *
 * // 401 Unauthorized
 * mockNotionError({
 *   statusCode: 401,
 *   errorCode: 'unauthorized',
 *   message: 'API token is invalid'
 * });
 * ```
 */
export function mockNotionError(options: MockNotionErrorOptions): nock.Scope {
  const {
    statusCode,
    errorCode,
    message = 'An error occurred',
    path = /.*/,
  } = options;

  return nock(NOTION_API_BASE)
    .persist()
    .get(path)
    .reply(statusCode, {
      object: 'error',
      status: statusCode,
      code: errorCode,
      message,
    })
    .post(path)
    .reply(statusCode, {
      object: 'error',
      status: statusCode,
      code: errorCode,
      message,
    });
}

/**
 * 모든 Notion Mock 정리
 *
 * 테스트 afterEach에서 호출하여 모든 mock을 정리합니다.
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   cleanupNotionMocks();
 * });
 * ```
 */
export function cleanupNotionMocks(): void {
  nock.cleanAll();
}
