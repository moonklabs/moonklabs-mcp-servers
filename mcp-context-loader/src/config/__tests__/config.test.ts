/**
 * mcp-context-loader 설정 모듈 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetEnvConfigCache } from "@moonklabs/mcp-common";

// 테스트 전에 환경변수 캐시 초기화
beforeEach(() => {
  resetEnvConfigCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvConfigCache();
});

describe("config", () => {
  describe("getConfig", () => {
    it("기본 설정값을 반환해야 함", async () => {
      // Given: 기본 환경변수 설정
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("LOG_LEVEL", "info");

      // When: 설정 로드 (동적 import로 캐시 우회)
      const { getConfig } = await import("../index.js");
      const config = getConfig();

      // Then: 기본값 확인
      expect(config.NODE_ENV).toBe("test");
      expect(config.LOG_LEVEL).toBe("info");
      expect(config.PROJECT_ROOT).toBeDefined();
    });

    it("PROJECT_ROOT 환경변수를 반영해야 함", async () => {
      // Given: PROJECT_ROOT 환경변수 설정
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("PROJECT_ROOT", "/custom/project/path");

      // When: 설정 로드
      const { getConfig } = await import("../index.js");
      const config = getConfig();

      // Then: PROJECT_ROOT 확인
      expect(config.PROJECT_ROOT).toBe("/custom/project/path");
    });

    it("PROJECT_ROOT 미설정 시 process.cwd() 사용", async () => {
      // Given: PROJECT_ROOT 없이 설정
      vi.stubEnv("NODE_ENV", "test");
      delete process.env.PROJECT_ROOT;

      // When: 설정 로드
      const { getConfig } = await import("../index.js");
      const config = getConfig();

      // Then: process.cwd() 사용 확인
      expect(config.PROJECT_ROOT).toBe(process.cwd());
    });
  });

  describe("getProjectRoot", () => {
    it("프로젝트 루트 경로를 반환해야 함", async () => {
      // Given: PROJECT_ROOT 설정
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("PROJECT_ROOT", "/my/project");

      // When: getProjectRoot 호출
      const { getProjectRoot } = await import("../index.js");
      const root = getProjectRoot();

      // Then: 경로 확인
      expect(root).toBe("/my/project");
    });
  });
});
