/**
 * config 모듈 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getConfig,
  validateNotionApiKey,
  isValidNotionApiKeyFormat,
} from "../index.js";

describe("config", () => {
  // 원본 환경변수 백업
  const originalEnv = process.env;

  beforeEach(() => {
    // 테스트 격리를 위해 환경변수 초기화
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // 원본 환경변수 복원
    process.env = originalEnv;
  });

  describe("validateNotionApiKey", () => {
    it("should throw error when NOTION_API_KEY is not set", () => {
      delete process.env.NOTION_API_KEY;

      expect(() => validateNotionApiKey()).toThrow("NOTION_API_KEY");
    });

    it("should throw error when NOTION_API_KEY is empty", () => {
      process.env.NOTION_API_KEY = "";

      expect(() => validateNotionApiKey()).toThrow("NOTION_API_KEY");
    });

    it("should throw error when NOTION_API_KEY is whitespace only", () => {
      process.env.NOTION_API_KEY = "   ";

      expect(() => validateNotionApiKey()).toThrow("NOTION_API_KEY");
    });

    it("should not throw when NOTION_API_KEY is set", () => {
      process.env.NOTION_API_KEY = "secret_test_key";

      expect(() => validateNotionApiKey()).not.toThrow();
    });
  });

  describe("getConfig", () => {
    it("should return config with NOTION_API_KEY", () => {
      process.env.NOTION_API_KEY = "secret_test_key";

      const config = getConfig();

      expect(config.NOTION_API_KEY).toBe("secret_test_key");
    });

    it("should parse NOTION_PAGE_IDS from comma-separated string", () => {
      process.env.NOTION_API_KEY = "secret_test_key";
      process.env.NOTION_PAGE_IDS = "page1,page2,page3";

      const config = getConfig();

      expect(config.NOTION_PAGE_IDS).toEqual(["page1", "page2", "page3"]);
    });

    it("should trim whitespace from NOTION_PAGE_IDS", () => {
      process.env.NOTION_API_KEY = "secret_test_key";
      process.env.NOTION_PAGE_IDS = " page1 , page2 , page3 ";

      const config = getConfig();

      expect(config.NOTION_PAGE_IDS).toEqual(["page1", "page2", "page3"]);
    });

    it("should return undefined for NOTION_PAGE_IDS when not set", () => {
      process.env.NOTION_API_KEY = "secret_test_key";
      delete process.env.NOTION_PAGE_IDS;

      const config = getConfig();

      expect(config.NOTION_PAGE_IDS).toBeUndefined();
    });

    it("should filter empty strings from NOTION_PAGE_IDS", () => {
      process.env.NOTION_API_KEY = "secret_test_key";
      process.env.NOTION_PAGE_IDS = "page1,,page2,";

      const config = getConfig();

      expect(config.NOTION_PAGE_IDS).toEqual(["page1", "page2"]);
    });

    it("should throw when NOTION_API_KEY is missing", () => {
      delete process.env.NOTION_API_KEY;

      expect(() => getConfig()).toThrow("NOTION_API_KEY");
    });
  });

  describe("isValidNotionApiKeyFormat", () => {
    it("should return true for valid Notion API key format", () => {
      expect(isValidNotionApiKeyFormat("secret_abc123xyz")).toBe(true);
    });

    it("should return false for key without secret_ prefix", () => {
      expect(isValidNotionApiKeyFormat("abc123xyz")).toBe(false);
    });

    it("should return false for key that is too short", () => {
      expect(isValidNotionApiKeyFormat("secret_ab")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidNotionApiKeyFormat("")).toBe(false);
    });
  });
});
