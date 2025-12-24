/**
 * 내 스프린트 작업 조회 로직
 * 담당자와 스프린트 번호로 작업을 조회합니다.
 */

import { getNotionClient, getTaskDatabaseId, getSprintDatabaseId } from "../../notion/client.js";
import { parseTasksFromPages } from "../../utils/propertyParser.js";
import type { Task, TaskStatus } from "../../notion/types.js";

/**
 * 스프린트 번호로 스프린트 페이지 ID를 조회합니다.
 * 스프린트 DB에서 제목이 "스프린트 {number}"인 페이지를 찾습니다.
 */
export async function findSprintIdByNumber(sprintNumber: number): Promise<string | null> {
  const notion = getNotionClient();
  const sprintDatabaseId = getSprintDatabaseId();

  const response = await notion.databases.query({
    database_id: sprintDatabaseId,
    filter: {
      property: "이름",
      title: {
        equals: `스프린트 ${sprintNumber}`,
      },
    },
    page_size: 1,
  });

  if (response.results.length === 0) {
    return null;
  }

  return response.results[0].id;
}

/**
 * 내 스프린트 작업을 조회합니다.
 * @param email 담당자 이메일 (Notion 사용자 ID로 변환 필요)
 * @param sprintNumber 스프린트 번호
 * @param status 상태 필터 (선택)
 * @param includeSubAssignee 담당자(부)도 포함할지
 */
export async function getMySprintTasks(
  email: string,
  sprintNumber: number,
  status?: TaskStatus,
  includeSubAssignee: boolean = true
): Promise<{ tasks: Task[]; sprintId: string | null }> {
  const notion = getNotionClient();
  const taskDatabaseId = getTaskDatabaseId();

  // 스프린트 ID 조회
  const sprintId = await findSprintIdByNumber(sprintNumber);

  if (!sprintId) {
    return { tasks: [], sprintId: null };
  }

  // 필터 조건 빌드
  const conditions: any[] = [
    {
      property: "스프린트",
      relation: { contains: sprintId },
    },
  ];

  // 담당자 조건 (이메일은 Notion에서 people 필터에 직접 사용 가능)
  // 참고: Notion API에서 people 필터는 user_id 또는 email 사용 가능
  if (includeSubAssignee) {
    conditions.push({
      or: [
        { property: "담당자(정)", people: { contains: email } },
        { property: "담당자(부)", people: { contains: email } },
      ],
    });
  } else {
    conditions.push({
      property: "담당자(정)",
      people: { contains: email },
    });
  }

  // 상태 필터
  if (status) {
    conditions.push({
      property: "상태",
      select: { equals: status },
    });
  }

  const response = await notion.databases.query({
    database_id: taskDatabaseId,
    filter: { and: conditions },
    sorts: [
      { property: "우선순위", direction: "descending" },
      { property: "마감일", direction: "ascending" },
    ],
    page_size: 100,
  });

  const tasks = parseTasksFromPages(response.results as any[]);

  return { tasks, sprintId };
}
