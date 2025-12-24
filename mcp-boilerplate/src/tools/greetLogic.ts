/**
 * 인사 도구의 비즈니스 로직
 * 순수 함수로 구성되어 테스트하기 쉬움
 */

/**
 * 이름을 받아 인사말을 생성합니다.
 * @param name 인사할 대상의 이름
 * @returns 생성된 인사말
 */
export function createGreetMessage(name: string): string {
  return `안녕하세요, ${name}님! 반갑습니다.`;
}

/**
 * 여러 인사말을 생성합니다.
 * @param name 인사할 대상의 이름
 * @param count 생성할 인사말의 개수 (기본값: 3, 최대: 5, 최소: 1)
 * @returns 인사말 배열
 */
export function createMultiGreetMessages(
  name: string,
  count: number = 3
): string[] {
  // count를 1~5 범위로 정규화
  const normalizedCount = Math.max(1, Math.min(5, count));

  const messages = [
    `${name}님, 안녕하세요!`,
    `${name}님, 오늘 하루도 좋은 하루 되세요!`,
    `${name}님, 만나서 반갑습니다!`,
    `${name}님, 항상 건강하세요!`,
    `${name}님, 좋은 일만 가득하길 바랍니다!`,
  ];

  const greetings: string[] = [];
  for (let i = 0; i < normalizedCount; i++) {
    greetings.push(`${i + 1}. ${messages[i % messages.length]}`);
  }

  return greetings;
}
