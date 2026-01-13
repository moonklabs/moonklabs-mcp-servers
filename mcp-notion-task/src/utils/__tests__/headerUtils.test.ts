/**
 * headerUtils 테스트
 */

import { describe, it, expect } from "vitest";
import { getUserIdFromHeader } from "../headerUtils.js";

describe("getUserIdFromHeader", () => {
  it("헤더 객체에서 X-User-Id 추출", () => {
    const extra = {
      requestInfo: {
        headers: {
          'x-user-id': 'hong'
        }
      }
    };

    expect(getUserIdFromHeader(extra)).toBe('hong');
  });

  it("헤더.get() 메서드로 X-User-Id 추출", () => {
    const extra = {
      requestInfo: {
        headers: {
          get: (name: string) => name === 'x-user-id' ? 'kim' : null
        }
      }
    };

    expect(getUserIdFromHeader(extra)).toBe('kim');
  });

  it("배열 값이면 첫 번째 값 반환", () => {
    const extra = {
      requestInfo: {
        headers: {
          'x-user-id': ['dosunyun', 'other']
        }
      }
    };

    expect(getUserIdFromHeader(extra)).toBe('dosunyun');
  });

  it("헤더가 없으면 undefined 반환", () => {
    expect(getUserIdFromHeader(undefined)).toBeUndefined();
  });

  it("requestInfo가 없으면 undefined 반환", () => {
    const extra = {};
    expect(getUserIdFromHeader(extra)).toBeUndefined();
  });

  it("headers가 없으면 undefined 반환", () => {
    const extra = {
      requestInfo: {}
    };
    expect(getUserIdFromHeader(extra)).toBeUndefined();
  });

  it("x-user-id 헤더가 없으면 undefined 반환", () => {
    const extra = {
      requestInfo: {
        headers: {
          'other-header': 'value'
        }
      }
    };
    expect(getUserIdFromHeader(extra)).toBeUndefined();
  });

  it("빈 문자열이면 undefined 반환", () => {
    const extra = {
      requestInfo: {
        headers: {
          'x-user-id': ''
        }
      }
    };
    expect(getUserIdFromHeader(extra)).toBeUndefined();
  });

  it("빈 배열이면 undefined 반환", () => {
    const extra = {
      requestInfo: {
        headers: {
          'x-user-id': []
        }
      }
    };
    expect(getUserIdFromHeader(extra)).toBeUndefined();
  });
});
