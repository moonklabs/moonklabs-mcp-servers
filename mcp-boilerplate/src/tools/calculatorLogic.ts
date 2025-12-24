/**
 * 계산기 도구의 비즈니스 로직
 * 순수 함수로 구성되어 테스트하기 쉬움
 */

/**
 * 두 수를 더합니다.
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 첫 번째 수에서 두 번째 수를 뺍니다.
 */
export function subtract(a: number, b: number): number {
  return a - b;
}

/**
 * 두 수를 곱합니다.
 */
export function multiply(a: number, b: number): number {
  return a * b;
}

/**
 * 첫 번째 수를 두 번째 수로 나눕니다.
 * @throws 두 번째 수가 0이면 에러 발생
 */
export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('0으로 나눌 수 없습니다.');
  }
  return a / b;
}

/**
 * 주어진 연산자로 두 수를 계산합니다.
 * @param a 첫 번째 수
 * @param operator 연산자 (+, -, *, /)
 * @param b 두 번째 수
 * @returns 계산 결과
 * @throws 유효하지 않은 연산자이거나 0으로 나눌 때
 */
export function calculate(
  a: number,
  operator: '+' | '-' | '*' | '/',
  b: number
): number {
  switch (operator) {
    case '+':
      return add(a, b);
    case '-':
      return subtract(a, b);
    case '*':
      return multiply(a, b);
    case '/':
      return divide(a, b);
    default:
      throw new Error(`유효하지 않은 연산자: ${operator}`);
  }
}
