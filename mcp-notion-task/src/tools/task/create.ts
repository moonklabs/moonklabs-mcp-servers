/**
 * 작업 생성 도구
 * notion-task-create
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createTask } from "./createLogic.js";
import { formatSuccess, formatError } from "../../utils/responseFormatter.js";
import { userIdToEmail } from "../../utils/userIdToEmail.js";
import type { CreateTaskInput } from "../../notion/types.js";

/**
 * 작업 생성 도구를 등록합니다.
 */
export function registerCreateTool(server: McpServer): void {
  server.registerTool(
    "notion-task-create",
    {
      description:
        "새 작업 추가 시. 기본 템플릿으로 본문을 초기화하고, 필요한 속성을 설정합니다.",
      inputSchema: z.object({
        title: z.string().describe("작업 제목"),
        status: z
          .enum(["시작 전", "일시중지", "진행 중", "완료", "보관됨", "상담완료"])
          .default("시작 전")
          .describe("초기 상태 (기본: 시작 전)"),
        userId: z
          .string()
          .optional()
          .describe("담당자 사용자 ID (이메일 앞부분, 예: hong). 미지정 시 담당자 없음"),
        issueType: z
          .enum(["버그", "개선", "고객요청", "작업", "미팅", "CS"])
          .optional()
          .describe("이슈 타입"),
        priority: z
          .enum(["낮음", "중간", "높음"])
          .optional()
          .describe("우선순위"),
        dueDate: z
          .string()
          .optional()
          .describe("마감일 (YYYY-MM-DD 형식)"),
        estimatedDays: z
          .number()
          .optional()
          .describe("예정기간 (일)"),
        tags: z
          .array(z.string())
          .optional()
          .describe("태그 목록"),
        memo: z.string().optional().describe("메모"),
        sprintId: z
          .string()
          .optional()
          .describe("스프린트 페이지 ID"),
        content: z
          .string()
          .optional()
          .describe("초기 본문 (Markdown, 선택 - 비우면 기본 템플릿 사용)"),
      }),
    },
    async ({
      title,
      status,
      userId,
      issueType,
      priority,
      dueDate,
      estimatedDays,
      tags,
      memo,
      sprintId,
      content,
    }) => {
      try {
        // userId를 이메일로 변환
        const resolvedAssignee = userId ? userIdToEmail(userId) : undefined;

        const input: CreateTaskInput = {
          title,
          status: status as CreateTaskInput["status"],
          assignees: resolvedAssignee ? [resolvedAssignee] : undefined,
          issueType: issueType as CreateTaskInput["issueType"],
          priority: priority as CreateTaskInput["priority"],
          dueDate,
          estimatedDays,
          tags,
          memo,
          sprintId,
          content,
        };

        const task = await createTask(input);

        return {
          content: [
            {
              type: "text",
              text: formatSuccess(
                `"${task.title}" 작업이 생성되었습니다.\n\n` +
                  `- ID: \`${task.id}\`\n` +
                  `- 상태: ${task.status}`
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "작업 생성 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
