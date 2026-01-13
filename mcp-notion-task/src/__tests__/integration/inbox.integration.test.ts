/**
 * Inbox 도구 통합 테스트
 * 실제 Notion API를 호출하여 전체 워크플로우 검증
 */

import { describe, it, expect, afterAll } from "vitest";
import { TEST_CONFIG, trackCreatedInbox, cleanupTestData, delay } from "./setup.js";

// Logic 함수 import
import { listInbox } from "../../tools/inbox/listLogic.js";
import { getInbox } from "../../tools/inbox/getLogic.js";
import { createInbox } from "../../tools/inbox/createLogic.js";
import { updateInbox } from "../../tools/inbox/updateLogic.js";

// 유틸리티
import { emailToUserId } from "../../utils/emailToUserId.js";

// 테스트 후 정리
afterAll(async () => {
  await cleanupTestData();
});

describe("Inbox 통합 테스트", () => {
  describe("조회 테스트", () => {
    it("listInbox: 전체 목록 조회", async () => {
      const items = await listInbox(
        undefined,
        "last_edited_time",
        "descending",
        5
      );

      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(5);

      // 첫 번째 항목 구조 검증
      const item = items[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("authors");
      expect(item).toHaveProperty("tags");

      console.log(`✓ listInbox: ${items.length}개 항목 조회`);
      await delay(300);
    }, 30000);

    it("listInbox: 작성자 필터링", async () => {
      // userId를 UUID로 변환
      const authorId = await emailToUserId(TEST_CONFIG.testEmail);

      const items = await listInbox(
        { author: authorId },
        "last_edited_time",
        "descending",
        10
      );

      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);

      console.log(`✓ listInbox (author): ${items.length}개 항목 조회 (${TEST_CONFIG.testUserId})`);
      await delay(300);
    }, 60000);

    it("listInbox: 태그 필터링", async () => {
      const items = await listInbox(
        { tag: "테스트" },
        "last_edited_time",
        "descending",
        10
      );

      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);

      // 모든 항목이 "테스트" 태그를 포함하는지 확인
      items.forEach((item) => {
        expect(item.tags).toContain("테스트");
      });

      console.log(`✓ listInbox (tag): ${items.length}개 "테스트" 태그 항목 조회`);
      await delay(300);
    }, 30000);

    it("getInbox: 페이지 ID로 상세 조회", async () => {
      // 먼저 목록에서 하나 가져오기
      const items = await listInbox(undefined, "last_edited_time", "descending", 1);
      expect(items.length).toBeGreaterThan(0);

      const itemId = items[0].id;
      const detail = await getInbox(itemId, 20);

      expect(detail).toBeDefined();
      expect(detail.id).toBe(itemId);
      expect(detail.title).toBeDefined();
      expect(detail.authors).toBeDefined();
      expect(detail.tags).toBeDefined();
      expect(detail.content).toBeDefined();
      expect(typeof detail.content).toBe("string");

      console.log(`✓ getInbox: "${detail.title}" 상세 조회 (${detail.content.length}자)`);
      await delay(300);
    }, 30000);
  });

  describe("생성/수정 테스트", () => {
    let testInboxId: string;

    it("createInbox: 새 Inbox 생성", async () => {
      const item = await createInbox({
        title: `[통합테스트] ${new Date().toISOString()}`,
        userIds: [TEST_CONFIG.testUserId],
        tags: ["통합테스트", "자동생성"],
        content: "# 통합 테스트\n\n이 Inbox는 자동으로 생성된 테스트 항목입니다.\n\n- 항목 1\n- 항목 2",
      });

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.title).toContain("[통합테스트]");
      expect(item.tags).toContain("통합테스트");
      expect(item.tags).toContain("자동생성");

      testInboxId = item.id;
      trackCreatedInbox(testInboxId);

      console.log(`✓ createInbox: "${item.title}" 생성 (${testInboxId})`);
      await delay(500);
    }, 30000);

    it("updateInbox: 제목 및 태그 수정", async () => {
      expect(testInboxId).toBeDefined();

      const updatedItem = await updateInbox(testInboxId, {
        title: `[통합테스트-수정됨] ${new Date().toISOString()}`,
        tags: ["통합테스트", "수정됨", "완료"],
      });

      expect(updatedItem).toBeDefined();
      expect(updatedItem.title).toContain("[통합테스트-수정됨]");
      expect(updatedItem.tags).toContain("수정됨");
      expect(updatedItem.tags).toContain("완료");

      console.log(`✓ updateInbox: 제목 및 태그 수정 완료`);
      await delay(500);
    }, 30000);

    it("updateInbox: 작성자 수정", async () => {
      expect(testInboxId).toBeDefined();

      // 한 명의 작성자로만 업데이트 (workspace에 존재하는 사용자만)
      const updatedItem = await updateInbox(testInboxId, {
        authors: [TEST_CONFIG.testEmail],
      });

      expect(updatedItem).toBeDefined();
      expect(updatedItem.authors).toHaveLength(1);
      expect(updatedItem.authors[0]).toBe(TEST_CONFIG.testEmail);

      console.log(`✓ updateInbox: 작성자 수정 완료`);
      await delay(300);
    }, 60000);
  });
});
