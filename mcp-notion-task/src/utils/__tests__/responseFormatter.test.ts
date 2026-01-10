/**
 * responseFormatter 유틸리티 테스트
 */

import { describe, it, expect } from "vitest";
import {
  formatTaskDetail,
  formatTaskList,
  formatSprintTaskList,
  formatSuccess,
  formatError,
} from "../responseFormatter.js";
import type { Task } from "../../notion/types.js";

describe("responseFormatter 유틸리티", () => {
  const sampleTask: Task = {
    id: "page-id-123",
    title: "테스트 작업",
    status: "진행 중",
    assignees: ["user@test.com"],
    subAssignees: [],
    issueType: "버그",
    priority: "높음",
    dueDate: "2025-01-20",
    estimatedDays: 3,
    tags: ["API", "백엔드"],
    memo: "중요한 메모",
    createdTime: "2025-01-01T00:00:00.000Z",
    lastEditedTime: "2025-01-15T12:00:00.000Z",
  };

  describe("formatTaskDetail", () => {
    it("작업 상세 정보를 마크다운으로 포맷팅해야 함", () => {
      const result = formatTaskDetail(sampleTask);

      expect(result).toContain("## 테스트 작업");
      expect(result).toContain("| 페이지ID | `page-id-123` |");
      expect(result).toContain("| 상태 | 진행 중 |");
      expect(result).toContain("| 담당자(정) | user@test.com |");
      expect(result).toContain("| 우선순위 | 높음 |");
      expect(result).toContain("| 마감일 | 2025-01-20 |");
      expect(result).toContain("| 태그 | API, 백엔드 |");
    });

    it("선택 속성이 없는 경우 해당 행을 생략해야 함", () => {
      const minimalTask: Task = {
        id: "minimal-id",
        title: "최소 작업",
        status: "시작 전",
        assignees: [],
        subAssignees: [],
        tags: [],
        createdTime: "2025-01-01T00:00:00.000Z",
        lastEditedTime: "2025-01-01T00:00:00.000Z",
      };

      const result = formatTaskDetail(minimalTask);

      expect(result).toContain("## 최소 작업");
      expect(result).toContain("| 담당자(정) | 미지정 |");
      expect(result).not.toContain("| 우선순위 |");
      expect(result).not.toContain("| 마감일 |");
    });
  });

  describe("formatTaskList", () => {
    it("작업 목록을 테이블로 포맷팅해야 함", () => {
      const tasks: Task[] = [sampleTask];
      const result = formatTaskList(tasks);

      expect(result).toContain("총 1개의 작업");
      expect(result).toContain("| 상태 | 제목 |");
      expect(result).toContain("| 진행 중 |");
    });

    it("빈 목록은 안내 메시지를 반환해야 함", () => {
      const result = formatTaskList([]);
      expect(result).toBe("조회된 작업이 없습니다.");
    });
  });

  describe("formatSprintTaskList", () => {
    it("상태별로 그룹화된 목록을 포맷팅해야 함", () => {
      const tasks: Task[] = [
        { ...sampleTask, status: "진행 중" },
        { ...sampleTask, id: "id-2", title: "작업 2", status: "시작 전" },
      ];

      const result = formatSprintTaskList(tasks);

      expect(result).toContain("### 진행 중 (1개)");
      expect(result).toContain("### 시작 전 (1개)");
      expect(result).toContain("[높음] 테스트 작업"); // taskId가 없으면 앞에 빈 문자열
    });
  });

  describe("formatSuccess", () => {
    it("성공 메시지에 체크 이모지를 추가해야 함", () => {
      expect(formatSuccess("완료!")).toBe("✅ 완료!");
    });
  });

  describe("formatError", () => {
    it("에러 메시지에 X 이모지를 추가해야 함", () => {
      expect(formatError("실패")).toBe("❌ 오류: 실패");
    });
  });
});
