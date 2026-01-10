/**
 * Notion 클라이언트 관리
 *
 * @notionhq/client를 싱글톤 패턴으로 관리합니다.
 * 환경변수 NOTION_API_KEY가 필수입니다.
 *
 * @module notion/client
 *
 * @example
 * ```typescript
 * import { getNotionClient } from './notion/client.js';
 *
 * const client = getNotionClient();
 * const page = await client.pages.retrieve({ page_id: 'xxx' });
 * ```
 */

import { Client } from "@notionhq/client";

// 싱글톤 인스턴스
let notionClient: Client | null = null;

/**
 * Notion 클라이언트 인스턴스를 반환합니다.
 * 싱글톤 패턴으로 한 번만 생성됩니다.
 *
 * @returns Notion 클라이언트 인스턴스
 * @throws NOTION_API_KEY 환경변수가 설정되지 않은 경우 에러
 *
 * @example
 * ```typescript
 * const client = getNotionClient();
 * const database = await client.databases.query({ database_id: 'xxx' });
 * ```
 */
export function getNotionClient(): Client {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "NOTION_API_KEY 환경변수가 설정되지 않았습니다. " +
          "Notion Integration Token을 생성하고 .env 파일에 NOTION_API_KEY를 설정하세요."
      );
    }
    notionClient = new Client({ auth: apiKey });
  }
  return notionClient;
}

/**
 * 테스트용: Notion 클라이언트 인스턴스를 리셋합니다.
 * 테스트 격리를 위해 사용합니다.
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetNotionClient();
 *   delete process.env.NOTION_API_KEY;
 * });
 * ```
 */
export function resetNotionClient(): void {
  notionClient = null;
}

/**
 * Notion API 연결을 테스트합니다.
 * 간단한 users.me() 호출로 API 키 유효성을 검증합니다.
 *
 * @returns 연결 성공 시 사용자 정보 객체
 * @throws API 키가 유효하지 않거나 네트워크 오류 시 에러
 *
 * @example
 * ```typescript
 * try {
 *   const user = await testNotionConnection();
 *   console.log('Connected as:', user.name);
 * } catch (error) {
 *   console.error('Connection failed:', error.message);
 * }
 * ```
 */
export async function testNotionConnection(): Promise<{
  id: string;
  type: string;
  name?: string;
}> {
  const client = getNotionClient();
  const response = await client.users.me({});
  return {
    id: response.id,
    type: response.type,
    // bot 타입의 경우 name이 null일 수 있어 undefined로 변환
    name: response.type === "bot" ? (response.name ?? undefined) : undefined,
  };
}
