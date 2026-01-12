import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { userIdToEmail } from "../userIdToEmail.js";

describe("userIdToEmail", () => {
  beforeEach(() => {
    // EMAIL_DOMAIN 환경변수 설정
    vi.stubEnv("EMAIL_DOMAIN", "moonklabs.com");
  });

  afterEach(() => {
    // 모든 환경변수 stub 해제
    vi.unstubAllEnvs();
  });

  it("userId와 EMAIL_DOMAIN을 결합하여 이메일 반환", () => {
    expect(userIdToEmail("hong")).toBe("hong@moonklabs.com");
    expect(userIdToEmail("kim")).toBe("kim@moonklabs.com");
    expect(userIdToEmail("park")).toBe("park@moonklabs.com");
  });

  it("EMAIL_DOMAIN 미설정 시 에러 throw", () => {
    vi.stubEnv("EMAIL_DOMAIN", "");
    expect(() => userIdToEmail("hong")).toThrow("EMAIL_DOMAIN");
  });

  it("다른 도메인도 정상 동작", () => {
    vi.stubEnv("EMAIL_DOMAIN", "example.com");
    expect(userIdToEmail("test")).toBe("test@example.com");
  });
});
