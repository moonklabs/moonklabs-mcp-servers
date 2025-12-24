/**
 * 작업 정보 수정 도구
 * notion-task-update
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { updateTask } from "./updateLogic.js";
import { formatSuccess, formatError } from "../../utils/responseFormatter.js";
import type { UpdateTaskInput } from "../../notion/types.js";

/**
 * 작업 정보 수정 도구를 등록합니다.
 */
export function registerUpdateTool(server: McpServer): void {
  server.registerTool(
    "notion-task-update",
    {
      description:
        "작업 정보를 수정합니다. 제목, 상태, 마감일, 우선순위, 태그 등 여러 속성을 한 번에 업데이트할 수 있습니다.",
      inputSchema: z.object({
        pageId: z.string().describe("작업 페이지 ID"),
        title: z.string().optional().describe("새 제목"),
        status: z
          .enum(["시작 전", "일시중지", "진행 중", "완료", "보관됨", "상담완료"])
          .optional()
          .describe("새 상태"),
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
          .describe("태그 목록 (기존 태그를 대체)"),
        memo: z.string().optional().describe("메모"),
        sprintId: z
          .string()
          .optional()
          .describe("스프린트 페이지 ID"),
        projectId: z
          .string()
          .optional()
          .describe("프로젝트 페이지 ID"),
      }),
    },
    async ({
      pageId,
      title,
      status,
      issueType,
      priority,
      dueDate,
      estimatedDays,
      tags,
      memo,
      sprintId,
      projectId,
    }) => {
      try {
        const updates: UpdateTaskInput = {
          title,
          status: status as UpdateTaskInput["status"],
          issueType: issueType as UpdateTaskInput["issueType"],
          priority: priority as UpdateTaskInput["priority"],
          dueDate,
          estimatedDays,
          tags,
          memo,
          sprintId,
          projectId,
        };

        const task = await updateTask(pageId, updates);

        return {
          content: [
            {
              type: "text",
              text: formatSuccess(`"${task.title}" 작업이 수정되었습니다.`),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: formatError(
                error instanceof Error ? error.message : "작업 수정 실패"
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
