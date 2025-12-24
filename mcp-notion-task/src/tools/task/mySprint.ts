/**
 * 내 스프린트 작업 조회 도구
 * notion-task-my-sprint
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMySprintTasks } from "./mySprintLogic.js";
import { formatSprintTaskList, formatError } from "../../utils/responseFormatter.js";
import type { TaskStatus } from "../../notion/types.js";

/**
 * 내 스프린트 작업 조회 도구를 등록합니다.
 */
export function registerMySprintTool(server: McpServer): void {
  server.registerTool(
    "notion-task-my-sprint",
    {
      description:
        "내가 담당한 스프린트 작업 목록을 조회합니다. 이메일과 스프린트 번호로 담당 작업을 확인할 수 있습니다.",
      inputSchema: z.object({
        email: z
          .string()
          .email()
          .describe("담당자 이메일 (예: user@moonklabs.com)"),
        sprintNumber: z
          .number()
          .int()
          .positive()
          .describe("스프린트 번호 (예: 50)"),
        status: z
          .enum(["시작 전", "일시중지", "진행 중", "완료", "보관됨", "상담완료"])
          .optional()
          .describe("상태 필터 (선택)"),
        includeSubAssignee: z
          .boolean()
          .default(true)
          .describe("담당자(부)로 할당된 작업도 포함할지 (기본: true)"),
      }),
    },
    async ({ email, sprintNumber, status, includeSubAssignee }) => {
      try {
        const { tasks, sprintId } = await getMySprintTasks(
          email,
          sprintNumber,
          status as TaskStatus | undefined,
          includeSubAssignee
        );

        if (!sprintId) {
          return {
            content: [
              {
                type: "text",
                text: formatError(
                  `스프린트 ${sprintNumber}을 찾을 수 없습니다. 스프린트 이름이 "스프린트 ${sprintNumber}" 형식인지 확인해주세요.`
                ),
              },
            ],
            isError: true,
          };
        }

        const header = `## 스프린트 ${sprintNumber} - ${email}님의 작업\n\n`;
        const formatted = header + formatSprintTaskList(tasks);

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
                error instanceof Error ? error.message : "스프린트 작업 조회 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
