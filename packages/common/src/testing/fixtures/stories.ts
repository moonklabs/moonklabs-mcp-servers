/**
 * Story 관련 테스트 Fixtures
 *
 * Story, Epic 등 BMAD 관련 테스트 데이터를 생성하는 팩토리 함수들입니다.
 *
 * @module testing/fixtures/stories
 *
 * @example
 * ```typescript
 * import { createMockStory, createMockEpic } from '@moonklabs/mcp-common';
 *
 * // 기본 Story 생성
 * const story = createMockStory();
 *
 * // 커스터마이징
 * const customStory = createMockStory({
 *   id: 'story-2-1',
 *   title: 'Custom Story',
 *   status: 'in-progress',
 * });
 * ```
 */

/**
 * Mock Story 타입
 */
export interface MockStory {
  /** Story ID (예: 'story-1-1') */
  id: string;
  /** Story 제목 */
  title: string;
  /** Story 상태 */
  status: 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
  /** Epic ID */
  epicId: string;
  /** Acceptance Criteria 목록 */
  acceptanceCriteria: string[];
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

/**
 * Mock Epic 타입
 */
export interface MockEpic {
  /** Epic ID (예: 'epic-1') */
  id: string;
  /** Epic 제목 */
  title: string;
  /** Epic 상태 */
  status: 'backlog' | 'in-progress' | 'done';
  /** 포함된 Story ID 목록 */
  storyIds: string[];
  /** Epic 설명 */
  description: string;
}

/**
 * Story 생성 옵션
 */
export interface CreateMockStoryOptions {
  /** Story ID */
  id?: string;
  /** Story 제목 */
  title?: string;
  /** Story 상태 */
  status?: MockStory['status'];
  /** Epic ID */
  epicId?: string;
  /** Acceptance Criteria 목록 */
  acceptanceCriteria?: string[];
  /** 생성일 */
  createdAt?: string;
  /** 수정일 */
  updatedAt?: string;
}

/**
 * Epic 생성 옵션
 */
export interface CreateMockEpicOptions {
  /** Epic ID */
  id?: string;
  /** Epic 제목 */
  title?: string;
  /** Epic 상태 */
  status?: MockEpic['status'];
  /** 포함된 Story ID 목록 */
  storyIds?: string[];
  /** Epic 설명 */
  description?: string;
}

/**
 * Mock Story 생성
 *
 * 테스트용 Story 객체를 생성합니다. 모든 필드에 기본값이 제공됩니다.
 *
 * @param overrides - 기본값을 덮어쓸 옵션
 * @returns MockStory 객체
 *
 * @example
 * ```typescript
 * // 기본 Story
 * const story = createMockStory();
 * // { id: 'story-1-1', title: 'Test Story', status: 'ready-for-dev', ... }
 *
 * // 커스텀 Story
 * const story = createMockStory({
 *   id: 'story-2-3',
 *   status: 'in-progress',
 *   acceptanceCriteria: ['AC1: 기능 구현', 'AC2: 테스트 통과'],
 * });
 * ```
 */
export function createMockStory(overrides: CreateMockStoryOptions = {}): MockStory {
  const now = new Date().toISOString();

  return {
    id: overrides.id ?? 'story-1-1',
    title: overrides.title ?? 'Test Story',
    status: overrides.status ?? 'ready-for-dev',
    epicId: overrides.epicId ?? 'epic-1',
    acceptanceCriteria: overrides.acceptanceCriteria ?? ['AC1: 기본 기능 구현', 'AC2: 단위 테스트 통과'],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Mock Epic 생성
 *
 * 테스트용 Epic 객체를 생성합니다. 모든 필드에 기본값이 제공됩니다.
 *
 * @param overrides - 기본값을 덮어쓸 옵션
 * @returns MockEpic 객체
 *
 * @example
 * ```typescript
 * // 기본 Epic
 * const epic = createMockEpic();
 * // { id: 'epic-1', title: 'Test Epic', status: 'backlog', ... }
 *
 * // 커스텀 Epic
 * const epic = createMockEpic({
 *   id: 'epic-2',
 *   status: 'in-progress',
 *   storyIds: ['story-2-1', 'story-2-2'],
 * });
 * ```
 */
export function createMockEpic(overrides: CreateMockEpicOptions = {}): MockEpic {
  return {
    id: overrides.id ?? 'epic-1',
    title: overrides.title ?? 'Test Epic',
    status: overrides.status ?? 'backlog',
    storyIds: overrides.storyIds ?? ['story-1-1', 'story-1-2'],
    description: overrides.description ?? 'Test Epic Description',
  };
}

/**
 * 여러 Mock Story 생성
 *
 * 지정된 개수만큼 Story 객체를 생성합니다.
 *
 * @param count - 생성할 Story 개수
 * @param baseOverrides - 모든 Story에 적용할 기본 옵션
 * @returns MockStory 배열
 *
 * @example
 * ```typescript
 * // 3개의 Story 생성
 * const stories = createMockStories(3);
 * // [{ id: 'story-1-1' }, { id: 'story-1-2' }, { id: 'story-1-3' }]
 *
 * // 특정 Epic에 속한 Story들 생성
 * const stories = createMockStories(2, { epicId: 'epic-2', status: 'done' });
 * ```
 */
export function createMockStories(
  count: number,
  baseOverrides: CreateMockStoryOptions = {}
): MockStory[] {
  return Array.from({ length: count }, (_, index) => {
    const storyNumber = index + 1;
    const epicNumber = baseOverrides.epicId
      ? parseInt(baseOverrides.epicId.replace('epic-', ''), 10) || 1
      : 1;

    return createMockStory({
      ...baseOverrides,
      id: baseOverrides.id ?? `story-${epicNumber}-${storyNumber}`,
      title: baseOverrides.title ?? `Test Story ${storyNumber}`,
    });
  });
}
