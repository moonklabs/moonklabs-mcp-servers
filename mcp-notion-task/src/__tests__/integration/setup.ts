/**
 * 통합 테스트 설정
 * 실제 Notion API를 호출하는 테스트를 위한 설정 및 유틸리티
 */

import "dotenv/config";
import { archiveTask } from "../../tools/task/archiveLogic.js";

/**
 * 테스트용 상수
 */
export const TEST_CONFIG = {
  sprintNumber: 51,              // 현재 활성 스프린트
  testUserId: "dosunyun",
  testEmail: "dosunyun@moonklabs.com",
};

/**
 * 생성된 테스트 데이터 추적 (자동 정리용)
 */
const createdTaskIds: string[] = [];
const createdInboxIds: string[] = [];

/**
 * 생성된 작업 ID 추적
 */
export function trackCreatedTask(pageId: string): void {
  createdTaskIds.push(pageId);
  console.log(`[TEST] Tracked task: ${pageId}`);
}

/**
 * 생성된 Inbox ID 추적
 */
export function trackCreatedInbox(pageId: string): void {
  createdInboxIds.push(pageId);
  console.log(`[TEST] Tracked inbox: ${pageId}`);
}

/**
 * 테스트 후 정리 (자동 archive)
 * 테스트에서 생성한 모든 작업을 보관 처리
 */
export async function cleanupTestData(): Promise<void> {
  console.log(`[TEST] Cleaning up ${createdTaskIds.length} tasks and ${createdInboxIds.length} inbox items...`);

  // Task 정리
  for (const pageId of createdTaskIds) {
    try {
      await archiveTask(pageId);
      console.log(`[TEST] Archived task: ${pageId}`);
    } catch (error) {
      console.error(`[TEST] Failed to archive task ${pageId}:`, error);
    }
  }

  // Inbox 정리 (Notion API archive 사용)
  for (const pageId of createdInboxIds) {
    try {
      const { getNotionClient } = await import("../../notion/client.js");
      const notion = getNotionClient();
      await notion.pages.update({
        page_id: pageId,
        archived: true,
      });
      console.log(`[TEST] Archived inbox: ${pageId}`);
    } catch (error) {
      console.error(`[TEST] Failed to archive inbox ${pageId}:`, error);
    }
  }

  // 추적 배열 초기화
  createdTaskIds.length = 0;
  createdInboxIds.length = 0;
}

/**
 * 테스트 간 딜레이 (Rate limit 방지)
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
