/**
 * Notion Property 파서 유틸리티
 * Notion API 응답에서 속성 값을 추출하는 헬퍼 함수들입니다.
 */

import type { Task, TaskStatus, IssueType, Priority } from "../notion/types.js";

// Notion API 응답 타입 (간소화)
type NotionPage = {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
};

/**
 * Title 속성에서 텍스트 추출
 */
export function parseTitle(property: any): string {
  return property?.title?.[0]?.text?.content || "";
}

/**
 * Rich Text 속성에서 텍스트 추출
 */
export function parseRichText(property: any): string {
  return property?.rich_text?.[0]?.text?.content || "";
}

/**
 * Select 속성에서 값 추출
 */
export function parseSelect(property: any): string | undefined {
  return property?.select?.name;
}

/**
 * Multi-select 속성에서 값 배열 추출
 */
export function parseMultiSelect(property: any): string[] {
  return property?.multi_select?.map((item: any) => item.name) || [];
}

/**
 * Date 속성에서 시작 날짜 추출
 */
export function parseDate(property: any): string | undefined {
  return property?.date?.start;
}

/**
 * Number 속성에서 값 추출
 */
export function parseNumber(property: any): number | undefined {
  return property?.number ?? undefined;
}

/**
 * People 속성에서 이메일 목록 추출
 */
export function parsePeople(property: any): string[] {
  return (
    property?.people?.map(
      (person: any) => person.person?.email || person.name || ""
    ) || []
  );
}

/**
 * Relation 속성에서 페이지 ID 추출
 */
export function parseRelation(property: any): string | undefined {
  return property?.relation?.[0]?.id;
}

/**
 * Notion 페이지를 Task 객체로 변환
 * MKL작업 데이터베이스의 속성 이름에 맞춰 파싱합니다.
 *
 * 예상 속성 이름:
 * - 이름: title
 * - 상태: select
 * - 담당자(정): people
 * - 담당자(부): people
 * - 스프린트: relation
 * - 프로젝트: relation
 * - 이슈 타입: select
 * - 우선순위: select
 * - 마감일: date
 * - 예정기간: number
 * - 태그: multi_select
 * - 메모: rich_text
 */
export function parseTaskFromPage(page: NotionPage): Task {
  const props = page.properties;

  return {
    id: page.id,
    title: parseTitle(props["작업 이름"]),
    status: (parseSelect(props["상태"]) || "시작 전") as TaskStatus,
    assignees: parsePeople(props["담당자"]),
    subAssignees: parsePeople(props["담당자(부)"]),
    sprintId: parseRelation(props["스프린트"]),
    projectId: parseRelation(props["프로젝트"]),
    issueType: parseSelect(props["이슈구분"]) as IssueType | undefined,
    priority: parseSelect(props["우선순위"]) as Priority | undefined,
    dueDate: parseDate(props["마감일"]),
    estimatedDays: parseNumber(props["예정기간"]),
    tags: parseMultiSelect(props["태그"]),
    memo: parseRichText(props["메모"]),
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

/**
 * 작업 목록을 Task 배열로 변환
 */
export function parseTasksFromPages(pages: NotionPage[]): Task[] {
  return pages.map(parseTaskFromPage);
}
