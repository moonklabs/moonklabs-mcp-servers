/**
 * 리소스의 비즈니스 로직
 * 순수 함수로 구성되어 테스트하기 쉬움
 */

/**
 * 기본 인사말 리소스를 반환합니다.
 */
export function getGreetingResource(): string {
  return '안녕하세요! MCP 서버에 오신 것을 환영합니다.';
}

/**
 * 서버 설정 리소스를 JSON 문자열로 반환합니다.
 */
export function getConfigResource(): string {
  const config = {
    name: 'mcp-boilerplate',
    version: '1.0.0',
    features: ['tools', 'resources', 'prompts'],
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(config, null, 2);
}

/**
 * 사용자 프로필 리소스를 반환합니다.
 * @param userId 사용자 ID
 * @returns 사용자 프로필 JSON 문자열
 */
export function getUserProfileResource(userId: string): string {
  const mockProfiles: Record<string, object> = {
    '1': { id: '1', name: '홍길동', email: 'hong@example.com' },
    '2': { id: '2', name: '김철수', email: 'kim@example.com' },
    '3': { id: '3', name: '이영희', email: 'lee@example.com' },
  };

  const profile = mockProfiles[userId] || {
    error: '사용자를 찾을 수 없습니다.',
    userId,
  };

  return JSON.stringify(profile, null, 2);
}
