/**
 * count-tokens 도구 단위 테스트
 *
 * @module tools/__tests__/countTokens.test
 */

import { describe, it, expect } from "vitest";
import {
  countTokens,
  SUPPORTED_MODELS,
  getEncodingForModel,
  isSupportedModel,
} from "../countTokensLogic.js";
import { createMcpError, toMcpToolResult } from "@moonklabs/mcp-common";

describe("countTokensLogic", () => {
  describe("countTokens", () => {
    it("텍스트의 토큰 수를 반환해야 한다", () => {
      const result = countTokens("Hello, world!");
      expect(result.token_count).toBeGreaterThan(0);
      expect(result.model).toBe("gpt-4");
    });

    it("빈 텍스트는 0을 반환해야 한다", () => {
      const result = countTokens("");
      expect(result.token_count).toBe(0);
      expect(result.model).toBe("gpt-4");
    });

    it("지정된 모델을 사용해야 한다", () => {
      const result = countTokens("Hello", "gpt-3.5-turbo");
      expect(result.token_count).toBeGreaterThan(0);
      expect(result.model).toBe("gpt-3.5-turbo");
    });

    it("gpt-4o 모델을 지원해야 한다", () => {
      const result = countTokens("Hello", "gpt-4o");
      expect(result.token_count).toBeGreaterThan(0);
      expect(result.model).toBe("gpt-4o");
    });

    it("claude 모델을 지원해야 한다", () => {
      const result = countTokens("Hello", "claude");
      expect(result.token_count).toBeGreaterThan(0);
      expect(result.model).toBe("claude");
    });

    it("한글 텍스트의 토큰 수를 계산해야 한다", () => {
      const result = countTokens("안녕하세요, 세계!");
      expect(result.token_count).toBeGreaterThan(0);
    });

    it("긴 텍스트의 토큰 수를 정확히 계산해야 한다", () => {
      const longText = "Hello world ".repeat(100);
      const result = countTokens(longText);
      // "Hello world " 반복이므로 토큰 수가 상당히 클 것
      expect(result.token_count).toBeGreaterThan(100);
    });
  });

  describe("getEncodingForModel", () => {
    it("gpt-4는 cl100k_base 인코딩을 사용해야 한다", () => {
      expect(getEncodingForModel("gpt-4")).toBe("cl100k_base");
    });

    it("gpt-3.5-turbo는 cl100k_base 인코딩을 사용해야 한다", () => {
      expect(getEncodingForModel("gpt-3.5-turbo")).toBe("cl100k_base");
    });

    it("gpt-4o는 o200k_base 인코딩을 사용해야 한다", () => {
      expect(getEncodingForModel("gpt-4o")).toBe("o200k_base");
    });

    it("claude는 cl100k_base 인코딩을 사용해야 한다", () => {
      expect(getEncodingForModel("claude")).toBe("cl100k_base");
    });

    it("알 수 없는 모델은 null을 반환해야 한다", () => {
      expect(getEncodingForModel("unknown-model")).toBeNull();
    });
  });

  describe("SUPPORTED_MODELS", () => {
    it("지원 모델 목록이 배열이어야 한다", () => {
      expect(Array.isArray(SUPPORTED_MODELS)).toBe(true);
    });

    it("gpt-4, gpt-3.5-turbo, gpt-4o, claude를 포함해야 한다", () => {
      expect(SUPPORTED_MODELS).toContain("gpt-4");
      expect(SUPPORTED_MODELS).toContain("gpt-3.5-turbo");
      expect(SUPPORTED_MODELS).toContain("gpt-4o");
      expect(SUPPORTED_MODELS).toContain("claude");
    });
  });

  describe("isSupportedModel", () => {
    it("지원하는 모델은 true를 반환해야 한다", () => {
      expect(isSupportedModel("gpt-4")).toBe(true);
      expect(isSupportedModel("gpt-3.5-turbo")).toBe(true);
      expect(isSupportedModel("gpt-4o")).toBe(true);
      expect(isSupportedModel("claude")).toBe(true);
    });

    it("지원하지 않는 모델은 false를 반환해야 한다", () => {
      expect(isSupportedModel("gpt-5")).toBe(false);
      expect(isSupportedModel("unknown")).toBe(false);
      expect(isSupportedModel("")).toBe(false);
    });
  });

  describe("에러 응답 형식", () => {
    it("지원하지 않는 모델에 대한 에러 응답에 suggestion이 포함되어야 한다", () => {
      const unsupportedModel = "gpt-5";
      const error = createMcpError(
        "UNSUPPORTED_MODEL",
        `지원하지 않는 모델입니다: ${unsupportedModel}`,
        "기본 모델 gpt-4를 사용하거나 지원 모델 목록을 확인하세요",
        { available_options: [...SUPPORTED_MODELS] }
      );

      expect(error.status).toBe("error");
      expect(error.error_code).toBe("UNSUPPORTED_MODEL");
      expect(error.message).toContain(unsupportedModel);
      expect(error.suggestion).toBeTruthy();
      expect(error.suggestion).toContain("gpt-4");
      expect(error.available_options).toEqual([...SUPPORTED_MODELS]);
    });

    it("에러 응답을 MCP 도구 결과로 변환할 수 있어야 한다", () => {
      const error = createMcpError(
        "UNSUPPORTED_MODEL",
        "지원하지 않는 모델입니다: gpt-5",
        "기본 모델 gpt-4를 사용하거나 지원 모델 목록을 확인하세요",
        { available_options: [...SUPPORTED_MODELS] }
      );

      const result = toMcpToolResult(error);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const parsed = JSON.parse(result.content[0].text!);
      expect(parsed.error_code).toBe("UNSUPPORTED_MODEL");
      expect(parsed.suggestion).toBeTruthy();
    });

    it("지원하지 않는 모델로 countTokens 호출 시 에러가 발생해야 한다", () => {
      expect(() => countTokens("Hello", "gpt-5")).toThrow("Unsupported model: gpt-5");
    });
  });
});
