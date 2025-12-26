/**
 * Notion 관련 테스트 Fixtures
 *
 * Notion 페이지, 블록 등 테스트 데이터를 생성하는 팩토리 함수들입니다.
 *
 * @module testing/fixtures/notion
 *
 * @remarks
 * **Fixtures vs Mocks 차이점**
 *
 * - **Fixtures** (`createMockNotionPage`, `createMockNotionBlock`):
 *   - 순수 JavaScript 객체를 생성하는 팩토리 함수
 *   - 단위 테스트에서 테스트 데이터로 사용
 *   - HTTP 요청 없이 로컬에서 동작
 *
 * - **Mocks** (`mockNotionPage`, `mockNotionPageBlocks`):
 *   - nock 기반 HTTP 요청 인터셉터
 *   - 통합 테스트에서 실제 API 호출을 모킹
 *   - 네트워크 레벨에서 Notion API 응답을 시뮬레이션
 *
 * 일반적으로 비즈니스 로직 단위 테스트에는 Fixtures를,
 * API 클라이언트 통합 테스트에는 Mocks를 사용하세요.
 *
 * @example
 * ```typescript
 * import { createMockNotionPage, createMockNotionBlock } from '@moonklabs/mcp-common';
 *
 * // 기본 Notion 페이지 생성
 * const page = createMockNotionPage();
 *
 * // 블록 생성
 * const block = createMockNotionBlock('paragraph', 'Hello World');
 * ```
 */

import type { NotionBlock, NotionBlockType } from '../../types/notion.js';

/**
 * Mock Notion 페이지 타입
 */
export interface MockNotionPage {
  /** 페이지 ID */
  id: string;
  /** 객체 타입 */
  object: 'page';
  /** 생성 시간 */
  created_time: string;
  /** 최종 수정 시간 */
  last_edited_time: string;
  /** 아카이브 여부 */
  archived: boolean;
  /** 페이지 아이콘 */
  icon: { type: 'emoji'; emoji: string } | null;
  /** 페이지 커버 */
  cover: { type: 'external'; external: { url: string } } | null;
  /** 페이지 속성 */
  properties: Record<string, unknown>;
  /** 부모 정보 */
  parent: { type: string; workspace?: boolean; database_id?: string };
  /** Notion URL */
  url: string;
}

/**
 * Notion 페이지 생성 옵션
 */
export interface CreateMockNotionPageOptions {
  /** 페이지 ID */
  id?: string;
  /** 페이지 제목 */
  title?: string;
  /** 아카이브 여부 */
  archived?: boolean;
  /** 아이콘 이모지 */
  icon?: string;
  /** 커버 이미지 URL */
  coverUrl?: string;
  /** 커스텀 속성 */
  properties?: Record<string, unknown>;
  /** 부모 데이터베이스 ID */
  parentDatabaseId?: string;
}

/**
 * Mock Notion 페이지 생성
 *
 * 테스트용 Notion 페이지 객체를 생성합니다.
 *
 * @param overrides - 기본값을 덮어쓸 옵션
 * @returns MockNotionPage 객체
 *
 * @example
 * ```typescript
 * // 기본 페이지
 * const page = createMockNotionPage();
 *
 * // 커스텀 페이지
 * const page = createMockNotionPage({
 *   id: 'page-123',
 *   title: 'My Story',
 *   icon: '📝',
 *   properties: {
 *     Status: { select: { name: 'In Progress' } },
 *   },
 * });
 * ```
 */
export function createMockNotionPage(
  overrides: CreateMockNotionPageOptions = {}
): MockNotionPage {
  const now = new Date().toISOString();
  const id = overrides.id ?? 'mock-page-id';
  const title = overrides.title ?? 'Mock Page';

  return {
    id,
    object: 'page',
    created_time: now,
    last_edited_time: now,
    archived: overrides.archived ?? false,
    icon: overrides.icon ? { type: 'emoji', emoji: overrides.icon } : null,
    cover: overrides.coverUrl
      ? { type: 'external', external: { url: overrides.coverUrl } }
      : null,
    properties: overrides.properties ?? {
      title: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: { content: title },
            plain_text: title,
          },
        ],
      },
    },
    parent: overrides.parentDatabaseId
      ? { type: 'database_id', database_id: overrides.parentDatabaseId }
      : { type: 'workspace', workspace: true },
    url: `https://www.notion.so/${id.replace(/-/g, '')}`,
  };
}

/**
 * Mock Notion 블록 생성
 *
 * 테스트용 Notion 블록 객체를 생성합니다.
 * 프로젝트의 NotionBlock 타입 (간소화된 형태)에 맞게 생성합니다.
 *
 * @param type - 블록 타입 (paragraph, heading_1, bulleted_list_item 등)
 * @param content - 블록 텍스트 콘텐츠
 * @param options - 추가 옵션
 * @returns NotionBlock 객체
 *
 * @example
 * ```typescript
 * // 단락 블록
 * const paragraph = createMockNotionBlock('paragraph', 'Hello World');
 *
 * // 제목 블록
 * const heading = createMockNotionBlock('heading_1', 'Chapter 1');
 *
 * // 목록 블록
 * const listItem = createMockNotionBlock('bulleted_list_item', 'First item');
 * ```
 */
export function createMockNotionBlock(
  type: NotionBlockType,
  content: string,
  options: { id?: string; hasChildren?: boolean } = {}
): NotionBlock {
  const now = new Date().toISOString();
  const id = options.id ?? `block-${Math.random().toString(36).substring(7)}`;

  return {
    id,
    type,
    content,
    has_children: options.hasChildren ?? false,
    created_time: now,
    last_edited_time: now,
  };
}

/**
 * 여러 Mock Notion 블록 생성
 *
 * 문자열 배열로부터 paragraph 블록들을 생성합니다.
 *
 * @param contents - 블록 텍스트 콘텐츠 배열
 * @param type - 블록 타입 (기본값: 'paragraph')
 * @returns NotionBlock 배열
 *
 * @example
 * ```typescript
 * const blocks = createMockNotionBlocks([
 *   'First paragraph',
 *   'Second paragraph',
 *   'Third paragraph',
 * ]);
 * ```
 */
export function createMockNotionBlocks(
  contents: string[],
  type: NotionBlockType = 'paragraph'
): NotionBlock[] {
  return contents.map((content) => createMockNotionBlock(type, content));
}
