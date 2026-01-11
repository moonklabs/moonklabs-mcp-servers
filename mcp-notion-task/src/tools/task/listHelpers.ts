/**
 * list 도구 헬퍼 함수들
 */

/**
 * assignee, useSessionUser, 세션 정보를 기반으로 최종 assignee를 결정합니다.
 *
 * 우선순위:
 * 1. assignee가 명시적으로 지정되면 → assignee 사용
 * 2. useSessionUser=true이고 세션 이메일이 있으면 → 세션 이메일 사용
 * 3. 그 외 → undefined (전체 조회)
 *
 * @param assignee 명시적으로 지정된 담당자 이메일
 * @param useSessionUser 세션 사용자로 필터링 여부
 * @param sessionEmail 세션 사용자 이메일
 * @returns 해석된 assignee 이메일 또는 undefined
 */
export function resolveAssignee(
  assignee: string | undefined,
  useSessionUser: boolean,
  sessionEmail: string | undefined
): string | undefined {
  if (assignee) {
    // assignee가 명시적으로 지정됨 - 최우선
    return assignee;
  } else if (useSessionUser && sessionEmail) {
    // 세션 사용자로 필터링
    return sessionEmail;
  }
  // 전체 조회
  return undefined;
}
