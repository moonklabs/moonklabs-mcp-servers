/**
 * 사용자 ID를 이메일 주소로 변환합니다.
 * userId (이메일 앞부분) + EMAIL_DOMAIN 환경변수 = 전체 이메일
 */

/**
 * 환경변수에서 이메일 도메인을 가져옵니다.
 */
function getEmailDomain(): string {
  const domain = process.env.EMAIL_DOMAIN;
  if (!domain) {
    throw new Error("EMAIL_DOMAIN 환경변수가 설정되지 않았습니다.");
  }
  return domain;
}

/**
 * 사용자 ID를 전체 이메일 주소로 변환합니다.
 *
 * @param userId - 이메일 앞부분 (예: "hong")
 * @returns 전체 이메일 주소 (예: "hong@moonklabs.com")
 *
 * @example
 * ```typescript
 * // EMAIL_DOMAIN=moonklabs.com 환경변수 설정 시
 * userIdToEmail("hong") // "hong@moonklabs.com"
 * ```
 */
export function userIdToEmail(userId: string): string {
  const domain = getEmailDomain();
  return `${userId}@${domain}`;
}
