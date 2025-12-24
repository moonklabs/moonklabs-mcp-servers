/**
 * greet 도구 테스트
 * TDD 방식으로 작성된 테스트 스위트
 */

import { describe, it, expect } from 'vitest';
import {
  createGreetMessage,
  createMultiGreetMessages,
} from '../greetLogic.js';

describe('Greet Logic Functions', () => {
  describe('createGreetMessage', () => {
    it('이름을 포함한 인사말을 생성해야 함', () => {
      const message = createGreetMessage('홍길동');

      expect(message).toContain('홍길동');
      expect(message).toContain('안녕하세요');
      expect(message).toContain('반갑습니다');
    });

    it('다른 이름에 대해 올바른 인사말을 생성해야 함', () => {
      const message1 = createGreetMessage('김철수');
      const message2 = createGreetMessage('이영희');

      expect(message1).toContain('김철수');
      expect(message2).toContain('이영희');
    });

    it('빈 이름에 대해서도 인사말을 생성해야 함', () => {
      const message = createGreetMessage('');

      expect(message).toContain('안녕하세요');
    });
  });

  describe('createMultiGreetMessages', () => {
    it('지정된 횟수만큼 인사말을 생성해야 함', () => {
      const messages = createMultiGreetMessages('홍길동', 2);

      expect(messages).toHaveLength(2);
      expect(messages[0]).toContain('1.');
      expect(messages[1]).toContain('2.');
    });

    it('3개 인사말을 생성할 때 모두 다른 내용이어야 함', () => {
      const messages = createMultiGreetMessages('홍길동', 3);

      expect(messages).toHaveLength(3);
      // 각 인사말이 고유해야 함
      const uniqueMessages = new Set(messages);
      expect(uniqueMessages.size).toBe(3);
    });

    it('기본값으로 3개 인사말을 생성해야 함', () => {
      const messages = createMultiGreetMessages('홍길동');

      expect(messages).toHaveLength(3);
    });

    it('최대값 5개까지 인사말을 생성해야 함', () => {
      const messages = createMultiGreetMessages('홍길동', 5);

      expect(messages).toHaveLength(5);
    });

    it('count가 5를 초과하면 5개만 생성해야 함', () => {
      const messages = createMultiGreetMessages('홍길동', 10);

      expect(messages.length).toBeLessThanOrEqual(5);
    });

    it('count가 1 미만이면 1개만 생성해야 함', () => {
      const messages = createMultiGreetMessages('홍길동', 0);

      expect(messages).toHaveLength(1);
    });
  });
});
