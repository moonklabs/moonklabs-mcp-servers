/**
 * 내 스프린트 작업 조회 도구
 * notion-task-my-sprint
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMySprintTasks } from "./mySprintLogic.js";
import { formatSprintTaskList, formatError } from "../../utils/responseFormatter.js";
import type { TaskStatus } from "../../notion/types.js";
import { userIdToEmail } from "../../utils/userIdToEmail.js";
import { getUserIdFromHeader } from "../../utils/headerUtils.js";

/**
 * 내 스프린트 작업 조회 도구를 등록합니다.
 */
export function registerMySprintTool(server: McpServer): void {
  server.registerTool(
    "notion-task-my-sprint",
    {
      description:
        "작업 시작 전 오늘 할 일 확인.",
      inputSchema: z.object({
        userId: z
          .string()
          .optional()
          .describe("담당자 사용자 ID (이메일 앞부분, 예: hong). 미지정 시 X-User-Id 헤더에서 읽음"),
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
    async ({ userId, sprintNumber, status, includeSubAssignee, pageSize }, extra) => {
      // userId 파라미터 → X-User-Id 헤더 fallback
      const resolvedUserId = userId || getUserIdFromHeader(extra);

      if (!resolvedUserId) {
        return {
          content: [
            {
              type: "text",
              text: formatError("userId 파라미터 또는 X-User-Id 헤더가 필요합니다."),
            },
          ],
          isError: true,
        };
      }

      // userId를 이메일로 변환
      const email = userIdToEmail(resolvedUserId);
      try {
        const { tasks, sprintId } = await getMySprintTasks(
          email,
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

        const header = `## 스프린트 ${sprintNumber} - ${resolvedUserId}님의 작업\n\n`;
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
