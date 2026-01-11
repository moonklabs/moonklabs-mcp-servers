/**
 * 내 스프린트 작업 조회 로직
 * 담당자와 스프린트 번호로 작업을 조회합니다.
 */

import { getNotionClient, getTaskDatabaseId, getSprintDatabaseId } from "../../notion/client.js";
import { parseTasksFromPages } from "../../utils/propertyParser.js";
import { emailToUserId } from "../../utils/emailToUserId.js";
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
      property: "스프린트 이름",
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
 * @param email 담당자 이메일 (Notion 사용자 UUID로 변환됨)
 * @param sprintNumber 스프린트 번호
 * @param status 상태 필터 (선택)
 * @param includeSubAssignee 담당자(부)도 포함할지
 * @param pageSize 최대 작업 수 (기본값: 50, 최대: 100)
 */
export async function getMySprintTasks(
  email: string,
  sprintNumber: number,
  status?: TaskStatus,
  includeSubAssignee: boolean = true,
  pageSize: number = 50
): Promise<{ tasks: Task[]; sprintId: string | null }> {
  const notion = getNotionClient();
  const taskDatabaseId = getTaskDatabaseId();

  // 스프린트 ID 조회
  const sprintId = await findSprintIdByNumber(sprintNumber);

  if (!sprintId) {
    return { tasks: [], sprintId: null };
  }

  // 이메일 → UUID 변환
  const userId = await emailToUserId(email);

  // 필터 조건 빌드
  const conditions: any[] = [
    {
      property: "스프린트",
      relation: { contains: sprintId },
    },
  ];

  // 담당자 조건 (Notion API people 필터는 UUID만 허용)
  if (includeSubAssignee) {
    conditions.push({
      or: [
        { property: "담당자", people: { contains: userId } },
        { property: "담당자(부)", people: { contains: userId } },
      ],
    });
  } else {
    conditions.push({
      property: "담당자",
      people: { contains: userId },
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
    page_size: Math.min(pageSize, 100), // 최대 100개 제한
  });

  const tasks = parseTasksFromPages(response.results as any[]);

  return { tasks, sprintId };
}
