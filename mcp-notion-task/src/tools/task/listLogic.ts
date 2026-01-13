/**
 * 작업 목록 조회 로직
 * 필터 조건에 맞는 작업 목록을 조회합니다.
 */

import { getNotionClient, getTaskDatabaseId } from "../../notion/client.js";
import { parseTasksFromPages } from "../../utils/propertyParser.js";
import type { Task, TaskListFilter, TaskSortBy } from "../../notion/types.js";

/**
 * 필터 조건에 맞는 작업 목록을 조회합니다.
 */
export async function listTasks(
  filter?: TaskListFilter,
  sortBy: TaskSortBy = "created_time",
  sortDirection: "ascending" | "descending" = "descending",
  pageSize: number = 20
): Promise<Task[]> {
  const notion = getNotionClient();
  const databaseId = getTaskDatabaseId();

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

  return parseTasksFromPages(response.results as any[]);
}

/**
 * TaskListFilter를 Notion API 필터로 변환
 */
function buildFilter(filter?: TaskListFilter): any {
  if (!filter) return undefined;

  const conditions: any[] = [];

  if (filter.status) {
    conditions.push({
      property: "상태",
      status: { equals: filter.status },
    });
  }

  if (filter.assignee) {
    // 담당자 또는 담당자(부) 검색
    if (filter.includeSubAssignee) {
      conditions.push({
        or: [
          {
            property: "담당자",
            people: { contains: filter.assignee },
          },
          {
            property: "담당자(부)",
            people: { contains: filter.assignee },
          },
        ],
      });
    } else {
      conditions.push({
        property: "담당자",
        people: { contains: filter.assignee },
      });
    }
  }

  if (filter.sprintId) {
    conditions.push({
      property: "스프린트",
      relation: { contains: filter.sprintId },
    });
  }

  if (filter.projectId) {
    conditions.push({
      property: "프로젝트",
      relation: { contains: filter.projectId },
    });
  }

  if (filter.priority) {
    conditions.push({
      property: "우선순위",
      select: { equals: filter.priority },
    });
  }

  if (filter.issueType) {
    conditions.push({
      property: "이슈구분",
      select: { equals: filter.issueType },
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
  sortBy: TaskSortBy,
  direction: "ascending" | "descending"
): any[] {
  const sortMap: Record<TaskSortBy, any> = {
    created_time: { timestamp: "created_time", direction },
    last_edited_time: { timestamp: "last_edited_time", direction },
    due_date: { property: "마감일", direction },
    priority: { property: "우선순위", direction },
  };

  return [sortMap[sortBy]];
}
