/**
 * 작업 목록 조회 도구
 * notion-task-list
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listTasks } from "./listLogic.js";
import { formatTaskList, formatError } from "../../utils/responseFormatter.js";
import type { TaskStatus, Priority, IssueType, TaskSortBy } from "../../notion/types.js";

/**
 * 작업 목록 조회 도구를 등록합니다.
 */
export function registerListTool(server: McpServer): void {
  server.registerTool(
    "notion-task-list",
    {
      description:
        "여러 조건으로 작업 검색 시. 상태, 담당자, 스프린트 등 다양한 필터와 정렬을 지원합니다.",
      inputSchema: z.object({
        status: z
          .enum(["시작 전", "일시중지", "진행 중", "완료", "보관됨", "상담완료"])
          .optional()
          .describe("상태 필터"),
        assignee: z
          .string()
          .optional()
          .describe("담당자 이메일 (Notion 사용자 ID)"),
        includeSubAssignee: z
          .boolean()
          .default(true)
          .describe("담당자(부)도 포함하여 검색할지 (기본: true)"),
        sprintId: z
          .string()
          .optional()
          .describe("스프린트 페이지 ID"),
        projectId: z
          .string()
          .optional()
          .describe("프로젝트 페이지 ID"),
        priority: z
          .enum(["낮음", "중간", "높음"])
          .optional()
          .describe("우선순위 필터"),
        issueType: z
          .enum(["버그", "개선", "고객요청", "작업", "미팅", "CS"])
          .optional()
          .describe("이슈 타입 필터"),
        sortBy: z
          .enum(["created_time", "last_edited_time", "due_date", "priority"])
          .default("created_time")
          .describe("정렬 기준 (기본: 생성 시간)"),
        sortDirection: z
          .enum(["ascending", "descending"])
          .default("descending")
          .describe("정렬 방향 (기본: 내림차순)"),
        pageSize: z
          .number()
          .min(1)
          .max(100)
          .default(20)
          .describe("조회할 작업 수 (기본: 20, 최대: 100)"),
      }),
    },
    async ({
      status,
      assignee,
      includeSubAssignee,
      sprintId,
      projectId,
      priority,
      issueType,
      sortBy,
      sortDirection,
      pageSize,
    }) => {
      try {
        const tasks = await listTasks(
          {
            status: status as TaskStatus | undefined,
            assignee,
            includeSubAssignee,
            sprintId,
            projectId,
            priority: priority as Priority | undefined,
            issueType: issueType as IssueType | undefined,
          },
          sortBy as TaskSortBy,
          sortDirection,
          pageSize
        );

        const formatted = formatTaskList(tasks);

        return {
          content: [
            {
              type: "text",
              text: formatted,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "작업 목록 조회 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
