/**
 * 인증 모듈
 * 토큰 기반 개발자 인증 및 세션 관리
 */

export interface AuthUser {
  email: string;
  name: string;
  token: string;
}

export interface AuthSession {
  user: AuthUser;
  authenticatedAt: Date;
}

// 인증된 세션 저장소 (sessionId -> AuthSession)
const authSessions = new Map<string, AuthSession>();

/**
 * 환경변수에서 사용자 정보를 파싱합니다.
 * AUTH_USERS=token1:email1:name1,token2:email2:name2
 */
export function parseAuthUsers(): Map<string, AuthUser> {
  const users = new Map<string, AuthUser>();
  const authUsersEnv = process.env.AUTH_USERS;

  if (!authUsersEnv) {
    console.warn("AUTH_USERS not configured - authentication disabled");
    return users;
  }

  const entries = authUsersEnv.split(",");
  for (const entry of entries) {
    const [token, email, name] = entry.trim().split(":");
    if (token && email && name) {
      users.set(token, { token, email, name });
    } else {
      console.warn(
        `Invalid AUTH_USERS entry (expected token:email:name): ${entry}`
      );
    }
  }

  console.log(`Loaded ${users.size} authenticated users`);
  return users;
}

// 싱글톤 사용자 맵
let authUsersMap: Map<string, AuthUser> | null = null;

export function getAuthUsers(): Map<string, AuthUser> {
  if (!authUsersMap) {
    authUsersMap = parseAuthUsers();
  }
  return authUsersMap;
}

/**
 * 토큰으로 사용자 조회
 */
export function authenticateToken(token: string): AuthUser | null {
  const users = getAuthUsers();
  return users.get(token) || null;
}

/**
 * 세션에 인증 정보 저장
 */
export function setAuthSession(sessionId: string, user: AuthUser): void {
  authSessions.set(sessionId, {
    user,
    authenticatedAt: new Date(),
  });
  console.log(
    `Auth session created: ${sessionId} for user ${user.email} (${user.name})`
  );
}

/**
 * 세션에서 인증 정보 조회
 */
export function getAuthSession(sessionId: string): AuthSession | null {
  return authSessions.get(sessionId) || null;
}

/**
 * 세션 인증 정보 삭제
 */
export function deleteAuthSession(sessionId: string): void {
  const session = authSessions.get(sessionId);
  if (session) {
    authSessions.delete(sessionId);
    console.log(`Auth session deleted: ${sessionId}`);
  }
}

/**
 * 인증 필수 여부
 */
export function isAuthRequired(): boolean {
  return process.env.AUTH_REQUIRED !== "false";
}
