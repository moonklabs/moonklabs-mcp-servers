import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  NotionPage,
  NotionBlock,
  NotionBlockType,
  NotionDatabase,
  NotionDatabaseProperty,
  NotionPropertyType,
  NotionApiError,
} from '../notion.js';
import { isNotionApiError } from '../notion.js';

describe('Notion Types', () => {
  describe('NotionPage', () => {
    it('should have required fields', () => {
      const page: NotionPage = {
        id: 'abc-123-def',
        title: '프로젝트 PRD',
        last_edited_time: '2025-12-26T10:00:00.000Z',
      };

      expect(page.id).toBe('abc-123-def');
      expect(page.title).toBe('프로젝트 PRD');
      expect(page.last_edited_time).toBeDefined();
    });

    it('should accept optional fields', () => {
      const page: NotionPage = {
        id: 'abc-123',
        title: 'Test Page',
        last_edited_time: '2025-12-26T10:00:00.000Z',
        created_time: '2025-12-01T09:00:00.000Z',
        url: 'https://notion.so/test-page',
        icon: '📄',
        cover: 'https://example.com/cover.jpg',
        parent_id: 'parent-123',
        archived: false,
      };

      expect(page.created_time).toBeDefined();
      expect(page.url).toContain('notion.so');
      expect(page.icon).toBe('📄');
      expect(page.archived).toBe(false);
    });
  });

  describe('NotionBlock', () => {
    it('should have required fields', () => {
      const block: NotionBlock = {
        id: 'block-123',
        type: 'paragraph',
        content: '이것은 단락 텍스트입니다.',
        has_children: false,
      };

      expect(block.id).toBe('block-123');
      expect(block.type).toBe('paragraph');
      expect(block.has_children).toBe(false);
    });

    it('should support string content', () => {
      const block: NotionBlock = {
        id: 'block-1',
        type: 'paragraph',
        content: 'Plain text content',
        has_children: false,
      };

      expectTypeOf(block.content).toMatchTypeOf<string | Record<string, unknown>>();
      expect(typeof block.content).toBe('string');
    });

    it('should support object content', () => {
      const block: NotionBlock = {
        id: 'block-2',
        type: 'code',
        content: { language: 'typescript', code: 'const x = 1;' },
        has_children: false,
      };

      expect(typeof block.content).toBe('object');
    });

    it('should accept nested children', () => {
      const block: NotionBlock = {
        id: 'parent-block',
        type: 'toggle',
        content: 'Toggle header',
        has_children: true,
        children: [
          {
            id: 'child-block',
            type: 'paragraph',
            content: 'Nested content',
            has_children: false,
          },
        ],
      };

      expect(block.children).toHaveLength(1);
      expect(block.children?.[0].type).toBe('paragraph');
    });
  });

  describe('NotionBlockType', () => {
    it('should accept valid block types', () => {
      const types: NotionBlockType[] = [
        'paragraph',
        'heading_1',
        'heading_2',
        'heading_3',
        'bulleted_list_item',
        'numbered_list_item',
        'to_do',
        'toggle',
        'code',
        'quote',
        'callout',
        'divider',
        'table',
        'image',
      ];

      types.forEach((type) => {
        const block: NotionBlock = {
          id: 'test',
          type,
          content: '',
          has_children: false,
        };
        expect(block.type).toBe(type);
      });
    });
  });

  describe('NotionDatabase', () => {
    it('should have required fields', () => {
      const database: NotionDatabase = {
        id: 'db-123',
        title: '프로젝트 스토리',
        last_edited_time: '2025-12-26T10:00:00.000Z',
        properties: {},
      };

      expect(database.id).toBe('db-123');
      expect(database.title).toBe('프로젝트 스토리');
      expect(database.properties).toEqual({});
    });

    it('should support property definitions', () => {
      const property: NotionDatabaseProperty = {
        id: 'title',
        name: 'Name',
        type: 'title',
      };

      const database: NotionDatabase = {
        id: 'db-123',
        title: 'Test DB',
        last_edited_time: '2025-12-26T10:00:00.000Z',
        properties: {
          Name: property,
          Status: { id: 'status', name: 'Status', type: 'status' },
        },
      };

      expect(database.properties.Name.type).toBe('title');
      expect(database.properties.Status.type).toBe('status');
    });
  });

  describe('NotionPropertyType', () => {
    it('should accept valid property types', () => {
      const types: NotionPropertyType[] = [
        'title',
        'rich_text',
        'number',
        'select',
        'multi_select',
        'date',
        'people',
        'checkbox',
        'url',
        'status',
      ];

      types.forEach((type) => {
        const prop: NotionDatabaseProperty = {
          id: 'test',
          name: 'Test',
          type,
        };
        expect(prop.type).toBe(type);
      });
    });
  });

  describe('NotionApiError', () => {
    it('should have correct structure', () => {
      const error: NotionApiError = {
        object: 'error',
        status: 404,
        code: 'object_not_found',
        message: 'Could not find object with ID: abc-123',
      };

      expect(error.object).toBe('error');
      expect(error.status).toBe(404);
      expect(error.code).toBe('object_not_found');
      expect(error.message).toContain('abc-123');
    });
  });

  describe('isNotionApiError', () => {
    it('should return true for valid error', () => {
      const error: NotionApiError = {
        object: 'error',
        status: 404,
        code: 'not_found',
        message: 'Not found',
      };

      expect(isNotionApiError(error)).toBe(true);
    });

    it('should return false for non-error objects', () => {
      expect(isNotionApiError({ object: 'page' })).toBe(false);
      expect(isNotionApiError({ object: 'database' })).toBe(false);
      expect(isNotionApiError({ status: 'success' })).toBe(false);
    });

    it('should return false for null and undefined', () => {
      expect(isNotionApiError(null)).toBe(false);
      expect(isNotionApiError(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isNotionApiError('error')).toBe(false);
      expect(isNotionApiError(404)).toBe(false);
      expect(isNotionApiError(true)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isNotionApiError({})).toBe(false);
    });

    it('should narrow type correctly', () => {
      const value: unknown = {
        object: 'error',
        status: 429,
        code: 'rate_limited',
        message: 'Too many requests',
      };

      if (isNotionApiError(value)) {
        // 타입 좁히기 확인
        expectTypeOf(value).toEqualTypeOf<NotionApiError>();
        expect(value.code).toBe('rate_limited');
      }
    });
  });
});
