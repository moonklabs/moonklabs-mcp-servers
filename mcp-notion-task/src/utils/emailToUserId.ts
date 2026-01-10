/**
 * 이메일 주소로 Notion 사용자 UUID를 조회하는 유틸리티
 * Notion API는 people 필터에서 이메일을 직접 지원하지 않으므로
 * users.list API로 전체 사용자를 조회한 후 매칭합니다.
 */

import { getNotionClient } from "../notion/client.js";
import type { Client } from "@notionhq/client";

/**
 * 사용자 정보 캐시 (메모리 기반)
 * 키: 이메일, 값: { id: UUID, name: string }
 */
const userCache = new Map<string, { id: string; name: string }>();

/**
 * 캐시 유효 시간 (5분)
 */
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * 이메일 주소로 Notion 사용자 UUID를 조회합니다.
 *
 * @param email - Notion 사용자 이메일 주소
 * @returns Notion 사용자 UUID
 * @throws {Error} 사용자를 찾을 수 없는 경우
 */
export async function emailToUserId(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();

  // 캐시 확인
  if (userCache.has(normalizedEmail) && Date.now() - cacheTimestamp < CACHE_TTL) {
    return userCache.get(normalizedEmail)!.id;
  }

  // 캐시 만료 또는 없음 → API 조회
  await refreshUserCache();

  // 캐시에서 다시 검색
  const user = userCache.get(normalizedEmail);
  if (!user) {
    throw new Error(
      `Notion 사용자를 찾을 수 없습니다: ${email}\n` +
      `워크스페이스에 등록된 사용자인지 확인해주세요.`
    );
  }

  return user.id;
}

/**
 * 사용자 캐시를 갱신합니다.
 * Notion users.list API로 전체 사용자를 조회합니다.
 */
async function refreshUserCache(): Promise<void> {
  const notion = getNotionClient();

  try {
    userCache.clear();

    // 페이지네이션 처리
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.users.list({
        start_cursor: startCursor,
        page_size: 100, // 최대값
      });

      // 응답에서 사용자 정보 추출
      for (const user of response.results) {
        // type이 'person'이고 이메일이 있는 경우만 캐시
        if (user.type === "person" && "person" in user && user.person?.email) {
          const email = user.person.email.toLowerCase().trim();
          const name = user.name || email;

          userCache.set(email, { id: user.id, name });
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    cacheTimestamp = Date.now();
  } catch (error) {
    throw new Error(
      `Notion 사용자 목록 조회 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 여러 이메일을 UUID로 일괄 변환합니다.
 *
 * @param emails - 이메일 주소 배열
 * @returns 이메일 → UUID 맵
 */
export async function emailsToUserIds(emails: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // 캐시 갱신 (한 번만)
  if (userCache.size === 0 || Date.now() - cacheTimestamp >= CACHE_TTL) {
    await refreshUserCache();
  }

  for (const email of emails) {
    try {
      const userId = await emailToUserId(email);
      result.set(email, userId);
    } catch (error) {
      // 개별 실패는 무시하고 계속 진행
      console.warn(`이메일 → UUID 변환 실패: ${email}`, error);
    }
  }

  return result;
}

/**
 * 캐시를 수동으로 갱신합니다.
 * 테스트나 초기화 시 사용.
 */
export async function refreshCache(): Promise<void> {
  await refreshUserCache();
}

/**
 * 캐시를 초기화합니다.
 * 테스트 시 사용.
 */
export function clearCache(): void {
  userCache.clear();
  cacheTimestamp = 0;
}
