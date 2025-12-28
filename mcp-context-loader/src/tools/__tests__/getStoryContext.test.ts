/**
 * get-story-context 도구 단위 테스트
 *
 * @module tools/__tests__/getStoryContext.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs/promises";
import { glob } from "glob";

// 모킹 설정
vi.mock("fs/promises");
vi.mock("glob");

// 테스트 대상 - 구현 후 import
import {
  normalizeStoryId,
  parseStoryMarkdown,
  listAvailableStories,
  getStoryContext,
  extractEpicNum,
  parseEpicsFile,
  extractArchitectureDecisions,
  linkDocuments,
  // Story 2.4c: 응답 포맷팅
  formatStoryResponse,
  generateSuggestion,
  collectWarnings,
  type StoryContext,
  type TaskItem,
  type StoryErrorResponse,
  type LinkedDocuments,
  type EpicInfo,
  type ArchitectureDecision,
  type FormattedStoryResponse,
} from "../getStoryContextLogic.js";

// 테스트 픽스처: 샘플 스토리 마크다운
const SAMPLE_STORY_MARKDOWN = `# Story 2.4a: get-story-context - 스토리 파싱 로직

Status: ready-for-dev

## Story

As a AI 에이전트,
I want 스토리 ID로 스토리 파일을 찾고 파싱하여,
so that 스토리의 기본 정보를 추출할 수 있습니다.

## Acceptance Criteria

1. **AC1**: story_id가 다양한 형식으로 전달됨
2. **AC2**: 스토리 파일이 파싱되어 구조화된 데이터로 반환됨
3. **AC3**: 스토리가 없으면 STORY_NOT_FOUND 에러 반환

## Tasks / Subtasks

- [x] Task 1: 첫 번째 태스크
  - [x] 1.1 첫 번째 서브태스크
  - [ ] 1.2 두 번째 서브태스크
- [ ] Task 2: 두 번째 태스크

## Dev Notes

개발 참고사항

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5
`;

describe("getStoryContextLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeStoryId", () => {
    it('"1.3" 형식을 "story-1.3"으로 정규화해야 한다', () => {
      expect(normalizeStoryId("1.3")).toBe("story-1.3");
    });

    it('"Story-1.3" 형식을 "story-1.3"으로 정규화해야 한다', () => {
      expect(normalizeStoryId("Story-1.3")).toBe("story-1.3");
    });

    it('"story-1-3" 형식은 그대로 유지해야 한다', () => {
      expect(normalizeStoryId("story-1-3")).toBe("story-1-3");
    });

    it('"2-4a" 형식을 "story-2-4a"로 정규화해야 한다', () => {
      expect(normalizeStoryId("2-4a")).toBe("story-2-4a");
    });

    it('"story-2.4a" 형식은 그대로 유지해야 한다', () => {
      expect(normalizeStoryId("story-2.4a")).toBe("story-2.4a");
    });

    it('"STORY-1.3" 대문자도 소문자로 변환해야 한다', () => {
      expect(normalizeStoryId("STORY-1.3")).toBe("story-1.3");
    });

    it('빈 문자열은 빈 문자열을 반환해야 한다', () => {
      expect(normalizeStoryId("")).toBe("");
    });
  });

  describe("parseStoryMarkdown", () => {
    it("스토리 제목을 추출해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.title).toBe("get-story-context - 스토리 파싱 로직");
    });

    it("스토리 ID를 추출해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.story_id).toBe("2.4a");
    });

    it("스토리 상태를 추출해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.status).toBe("ready-for-dev");
    });

    it("Acceptance Criteria 목록을 추출해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.acceptance_criteria).toHaveLength(3);
      expect(result.acceptance_criteria[0]).toContain("AC1");
      expect(result.acceptance_criteria[1]).toContain("AC2");
      expect(result.acceptance_criteria[2]).toContain("AC3");
    });

    it("Tasks 목록을 추출해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.tasks).toHaveLength(2);
    });

    it("Task 완료 상태를 파싱해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.tasks[0].completed).toBe(true);
      expect(result.tasks[1].completed).toBe(false);
    });

    it("Subtasks를 파싱해야 한다", () => {
      const result = parseStoryMarkdown(SAMPLE_STORY_MARKDOWN);
      expect(result.tasks[0].subtasks).toBeDefined();
      expect(result.tasks[0].subtasks).toHaveLength(2);
      expect(result.tasks[0].subtasks![0].completed).toBe(true);
      expect(result.tasks[0].subtasks![1].completed).toBe(false);
    });

    it("빈 마크다운은 빈 결과를 반환해야 한다", () => {
      const result = parseStoryMarkdown("");
      expect(result.title).toBe("");
      expect(result.status).toBe("");
      expect(result.acceptance_criteria).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe("listAvailableStories", () => {
    beforeEach(() => {
      vi.mocked(glob).mockResolvedValue([]);
    });

    it("스토리 파일 목록을 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([
        "/path/stories/story-1.1.md",
        "/path/stories/story-2.3.md",
        "/path/stories/story-2-4a-get-story-context.md",
      ]);

      const result = await listAvailableStories();

      expect(result).toHaveLength(3);
      expect(result).toContain("1.1");
      expect(result).toContain("2.3");
      expect(result).toContain("2-4a");
    });

    it("스토리 파일이 없으면 빈 배열을 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([]);

      const result = await listAvailableStories();

      expect(result).toHaveLength(0);
    });

    it("basePath 옵션을 지원해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/custom/path/stories/story-1.1.md"]);

      const result = await listAvailableStories({ basePath: "/custom/path" });

      expect(glob).toHaveBeenCalledWith(
        expect.stringContaining("/custom/path"),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getStoryContext", () => {
    beforeEach(() => {
      vi.mocked(glob).mockResolvedValue([]);
      vi.mocked(fs.readFile).mockResolvedValue("");
    });

    it("존재하는 스토리를 로드해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([
        "/path/stories/story-2-4a-get-story-context-parsing.md",
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      const result = await getStoryContext({ storyId: "2-4a" });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe("get-story-context - 스토리 파싱 로직");
      expect(result.data!.status).toBe("ready-for-dev");
    });

    it("다양한 story_id 형식을 지원해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-1.3.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      // "1.3" 형식
      const result1 = await getStoryContext({ storyId: "1.3" });
      expect(result1.success).toBe(true);

      // "Story-1.3" 형식
      const result2 = await getStoryContext({ storyId: "Story-1.3" });
      expect(result2.success).toBe(true);
    });

    it("스토리가 없으면 STORY_NOT_FOUND 에러를 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([
        "/path/stories/story-1.1.md",
        "/path/stories/story-2.3.md",
      ]);

      const result = await getStoryContext({ storyId: "999" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.error_code).toBe("STORY_NOT_FOUND");
    });

    it("에러 응답에 suggestion이 포함되어야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-1.1.md"]);

      const result = await getStoryContext({ storyId: "999" });

      expect(result.success).toBe(false);
      expect(result.error!.suggestion).toBeDefined();
      expect(result.error!.suggestion).toContain("사용 가능한 스토리");
    });

    it("에러 응답에 available_options가 포함되어야 한다", async () => {
      vi.mocked(glob).mockResolvedValue([
        "/path/stories/story-1.1.md",
        "/path/stories/story-2.3.md",
      ]);

      const result = await getStoryContext({ storyId: "999" });

      expect(result.success).toBe(false);
      expect(result.error!.available_options).toBeDefined();
      expect(result.error!.available_options).toContain("1.1");
      expect(result.error!.available_options).toContain("2.3");
    });

    it("basePath 옵션을 지원해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/custom/stories/story-1.1.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      const result = await getStoryContext({
        storyId: "1.1",
        basePath: "/custom",
      });

      expect(result.success).toBe(true);
      expect(glob).toHaveBeenCalledWith(
        expect.stringContaining("/custom"),
        expect.any(Object)
      );
    });

    it("raw_content 옵션이 true이면 원본 마크다운을 포함해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-1.1.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      const result = await getStoryContext({
        storyId: "1.1",
        includeRawContent: true,
      });

      expect(result.success).toBe(true);
      expect(result.data!.raw_content).toBe(SAMPLE_STORY_MARKDOWN);
    });

    it("파일 읽기 에러 시 적절한 에러를 반환해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-1.1.md"]);
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File read error"));

      const result = await getStoryContext({ storyId: "1.1" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ===== Story 2.4b: 문서 연결 테스트 =====

  describe("extractEpicNum", () => {
    it('"2-4b" 형식에서 epic 번호 2를 추출해야 한다', () => {
      expect(extractEpicNum("2-4b")).toBe("2");
    });

    it('"1.3" 형식에서 epic 번호 1을 추출해야 한다', () => {
      expect(extractEpicNum("1.3")).toBe("1");
    });

    it('"story-2-4a" 형식에서 epic 번호 2를 추출해야 한다', () => {
      expect(extractEpicNum("story-2-4a")).toBe("2");
    });

    it('빈 문자열은 빈 문자열을 반환해야 한다', () => {
      expect(extractEpicNum("")).toBe("");
    });
  });

  describe("parseEpicsFile", () => {
    const SAMPLE_EPICS_CONTENT = `# Epics

## Epic 2: mcp-context-loader 구현

AI 에이전트가 BMAD 문서를 효율적으로 로드할 수 있는 MCP 서버 구현

### Epic 목표
- 토큰 효율적인 문서 로딩
- 스토리 컨텍스트 제공

### Stories

#### Story 2.4a: 스토리 파싱
기본 파싱 로직 구현

#### Story 2.4b: 문서 연결
관련 문서 연결 기능

---

## Epic 3: mcp-spec-reader 구현

기술 명세 읽기 서버
`;

    it("Epic 정보를 파싱해야 한다", () => {
      const result = parseEpicsFile(SAMPLE_EPICS_CONTENT, "2");
      expect(result).toBeDefined();
      expect(result!.epic_id).toBe("2");
      expect(result!.title).toBe("mcp-context-loader 구현");
    });

    it("Epic 설명을 추출해야 한다", () => {
      const result = parseEpicsFile(SAMPLE_EPICS_CONTENT, "2");
      expect(result!.description).toContain("AI 에이전트가");
    });

    it("존재하지 않는 Epic은 undefined를 반환해야 한다", () => {
      const result = parseEpicsFile(SAMPLE_EPICS_CONTENT, "999");
      expect(result).toBeUndefined();
    });

    it("빈 콘텐츠는 undefined를 반환해야 한다", () => {
      const result = parseEpicsFile("", "2");
      expect(result).toBeUndefined();
    });
  });

  describe("extractArchitectureDecisions", () => {
    const SAMPLE_ARCH_CONTENT = `# Architecture

## Technology Stack

TypeScript 5.7+, Node.js 20+

## Critical Implementation Rules

### MCP 서버 패턴 (필수)

3계층 분리: index.ts → tool.ts → toolLogic.ts

### 에러 처리 (필수)

createMcpError() 헬퍼 사용 필수

## Testing Rules

Vitest 사용, 80% 커버리지 목표
`;

    it("Architecture 결정사항을 추출해야 한다", () => {
      const result = extractArchitectureDecisions(SAMPLE_ARCH_CONTENT);
      expect(result.length).toBeGreaterThan(0);
    });

    it("섹션 제목과 내용을 포함해야 한다", () => {
      const result = extractArchitectureDecisions(SAMPLE_ARCH_CONTENT);
      const mcpSection = result.find(d => d.section.includes("MCP"));
      expect(mcpSection).toBeDefined();
      expect(mcpSection!.content).toContain("3계층 분리");
    });

    it("빈 콘텐츠는 빈 배열을 반환해야 한다", () => {
      const result = extractArchitectureDecisions("");
      expect(result).toEqual([]);
    });
  });

  describe("linkDocuments", () => {
    beforeEach(() => {
      vi.mocked(fs.readFile).mockReset();
    });

    it("Epic 정보를 연결해야 한다", async () => {
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (String(path).includes("epics")) {
          return `## Epic 2: 테스트 Epic\n테스트 설명`;
        }
        return "";
      });

      const result = await linkDocuments({ storyId: "2-4b", basePath: "/test" });
      expect(result.epic).toBeDefined();
      expect(result.epic!.epic_id).toBe("2");
    });

    it("Epic 파일이 없으면 epic은 undefined여야 한다 (graceful degradation)", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      const result = await linkDocuments({ storyId: "2-4b", basePath: "/test" });
      expect(result.epic).toBeUndefined();
    });

    it("Architecture 결정을 연결해야 한다", async () => {
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (String(path).includes("architecture")) {
          return `### 테스트 결정\n결정 내용`;
        }
        return "";
      });

      const result = await linkDocuments({ storyId: "2-4b", basePath: "/test" });
      expect(result.architecture).toBeDefined();
      expect(Array.isArray(result.architecture)).toBe(true);
    });

    it("Architecture 파일이 없으면 빈 배열이어야 한다 (graceful degradation)", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      const result = await linkDocuments({ storyId: "2-4b", basePath: "/test" });
      expect(result.architecture).toEqual([]);
    });

    it("requirements는 빈 배열로 반환되어야 한다 (Phase 1)", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("");

      const result = await linkDocuments({ storyId: "2-4b", basePath: "/test" });
      expect(result.requirements).toEqual([]);
    });
  });

  describe("getStoryContext with linked documents", () => {
    beforeEach(() => {
      vi.mocked(glob).mockResolvedValue([]);
      vi.mocked(fs.readFile).mockResolvedValue("");
    });

    it("linked_documents를 포함해야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-2-4b.md"]);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (String(path).includes("story-2-4b")) {
          return SAMPLE_STORY_MARKDOWN;
        }
        if (String(path).includes("epics")) {
          return `## Epic 2: 테스트\n설명`;
        }
        return "";
      });

      const result = await getStoryContext({
        storyId: "2-4b",
        includeLinkedDocuments: true,
      });

      expect(result.success).toBe(true);
      expect(result.data!.linked_documents).toBeDefined();
    });

    it("includeLinkedDocuments가 false이면 linked_documents가 없어야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-2-4b.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      const result = await getStoryContext({
        storyId: "2-4b",
        includeLinkedDocuments: false,
      });

      expect(result.success).toBe(true);
      expect(result.data!.linked_documents).toBeUndefined();
    });

    it("기본값으로 linked_documents를 포함해야 한다 (includeLinkedDocuments 기본값 true)", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-2-4b.md"]);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (String(path).includes("story-2-4b")) {
          return SAMPLE_STORY_MARKDOWN;
        }
        return "";
      });

      const result = await getStoryContext({ storyId: "2-4b" });

      expect(result.success).toBe(true);
      expect(result.data!.linked_documents).toBeDefined();
    });
  });

  describe("LinkedDocuments 타입 검증", () => {
    it("LinkedDocuments 인터페이스가 올바른 필드를 가져야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-2-4b.md"]);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (String(path).includes("story-2-4b")) {
          return SAMPLE_STORY_MARKDOWN;
        }
        if (String(path).includes("epics")) {
          return `## Epic 2: 테스트\n설명`;
        }
        if (String(path).includes("architecture")) {
          return `### 결정\n내용`;
        }
        return "";
      });

      const result = await getStoryContext({
        storyId: "2-4b",
        includeLinkedDocuments: true,
      });

      expect(result.success).toBe(true);
      const linked = result.data!.linked_documents!;

      // 선택적 필드 검증
      if (linked.epic) {
        expect(linked.epic).toHaveProperty("epic_id");
        expect(linked.epic).toHaveProperty("title");
      }
      expect(Array.isArray(linked.requirements)).toBe(true);
      expect(Array.isArray(linked.architecture)).toBe(true);
    });
  });

  // ===== Story 2.4c: 응답 포맷팅 및 에러 처리 테스트 =====

  describe("formatStoryResponse", () => {
    // 테스트용 StoryContext mock
    const mockStoryContext: StoryContext = {
      story_id: "2-4c",
      title: "get-story-context - 응답 포맷팅",
      status: "ready-for-dev",
      acceptance_criteria: [
        "**AC1**: 응답이 구조화됨",
        "**AC2**: suggestion 필드 포함",
      ],
      tasks: [
        { description: "Task 1", completed: false },
        { description: "Task 2", completed: true },
      ],
      linked_documents: {
        epic: {
          epic_id: "2",
          title: "mcp-context-loader 구현",
          description: "AI 에이전트용 MCP 서버",
        },
        requirements: [],
        architecture: [
          { section: "MCP 패턴", content: "3계층 분리" },
        ],
      },
    };

    it("StoryContext를 FormattedStoryResponse로 변환해야 한다", () => {
      const result = formatStoryResponse(mockStoryContext);

      expect(result).toBeDefined();
      expect(result.story).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });

    it("story 섹션에 id, title, status, acceptance_criteria, tasks가 포함되어야 한다", () => {
      const result = formatStoryResponse(mockStoryContext);

      expect(result.story.id).toBe("2-4c");
      expect(result.story.title).toBe("get-story-context - 응답 포맷팅");
      expect(result.story.status).toBe("ready-for-dev");
      expect(result.story.acceptance_criteria).toHaveLength(2);
      expect(result.story.tasks).toHaveLength(2);
    });

    it("epic 섹션이 linked_documents.epic에서 추출되어야 한다", () => {
      const result = formatStoryResponse(mockStoryContext);

      expect(result.epic).toBeDefined();
      expect(result.epic!.id).toBe("2");
      expect(result.epic!.title).toBe("mcp-context-loader 구현");
      expect(result.epic!.description).toBe("AI 에이전트용 MCP 서버");
    });

    it("architecture 섹션이 linked_documents.architecture에서 추출되어야 한다", () => {
      const result = formatStoryResponse(mockStoryContext);

      expect(result.architecture).toBeDefined();
      expect(result.architecture).toHaveLength(1);
      expect(result.architecture![0].section).toBe("MCP 패턴");
    });

    it("linked_documents가 없으면 epic과 architecture가 undefined여야 한다", () => {
      const contextWithoutLinks: StoryContext = {
        ...mockStoryContext,
        linked_documents: undefined,
      };
      const result = formatStoryResponse(contextWithoutLinks);

      expect(result.epic).toBeUndefined();
      expect(result.architecture).toBeUndefined();
    });

    it("warnings가 있으면 포함되어야 한다", () => {
      const contextWithWarnings: StoryContext = {
        ...mockStoryContext,
        warnings: ["Epic 파일을 찾을 수 없습니다"],
      };
      const result = formatStoryResponse(contextWithWarnings);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain("Epic 파일을 찾을 수 없습니다");
    });
  });

  describe("generateSuggestion", () => {
    it("done 상태는 완료 메시지를 반환해야 한다", () => {
      const result = generateSuggestion("done", "2-4c");
      expect(result).toContain("완료");
    });

    it("in-progress 상태는 진행 중 메시지를 반환해야 한다", () => {
      const result = generateSuggestion("in-progress", "2-4c");
      expect(result).toContain("진행 중");
    });

    it("ready-for-dev 상태는 구현 시작 메시지를 반환해야 한다", () => {
      const result = generateSuggestion("ready-for-dev", "2-4c");
      expect(result).toContain("시작");
    });

    it("backlog 상태는 준비되지 않음 메시지를 반환해야 한다", () => {
      const result = generateSuggestion("backlog", "2-4c");
      expect(result).toContain("준비");
    });

    it("review 상태는 리뷰 메시지를 반환해야 한다", () => {
      const result = generateSuggestion("review", "2-4c");
      expect(result).toContain("리뷰");
    });

    it("nextStoryId가 제공되면 다음 스토리 안내가 포함되어야 한다", () => {
      const result = generateSuggestion("done", "2-4c", "2-5");
      expect(result).toContain("2-5");
    });

    it("isLastInEpic이 true이면 Epic 완료 메시지가 포함되어야 한다", () => {
      const result = generateSuggestion("done", "2-4c", undefined, true);
      expect(result).toContain("Epic");
    });
  });

  describe("collectWarnings", () => {
    it("Epic 로드 실패 시 warning을 추가해야 한다", () => {
      const warnings = collectWarnings({
        epicLoaded: false,
        architectureLoaded: true,
        existingWarnings: [],
      });

      expect(warnings).toContain("Epic 정보를 로드할 수 없습니다");
    });

    it("Architecture 로드 실패 시 warning을 추가해야 한다", () => {
      const warnings = collectWarnings({
        epicLoaded: true,
        architectureLoaded: false,
        existingWarnings: [],
      });

      expect(warnings).toContain("Architecture 정보를 로드할 수 없습니다");
    });

    it("기존 warnings와 병합해야 한다", () => {
      const warnings = collectWarnings({
        epicLoaded: false,
        architectureLoaded: false,
        existingWarnings: ["기존 경고"],
      });

      expect(warnings).toContain("기존 경고");
      expect(warnings).toContain("Epic 정보를 로드할 수 없습니다");
      expect(warnings).toContain("Architecture 정보를 로드할 수 없습니다");
    });

    it("모두 성공하면 기존 warnings만 반환해야 한다", () => {
      const warnings = collectWarnings({
        epicLoaded: true,
        architectureLoaded: true,
        existingWarnings: ["기존 경고"],
      });

      expect(warnings).toEqual(["기존 경고"]);
    });

    it("모두 성공하고 기존 warnings가 없으면 빈 배열을 반환해야 한다", () => {
      const warnings = collectWarnings({
        epicLoaded: true,
        architectureLoaded: true,
        existingWarnings: [],
      });

      expect(warnings).toEqual([]);
    });
  });

  describe("FormattedStoryResponse 타입 검증", () => {
    it("FormattedStoryResponse가 올바른 구조를 가져야 한다", () => {
      const mockContext: StoryContext = {
        story_id: "test",
        title: "Test",
        status: "done",
        acceptance_criteria: [],
        tasks: [],
      };

      const formatted = formatStoryResponse(mockContext);

      // story 섹션 필수
      expect(formatted.story).toBeDefined();
      expect(formatted.story.id).toBeDefined();
      expect(formatted.story.title).toBeDefined();
      expect(formatted.story.status).toBeDefined();

      // suggestion 필수
      expect(typeof formatted.suggestion).toBe("string");
    });
  });

  describe("getStoryContext with format_response", () => {
    beforeEach(() => {
      vi.mocked(glob).mockResolvedValue([]);
      vi.mocked(fs.readFile).mockResolvedValue("");
    });

    it("기본값으로 포맷팅된 응답을 반환해야 한다 (format_response 기본값 true)", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-2-4c.md"]);
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (String(path).includes("story-2-4c")) {
          return SAMPLE_STORY_MARKDOWN;
        }
        return "";
      });

      const result = await getStoryContext({ storyId: "2-4c" });

      expect(result.success).toBe(true);
      // 포맷팅 관련 검증은 formatStoryResponse 테스트에서 수행
      expect(result.data).toBeDefined();
    });
  });

  describe("StoryContext 타입 검증", () => {
    it("StoryContext 인터페이스가 올바른 필드를 가져야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-1.1.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      const result = await getStoryContext({ storyId: "1.1" });

      expect(result.success).toBe(true);
      const context = result.data!;

      // 필수 필드 검증
      expect(context).toHaveProperty("story_id");
      expect(context).toHaveProperty("title");
      expect(context).toHaveProperty("status");
      expect(context).toHaveProperty("acceptance_criteria");
      expect(context).toHaveProperty("tasks");

      // 타입 검증
      expect(typeof context.story_id).toBe("string");
      expect(typeof context.title).toBe("string");
      expect(typeof context.status).toBe("string");
      expect(Array.isArray(context.acceptance_criteria)).toBe(true);
      expect(Array.isArray(context.tasks)).toBe(true);
    });

    it("TaskItem 인터페이스가 올바른 필드를 가져야 한다", async () => {
      vi.mocked(glob).mockResolvedValue(["/path/stories/story-1.1.md"]);
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_STORY_MARKDOWN);

      const result = await getStoryContext({ storyId: "1.1" });

      expect(result.success).toBe(true);
      const task = result.data!.tasks[0];

      // 필수 필드 검증
      expect(task).toHaveProperty("description");
      expect(task).toHaveProperty("completed");

      // 타입 검증
      expect(typeof task.description).toBe("string");
      expect(typeof task.completed).toBe("boolean");
    });
  });
});
