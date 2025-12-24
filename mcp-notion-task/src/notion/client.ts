/**
 * Notion API 클라이언트 모듈
 * Notion SDK 인스턴스를 생성하고 관리합니다.
 */

import { Client } from "@notionhq/client";
import { getConfig } from "../config/index.js";

// 싱글톤 클라이언트 인스턴스
let notionClient: Client | null = null;

/**
 * Notion 클라이언트 인스턴스를 가져옵니다.
 * 첫 호출 시 클라이언트를 초기화합니다.
 */
export function getNotionClient(): Client {
  if (!notionClient) {
    const config = getConfig();
    notionClient = new Client({
      auth: config.notion.token,
    });
  }
  return notionClient;
}

/**
 * MKL작업 데이터베이스 ID를 가져옵니다.
 */
export function getTaskDatabaseId(): string {
  return getConfig().notion.taskDatabaseId;
}

/**
 * MKL스프린트 데이터베이스 ID를 가져옵니다.
 */
export function getSprintDatabaseId(): string {
  return getConfig().notion.sprintDatabaseId;
}
