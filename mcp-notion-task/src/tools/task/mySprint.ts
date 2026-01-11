/**
 * 내 스프린트 작업 조회 도구
 * notion-task-my-sprint
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMySprintTasks } from "./mySprintLogic.js";
import { formatSprintTaskList, formatError } from "../../utils/responseFormatter.js";
import type { TaskStatus } from "../../notion/types.js";
import { getUserFromSession } from "../index.js";

/**
 * 내 스프린트 작업 조회 도구를 등록합니다.
 */
export function registerMySprintTool(server: McpServer): void {
  server.registerTool(
    "notion-task-my-sprint",
    {
      description:
        "작업 시작 전 오늘 할 일 확인. 인증된 세션에서는 email 생략 가능.",
      inputSchema: z.object({
        email: z
          .string()
          .email()
          .optional()
          .describe("담당자 이메일 (인증된 세션에서는 자동 주입)"),
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
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(50)
          .describe("최대 작업 수 (기본값: 50, 최대: 100)"),
      }),
    },
    async ({ email, sprintNumber, status, includeSubAssignee, pageSize }, extra) => {
      // 세션에서 사용자 정보 가져오기
      const sessionUser = getUserFromSession(extra?.sessionId);

      // email 우선순위: 파라미터 > 세션 > 에러
      const resolvedEmail = email || sessionUser?.email;

      if (!resolvedEmail) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                "email이 필요합니다. 인증하거나 email 파라미터를 전달해주세요."
              ),
            },
          ],
          isError: true,
        };
      }
      try {
        const { tasks, sprintId } = await getMySprintTasks(
          resolvedEmail,
          sprintNumber,
          status as TaskStatus | undefined,
          includeSubAssignee,
          pageSize
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

        const header = `## 스프린트 ${sprintNumber} - ${resolvedEmail}님의 작업\n\n`;
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
