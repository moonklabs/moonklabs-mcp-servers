/**
 * 작업 ID 해석기
 * taskId (MKL-123) 또는 pageId (UUID) 둘 다 받아서 pageId로 변환합니다.
 */

import { getNotionClient } from "../notion/client.js";
import { getConfig } from "../config/index.js";

/**
 * UUID 형식인지 확인합니다.
 * Notion 페이지 ID는 32자 hex 또는 하이픈 포함 36자입니다.
 */
function isUUID(id: string): boolean {
  // 하이픈 없는 32자 hex
  if (/^[0-9a-f]{32}$/i.test(id)) return true;
  // 하이픈 포함 36자 UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return true;
  return false;
}

/**
 * 작업 ID (MKL-123) 형식인지 확인합니다.
 */
function isTaskId(id: string): boolean {
  return /^[A-Z]+-\d+$/i.test(id);
}

/**
 * 작업 ID를 파싱합니다.
 * @returns { prefix, number } 또는 null
 */
function parseTaskId(taskId: string): { prefix: string; number: number } | null {
  const match = taskId.match(/^([A-Z]+)-(\d+)$/i);
  if (!match) return null;
  return {
    prefix: match[1].toUpperCase(),
    number: parseInt(match[2], 10),
  };
}

/**
 * taskId (MKL-123) 또는 pageId (UUID)를 받아서 pageId로 변환합니다.
 *
 * @param id 작업 ID (MKL-123) 또는 페이지 ID (UUID)
 * @returns Notion 페이지 ID
 * @throws 작업을 찾을 수 없는 경우 에러
 */
export async function resolveToPageId(id: string): Promise<string> {
  // 이미 UUID 형식이면 그대로 반환
  if (isUUID(id)) {
    return id;
  }

  // taskId 형식인지 확인
  if (!isTaskId(id)) {
    throw new Error(`유효하지 않은 ID 형식입니다: ${id}\n- 작업 ID 예: MKL-123\n- 페이지 ID 예: 5222e31c-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
  }

  const parsed = parseTaskId(id);
  if (!parsed) {
    throw new Error(`작업 ID를 파싱할 수 없습니다: ${id}`);
  }

  // Notion DB에서 unique_id로 검색
  const notion = getNotionClient();
  const config = getConfig();

  const response = await notion.databases.query({
    database_id: config.notion.taskDatabaseId,
    filter: {
      property: "작업 ID",
      unique_id: {
        equals: parsed.number,
      },
    },
    page_size: 1,
  });

  if (response.results.length === 0) {
    throw new Error(`작업을 찾을 수 없습니다: ${id}`);
  }

  return response.results[0].id;
}

/**
 * ID 형식을 판별합니다.
 */
export function getIdType(id: string): "pageId" | "taskId" | "unknown" {
  if (isUUID(id)) return "pageId";
  if (isTaskId(id)) return "taskId";
  return "unknown";
}
