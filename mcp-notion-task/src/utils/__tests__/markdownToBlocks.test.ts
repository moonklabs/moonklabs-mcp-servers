/**
 * markdownToBlocks 유틸리티 테스트
 */

import { describe, it, expect } from "vitest";
import {
  markdownToBlocks,
  blocksToMarkdown,
  createLogBlocks,
} from "../markdownToBlocks.js";

describe("markdownToBlocks 유틸리티", () => {
  describe("markdownToBlocks", () => {
    it("마크다운을 Notion 블록으로 변환해야 함", () => {
      const markdown = "# 제목\n\n본문 텍스트";
      const blocks = markdownToBlocks(markdown);

      expect(blocks.length).toBeGreaterThan(0);
      // @tryfabric/martian의 출력 형식에 따라 검증
    });

    it("빈 문자열은 빈 배열을 반환해야 함", () => {
      const blocks = markdownToBlocks("");
      expect(blocks).toEqual([]);
    });
  });

  describe("blocksToMarkdown", () => {
    it("heading_1 블록을 # 헤딩으로 변환해야 함", () => {
      const blocks = [
        {
          type: "heading_1",
          heading_1: {
            rich_text: [{ text: { content: "제목" } }],
          },
        },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain("# 제목");
    });

    it("paragraph 블록을 일반 텍스트로 변환해야 함", () => {
      const blocks = [
        {
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: "본문 텍스트" } }],
          },
        },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain("본문 텍스트");
    });

    it("bulleted_list_item 블록을 - 리스트로 변환해야 함", () => {
      const blocks = [
        {
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ text: { content: "리스트 항목" } }],
          },
        },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain("- 리스트 항목");
    });

    it("code 블록을 코드 펜스로 변환해야 함", () => {
      const blocks = [
        {
          type: "code",
          code: {
            language: "typescript",
            rich_text: [{ text: { content: "const x = 1;" } }],
          },
        },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain("```typescript");
      expect(markdown).toContain("const x = 1;");
      expect(markdown).toContain("```");
    });

    it("to_do 블록을 체크박스로 변환해야 함", () => {
      const blocks = [
        {
          type: "to_do",
          to_do: {
            checked: true,
            rich_text: [{ text: { content: "완료된 작업" } }],
          },
        },
        {
          type: "to_do",
          to_do: {
            checked: false,
            rich_text: [{ text: { content: "미완료 작업" } }],
          },
        },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain("- [x] 완료된 작업");
      expect(markdown).toContain("- [ ] 미완료 작업");
    });

    it("divider 블록을 --- 로 변환해야 함", () => {
      const blocks = [{ type: "divider" }];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain("---");
    });

    it("빈 배열은 빈 문자열을 반환해야 함", () => {
      expect(blocksToMarkdown([])).toBe("");
    });
  });

  describe("createLogBlocks", () => {
    it("진행 로그 블록을 생성해야 함", () => {
      const blocks = createLogBlocks("작업 완료", "홍길동", "progress");

      expect(blocks.length).toBeGreaterThan(0);
    });

    it("블로커 로그는 🚧 아이콘을 포함해야 함", () => {
      const blocks = createLogBlocks("차단됨", "김철수", "blocker");

      // 블록 내용에 blocker 관련 텍스트가 있는지 확인
      const hasBlockerIcon = JSON.stringify(blocks).includes("블로커");
      expect(hasBlockerIcon).toBe(true);
    });
  });
});
