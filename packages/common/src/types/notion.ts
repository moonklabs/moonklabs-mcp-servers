/**
 * Notion API 타입 정의
 *
 * Notion API와 상호작용할 때 사용하는 타입들을 정의합니다.
 * mcp-spec-reader 서버에서 주로 사용됩니다.
 *
 * @module types/notion
 */

/**
 * Notion 블록 타입
 *
 * Notion에서 지원하는 블록 유형들입니다.
 */
export type NotionBlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'code'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'table'
  | 'table_row'
  | 'image'
  | 'bookmark'
  | 'embed'
  | 'file'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'link_preview'
  | 'synced_block'
  | 'template'
  | 'link_to_page'
  | 'table_of_contents'
  | 'column_list'
  | 'column'
  | 'breadcrumb'
  | 'equation'
  | 'child_page'
  | 'child_database'
  | 'unsupported';

/**
 * Notion 페이지 정보
 *
 * @example
 * ```typescript
 * const page: NotionPage = {
 *   id: "abc-123-def",
 *   title: "프로젝트 PRD",
 *   last_edited_time: "2025-12-26T10:00:00.000Z",
 *   created_time: "2025-12-01T09:00:00.000Z",
 *   url: "https://notion.so/project-prd-abc123"
 * };
 * ```
 */
export interface NotionPage {
  /** 페이지 고유 ID (UUID 형식) */
  id: string;
  /** 페이지 제목 */
  title: string;
  /** 마지막 수정 시간 (ISO 8601) */
  last_edited_time: string;
  /** 생성 시간 (ISO 8601) */
  created_time?: string;
  /** 페이지 URL */
  url?: string;
  /** 아이콘 (이모지 또는 URL) */
  icon?: string | null;
  /** 커버 이미지 URL */
  cover?: string | null;
  /** 부모 페이지/데이터베이스 ID */
  parent_id?: string;
  /** 아카이브 여부 */
  archived?: boolean;
}

/**
 * Notion 블록 정보
 *
 * @example
 * ```typescript
 * const block: NotionBlock = {
 *   id: "block-123",
 *   type: "paragraph",
 *   content: "이것은 단락 텍스트입니다.",
 *   has_children: false
 * };
 * ```
 */
export interface NotionBlock {
  /** 블록 고유 ID */
  id: string;
  /** 블록 타입 */
  type: NotionBlockType;
  /** 블록 내용 (텍스트 또는 구조화된 데이터) */
  content: string | Record<string, unknown>;
  /** 자식 블록 존재 여부 */
  has_children: boolean;
  /** 생성 시간 (ISO 8601) */
  created_time?: string;
  /** 마지막 수정 시간 (ISO 8601) */
  last_edited_time?: string;
  /** 자식 블록 배열 (has_children이 true인 경우) */
  children?: NotionBlock[];
}

/**
 * Notion 데이터베이스 속성 타입
 */
export type NotionPropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'people'
  | 'files'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'status';

/**
 * Notion 데이터베이스 속성 정의
 */
export interface NotionDatabaseProperty {
  /** 속성 ID */
  id: string;
  /** 속성 이름 */
  name: string;
  /** 속성 타입 */
  type: NotionPropertyType;
}

/**
 * Notion 데이터베이스 정보
 *
 * @example
 * ```typescript
 * const database: NotionDatabase = {
 *   id: "db-123",
 *   title: "프로젝트 스토리",
 *   last_edited_time: "2025-12-26T10:00:00.000Z",
 *   properties: {
 *     "Name": { id: "title", name: "Name", type: "title" },
 *     "Status": { id: "status", name: "Status", type: "status" }
 *   }
 * };
 * ```
 */
export interface NotionDatabase {
  /** 데이터베이스 고유 ID */
  id: string;
  /** 데이터베이스 제목 */
  title: string;
  /** 마지막 수정 시간 (ISO 8601) */
  last_edited_time: string;
  /** 생성 시간 (ISO 8601) */
  created_time?: string;
  /** 데이터베이스 URL */
  url?: string;
  /** 속성 정의 맵 */
  properties: Record<string, NotionDatabaseProperty>;
  /** 아이콘 (이모지 또는 URL) */
  icon?: string | null;
  /** 커버 이미지 URL */
  cover?: string | null;
  /** 아카이브 여부 */
  archived?: boolean;
}

/**
 * Notion API 에러 정보
 */
export interface NotionApiError {
  /** 에러 객체 타입 */
  object: 'error';
  /** HTTP 상태 코드 */
  status: number;
  /** 에러 코드 */
  code: string;
  /** 에러 메시지 */
  message: string;
}

/**
 * 타입 가드: NotionApiError인지 확인
 *
 * @param value - 확인할 값
 * @returns NotionApiError인 경우 true
 */
export function isNotionApiError(value: unknown): value is NotionApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'object' in value &&
    (value as NotionApiError).object === 'error'
  );
}
