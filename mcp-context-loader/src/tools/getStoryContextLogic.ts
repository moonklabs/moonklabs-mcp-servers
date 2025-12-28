/**
 * get-story-context 순수 로직
 *
 * 스토리 ID로 스토리 파일을 찾고 파싱하여 구조화된 데이터를 반환합니다.
 * MCP 도구에서 분리된 순수 비즈니스 로직입니다.
 *
 * @module tools/getStoryContextLogic
 */

import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { createMcpError, type McpErrorResponse } from "@moonklabs/mcp-common";

/**
 * 태스크 항목 인터페이스
 */
export interface TaskItem {
  /** 태스크 설명 */
  description: string;
  /** 완료 여부 */
  completed: boolean;
  /** 서브태스크 목록 (선택적) */
  subtasks?: TaskItem[];
}

/**
 * Epic 정보 인터페이스
 */
export interface EpicInfo {
  /** Epic ID (예: "2") */
  epic_id: string;
  /** Epic 제목 */
  title: string;
  /** Epic 설명 */
  description: string;
  /** Epic 목표 (선택적) */
  objectives?: string[];
}

/**
 * 아키텍처 결정 인터페이스
 */
export interface ArchitectureDecision {
  /** 섹션명 */
  section: string;
  /** 결정 내용 */
  content: string;
}

/**
 * 연결된 문서 정보 인터페이스
 */
export interface LinkedDocuments {
  /** Epic 정보 (선택적) */
  epic?: EpicInfo;
  /** 관련 요구사항 목록 */
  requirements?: string[];
  /** 아키텍처 결정 목록 */
  architecture?: ArchitectureDecision[];
}

/**
 * 스토리 컨텍스트 인터페이스
 */
export interface StoryContext {
  /** 정규화된 스토리 ID */
  story_id: string;
  /** 스토리 제목 */
  title: string;
  /** 스토리 상태 (ready-for-dev, in-progress, done 등) */
  status: string;
  /** Acceptance Criteria 목록 */
  acceptance_criteria: string[];
  /** 태스크 목록 */
  tasks: TaskItem[];
  /** 원본 마크다운 (선택적) */
  raw_content?: string;
  /** 파싱 경고 메시지 (선택적) */
  warnings?: string[];
  /** 연결된 문서 정보 (선택적) */
  linked_documents?: LinkedDocuments;
}

/**
 * getStoryContext 옵션
 */
export interface GetStoryContextOptions {
  /** 스토리 ID (다양한 형식 지원) */
  storyId: string;
  /** 기본 검색 경로 (기본값: 현재 디렉토리) */
  basePath?: string;
  /** 원본 마크다운 포함 여부 */
  includeRawContent?: boolean;
  /** 스토리 파일 검색 패턴 (기본값: STORY_GLOB_PATTERN) */
  storyGlobPattern?: string;
  /** 연결된 문서 포함 여부 (기본값: true) */
  includeLinkedDocuments?: boolean;
}

/**
 * 스토리 에러 응답 인터페이스
 */
export interface StoryErrorResponse extends Omit<McpErrorResponse, "available_options"> {
  /** 사용 가능한 스토리 목록 */
  available_options?: string[];
}

/**
 * getStoryContext 결과 타입
 */
export interface GetStoryContextResult {
  /** 성공 여부 */
  success: boolean;
  /** 성공 시 스토리 컨텍스트 데이터 */
  data?: StoryContext;
  /** 실패 시 에러 정보 */
  error?: StoryErrorResponse;
}

/**
 * listAvailableStories 옵션
 */
export interface ListStoriesOptions {
  /** 기본 검색 경로 (기본값: 현재 디렉토리) */
  basePath?: string;
  /** 스토리 파일 검색 패턴 (기본값: STORY_GLOB_PATTERN) */
  storyGlobPattern?: string;
}

/**
 * 스토리 파일 기본 검색 패턴
 */
export const DEFAULT_STORY_GLOB_PATTERN =
  "_bmad-output/implementation-artifacts/stories/story-*.md";

/**
 * story_id를 정규화합니다.
 *
 * 다양한 입력 형식을 표준 형식으로 변환합니다.
 * - "1.3" → "story-1.3"
 * - "Story-1.3" → "story-1.3"
 * - "story-1-3" → "story-1-3" (그대로)
 * - "2-4a" → "story-2-4a"
 *
 * @param storyId - 정규화할 스토리 ID
 * @returns 정규화된 스토리 ID
 */
export function normalizeStoryId(storyId: string): string {
  if (!storyId) {
    return "";
  }

  // 소문자로 변환
  const normalized = storyId.toLowerCase();

  // "story-" 접두사가 있으면 그대로 반환
  if (normalized.startsWith("story-")) {
    return normalized;
  }

  // 숫자로 시작하면 "story-" 접두사 추가
  if (/^\d/.test(normalized)) {
    return `story-${normalized}`;
  }

  return normalized;
}

/**
 * 파일명에서 스토리 ID를 추출합니다.
 *
 * @param filename - 파일명 (예: "story-2-4a-get-story-context.md")
 * @returns 스토리 ID (예: "2-4a")
 */
export function extractStoryIdFromFilename(filename: string): string {
  // 파일명에서 경로와 확장자 제거
  const basename = path.basename(filename, ".md");

  // "story-" 접두사 제거
  const withoutPrefix = basename.replace(/^story-/, "");

  // 첫 번째 숫자 부분까지만 추출 (예: "2-4a-get-story-context" → "2-4a")
  // 패턴: 숫자, 대시, 숫자/문자 조합
  const match = withoutPrefix.match(/^(\d+(?:[.-]\d+[a-z]?)?(?:-\d+[a-z]?)?)/);
  if (match) {
    return match[1];
  }

  return withoutPrefix;
}

/**
 * 스토리 마크다운을 파싱하여 구조화된 데이터로 변환합니다.
 *
 * @param markdown - 스토리 마크다운 내용
 * @returns 파싱된 스토리 컨텍스트
 */
export function parseStoryMarkdown(markdown: string): Omit<StoryContext, "raw_content"> {
  const result: Omit<StoryContext, "raw_content"> = {
    story_id: "",
    title: "",
    status: "",
    acceptance_criteria: [],
    tasks: [],
  };

  if (!markdown) {
    return result;
  }

  // 제목과 스토리 ID 추출 (# Story X.X: 제목)
  const titleMatch = markdown.match(/^#\s*Story\s+([\d.a-zA-Z-]+):\s*(.+)$/m);
  if (titleMatch) {
    result.story_id = titleMatch[1];
    result.title = titleMatch[2].trim();
  }

  // Status 추출
  const statusMatch = markdown.match(/^Status:\s*(.+)$/m);
  if (statusMatch) {
    result.status = statusMatch[1].trim();
  }

  // Acceptance Criteria 섹션 파싱
  const acSection = markdown.match(
    /## Acceptance Criteria\n([\s\S]*?)(?=\n## |\n---|$)/
  );
  if (acSection) {
    const acContent = acSection[1];
    // 번호가 매겨진 AC 추출 (1. **AC1**: ...)
    const acMatches = acContent.matchAll(/^\d+\.\s*(.+)$/gm);
    for (const match of acMatches) {
      result.acceptance_criteria.push(match[1].trim());
    }
  }

  // Tasks / Subtasks 섹션 파싱
  const tasksSection = markdown.match(
    /## Tasks \/ Subtasks\n([\s\S]*?)(?=\n## |\n---|$)/
  );
  if (tasksSection) {
    const tasksContent = tasksSection[1];
    const lines = tasksContent.split("\n");

    let currentTask: TaskItem | null = null;

    for (const line of lines) {
      // 메인 태스크 (- [ ] 또는 - [x])
      const taskMatch = line.match(/^- \[([ x])\]\s*(.+)$/);
      if (taskMatch) {
        if (currentTask) {
          result.tasks.push(currentTask);
        }
        currentTask = {
          description: taskMatch[2].trim(),
          completed: taskMatch[1] === "x",
          subtasks: [],
        };
        continue;
      }

      // 서브태스크 (  - [ ] 또는   - [x])
      const subtaskMatch = line.match(/^\s+- \[([ x])\]\s*(.+)$/);
      if (subtaskMatch && currentTask) {
        currentTask.subtasks!.push({
          description: subtaskMatch[2].trim(),
          completed: subtaskMatch[1] === "x",
        });
      }
    }

    // 마지막 태스크 추가
    if (currentTask) {
      result.tasks.push(currentTask);
    }
  }

  return result;
}

/**
 * 사용 가능한 스토리 목록을 반환합니다.
 *
 * @param options - 옵션 (basePath 등)
 * @returns 스토리 ID 배열
 */
export async function listAvailableStories(
  options?: ListStoriesOptions
): Promise<string[]> {
  const basePath = options?.basePath || process.cwd();
  const globPattern = options?.storyGlobPattern || DEFAULT_STORY_GLOB_PATTERN;
  const fullPattern = `${basePath}/${globPattern}`;

  try {
    const files = await glob(fullPattern, {
      nodir: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    });

    // 파일명에서 스토리 ID 추출
    const storyIds = files.map((file) => extractStoryIdFromFilename(file));

    return storyIds;
  } catch {
    return [];
  }
}

/**
 * 스토리 ID로 스토리 파일을 찾아 매칭합니다.
 *
 * @param normalizedId - 정규화된 스토리 ID
 * @param files - 스토리 파일 경로 배열
 * @returns 매칭된 파일 경로 또는 undefined
 */
function findMatchingStoryFile(
  normalizedId: string,
  files: string[]
): string | undefined {
  // "story-" 접두사 제거
  const idWithoutPrefix = normalizedId.replace(/^story-/, "");

  for (const file of files) {
    const basename = path.basename(file, ".md");
    const fileIdPart = basename.replace(/^story-/, "");

    // 정확히 일치하거나 접두사로 시작하는 경우
    if (
      fileIdPart === idWithoutPrefix ||
      fileIdPart.startsWith(`${idWithoutPrefix}-`)
    ) {
      return file;
    }

    // 점(.)과 대시(-) 혼용 처리 (1.3 == 1-3)
    const normalizedFileId = fileIdPart.replace(/\./g, "-");
    const normalizedSearchId = idWithoutPrefix.replace(/\./g, "-");

    if (
      normalizedFileId === normalizedSearchId ||
      normalizedFileId.startsWith(`${normalizedSearchId}-`)
    ) {
      return file;
    }
  }

  return undefined;
}

/**
 * 스토리 컨텍스트를 가져옵니다.
 *
 * @param options - 옵션 (storyId, basePath, includeRawContent)
 * @returns 스토리 컨텍스트 결과
 *
 * @example
 * ```typescript
 * const result = await getStoryContext({ storyId: "2-4a" });
 * if (result.success) {
 *   console.log(result.data.title);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function getStoryContext(
  options: GetStoryContextOptions
): Promise<GetStoryContextResult> {
  const {
    storyId,
    basePath,
    includeRawContent,
    storyGlobPattern,
    includeLinkedDocuments = true,
  } = options;
  const searchBasePath = basePath || process.cwd();
  const globPattern = storyGlobPattern || DEFAULT_STORY_GLOB_PATTERN;
  const fullPattern = `${searchBasePath}/${globPattern}`;

  try {
    // 스토리 파일 검색
    const files = await glob(fullPattern, {
      nodir: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    });

    // story_id 정규화
    const normalizedId = normalizeStoryId(storyId);

    // 매칭되는 파일 찾기
    const matchedFile = findMatchingStoryFile(normalizedId, files);

    if (!matchedFile) {
      // 사용 가능한 스토리 목록 추출
      const availableStories = files.map((file) =>
        extractStoryIdFromFilename(file)
      );

      // createMcpError 사용 (AC3 준수)
      const error = createMcpError(
        "STORY_NOT_FOUND",
        `스토리 '${storyId}'를 찾을 수 없습니다`,
        `사용 가능한 스토리: ${availableStories.join(", ") || "없음"}`,
        { available_options: availableStories }
      ) as StoryErrorResponse;

      return {
        success: false,
        error,
      };
    }

    // 파일 읽기
    const content = await fs.readFile(matchedFile, "utf-8");

    // 마크다운 파싱
    const parsedContext = parseStoryMarkdown(content);

    // 마크다운 검증: 필수 섹션 누락 경고
    const warnings: string[] = [];
    if (!parsedContext.title) {
      warnings.push("제목(# Story X.X: ...) 섹션을 찾을 수 없습니다");
    }
    if (!parsedContext.status) {
      warnings.push("Status 필드를 찾을 수 없습니다");
    }
    if (parsedContext.acceptance_criteria.length === 0) {
      warnings.push("Acceptance Criteria 섹션이 비어있거나 찾을 수 없습니다");
    }
    if (parsedContext.tasks.length === 0) {
      warnings.push("Tasks / Subtasks 섹션이 비어있거나 찾을 수 없습니다");
    }

    // 결과 구성
    const storyContext: StoryContext = {
      ...parsedContext,
      story_id: parsedContext.story_id || normalizedId.replace(/^story-/, ""),
    };

    // 경고가 있으면 추가
    if (warnings.length > 0) {
      storyContext.warnings = warnings;
    }

    // 원본 마크다운 포함 옵션
    if (includeRawContent) {
      storyContext.raw_content = content;
    }

    // 연결된 문서 포함 옵션 (AC1-3, AC6)
    if (includeLinkedDocuments) {
      const linkedDocs = await linkDocuments({
        storyId: storyContext.story_id,
        basePath: searchBasePath,
      });
      storyContext.linked_documents = linkedDocs;
    }

    return {
      success: true,
      data: storyContext,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    // createMcpError 사용 (AC3 준수)
    const error = createMcpError(
      "INTERNAL_ERROR",
      `스토리 컨텍스트 로드 중 오류 발생: ${errorMessage}`,
      "스토리 파일 경로와 권한을 확인하세요"
    ) as StoryErrorResponse;

    return {
      success: false,
      error,
    };
  }
}

// ============================================================================
// Story 2.4c: 응답 포맷팅 및 에러 처리
// ============================================================================

/**
 * Story 섹션 인터페이스 (포맷팅된 응답용)
 */
export interface StorySection {
  /** 스토리 ID */
  id: string;
  /** 스토리 제목 */
  title: string;
  /** 스토리 상태 */
  status: string;
  /** Acceptance Criteria 목록 */
  acceptance_criteria: string[];
  /** 태스크 목록 */
  tasks: TaskItem[];
}

/**
 * Epic 섹션 인터페이스 (포맷팅된 응답용)
 */
export interface EpicSection {
  /** Epic ID */
  id: string;
  /** Epic 제목 */
  title: string;
  /** Epic 설명 */
  description: string;
}

/**
 * 포맷팅된 스토리 응답 인터페이스
 */
export interface FormattedStoryResponse {
  /** 스토리 정보 */
  story: StorySection;
  /** Epic 정보 (선택적) */
  epic?: EpicSection;
  /** 요구사항 목록 (선택적) */
  requirements?: string[];
  /** 아키텍처 결정 목록 (선택적) */
  architecture?: ArchitectureDecision[];
  /** 다음 행동 제안 */
  suggestion: string;
  /** 경고 메시지 (선택적) */
  warnings?: string[];
}

/**
 * collectWarnings 옵션
 */
export interface CollectWarningsOptions {
  /** Epic 로드 성공 여부 */
  epicLoaded: boolean;
  /** Architecture 로드 성공 여부 */
  architectureLoaded: boolean;
  /** 기존 warnings 배열 */
  existingWarnings: string[];
}

/**
 * 상태별 suggestion 메시지
 */
const SUGGESTION_MESSAGES: Record<string, string> = {
  done: "이 스토리는 완료되었습니다.",
  "in-progress": "이 스토리는 진행 중입니다. AC를 확인하고 구현을 계속하세요.",
  "ready-for-dev": "구현을 시작하세요. 첫 번째 Task부터 진행하세요.",
  backlog: "이 스토리는 아직 준비되지 않았습니다.",
  review: "이 스토리는 리뷰 대기 중입니다. 코드 리뷰를 진행하세요.",
};

/**
 * StoryContext를 FormattedStoryResponse로 변환합니다.
 *
 * @param context - 원본 StoryContext
 * @returns 포맷팅된 응답
 */
export function formatStoryResponse(context: StoryContext): FormattedStoryResponse {
  // story 섹션 구성
  const story: StorySection = {
    id: context.story_id,
    title: context.title,
    status: context.status,
    acceptance_criteria: context.acceptance_criteria,
    tasks: context.tasks,
  };

  // 결과 구성
  const result: FormattedStoryResponse = {
    story,
    suggestion: generateSuggestion(context.status, context.story_id),
  };

  // linked_documents에서 epic 추출
  if (context.linked_documents?.epic) {
    result.epic = {
      id: context.linked_documents.epic.epic_id,
      title: context.linked_documents.epic.title,
      description: context.linked_documents.epic.description,
    };
  }

  // linked_documents에서 requirements 추출
  if (context.linked_documents?.requirements && context.linked_documents.requirements.length > 0) {
    result.requirements = context.linked_documents.requirements;
  }

  // linked_documents에서 architecture 추출
  if (context.linked_documents?.architecture && context.linked_documents.architecture.length > 0) {
    result.architecture = context.linked_documents.architecture;
  }

  // warnings 수집 (AC3, AC4: graceful degradation)
  // linked_documents가 요청되었지만 로드 실패한 경우 경고 추가
  const linkedDocsRequested = context.linked_documents !== undefined;
  if (linkedDocsRequested) {
    const epicLoaded = !!context.linked_documents?.epic;
    // Architecture는 파일 없어도 빈 배열 반환하므로 로드 성공으로 간주
    const architectureLoaded = true;
    const collectedWarnings = collectWarnings({
      epicLoaded,
      architectureLoaded,
      existingWarnings: context.warnings || [],
    });
    if (collectedWarnings.length > 0) {
      result.warnings = collectedWarnings;
    }
  } else if (context.warnings && context.warnings.length > 0) {
    // linked_documents 미요청 시 기존 warnings만 포함
    result.warnings = context.warnings;
  }

  return result;
}

/**
 * 스토리 상태에 따른 suggestion을 생성합니다.
 *
 * @param status - 스토리 상태
 * @param storyId - 현재 스토리 ID
 * @param nextStoryId - 다음 스토리 ID (선택적)
 * @param isLastInEpic - Epic 내 마지막 스토리 여부 (선택적)
 * @returns suggestion 문자열
 */
export function generateSuggestion(
  status: string,
  storyId: string,
  nextStoryId?: string,
  isLastInEpic?: boolean
): string {
  // 기본 메시지
  let message = SUGGESTION_MESSAGES[status] || `스토리 ${storyId}`;

  // done 상태에서 추가 정보
  if (status === "done") {
    if (isLastInEpic) {
      const epicNum = extractEpicNum(storyId);
      message += ` Epic ${epicNum}의 마지막 스토리입니다. 회고를 진행하세요.`;
    } else if (nextStoryId) {
      message += ` 다음 스토리: ${nextStoryId}`;
    }
  }

  return message;
}

/**
 * 부분 실패 경고를 수집합니다.
 *
 * @param options - 경고 수집 옵션
 * @returns 통합된 warnings 배열
 */
export function collectWarnings(options: CollectWarningsOptions): string[] {
  const { epicLoaded, architectureLoaded, existingWarnings } = options;
  const warnings = [...existingWarnings];

  if (!epicLoaded) {
    warnings.push("Epic 정보를 로드할 수 없습니다");
  }

  if (!architectureLoaded) {
    warnings.push("Architecture 정보를 로드할 수 없습니다");
  }

  return warnings;
}

// ============================================================================
// Story 2.4b: 문서 연결 기능
// ============================================================================

/**
 * 스토리 ID에서 Epic 번호를 추출합니다.
 *
 * @param storyId - 스토리 ID (예: "2-4a", "1.3", "story-2-4b")
 * @returns Epic 번호 (예: "2", "1") 또는 빈 문자열
 *
 * @example
 * extractEpicNum("2-4a") // => "2"
 * extractEpicNum("1.3") // => "1"
 * extractEpicNum("story-2-4b") // => "2"
 */
export function extractEpicNum(storyId: string): string {
  if (!storyId) {
    return "";
  }

  // 정규화: 소문자, story- 접두사 제거
  const normalized = storyId.toLowerCase().replace(/^story-/, "");

  // 첫 번째 숫자 추출 (대시 또는 점 이전)
  const match = normalized.match(/^(\d+)/);
  if (match) {
    return match[1];
  }

  return "";
}

/**
 * Epic 문서 기본 경로
 */
export const DEFAULT_EPICS_PATH = "_bmad-output/epics.md";

/**
 * Architecture 문서 기본 경로
 */
export const DEFAULT_ARCHITECTURE_PATH = "_bmad-output/architecture.md";

/**
 * epics.md 파일을 파싱하여 특정 Epic 정보를 추출합니다.
 *
 * @param epicContent - epics.md 파일 내용
 * @param epicNum - 추출할 Epic 번호 (예: "2")
 * @returns EpicInfo 또는 undefined (해당 Epic이 없는 경우)
 */
export function parseEpicsFile(
  epicContent: string,
  epicNum: string
): EpicInfo | undefined {
  if (!epicContent || !epicNum) {
    return undefined;
  }

  // Epic 섹션 추출 패턴: ## Epic N: Title
  const epicPattern = new RegExp(
    `## Epic ${epicNum}:\\s*(.+?)\\n([\\s\\S]*?)(?=\\n## Epic \\d+:|$)`,
    "i"
  );

  const match = epicContent.match(epicPattern);
  if (!match) {
    return undefined;
  }

  const title = match[1].trim();
  const content = match[2];

  // 설명 추출: Epic 제목 다음의 첫 번째 텍스트 블록
  let description = "";
  const descLines: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // 새로운 섹션 시작 (### 또는 ## 또는 Story)이면 중단
    if (line.match(/^###?\s/) || line.match(/^Story\s+\d/i)) {
      break;
    }
    // 빈 줄이 아니면 추가
    if (line.trim()) {
      descLines.push(line.trim());
    }
  }
  description = descLines.join(" ");

  // 목표(Objectives) 추출: ### Objectives 또는 **Objectives** 패턴
  const objectives: string[] = [];
  const objectivesMatch = content.match(
    /(?:###\s*Objectives|Goals|\*\*Objectives\*\*|\*\*Goals\*\*)[\s:]*\n([\s\S]*?)(?=\n###|\n##|\n\*\*|$)/i
  );

  if (objectivesMatch) {
    const objectivesContent = objectivesMatch[1];
    // 목록 항목 추출 (- 또는 * 또는 숫자.)
    const itemMatches = objectivesContent.matchAll(/^[\s]*[-*\d.]+\s*(.+)$/gm);
    for (const itemMatch of itemMatches) {
      objectives.push(itemMatch[1].trim());
    }
  }

  const epicInfo: EpicInfo = {
    epic_id: epicNum,
    title,
    description,
  };

  if (objectives.length > 0) {
    epicInfo.objectives = objectives;
  }

  return epicInfo;
}

/**
 * architecture.md 파일에서 관련 섹션을 추출합니다.
 *
 * @param archContent - architecture.md 파일 내용
 * @param keywords - 검색할 키워드 배열 (선택적)
 * @returns ArchitectureDecision 배열
 */
export function extractArchitectureDecisions(
  archContent: string,
  keywords?: string[]
): ArchitectureDecision[] {
  if (!archContent) {
    return [];
  }

  const decisions: ArchitectureDecision[] = [];

  // 줄 단위로 분리하여 섹션 추출
  const lines = archContent.split("\n");
  let currentSection: { title: string; content: string[] } | null = null;

  for (const line of lines) {
    // ## 또는 ### 섹션 헤더 매치
    const headerMatch = line.match(/^(#{2,3})\s+(.+?)(?:\s*\{#[\w-]+\})?$/);
    if (headerMatch) {
      // 이전 섹션 저장
      if (currentSection && currentSection.content.length > 0) {
        const sectionContent = currentSection.content.join("\n").trim();
        if (sectionContent) {
          // 키워드 필터링
          if (keywords && keywords.length > 0) {
            const lowerTitle = currentSection.title.toLowerCase();
            const lowerContent = sectionContent.toLowerCase();
            const hasMatch = keywords.some(
              (kw) =>
                lowerTitle.includes(kw.toLowerCase()) ||
                lowerContent.includes(kw.toLowerCase())
            );
            if (hasMatch) {
              decisions.push({
                section: currentSection.title,
                content: sectionContent,
              });
            }
          } else {
            decisions.push({
              section: currentSection.title,
              content: sectionContent,
            });
          }
        }
      }
      // 새 섹션 시작
      currentSection = { title: headerMatch[2].trim(), content: [] };
    } else if (currentSection) {
      // --- 구분선이면 섹션 종료
      if (line.match(/^---+$/)) {
        continue;
      }
      currentSection.content.push(line);
    }
  }

  // 마지막 섹션 저장
  if (currentSection && currentSection.content.length > 0) {
    const sectionContent = currentSection.content.join("\n").trim();
    if (sectionContent) {
      // 키워드 필터링
      if (keywords && keywords.length > 0) {
        const lowerTitle = currentSection.title.toLowerCase();
        const lowerContent = sectionContent.toLowerCase();
        const hasMatch = keywords.some(
          (kw) =>
            lowerTitle.includes(kw.toLowerCase()) ||
            lowerContent.includes(kw.toLowerCase())
        );
        if (hasMatch) {
          decisions.push({
            section: currentSection.title,
            content: sectionContent,
          });
        }
      } else {
        decisions.push({
          section: currentSection.title,
          content: sectionContent,
        });
      }
    }
  }

  return decisions;
}

/**
 * linkDocuments 옵션
 */
export interface LinkDocumentsOptions {
  /** 스토리 ID */
  storyId: string;
  /** 기본 경로 */
  basePath?: string;
  /** epics.md 경로 (기본값: DEFAULT_EPICS_PATH) */
  epicsPath?: string;
  /** architecture.md 경로 (기본값: DEFAULT_ARCHITECTURE_PATH) */
  architecturePath?: string;
  /** 아키텍처 검색 키워드 (선택적) */
  architectureKeywords?: string[];
}

/**
 * 스토리와 관련된 문서들을 연결합니다.
 *
 * Epic, PRD 요구사항, Architecture 결정사항을 연결합니다.
 * 파일이 없거나 해당 섹션이 없으면 graceful degradation을 적용합니다.
 *
 * @param options - 연결 옵션
 * @returns 연결된 문서 정보
 */
export async function linkDocuments(
  options: LinkDocumentsOptions
): Promise<LinkedDocuments> {
  const {
    storyId,
    basePath = process.cwd(),
    epicsPath = DEFAULT_EPICS_PATH,
    architecturePath = DEFAULT_ARCHITECTURE_PATH,
    architectureKeywords,
  } = options;

  const result: LinkedDocuments = {};

  // 1. Epic 정보 연결
  const epicNum = extractEpicNum(storyId);
  if (epicNum) {
    try {
      const epicsFullPath = path.join(basePath, epicsPath);
      const epicsContent = await fs.readFile(epicsFullPath, "utf-8");
      const epicInfo = parseEpicsFile(epicsContent, epicNum);
      if (epicInfo) {
        result.epic = epicInfo;
      }
    } catch {
      // 파일이 없으면 무시 (graceful degradation)
    }
  }

  // 2. 요구사항 연결 (현재 버전에서는 빈 배열 반환)
  // Story References 섹션이나 PRD에서 추출하는 로직은 Phase 2로 연기
  result.requirements = [];

  // 3. Architecture 결정 연결
  try {
    const archFullPath = path.join(basePath, architecturePath);
    const archContent = await fs.readFile(archFullPath, "utf-8");
    result.architecture = extractArchitectureDecisions(
      archContent,
      architectureKeywords
    );
  } catch {
    // 파일이 없으면 빈 배열 (graceful degradation)
    result.architecture = [];
  }

  return result;
}
