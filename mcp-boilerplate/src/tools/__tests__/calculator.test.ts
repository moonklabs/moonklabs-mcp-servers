/**
 * 계산기 도구 테스트
 * TDD 방식으로 작성된 테스트 스위트
 */

import { describe, it, expect } from 'vitest';
import {
  add,
  subtract,
  multiply,
  divide,
  calculate,
} from '../calculatorLogic.js';

describe('Calculator Logic Functions', () => {
  describe('add', () => {
    it('두 양수를 더해야 함', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('음수를 포함한 덧셈', () => {
      expect(add(-2, 3)).toBe(1);
      expect(add(-2, -3)).toBe(-5);
    });

    it('소수를 더해야 함', () => {
      expect(add(1.5, 2.5)).toBe(4);
    });

    it('0을 더해야 함', () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe('subtract', () => {
    it('두 양수를 빼야 함', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('음수 결과를 반환할 수 있어야 함', () => {
      expect(subtract(3, 5)).toBe(-2);
    });

    it('음수를 포함한 뺄셈', () => {
      expect(subtract(-5, -3)).toBe(-2);
    });

    it('소수를 빼야 함', () => {
      expect(subtract(5.5, 2.5)).toBe(3);
    });
  });

  describe('multiply', () => {
    it('두 양수를 곱해야 함', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('음수를 곱해야 함', () => {
      expect(multiply(-3, 4)).toBe(-12);
      expect(multiply(-3, -4)).toBe(12);
    });

    it('0을 곱하면 0이어야 함', () => {
      expect(multiply(100, 0)).toBe(0);
    });

    it('소수를 곱해야 함', () => {
      expect(multiply(2.5, 4)).toBe(10);
    });
  });

  describe('divide', () => {
    it('두 양수를 나누어야 함', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('소수 결과를 반환할 수 있어야 함', () => {
      expect(divide(7, 2)).toBe(3.5);
    });

    it('음수를 나누어야 함', () => {
      expect(divide(-10, 2)).toBe(-5);
      expect(divide(-10, -2)).toBe(5);
    });

    it('0으로 나누면 에러를 throw해야 함', () => {
      expect(() => divide(10, 0)).toThrow('0으로 나눌 수 없습니다.');
    });

    it('0을 나누면 0이어야 함', () => {
      expect(divide(0, 5)).toBe(0);
    });
  });

  describe('calculate', () => {
    it('더하기 연산을 수행해야 함', () => {
      expect(calculate(5, '+', 3)).toBe(8);
    });

    it('빼기 연산을 수행해야 함', () => {
      expect(calculate(5, '-', 3)).toBe(2);
    });

    it('곱하기 연산을 수행해야 함', () => {
      expect(calculate(5, '*', 3)).toBe(15);
    });

    it('나누기 연산을 수행해야 함', () => {
      expect(calculate(6, '/', 2)).toBe(3);
    });

    it('0으로 나누기는 에러를 throw해야 함', () => {
      expect(() => calculate(10, '/', 0)).toThrow('0으로 나눌 수 없습니다.');
    });

    it('복합 연산을 수행해야 함', () => {
      expect(calculate(-10, '+', 5)).toBe(-5);
      expect(calculate(-10, '-', 5)).toBe(-15);
      expect(calculate(-10, '*', 5)).toBe(-50);
    });
  });
});
