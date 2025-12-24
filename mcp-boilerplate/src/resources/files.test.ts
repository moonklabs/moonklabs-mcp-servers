/**
 * 파일 리소스 테스트
 * TDD 방식으로 작성된 테스트 스위트
 */

import { describe, it, expect } from 'vitest';
import {
  getGreetingResource,
  getConfigResource,
  getUserProfileResource,
} from './resourceLogic.js';

describe('Resource Logic Functions', () => {
  describe('getGreetingResource', () => {
    it('기본 인사말 리소스를 반환해야 함', () => {
      const resource = getGreetingResource();

      expect(resource).toContain('안녕하세요');
      expect(resource).toContain('환영합니다');
    });
  });

  describe('getConfigResource', () => {
    it('서버 설정을 JSON 형식으로 반환해야 함', () => {
      const configJson = getConfigResource();
      const config = JSON.parse(configJson);

      expect(config.name).toBe('mcp-boilerplate');
      expect(config.version).toBe('1.0.0');
      expect(config.features).toContain('tools');
      expect(config.features).toContain('resources');
      expect(config.features).toContain('prompts');
    });

    it('설정에 timestamp가 포함되어야 함', () => {
      const configJson = getConfigResource();
      const config = JSON.parse(configJson);

      expect(config.timestamp).toBeDefined();
      expect(config.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('getUserProfileResource', () => {
    it('존재하는 사용자 프로필을 반환해야 함', () => {
      const profileJson = getUserProfileResource('1');
      const profile = JSON.parse(profileJson);

      expect(profile.id).toBe('1');
      expect(profile.name).toBe('홍길동');
      expect(profile.email).toContain('@');
    });

    it('존재하지 않는 사용자는 에러 메시지를 반환해야 함', () => {
      const profileJson = getUserProfileResource('999');
      const profile = JSON.parse(profileJson);

      expect(profile.error).toBeDefined();
      expect(profile.error).toContain('찾을 수 없습니다');
    });

    it('여러 사용자 프로필을 조회할 수 있어야 함', () => {
      const profile1 = JSON.parse(getUserProfileResource('1'));
      const profile2 = JSON.parse(getUserProfileResource('2'));
      const profile3 = JSON.parse(getUserProfileResource('3'));

      expect(profile1.name).not.toBe(profile2.name);
      expect(profile2.name).not.toBe(profile3.name);
      expect(profile1.name).toBe('홍길동');
      expect(profile2.name).toBe('김철수');
      expect(profile3.name).toBe('이영희');
    });
  });
});
