/**
 * 작업 생성 로직
 * 새 작업을 생성하고 기본 템플릿으로 본문을 초기화합니다.
 */

import { getNotionClient, getTaskDatabaseId } from "../../notion/client.js";
import { parseTaskFromPage } from "../../utils/propertyParser.js";
import {
  buildTitleProperty,
  buildSelectProperty,
  buildMultiSelectProperty,
  buildDateProperty,
  buildNumberProperty,
  buildRelationProperty,
  buildRichTextProperty,
} from "../../utils/propertyBuilder.js";
import { markdownToBlocks } from "../../utils/markdownToBlocks.js";
import type { Task, CreateTaskInput } from "../../notion/types.js";

/**
 * 기본 작업 본문 템플릿
 */
const DEFAULT_TEMPLATE = `## 📋 개요
> 작업에 대한 간단한 설명

## 🎯 목표
- [ ] 목표 1
- [ ] 목표 2

## 📝 상세 내용
작업의 상세 내용 기술

## 🔗 관련 링크
-

---

## 📜 Changelog
<!-- 아래에 진행 로그가 자동으로 추가됩니다 -->
`;

/**
 * 새 작업을 생성합니다.
 * @param input 작업 생성 입력
 * @returns 생성된 Task 객체
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const notion = getNotionClient();
  const databaseId = getTaskDatabaseId();

  // 속성 빌드
  const properties = buildCreateProperties(input);

  // 본문 블록 생성
  const content = input.content || DEFAULT_TEMPLATE;
  const children = markdownToBlocks(content);

  // 페이지 생성
  const page = await notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties,
    children,
  });

  return parseTaskFromPage(page as any);
}

/**
 * CreateTaskInput을 Notion properties 객체로 변환
 */
function buildCreateProperties(input: CreateTaskInput): Record<string, any> {
  const props: Record<string, any> = {
    "작업 이름": buildTitleProperty(input.title),
  };

  if (input.status) {
    props["상태"] = buildSelectProperty(input.status);
  } else {
    props["상태"] = buildSelectProperty("시작 전");
  }

  if (input.issueType) {
    props["이슈구분"] = buildSelectProperty(input.issueType);
  }

  if (input.priority) {
    props["우선순위"] = buildSelectProperty(input.priority);
  }

  if (input.dueDate) {
    props["마감일"] = buildDateProperty(input.dueDate);
  }

  if (input.estimatedDays !== undefined) {
    props["예정기간"] = buildNumberProperty(input.estimatedDays);
  }

  if (input.tags && input.tags.length > 0) {
    props["태그"] = buildMultiSelectProperty(input.tags);
  }

  if (input.memo) {
    props["메모"] = buildRichTextProperty(input.memo);
  }

  if (input.sprintId) {
    props["스프린트"] = buildRelationProperty([input.sprintId]);
  }

  // 담당자는 People 타입으로, email → user_id 변환이 필요
  // 현재는 생략 (나중에 구현 필요)

  return props;
}
