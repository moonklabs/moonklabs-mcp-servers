/**
 * 프롬프트 템플릿 테스트
 * TDD 방식으로 작성된 테스트 스위트
 */

import { describe, it, expect } from 'vitest';
import {
  createGreetingPrompt,
  createSummarizePrompt,
  createCodeReviewPrompt,
} from './promptLogic.js';

describe('Prompt Template Logic Functions', () => {
  describe('createGreetingPrompt', () => {
    it('이름을 포함한 인사 프롬프트를 생성해야 함', () => {
      const prompt = createGreetingPrompt('홍길동', 'formal');

      expect(prompt).toContain('홍길동');
      expect(prompt).toContain('정중');
    });

    it('casual 스타일을 지원해야 함', () => {
      const prompt = createGreetingPrompt('홍길동', 'casual');

      expect(prompt).toContain('홍길동');
      expect(prompt).toContain('편하게');
    });

    it('friendly 스타일을 지원해야 함', () => {
      const prompt = createGreetingPrompt('홍길동', 'friendly');

      expect(prompt).toContain('홍길동');
      expect(prompt).toContain('친근');
    });

    it('스타일이 없으면 friendly 기본값을 사용해야 함', () => {
      const prompt = createGreetingPrompt('홍길동');

      expect(prompt).toContain('홍길동');
      expect(prompt).toContain('친근');
    });
  });

  describe('createSummarizePrompt', () => {
    it('텍스트를 요약하는 프롬프트를 생성해야 함', () => {
      const text = '이것은 긴 텍스트입니다. 이것을 요약해야 합니다.';
      const prompt = createSummarizePrompt(text, 'short');

      expect(prompt).toContain(text);
      expect(prompt).toContain('간단');
    });

    it('medium 길이를 지원해야 함', () => {
      const prompt = createSummarizePrompt('text', 'medium');

      expect(prompt).toContain('적절한 길이');
    });

    it('long 길이를 지원해야 함', () => {
      const prompt = createSummarizePrompt('text', 'long');

      expect(prompt).toContain('상세');
    });

    it('기본값으로 적절한 길이를 사용해야 함', () => {
      const prompt = createSummarizePrompt('text');

      expect(prompt).toContain('적절한 길이');
    });
  });

  describe('createCodeReviewPrompt', () => {
    it('코드를 리뷰하는 프롬프트를 생성해야 함', () => {
      const code = 'const x = 1;';
      const prompt = createCodeReviewPrompt(code, 'typescript', 'security');

      expect(prompt).toContain(code);
      expect(prompt).toContain('typescript');
      expect(prompt).toContain('보안');
    });

    it('performance 초점을 지원해야 함', () => {
      const prompt = createCodeReviewPrompt('code', 'javascript', 'performance');

      expect(prompt).toContain('성능');
    });

    it('readability 초점을 지원해야 함', () => {
      const prompt = createCodeReviewPrompt('code', 'python', 'readability');

      expect(prompt).toContain('가독성');
    });

    it('all 초점을 지원해야 함', () => {
      const prompt = createCodeReviewPrompt('code', 'java', 'all');

      expect(prompt).toContain('전반적');
    });

    it('언어를 지정하지 않으면 기본값을 사용해야 함', () => {
      const prompt = createCodeReviewPrompt('code');

      expect(prompt).toContain('코드');
      expect(prompt).toBeDefined();
    });
  });
});
