/**
 * 테스트 Fixtures 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  createMockStory,
  createMockEpic,
  createMockStories,
  createMockNotionPage,
  createMockNotionBlock,
  createMockNotionBlocks,
} from '../fixtures/index.js';

describe('Story Fixtures', () => {
  describe('createMockStory', () => {
    it('기본값으로 Story를 생성해야 함', () => {
      const story = createMockStory();

      expect(story.id).toBe('story-1-1');
      expect(story.title).toBe('Test Story');
      expect(story.status).toBe('ready-for-dev');
      expect(story.epicId).toBe('epic-1');
      expect(story.acceptanceCriteria).toHaveLength(2);
      expect(story.createdAt).toBeDefined();
      expect(story.updatedAt).toBeDefined();
    });

    it('커스텀 값으로 Story를 생성해야 함', () => {
      const story = createMockStory({
        id: 'story-2-3',
        title: 'Custom Story',
        status: 'in-progress',
        epicId: 'epic-2',
      });

      expect(story.id).toBe('story-2-3');
      expect(story.title).toBe('Custom Story');
      expect(story.status).toBe('in-progress');
      expect(story.epicId).toBe('epic-2');
    });

    it('acceptanceCriteria를 커스터마이징할 수 있어야 함', () => {
      const story = createMockStory({
        acceptanceCriteria: ['AC1', 'AC2', 'AC3'],
      });

      expect(story.acceptanceCriteria).toEqual(['AC1', 'AC2', 'AC3']);
    });
  });

  describe('createMockEpic', () => {
    it('기본값으로 Epic을 생성해야 함', () => {
      const epic = createMockEpic();

      expect(epic.id).toBe('epic-1');
      expect(epic.title).toBe('Test Epic');
      expect(epic.status).toBe('backlog');
      expect(epic.storyIds).toEqual(['story-1-1', 'story-1-2']);
      expect(epic.description).toBe('Test Epic Description');
    });

    it('커스텀 값으로 Epic을 생성해야 함', () => {
      const epic = createMockEpic({
        id: 'epic-3',
        title: 'Feature Epic',
        status: 'in-progress',
        storyIds: ['story-3-1', 'story-3-2', 'story-3-3'],
      });

      expect(epic.id).toBe('epic-3');
      expect(epic.title).toBe('Feature Epic');
      expect(epic.status).toBe('in-progress');
      expect(epic.storyIds).toHaveLength(3);
    });
  });

  describe('createMockStories', () => {
    it('지정된 개수만큼 Story를 생성해야 함', () => {
      const stories = createMockStories(5);

      expect(stories).toHaveLength(5);
      expect(stories[0].id).toBe('story-1-1');
      expect(stories[4].id).toBe('story-1-5');
    });

    it('모든 Story에 기본 옵션을 적용해야 함', () => {
      const stories = createMockStories(3, {
        epicId: 'epic-2',
        status: 'done',
      });

      expect(stories).toHaveLength(3);
      stories.forEach((story) => {
        expect(story.epicId).toBe('epic-2');
        expect(story.status).toBe('done');
      });
      expect(stories[0].id).toBe('story-2-1');
      expect(stories[2].id).toBe('story-2-3');
    });

    it('빈 배열도 생성할 수 있어야 함', () => {
      const stories = createMockStories(0);

      expect(stories).toHaveLength(0);
    });
  });
});

describe('Notion Fixtures', () => {
  describe('createMockNotionPage', () => {
    it('기본값으로 Notion 페이지를 생성해야 함', () => {
      const page = createMockNotionPage();

      expect(page.id).toBe('mock-page-id');
      expect(page.object).toBe('page');
      expect(page.archived).toBe(false);
      expect(page.icon).toBeNull();
      expect(page.cover).toBeNull();
      expect(page.properties.title).toBeDefined();
      expect(page.url).toContain('notion.so');
    });

    it('커스텀 ID와 제목으로 페이지를 생성해야 함', () => {
      const page = createMockNotionPage({
        id: 'custom-id',
        title: 'My Custom Page',
      });

      expect(page.id).toBe('custom-id');
      // 타입 안전하게 접근
      const titleProp = page.properties.title as {
        title: Array<{ text: { content: string } }>;
      };
      expect(titleProp.title[0].text.content).toBe('My Custom Page');
    });

    it('아이콘과 커버를 설정할 수 있어야 함', () => {
      const page = createMockNotionPage({
        icon: '📝',
        coverUrl: 'https://example.com/cover.jpg',
      });

      expect(page.icon).toEqual({ type: 'emoji', emoji: '📝' });
      expect(page.cover).toEqual({
        type: 'external',
        external: { url: 'https://example.com/cover.jpg' },
      });
    });

    it('부모 데이터베이스를 설정할 수 있어야 함', () => {
      const page = createMockNotionPage({
        parentDatabaseId: 'db-123',
      });

      expect(page.parent).toEqual({
        type: 'database_id',
        database_id: 'db-123',
      });
    });

    it('커스텀 속성을 설정할 수 있어야 함', () => {
      const page = createMockNotionPage({
        properties: {
          Status: { select: { name: 'Done' } },
          Priority: { number: 5 },
        },
      });

      expect(page.properties.Status).toEqual({ select: { name: 'Done' } });
      expect(page.properties.Priority).toEqual({ number: 5 });
    });
  });

  describe('createMockNotionBlock', () => {
    it('paragraph 블록을 생성해야 함', () => {
      const block = createMockNotionBlock('paragraph', 'Hello World');

      expect(block.type).toBe('paragraph');
      expect(block.content).toBe('Hello World');
      expect(block.has_children).toBe(false);
    });

    it('heading_1 블록을 생성해야 함', () => {
      const block = createMockNotionBlock('heading_1', 'Chapter 1');

      expect(block.type).toBe('heading_1');
      expect(block.content).toBe('Chapter 1');
    });

    it('bulleted_list_item 블록을 생성해야 함', () => {
      const block = createMockNotionBlock('bulleted_list_item', 'List item');

      expect(block.type).toBe('bulleted_list_item');
      expect(block.content).toBe('List item');
    });

    it('code 블록을 생성해야 함', () => {
      const block = createMockNotionBlock('code', 'console.log("hi")');

      expect(block.type).toBe('code');
      expect(block.content).toBe('console.log("hi")');
    });

    it('커스텀 ID를 설정할 수 있어야 함', () => {
      const block = createMockNotionBlock('paragraph', 'Content', {
        id: 'custom-block-id',
      });

      expect(block.id).toBe('custom-block-id');
    });

    it('hasChildren 옵션을 설정할 수 있어야 함', () => {
      const block = createMockNotionBlock('toggle', 'Toggle content', {
        hasChildren: true,
      });

      expect(block.has_children).toBe(true);
    });
  });

  describe('createMockNotionBlocks', () => {
    it('여러 블록을 생성해야 함', () => {
      const blocks = createMockNotionBlocks([
        'First paragraph',
        'Second paragraph',
        'Third paragraph',
      ]);

      expect(blocks).toHaveLength(3);
      blocks.forEach((block) => {
        expect(block.type).toBe('paragraph');
      });
    });

    it('커스텀 타입으로 블록들을 생성해야 함', () => {
      const blocks = createMockNotionBlocks(
        ['Item 1', 'Item 2'],
        'bulleted_list_item'
      );

      expect(blocks).toHaveLength(2);
      blocks.forEach((block) => {
        expect(block.type).toBe('bulleted_list_item');
      });
    });

    it('빈 배열도 처리할 수 있어야 함', () => {
      const blocks = createMockNotionBlocks([]);

      expect(blocks).toHaveLength(0);
    });
  });
});
