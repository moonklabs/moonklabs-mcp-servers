/**
 * load-context 순수 로직
 *
 * 여러 문서 유형을 로드하고 통합된 컨텍스트를 반환합니다.
 * MCP 도구에서 분리된 순수 비즈니스 로직입니다.
 *
 * @module tools/loadContextLogic
 */

import fs from "fs/promises";
import { glob } from "glob";
import { countTokens } from "./countTokensLogic.js";

/**
 * 지원하는 문서 유형 목록
 */
export const SUPPORTED_DOCUMENT_TYPES = [
  "prd",
  "architecture",
  "epic",
  "story",
  "project-context",
  "brainstorming",
] as const;

/**
 * 지원 문서 유형 타입
 */
export type DocumentType = (typeof SUPPORTED_DOCUMENT_TYPES)[number];

/**
 * load-context 결과 타입
 */
export interface LoadContextResult {
  /** 문서 유형별 내용 */
  documents: Record<string, string>;
  /** 총 토큰 수 */
  token_count: number;
  /** 무시된 (지원하지 않는) 문서 유형 */
  ignored_types: string[];
}

/**
 * load-context 옵션
 */
export interface LoadContextOptions {
  /** 기본 검색 경로 (기본값: 현재 디렉토리) */
  basePath?: string;
  /** 특정 Epic 번호 (epic 타입용) */
  epicNum?: number;
  /** 특정 스토리 ID (story 타입용) */
  storyId?: string;
}

/**
 * 문서 유형별 glob 패턴 매핑
 */
const DOCUMENT_PATTERNS: Record<DocumentType, string> = {
  prd: "_bmad-output/*prd*.md",
  architecture: "_bmad-output/*architecture*.md",
  epic: "_bmad-output/epics.md",
  story: "_bmad-output/implementation-artifacts/stories/*.md",
  "project-context": "**/project-context.md",
  brainstorming: "_bmad-output/*brainstorming*.md",
};

/**
 * 지원하는 문서 유형인지 확인합니다.
 *
 * @param type - 확인할 문서 유형
 * @returns 지원하는 유형이면 true
 */
export function isSupportedDocumentType(type: string): type is DocumentType {
  return SUPPORTED_DOCUMENT_TYPES.includes(type as DocumentType);
}

/**
 * 특정 문서 유형의 내용을 로드합니다.
 *
 * @param docType - 문서 유형
 * @param options - 로드 옵션
 * @returns 문서 내용 (파일이 없으면 빈 문자열)
 */
export async function loadDocumentContent(
  docType: DocumentType,
  options?: LoadContextOptions
): Promise<string> {
  const pattern = DOCUMENT_PATTERNS[docType];
  const basePath = options?.basePath || process.cwd();
  const fullPattern = `${basePath}/${pattern}`;

  try {
    // glob으로 파일 찾기 (node_modules 등 불필요한 디렉토리 제외)
    const files = await glob(fullPattern, {
      nodir: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    });

    if (files.length === 0) {
      return "";
    }

    // 모든 파일 내용 읽기
    const contents: string[] = [];
    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf-8");
        contents.push(content);
      } catch {
        // 개별 파일 읽기 실패는 무시
        continue;
      }
    }

    // 여러 파일인 경우 구분자로 합치기
    return contents.join("\n\n---\n\n");
  } catch {
    // glob 에러 시 빈 문자열 반환
    return "";
  }
}

/**
 * 여러 문서 유형을 한 번에 로드합니다.
 *
 * @param documentTypes - 로드할 문서 유형 배열
 * @param options - 로드 옵션
 * @returns 로드된 문서들과 메타데이터
 *
 * @example
 * ```typescript
 * const result = await loadContext(["prd", "architecture"]);
 * console.log(result.documents.prd);
 * console.log(result.token_count);
 * ```
 */
export async function loadContext(
  documentTypes: string[],
  options?: LoadContextOptions
): Promise<LoadContextResult> {
  const documents: Record<string, string> = {};
  const ignoredTypes: string[] = [];

  // 지원/미지원 타입 분류
  const supportedTypes: DocumentType[] = [];
  for (const type of documentTypes) {
    if (isSupportedDocumentType(type)) {
      supportedTypes.push(type);
    } else {
      ignoredTypes.push(type);
    }
  }

  // 지원하는 타입들의 문서 로드
  for (const docType of supportedTypes) {
    const content = await loadDocumentContent(docType, options);
    if (content) {
      documents[docType] = content;
    }
  }

  // 총 토큰 수 계산
  const allContent = Object.values(documents).join("\n");
  const tokenCount = allContent ? countTokens(allContent).token_count : 0;

  return {
    documents,
    token_count: tokenCount,
    ignored_types: ignoredTypes,
  };
}
