/**
 * load-context 도구 단위 테스트
 *
 * @module tools/__tests__/loadContext.test
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import fs from "fs/promises";
import { glob } from "glob";

// 모킹 설정
vi.mock("fs/promises");
vi.mock("glob");

// 테스트 대상 - 구현 후 import
import {
  SUPPORTED_DOCUMENT_TYPES,
  isSupportedDocumentType,
  loadDocumentContent,
  loadContext,
  type LoadContextResult,
  type LoadContextOptions,
} from "../loadContextLogic.js";

describe("loadContextLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SUPPORTED_DOCUMENT_TYPES", () => {
    it("지원 문서 유형 배열이어야 한다", () => {
      expect(Array.isArray(SUPPORTED_DOCUMENT_TYPES)).toBe(true);
    });

    it("prd, architecture, epic, story, project-context, brainstorming을 포함해야 한다", () => {
      expect(SUPPORTED_DOCUMENT_TYPES).toContain("prd");
      expect(SUPPORTED_DOCUMENT_TYPES).toContain("architecture");
      expect(SUPPORTED_DOCUMENT_TYPES).toContain("epic");
      expect(SUPPORTED_DOCUMENT_TYPES).toContain("story");
      expect(SUPPORTED_DOCUMENT_TYPES).toContain("project-context");
      expect(SUPPORTED_DOCUMENT_TYPES).toContain("brainstorming");
    });

    it("6개의 문서 유형이 있어야 한다", () => {
      expect(SUPPORTED_DOCUMENT_TYPES).toHaveLength(6);
    });
  });

  describe("isSupportedDocumentType", () => {
    it("지원하는 문서 유형에 대해 true를 반환해야 한다", () => {
      expect(isSupportedDocumentType("prd")).toBe(true);
      expect(isSupportedDocumentType("architecture")).toBe(true);
      expect(isSupportedDocumentType("epic")).toBe(true);
      expect(isSupportedDocumentType("story")).toBe(true);
      expect(isSupportedDocumentType("project-context")).toBe(true);
      expect(isSupportedDocumentType("brainstorming")).toBe(true);
    });

    it("지원하지 않는 문서 유형에 대해 false를 반환해야 한다", () => {
      expect(isSupportedDocumentType("unknown")).toBe(false);
      expect(isSupportedDocumentType("readme")).toBe(false);
      expect(isSupportedDocumentType("")).toBe(false);
    });
  });

  describe("loadDocumentContent", () => {
    it("PRD 문서를 로드해야 한다", async () => {
      const mockContent = "# PRD Content\n\nThis is the PRD.";
      vi.mocked(glob).mockResolvedValue(["_bmad-output/prd.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await loadDocumentContent("prd");

      expect(result).toBe(mockContent);
      expect(glob).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalled();
    });

    it("파일이 없으면 빈 문자열을 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([]);

      const result = await loadDocumentContent("prd");

      expect(result).toBe("");
    });

    it("여러 파일이 있으면 모두 합쳐서 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([
        "_bmad-output/prd.md",
        "_bmad-output/prd-v2.md",
      ]);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce("# PRD v1")
        .mockResolvedValueOnce("# PRD v2");

      const result = await loadDocumentContent("prd");

      expect(result).toContain("# PRD v1");
      expect(result).toContain("# PRD v2");
    });

    it("파일 읽기 에러 시 빈 문자열을 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/prd.md"]);
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      const result = await loadDocumentContent("prd");

      expect(result).toBe("");
    });
  });

  describe("loadContext", () => {
    beforeEach(() => {
      // 기본 모킹 설정
      vi.mocked(glob).mockResolvedValue([]);
      vi.mocked(fs.readFile).mockResolvedValue("");
    });

    it("단일 문서 유형을 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/prd.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# PRD Content");

      const result = await loadContext(["prd"]);

      expect(result.documents).toHaveProperty("prd");
      expect(result.documents.prd).toBe("# PRD Content");
      expect(result.token_count).toBeGreaterThan(0);
      expect(result.ignored_types).toHaveLength(0);
    });

    it("여러 문서 유형을 로드해야 한다", async () => {
      vi.mocked(glob)
        .mockResolvedValueOnce(["_bmad-output/prd.md"])
        .mockResolvedValueOnce(["_bmad-output/architecture.md"]);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce("# PRD")
        .mockResolvedValueOnce("# Architecture");

      const result = await loadContext(["prd", "architecture"]);

      expect(result.documents).toHaveProperty("prd");
      expect(result.documents).toHaveProperty("architecture");
      expect(result.token_count).toBeGreaterThan(0);
    });

    it("지원하지 않는 타입은 ignored_types에 포함해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/prd.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# PRD");

      const result = await loadContext(["prd", "unknown-type", "readme"]);

      expect(result.ignored_types).toContain("unknown-type");
      expect(result.ignored_types).toContain("readme");
      expect(result.documents).toHaveProperty("prd");
      expect(result.documents).not.toHaveProperty("unknown-type");
    });

    it("token_count 필드가 총 토큰 수를 포함해야 한다", async () => {
      const longContent = "Hello world ".repeat(100);
      vi.mocked(glob).mockResolvedValue(["_bmad-output/prd.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(longContent);

      const result = await loadContext(["prd"]);

      expect(result.token_count).toBeGreaterThan(100);
    });

    it("빈 document_types 배열은 빈 결과를 반환해야 한다", async () => {
      const result = await loadContext([]);

      expect(Object.keys(result.documents)).toHaveLength(0);
      expect(result.token_count).toBe(0);
      expect(result.ignored_types).toHaveLength(0);
    });

    it("모든 타입이 지원하지 않는 경우 빈 documents를 반환해야 한다", async () => {
      const result = await loadContext(["unknown1", "unknown2"]);

      expect(Object.keys(result.documents)).toHaveLength(0);
      expect(result.ignored_types).toContain("unknown1");
      expect(result.ignored_types).toContain("unknown2");
    });

    it("options에 basePath가 있으면 해당 경로 기준으로 검색해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/custom/path/prd.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# Custom PRD");

      const result = await loadContext(["prd"], { basePath: "/custom/path" });

      expect(result.documents.prd).toBe("# Custom PRD");
    });
  });

  describe("Document Type Patterns", () => {
    it("architecture 문서를 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/architecture.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# Architecture");

      const result = await loadContext(["architecture"]);

      expect(result.documents.architecture).toBe("# Architecture");
    });

    it("epic 문서를 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/epics.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# Epics");

      const result = await loadContext(["epic"]);

      expect(result.documents.epic).toBe("# Epics");
    });

    it("story 문서를 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["stories/story-2.3.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# Story 2.3");

      const result = await loadContext(["story"]);

      expect(result.documents.story).toContain("# Story 2.3");
    });

    it("project-context 문서를 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/project-context.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# Project Context");

      const result = await loadContext(["project-context"]);

      expect(result.documents["project-context"]).toBe("# Project Context");
    });

    it("brainstorming 문서를 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["_bmad-output/brainstorming.md"]);
      vi.mocked(fs.readFile).mockResolvedValue("# Brainstorming");

      const result = await loadContext(["brainstorming"]);

      expect(result.documents.brainstorming).toBe("# Brainstorming");
    });
  });
});
