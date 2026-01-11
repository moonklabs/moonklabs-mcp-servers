/**
 * Inbox 목록 조회 로직
 * 필터 조건에 맞는 문서 목록을 조회합니다.
 */

import { getNotionClient, getInboxDatabaseId } from "../../notion/client.js";
import { parseInboxFromPages } from "../../utils/propertyParser.js";
import type { InboxItem, InboxListFilter, InboxSortBy } from "../../notion/types.js";

/**
 * 필터 조건에 맞는 Inbox 아이템 목록을 조회합니다.
 */
export async function listInbox(
  filter?: InboxListFilter,
  sortBy: InboxSortBy = "last_edited_time",
  sortDirection: "ascending" | "descending" = "descending",
  pageSize: number = 20
): Promise<InboxItem[]> {
  const notion = getNotionClient();
  const databaseId = getInboxDatabaseId();

  // 필터 조건 빌드
  const notionFilter = buildFilter(filter);

  // 정렬 조건 빌드
  const sorts = buildSorts(sortBy, sortDirection);

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: notionFilter,
    sorts,
    page_size: Math.min(pageSize, 100), // 최대 100
  });

  return parseInboxFromPages(response.results as any[]);
}

/**
 * InboxListFilter를 Notion API 필터로 변환
 */
function buildFilter(filter?: InboxListFilter): any {
  if (!filter) return undefined;

  const conditions: any[] = [];

  if (filter.author) {
    conditions.push({
      property: "작성자",
      people: { contains: filter.author },
    });
  }

  if (filter.tag) {
    conditions.push({
      property: "태그",
      multi_select: { contains: filter.tag },
    });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];

  return { and: conditions };
}

/**
 * 정렬 조건 빌드
 */
function buildSorts(
  sortBy: InboxSortBy,
  direction: "ascending" | "descending"
): any[] {
  const sortMap: Record<InboxSortBy, any> = {
    created_time: { timestamp: "created_time", direction },
    last_edited_time: { timestamp: "last_edited_time", direction },
  };

  return [sortMap[sortBy]];
}
