/**
 * Notion Property 빌더 유틸리티
 * Notion API에 전달할 속성 객체를 생성하는 헬퍼 함수들입니다.
 */

/**
 * Title 속성 생성
 */
export function buildTitleProperty(title: string) {
  return {
    title: [
      {
        type: "text" as const,
        text: { content: title },
      },
    ],
  };
}

/**
 * Rich Text 속성 생성
 */
export function buildRichTextProperty(text: string) {
  return {
    rich_text: [
      {
        type: "text" as const,
        text: { content: text },
      },
    ],
  };
}

/**
 * Select 속성 생성
 */
export function buildSelectProperty(value: string) {
  return {
    select: { name: value },
  };
}

/**
 * Status 속성 생성
 * Notion의 status 타입 속성을 위한 빌더
 */
export function buildStatusProperty(value: string) {
  return {
    status: { name: value },
  };
}

/**
 * Multi-select 속성 생성
 */
export function buildMultiSelectProperty(values: string[]) {
  return {
    multi_select: values.map((name) => ({ name })),
  };
}

/**
 * Date 속성 생성 (날짜만)
 */
export function buildDateProperty(date: string) {
  return {
    date: { start: date },
  };
}

/**
 * Number 속성 생성
 */
export function buildNumberProperty(value: number) {
  return {
    number: value,
  };
}

/**
 * People 속성 생성 (이메일로 사용자 ID 조회 필요)
 * 참고: Notion API에서는 사용자 ID가 필요하므로,
 * 실제로는 email → user_id 매핑이 필요합니다.
 * 여기서는 user_id를 직접 받는 것으로 처리합니다.
 */
export function buildPeopleProperty(userIds: string[]) {
  return {
    people: userIds.map((id) => ({ id })),
  };
}

/**
 * Relation 속성 생성
 */
export function buildRelationProperty(pageIds: string[]) {
  return {
    relation: pageIds.map((id) => ({ id })),
  };
}

/**
 * Checkbox 속성 생성
 */
export function buildCheckboxProperty(checked: boolean) {
  return {
    checkbox: checked,
  };
}

/**
 * 속성 객체 빌더 (여러 속성을 한 번에 생성)
 * undefined 값은 제외됩니다.
 */
export function buildProperties(
  props: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}
