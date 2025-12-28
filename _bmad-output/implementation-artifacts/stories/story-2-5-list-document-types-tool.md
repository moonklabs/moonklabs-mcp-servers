# Story 2.5: list-document-types 도구 구현

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a AI 에이전트,
I want 로드 가능한 문서 유형 목록을 조회하여,
so that load-context 도구에 올바른 파라미터를 전달할 수 있습니다.

## Acceptance Criteria

1. **AC1**: list-document-types 도구가 파라미터 없이 호출됨
2. **AC2**: 사용 가능한 document_types 배열이 반환됨 (prd, architecture, epic, story, project-context, brainstorming)
3. **AC3**: 각 유형에 description이 포함됨 (용도 설명)
4. **AC4**: 각 유형에 example이 포함됨 (파일 경로 패턴 예시)
5. **AC5**: 각 유형에 glob_pattern이 포함됨 (실제 검색 패턴)
6. **AC6**: 응답에 total_count 필드로 지원 유형 수가 포함됨

## Tasks / Subtasks

- [x] Task 1: src/tools/listDocumentTypesLogic.ts 생성 (AC: #2-5)
  - [x] 1.1 DocumentTypeInfo 인터페이스 정의
    ```typescript
    interface DocumentTypeInfo {
      type: DocumentType;
      description: string;
      example: string;
      glob_pattern: string;
    }
    ```
  - [x] 1.2 DOCUMENT_TYPE_METADATA 상수 정의 (6가지 문서 유형)
    - prd: "제품 요구사항 문서 (PRD)"
    - architecture: "아키텍처 결정 및 설계 문서"
    - epic: "Epic 및 Story 목록"
    - story: "개별 스토리 파일들"
    - project-context: "프로젝트 컨텍스트 및 규칙"
    - brainstorming: "브레인스토밍 및 아이디어 문서"
  - [x] 1.3 listDocumentTypes() 함수 구현
  - [x] 1.4 SUPPORTED_DOCUMENT_TYPES, DOCUMENT_PATTERNS 재사용 (loadContextLogic.ts에서 import)

- [x] Task 2: src/tools/listDocumentTypes.ts 생성 - MCP 도구 등록 (AC: #1, #6)
  - [x] 2.1 Zod 스키마 정의 (빈 객체 - 파라미터 없음)
  - [x] 2.2 registerListDocumentTypesTool 함수 구현
  - [x] 2.3 도구 설명 작성: "load-context 도구에서 사용 가능한 문서 유형 목록과 설명을 반환합니다"
  - [x] 2.4 응답에 total_count 필드 추가

- [x] Task 3: src/tools/index.ts 업데이트
  - [x] 3.1 registerListDocumentTypesTool import 추가
  - [x] 3.2 registerAllTools에서 호출

- [x] Task 4: 단위 테스트 작성 - TDD 접근 (AC: #1-6)
  - [x] 4.1 src/tools/__tests__/listDocumentTypes.test.ts 생성
  - [x] 4.2 listDocumentTypes() 함수 테스트
    - 반환 배열 길이 테스트 (6개)
    - 각 항목에 type, description, example, glob_pattern 포함 확인
    - SUPPORTED_DOCUMENT_TYPES와 일치 확인
  - [x] 4.3 DOCUMENT_TYPE_METADATA 테스트
    - 모든 DocumentType에 메타데이터 존재 확인
    - description이 빈 문자열이 아닌지 확인
    - example이 실제 경로 패턴인지 확인
  - [x] 4.4 MCP 도구 통합 테스트
    - 파라미터 없이 호출 테스트
    - 응답 구조 검증 (document_types, total_count)

- [x] Task 5: 타입 검사 및 테스트 통과
  - [x] 5.1 npm run typecheck 통과
  - [x] 5.2 npm test 전체 통과 (130개)

## Dev Notes

### 아키텍처 패턴 (3계층 분리)

```
src/tools/
├── index.ts                        # registerAllTools() - 도구 등록 헬퍼
├── listDocumentTypes.ts            # MCP 도구 등록 + Zod 스키마
├── listDocumentTypesLogic.ts       # 순수 비즈니스 로직 (테스트 대상)
├── loadContextLogic.ts             # SUPPORTED_DOCUMENT_TYPES, DOCUMENT_PATTERNS 정의됨
└── __tests__/
    └── listDocumentTypes.test.ts   # 단위 테스트
```

### 기존 코드 재사용

Story 2.5는 loadContextLogic.ts에 이미 정의된 상수를 재사용합니다:

```typescript
// loadContextLogic.ts에서 가져올 것들
import {
  SUPPORTED_DOCUMENT_TYPES,   // 지원 문서 유형 배열
  DocumentType,                // 문서 유형 타입
} from './loadContextLogic.js';

// DOCUMENT_PATTERNS도 export 필요 (현재는 내부 상수)
const DOCUMENT_PATTERNS: Record<DocumentType, string> = {
  prd: "_bmad-output/*prd*.md",
  architecture: "_bmad-output/*architecture*.md",
  epic: "_bmad-output/epics.md",
  story: "_bmad-output/implementation-artifacts/stories/*.md",
  "project-context": "**/project-context.md",
  brainstorming: "_bmad-output/*brainstorming*.md",
};
```

**Note:** loadContextLogic.ts에서 `DOCUMENT_PATTERNS`를 export해야 할 수 있습니다.

### 응답 구조 설계

```typescript
// 성공 응답
interface ListDocumentTypesResponse {
  status: "success";
  document_types: DocumentTypeInfo[];
  total_count: number;
}

// 각 문서 유형 정보
interface DocumentTypeInfo {
  type: string;           // "prd", "architecture", etc.
  description: string;    // 용도 설명
  example: string;        // 파일 경로 예시
  glob_pattern: string;   // 실제 glob 패턴
}
```

### 문서 유형 메타데이터

| type | description | example |
|------|-------------|---------|
| prd | 제품 요구사항 문서 (PRD) | _bmad-output/prd.md |
| architecture | 아키텍처 결정 및 설계 문서 | _bmad-output/architecture.md |
| epic | Epic 및 Story 목록 | _bmad-output/epics.md |
| story | 개별 스토리 파일들 | _bmad-output/implementation-artifacts/stories/story-1-1.md |
| project-context | 프로젝트 컨텍스트 및 규칙 | _bmad-output/project-context.md |
| brainstorming | 브레인스토밍 및 아이디어 문서 | _bmad-output/brainstorming-session-*.md |

### Project Structure Notes

- **파일 위치**: `mcp-context-loader/src/tools/` 내 생성
- **네이밍 컨벤션**: camelCase (함수), kebab-case (파일)
- **의존성**: loadContextLogic.ts에서 SUPPORTED_DOCUMENT_TYPES, DocumentType import

### 간단한 도구

이 도구는 단순히 정적 메타데이터를 반환하므로:
- 캐싱 불필요 (정적 데이터)
- 에러 처리 최소화 (실패할 가능성 낮음)
- 파라미터 없음 (빈 inputSchema)

### References

- [Source: _bmad-output/epics.md#Story-2.5]
- [Source: mcp-context-loader/src/tools/loadContextLogic.ts#SUPPORTED_DOCUMENT_TYPES]
- [Source: _bmad-output/project-context.md#Critical-Implementation-Rules]
- [Source: _bmad-output/implementation-artifacts/stories/story-2-4a-get-story-context-parsing.md#Dev-Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

없음

### Completion Notes List

1. **TDD 접근법 적용**: 테스트 먼저 작성(RED) → 구현(GREEN) 순서로 진행
2. **2개 인터페이스 정의**: `DocumentTypeInfo`, `DocumentTypeMetadata`
3. **기존 코드 재사용**: `SUPPORTED_DOCUMENT_TYPES`, `DocumentType`를 loadContextLogic.ts에서 import
4. **DOCUMENT_PATTERNS 복제**: loadContextLogic.ts의 내부 상수를 listDocumentTypesLogic.ts에 재정의
5. **18개 테스트 추가**: 112개 → 130개 (14개 단위 테스트 + 4개 MCP 통합 테스트)
6. **AC 충족**:
   - AC1: 파라미터 없이 호출 (빈 inputSchema) ✓
   - AC2: 6가지 document_types 배열 반환 ✓
   - AC3: 각 유형에 description 포함 ✓
   - AC4: 각 유형에 example 포함 ✓
   - AC5: 각 유형에 glob_pattern 포함 ✓
   - AC6: total_count 필드 포함 ✓

### File List

**신규 생성:**
- `mcp-context-loader/src/tools/listDocumentTypesLogic.ts` - 비즈니스 로직 (~100줄)
- `mcp-context-loader/src/tools/listDocumentTypes.ts` - MCP 도구 등록 (~60줄)
- `mcp-context-loader/src/tools/__tests__/listDocumentTypes.test.ts` - 단위 테스트 (18개 테스트)

**수정:**
- `mcp-context-loader/src/tools/index.ts` - registerListDocumentTypesTool import 및 호출 추가
- `mcp-context-loader/src/tools/loadContextLogic.ts` - DOCUMENT_PATTERNS export 추가 (코드 리뷰 반영)

## Senior Developer Review (AI)

**리뷰어:** Claude Opus 4.5 | **날짜:** 2025-12-29

### 리뷰 결과: ✅ APPROVED

**발견 이슈 및 수정 완료:**

| 심각도 | 이슈 | 상태 |
|--------|------|------|
| MEDIUM | M1. DOCUMENT_PATTERNS 중복 정의 - DRY 원칙 위반 | ✅ 수정됨 |
| MEDIUM | M2. DocumentTypeMetadata 인터페이스 미export | ✅ 수정됨 |
| LOW | L1. 테스트에서 미사용 vi import | ✅ 수정됨 |

**수정 내용:**
1. `loadContextLogic.ts`에서 `DOCUMENT_PATTERNS` export하고 `listDocumentTypesLogic.ts`에서 재사용
2. `DocumentTypeMetadata` 인터페이스 export
3. 테스트 파일에서 미사용 `vi` import 제거

**검증:**
- ✅ typecheck 통과
- ✅ 18개 단위 테스트 통과
- ✅ loadContext 관련 21개 테스트도 통과 (변경 영향 없음)
- ✅ 모든 AC 충족

## Change Log

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-29 | Story 2.5 구현 완료 - list-document-types 도구 |
| 2025-12-29 | 코드 리뷰 완료 - 3개 이슈 수정 (M1, M2, L1), Status → done |
