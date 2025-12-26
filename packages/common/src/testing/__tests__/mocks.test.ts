/**
 * API Mock 함수 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import {
  mockNotionPage,
  mockNotionPageBlocks,
  mockNotionDatabase,
  mockNotionRateLimit,
  mockNotionError,
  cleanupNotionMocks,
  mockSlackMessage,
  mockSlackRateLimit,
  mockSlackError,
  cleanupSlackMocks,
} from '../mocks/index.js';

// 타입 정의
interface NotionPageResponse {
  object: string;
  id: string;
  properties: {
    title?: {
      title: Array<{ text: { content: string } }>;
    };
    Status?: {
      select: { name: string };
    };
  };
}

interface NotionDatabaseQueryResponse {
  object: string;
  results: Array<{ id: string }>;
  next_cursor: string | null;
  has_more: boolean;
}

interface NotionBlocksResponse {
  object: string;
  results: Array<{
    id: string;
    type: string;
    has_children: boolean;
  }>;
  next_cursor: string | null;
  has_more: boolean;
}

interface NotionErrorResponse {
  code: string;
  message: string;
}

interface SlackApiResponse {
  ok: boolean;
  channel?: string;
  error?: string;
}

describe('Notion API Mocks', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('mockNotionPage', () => {
    it('기본 페이지 mock을 설정해야 함', async () => {
      const scope = mockNotionPage({ pageId: 'page-123' });

      const response = await fetch('https://api.notion.com/v1/pages/page-123');
      const data = (await response.json()) as NotionPageResponse;

      expect(response.status).toBe(200);
      expect(data.id).toBe('page-123');
      expect(data.object).toBe('page');

      scope.done();
    });

    it('커스텀 제목으로 페이지 mock을 설정해야 함', async () => {
      const scope = mockNotionPage({
        pageId: 'page-456',
        title: 'My Custom Title',
      });

      const response = await fetch('https://api.notion.com/v1/pages/page-456');
      const data = (await response.json()) as NotionPageResponse;

      expect(response.status).toBe(200);
      expect(data.properties.title?.title[0].text.content).toBe('My Custom Title');

      scope.done();
    });

    it('커스텀 속성으로 페이지 mock을 설정해야 함', async () => {
      const scope = mockNotionPage({
        pageId: 'page-789',
        properties: {
          Status: { select: { name: 'In Progress' } },
        },
      });

      const response = await fetch('https://api.notion.com/v1/pages/page-789');
      const data = (await response.json()) as NotionPageResponse;

      expect(response.status).toBe(200);
      expect(data.properties.Status?.select.name).toBe('In Progress');

      scope.done();
    });
  });

  describe('mockNotionPageBlocks', () => {
    it('페이지 블록 조회 mock을 설정해야 함', async () => {
      const scope = mockNotionPageBlocks({
        blockId: 'page-123',
        blocks: [
          { id: 'block-1', type: 'paragraph', content: 'Hello World', has_children: false, created_time: '2025-01-01T00:00:00Z', last_edited_time: '2025-01-01T00:00:00Z' },
          { id: 'block-2', type: 'heading_1', content: 'Title', has_children: false, created_time: '2025-01-01T00:00:00Z', last_edited_time: '2025-01-01T00:00:00Z' },
        ],
      });

      const response = await fetch('https://api.notion.com/v1/blocks/page-123/children');
      const data = (await response.json()) as NotionBlocksResponse;

      expect(response.status).toBe(200);
      expect(data.object).toBe('list');
      expect(data.results).toHaveLength(2);
      expect(data.results[0].id).toBe('block-1');
      expect(data.results[0].type).toBe('paragraph');
      expect(data.results[1].type).toBe('heading_1');

      scope.done();
    });

    it('페이지네이션 정보를 포함해야 함', async () => {
      const scope = mockNotionPageBlocks({
        blockId: 'page-456',
        blocks: [
          { id: 'block-1', type: 'paragraph', content: 'Content', has_children: false, created_time: '2025-01-01T00:00:00Z', last_edited_time: '2025-01-01T00:00:00Z' },
        ],
        nextCursor: 'cursor-456',
        hasMore: true,
      });

      const response = await fetch('https://api.notion.com/v1/blocks/page-456/children');
      const data = (await response.json()) as NotionBlocksResponse;

      expect(data.next_cursor).toBe('cursor-456');
      expect(data.has_more).toBe(true);

      scope.done();
    });

    it('빈 블록 배열을 처리해야 함', async () => {
      const scope = mockNotionPageBlocks({
        blockId: 'empty-page',
        blocks: [],
      });

      const response = await fetch('https://api.notion.com/v1/blocks/empty-page/children');
      const data = (await response.json()) as NotionBlocksResponse;

      expect(data.results).toHaveLength(0);
      expect(data.has_more).toBe(false);

      scope.done();
    });
  });

  describe('mockNotionDatabase', () => {
    it('데이터베이스 쿼리 mock을 설정해야 함', async () => {
      const scope = mockNotionDatabase({
        databaseId: 'db-123',
        pages: [
          { id: 'page-1' },
          { id: 'page-2' },
        ],
      });

      const response = await fetch('https://api.notion.com/v1/databases/db-123/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as NotionDatabaseQueryResponse;

      expect(response.status).toBe(200);
      expect(data.object).toBe('list');
      expect(data.results).toHaveLength(2);
      expect(data.results[0].id).toBe('page-1');

      scope.done();
    });

    it('페이지네이션 정보를 포함해야 함', async () => {
      const scope = mockNotionDatabase({
        databaseId: 'db-456',
        pages: [{ id: 'page-1' }],
        nextCursor: 'cursor-123',
        hasMore: true,
      });

      const response = await fetch('https://api.notion.com/v1/databases/db-456/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as NotionDatabaseQueryResponse;

      expect(data.next_cursor).toBe('cursor-123');
      expect(data.has_more).toBe(true);

      scope.done();
    });
  });

  describe('mockNotionRateLimit', () => {
    it('429 응답을 반환해야 함', async () => {
      mockNotionRateLimit(30);

      const response = await fetch('https://api.notion.com/v1/pages/any-page');

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('30');
    });

    it('기본 retryAfter 값은 60이어야 함', async () => {
      mockNotionRateLimit();

      const response = await fetch('https://api.notion.com/v1/pages/any-page');

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('mockNotionError', () => {
    it('404 에러를 반환해야 함', async () => {
      mockNotionError({
        statusCode: 404,
        errorCode: 'object_not_found',
        message: 'Page not found',
      });

      const response = await fetch('https://api.notion.com/v1/pages/missing');
      const data = (await response.json()) as NotionErrorResponse;

      expect(response.status).toBe(404);
      expect(data.code).toBe('object_not_found');
      expect(data.message).toBe('Page not found');
    });

    it('401 에러를 반환해야 함', async () => {
      mockNotionError({
        statusCode: 401,
        errorCode: 'unauthorized',
      });

      const response = await fetch('https://api.notion.com/v1/pages/secret');

      expect(response.status).toBe(401);
    });
  });

  describe('cleanupNotionMocks', () => {
    it('모든 mock을 정리해야 함', () => {
      mockNotionPage({ pageId: 'page-1' });
      mockNotionPage({ pageId: 'page-2' });

      cleanupNotionMocks();

      // mock이 정리되어 요청이 실패해야 함
      expect(nock.pendingMocks()).toHaveLength(0);
    });
  });
});

describe('Slack API Mocks (Phase 2 스텁)', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('mockSlackMessage', () => {
    it('메시지 전송 mock을 설정해야 함', async () => {
      const scope = mockSlackMessage({
        channel: 'C123456',
        text: 'Hello!',
      });

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'C123456', text: 'Hello!' }),
      });
      const data = (await response.json()) as SlackApiResponse;

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.channel).toBe('C123456');

      scope.done();
    });
  });

  describe('mockSlackRateLimit', () => {
    it('429 응답을 반환해야 함', async () => {
      mockSlackRateLimit(30);

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as SlackApiResponse;

      expect(response.status).toBe(429);
      expect(data.error).toBe('ratelimited');
    });
  });

  describe('mockSlackError', () => {
    it('에러 응답을 반환해야 함', async () => {
      mockSlackError('channel_not_found');

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as SlackApiResponse;

      expect(response.status).toBe(200);
      expect(data.ok).toBe(false);
      expect(data.error).toBe('channel_not_found');
    });
  });

  describe('cleanupSlackMocks', () => {
    it('모든 mock을 정리해야 함', () => {
      mockSlackMessage({ channel: 'C1' });
      mockSlackMessage({ channel: 'C2' });

      cleanupSlackMocks();

      expect(nock.pendingMocks()).toHaveLength(0);
    });
  });
});
