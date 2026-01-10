import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  emailToUserId,
  emailsToUserIds,
  clearCache,
  refreshCache,
} from "../emailToUserId.js";
import * as clientModule from "../../notion/client.js";

// Notion 클라이언트 모킹
const mockUsersList = vi.fn();
const mockNotionClient = {
  users: {
    list: mockUsersList,
  },
};

vi.spyOn(clientModule, "getNotionClient").mockReturnValue(mockNotionClient as any);

describe("emailToUserId 유틸리티", () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearCache();
  });

  describe("emailToUserId", () => {
    it("이메일 주소로 Notion 사용자 UUID를 조회해야 함", async () => {
      const email = "test@example.com";
      const userId = "00000000-0000-0000-0000-000000000001";

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: userId,
            name: "Test User",
            person: { email },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      const result = await emailToUserId(email);

      expect(result).toBe(userId);
      expect(mockUsersList).toHaveBeenCalledOnce();
    });

    it("이메일 주소 대소문자 무시하고 조회해야 함", async () => {
      const email = "Test@Example.COM";
      const userId = "00000000-0000-0000-0000-000000000002";

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: userId,
            name: "Test User",
            person: { email: email.toLowerCase() },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      const result = await emailToUserId(email);

      expect(result).toBe(userId);
    });

    it("사용자를 찾을 수 없으면 에러를 던져야 함", async () => {
      const email = "notfound@example.com";

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: "user-123",
            name: "Other User",
            person: { email: "other@example.com" },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      await expect(emailToUserId(email)).rejects.toThrow(
        /Notion 사용자를 찾을 수 없습니다/
      );
    });

    it("캐시된 사용자를 재조회할 때 API 호출하지 않아야 함", async () => {
      const email = "cached@example.com";
      const userId = "00000000-0000-0000-0000-000000000003";

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: userId,
            name: "Cached User",
            person: { email },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      // 첫 번째 호출
      const result1 = await emailToUserId(email);
      expect(result1).toBe(userId);
      expect(mockUsersList).toHaveBeenCalledTimes(1);

      // 두 번째 호출 (캐시에서)
      const result2 = await emailToUserId(email);
      expect(result2).toBe(userId);
      expect(mockUsersList).toHaveBeenCalledTimes(1); // 여전히 1번만 호출
    });

    it("페이지네이션을 처리해야 함", async () => {
      const email = "page2@example.com";
      const userId = "00000000-0000-0000-0000-000000000004";

      // 첫 페이지에는 다른 사용자
      mockUsersList
        .mockResolvedValueOnce({
          results: [
            {
              type: "person",
              id: "user-1",
              name: "User 1",
              person: { email: "user1@example.com" },
            },
          ],
          has_more: true,
          next_cursor: "cursor-1",
        })
        // 두 번째 페이지에 원하는 사용자
        .mockResolvedValueOnce({
          results: [
            {
              type: "person",
              id: userId,
              name: "Page 2 User",
              person: { email },
            },
          ],
          has_more: false,
          next_cursor: null,
        });

      const result = await emailToUserId(email);

      expect(result).toBe(userId);
      expect(mockUsersList).toHaveBeenCalledTimes(2);
    });

    it("이메일이 없는 사용자는 스킵해야 함", async () => {
      const email = "valid@example.com";
      const userId = "00000000-0000-0000-0000-000000000005";

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: "no-email-user",
            name: "No Email User",
            person: { email: null }, // 이메일 없음
          },
          {
            type: "person",
            id: userId,
            name: "Valid User",
            person: { email },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      const result = await emailToUserId(email);
      expect(result).toBe(userId);
    });
  });

  describe("emailsToUserIds", () => {
    it("여러 이메일을 한 번에 변환해야 함", async () => {
      const emails = ["user1@example.com", "user2@example.com"];

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: "uuid-1",
            name: "User 1",
            person: { email: emails[0] },
          },
          {
            type: "person",
            id: "uuid-2",
            name: "User 2",
            person: { email: emails[1] },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      const result = await emailsToUserIds(emails);

      expect(result.get(emails[0])).toBe("uuid-1");
      expect(result.get(emails[1])).toBe("uuid-2");
      expect(mockUsersList).toHaveBeenCalledOnce();
    });

    it("찾을 수 없는 이메일은 무시하고 계속 진행해야 함", async () => {
      const emails = ["found@example.com", "notfound@example.com"];

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: "uuid-found",
            name: "Found User",
            person: { email: emails[0] },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      const result = await emailsToUserIds(emails);

      expect(result.get(emails[0])).toBe("uuid-found");
      expect(result.has(emails[1])).toBe(false);
    });
  });

  describe("refreshCache", () => {
    it("캐시를 수동으로 갱신해야 함", async () => {
      const email = "refresh@example.com";
      const userId = "00000000-0000-0000-0000-000000000006";

      mockUsersList.mockResolvedValue({
        results: [
          {
            type: "person",
            id: userId,
            name: "Refresh User",
            person: { email },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      await refreshCache();

      expect(mockUsersList).toHaveBeenCalledOnce();
    });
  });

  describe("에러 처리", () => {
    it("Notion API 오류를 처리해야 함", async () => {
      mockUsersList.mockRejectedValue(new Error("API Error"));

      await expect(emailToUserId("test@example.com")).rejects.toThrow(
        /Notion 사용자 목록 조회 실패/
      );
    });
  });
});
