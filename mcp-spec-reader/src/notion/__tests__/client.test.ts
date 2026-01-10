/**
 * Notion 클라이언트 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import {
  getNotionClient,
  resetNotionClient,
  testNotionConnection,
} from "../client.js";

describe("notion/client", () => {
  // 원본 환경변수 백업
  const originalEnv = process.env;

  beforeEach(() => {
    // 테스트 격리
    nock.cleanAll();
    resetNotionClient();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // 정리
    nock.cleanAll();
    resetNotionClient();
    process.env = originalEnv;
  });

  describe("getNotionClient", () => {
    it("should create client with valid API key", () => {
      process.env.NOTION_API_KEY = "secret_test_api_key_12345";

      const client = getNotionClient();

      expect(client).toBeDefined();
    });

    it("should return same instance on multiple calls (singleton)", () => {
      process.env.NOTION_API_KEY = "secret_test_api_key_12345";

      const client1 = getNotionClient();
      const client2 = getNotionClient();

      expect(client1).toBe(client2);
    });

    it("should throw error when NOTION_API_KEY is not set", () => {
      delete process.env.NOTION_API_KEY;

      expect(() => getNotionClient()).toThrow("NOTION_API_KEY");
    });

    it("should throw error when NOTION_API_KEY is empty", () => {
      process.env.NOTION_API_KEY = "";

      expect(() => getNotionClient()).toThrow("NOTION_API_KEY");
    });

    it("should throw error when NOTION_API_KEY is whitespace only", () => {
      process.env.NOTION_API_KEY = "   ";

      expect(() => getNotionClient()).toThrow("NOTION_API_KEY");
    });
  });

  describe("resetNotionClient", () => {
    it("should reset client instance", () => {
      process.env.NOTION_API_KEY = "secret_test_api_key_12345";

      const client1 = getNotionClient();
      resetNotionClient();
      const client2 = getNotionClient();

      // 새 인스턴스가 생성되어야 함 (참조가 다름)
      expect(client1).not.toBe(client2);
    });
  });

  describe("testNotionConnection", () => {
    it("should return user info on successful connection", async () => {
      process.env.NOTION_API_KEY = "secret_test_api_key_12345";

      // Notion API 응답 모킹
      nock("https://api.notion.com")
        .get("/v1/users/me")
        .reply(200, {
          object: "user",
          id: "user-123",
          type: "bot",
          name: "Test Bot",
          avatar_url: null,
          bot: {
            owner: { type: "workspace", workspace: true },
            workspace_name: "Test Workspace",
          },
        });

      const result = await testNotionConnection();

      expect(result.id).toBe("user-123");
      expect(result.type).toBe("bot");
      expect(result.name).toBe("Test Bot");
    });

    it("should throw error when API key is invalid", async () => {
      process.env.NOTION_API_KEY = "secret_invalid_key";

      // 401 Unauthorized 응답 모킹
      nock("https://api.notion.com").get("/v1/users/me").reply(401, {
        object: "error",
        status: 401,
        code: "unauthorized",
        message: "API token is invalid.",
      });

      await expect(testNotionConnection()).rejects.toThrow();
    });

    it("should throw error when NOTION_API_KEY is not set", async () => {
      delete process.env.NOTION_API_KEY;

      await expect(testNotionConnection()).rejects.toThrow("NOTION_API_KEY");
    });
  });
});
