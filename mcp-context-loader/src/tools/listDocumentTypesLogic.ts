/**
 * list-document-types 순수 로직
 *
 * 사용 가능한 문서 유형 목록과 메타데이터를 반환합니다.
 * MCP 도구에서 분리된 순수 비즈니스 로직입니다.
 *
 * @module tools/listDocumentTypesLogic
 */

import {
  SUPPORTED_DOCUMENT_TYPES,
  DOCUMENT_PATTERNS,
  type DocumentType,
} from "./loadContextLogic.js";

/**
 * 문서 유형 정보 인터페이스
 */
export interface DocumentTypeInfo {
  /** 문서 유형 (예: "prd", "architecture") */
  type: DocumentType;
  /** 문서 유형에 대한 설명 */
  description: string;
  /** 파일 경로 예시 */
  example: string;
  /** 실제 검색에 사용되는 glob 패턴 */
  glob_pattern: string;
}

/**
 * 문서 유형별 메타데이터 (설명 제외)
 */
export interface DocumentTypeMetadata {
  description: string;
  example: string;
  glob_pattern: string;
}

/**
 * 문서 유형별 메타데이터 정의
 *
 * 각 문서 유형에 대한 설명, 예시, glob 패턴을 제공합니다.
 */
export const DOCUMENT_TYPE_METADATA: Record<DocumentType, DocumentTypeMetadata> = {
  prd: {
    description: "제품 요구사항 문서 (PRD) - 기능 요구사항, 비기능 요구사항, 제약조건 정의",
    example: "_bmad-output/prd.md",
    glob_pattern: DOCUMENT_PATTERNS.prd,
  },
  architecture: {
    description: "아키텍처 결정 및 설계 문서 - 시스템 구조, 기술 스택, 설계 패턴 정의",
    example: "_bmad-output/architecture.md",
    glob_pattern: DOCUMENT_PATTERNS.architecture,
  },
  epic: {
    description: "Epic 및 Story 목록 - 프로젝트의 모든 Epic과 하위 Story 정의",
    example: "_bmad-output/epics.md",
    glob_pattern: DOCUMENT_PATTERNS.epic,
  },
  story: {
    description: "개별 스토리 파일들 - 구현 대상 스토리의 AC, Tasks, Dev Notes 포함",
    example: "_bmad-output/implementation-artifacts/stories/story-1-1.md",
    glob_pattern: DOCUMENT_PATTERNS.story,
  },
  "project-context": {
    description: "프로젝트 컨텍스트 및 규칙 - AI 에이전트가 따라야 할 핵심 규칙과 패턴",
    example: "_bmad-output/project-context.md",
    glob_pattern: DOCUMENT_PATTERNS["project-context"],
  },
  brainstorming: {
    description: "브레인스토밍 및 아이디어 문서 - 초기 아이디어, 연구 결과, 분석 내용",
    example: "_bmad-output/brainstorming-session-2025-01-01.md",
    glob_pattern: DOCUMENT_PATTERNS.brainstorming,
  },
};

/**
 * 사용 가능한 문서 유형 목록을 반환합니다.
 *
 * @returns 문서 유형 정보 배열
 *
 * @example
 * ```typescript
 * const types = listDocumentTypes();
 * console.log(types[0].type);        // "prd"
 * console.log(types[0].description); // "제품 요구사항 문서 (PRD) - ..."
 * ```
 */
export function listDocumentTypes(): DocumentTypeInfo[] {
  return SUPPORTED_DOCUMENT_TYPES.map((docType) => ({
    type: docType,
    description: DOCUMENT_TYPE_METADATA[docType].description,
    example: DOCUMENT_TYPE_METADATA[docType].example,
    glob_pattern: DOCUMENT_TYPE_METADATA[docType].glob_pattern,
  }));
}
