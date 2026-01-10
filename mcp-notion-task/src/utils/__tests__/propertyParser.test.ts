/**
 * propertyParser 유틸리티 테스트
 */

import { describe, it, expect } from "vitest";
import {
  parseTitle,
  parseRichText,
  parseSelect,
  parseMultiSelect,
  parseDate,
  parseNumber,
  parsePeople,
  parseTaskFromPage,
} from "../propertyParser.js";

describe("propertyParser 유틸리티", () => {
  describe("parseTitle", () => {
    it("title 속성에서 텍스트를 추출해야 함", () => {
      const property = {
        title: [{ text: { content: "테스트 작업" } }],
      };
      expect(parseTitle(property)).toBe("테스트 작업");
    });

    it("빈 title은 빈 문자열을 반환해야 함", () => {
      expect(parseTitle({})).toBe("");
      expect(parseTitle(null)).toBe("");
      expect(parseTitle({ title: [] })).toBe("");
    });
  });

  describe("parseRichText", () => {
    it("rich_text 속성에서 텍스트를 추출해야 함", () => {
      const property = {
        rich_text: [{ text: { content: "메모 내용" } }],
      };
      expect(parseRichText(property)).toBe("메모 내용");
    });

    it("빈 rich_text는 빈 문자열을 반환해야 함", () => {
      expect(parseRichText({})).toBe("");
    });
  });

  describe("parseSelect", () => {
    it("select 속성에서 이름을 추출해야 함", () => {
      const property = {
        select: { name: "진행 중" },
      };
      expect(parseSelect(property)).toBe("진행 중");
    });

    it("빈 select는 undefined를 반환해야 함", () => {
      expect(parseSelect({})).toBeUndefined();
    });
  });

  describe("parseMultiSelect", () => {
    it("multi_select 속성에서 이름 배열을 추출해야 함", () => {
      const property = {
        multi_select: [{ name: "태그1" }, { name: "태그2" }],
      };
      expect(parseMultiSelect(property)).toEqual(["태그1", "태그2"]);
    });

    it("빈 multi_select는 빈 배열을 반환해야 함", () => {
      expect(parseMultiSelect({})).toEqual([]);
    });
  });

  describe("parseDate", () => {
    it("date 속성에서 시작 날짜를 추출해야 함", () => {
      const property = {
        date: { start: "2025-01-15" },
      };
      expect(parseDate(property)).toBe("2025-01-15");
    });

    it("빈 date는 undefined를 반환해야 함", () => {
      expect(parseDate({})).toBeUndefined();
    });
  });

  describe("parseNumber", () => {
    it("number 속성에서 값을 추출해야 함", () => {
      const property = { number: 5 };
      expect(parseNumber(property)).toBe(5);
    });

    it("0도 올바르게 반환해야 함", () => {
      const property = { number: 0 };
      expect(parseNumber(property)).toBe(0);
    });

    it("빈 number는 undefined를 반환해야 함", () => {
      expect(parseNumber({})).toBeUndefined();
    });
  });

  describe("parsePeople", () => {
    it("people 속성에서 이메일 목록을 추출해야 함", () => {
      const property = {
        people: [
          { person: { email: "user1@test.com" } },
          { person: { email: "user2@test.com" } },
        ],
      };
      expect(parsePeople(property)).toEqual(["user1@test.com", "user2@test.com"]);
    });

    it("빈 people은 빈 배열을 반환해야 함", () => {
      expect(parsePeople({})).toEqual([]);
    });
  });

  describe("parseTaskFromPage", () => {
    it("Notion 페이지를 Task 객체로 변환해야 함", () => {
      const page = {
        id: "page-id-123",
        created_time: "2025-01-01T00:00:00.000Z",
        last_edited_time: "2025-01-15T12:00:00.000Z",
        properties: {
          "작업 이름": { title: [{ text: { content: "테스트 작업" } }] },
          "상태": { select: { name: "진행 중" } },
          "담당자": { people: [{ person: { email: "user@test.com" } }] },
          "담당자(부)": { people: [] },
          "우선순위": { select: { name: "높음" } },
          "마감일": { date: { start: "2025-01-20" } },
          "예정기간": { number: 3 },
          "태그": { multi_select: [{ name: "API" }, { name: "백엔드" }] },
          "메모": { rich_text: [{ text: { content: "메모 내용" } }] },
        },
      };

      const task = parseTaskFromPage(page);

      expect(task.id).toBe("page-id-123");
      expect(task.title).toBe("테스트 작업");
      expect(task.status).toBe("진행 중");
      expect(task.assignees).toEqual(["user@test.com"]);
      expect(task.subAssignees).toEqual([]);
      expect(task.priority).toBe("높음");
      expect(task.dueDate).toBe("2025-01-20");
      expect(task.estimatedDays).toBe(3);
      expect(task.tags).toEqual(["API", "백엔드"]);
      expect(task.memo).toBe("메모 내용");
    });

    it("속성이 없는 페이지도 기본값으로 처리해야 함", () => {
      const page = {
        id: "page-id-empty",
        created_time: "2025-01-01T00:00:00.000Z",
        last_edited_time: "2025-01-01T00:00:00.000Z",
        properties: {},
      };

      const task = parseTaskFromPage(page);

      expect(task.id).toBe("page-id-empty");
      expect(task.title).toBe("");
      expect(task.status).toBe("시작 전");
      expect(task.assignees).toEqual([]);
      expect(task.tags).toEqual([]);
    });
  });
});
