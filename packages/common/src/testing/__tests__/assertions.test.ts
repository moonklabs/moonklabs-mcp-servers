/**
 * MCP Assertion 헬퍼 테스트
 */

import { describe, it, expect } from 'vitest';
import { assertMcpSuccess, assertMcpError, assertMcpContent } from '../assertions.js';
import type { McpToolResult } from '../../types/mcp.js';

describe('assertMcpSuccess', () => {
  it('성공 응답을 올바르게 검증해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Success!' }],
      isError: false,
    };

    // 에러 없이 통과해야 함
    expect(() => assertMcpSuccess(response)).not.toThrow();
  });

  it('isError가 undefined인 경우도 성공으로 처리해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Success!' }],
      // isError 생략
    };

    expect(() => assertMcpSuccess(response)).not.toThrow();
  });

  it('expectedText가 포함된 응답을 검증해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Hello World!' }],
      isError: false,
    };

    expect(() => assertMcpSuccess(response, 'World')).not.toThrow();
  });

  it('expectedText가 없는 경우 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Hello!' }],
      isError: false,
    };

    expect(() => assertMcpSuccess(response, 'World')).toThrow();
  });

  it('isError가 true인 경우 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Error!' }],
      isError: true,
    };

    expect(() => assertMcpSuccess(response)).toThrow();
  });

  it('빈 content 배열인 경우 실패해야 함', () => {
    const response: McpToolResult = {
      content: [],
      isError: false,
    };

    expect(() => assertMcpSuccess(response)).toThrow();
  });

  it('undefined 응답인 경우 실패해야 함', () => {
    expect(() => assertMcpSuccess(undefined as unknown as McpToolResult)).toThrow();
  });

  it('null 응답인 경우 실패해야 함', () => {
    expect(() => assertMcpSuccess(null as unknown as McpToolResult)).toThrow();
  });

  it('content가 배열이 아닌 경우 실패해야 함', () => {
    const response = {
      content: 'not an array',
      isError: false,
    } as unknown as McpToolResult;

    expect(() => assertMcpSuccess(response)).toThrow();
  });
});

describe('assertMcpError', () => {
  it('에러 응답을 올바르게 검증해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'NOTION_NOT_FOUND: Story를 찾을 수 없습니다' }],
      isError: true,
    };

    expect(() => assertMcpError(response)).not.toThrow();
  });

  it('expectedCode가 포함된 응답을 검증해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'NOTION_NOT_FOUND: Story를 찾을 수 없습니다' }],
      isError: true,
    };

    expect(() => assertMcpError(response, 'NOTION_NOT_FOUND')).not.toThrow();
  });

  it('expectedMessage가 포함된 응답을 검증해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'NOTION_NOT_FOUND: Story를 찾을 수 없습니다' }],
      isError: true,
    };

    expect(() => assertMcpError(response, undefined, 'Story를 찾을 수 없습니다')).not.toThrow();
  });

  it('expectedCode와 expectedMessage 모두 검증해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'NOTION_RATE_LIMIT: Rate limit exceeded' }],
      isError: true,
    };

    expect(() => assertMcpError(response, 'NOTION_RATE_LIMIT', 'Rate limit')).not.toThrow();
  });

  it('isError가 false인 경우 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Success!' }],
      isError: false,
    };

    expect(() => assertMcpError(response)).toThrow();
  });

  it('예상 코드가 없는 경우 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'NOTION_NOT_FOUND: Error' }],
      isError: true,
    };

    expect(() => assertMcpError(response, 'NOTION_RATE_LIMIT')).toThrow();
  });

  it('undefined 응답인 경우 실패해야 함', () => {
    expect(() => assertMcpError(undefined as unknown as McpToolResult)).toThrow();
  });

  it('null 응답인 경우 실패해야 함', () => {
    expect(() => assertMcpError(null as unknown as McpToolResult)).toThrow();
  });

  it('텍스트 콘텐츠가 없는 에러 응답은 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'image', data: 'base64...' }],
      isError: true,
    };

    expect(() => assertMcpError(response)).toThrow();
  });
});

describe('assertMcpContent', () => {
  it('매처 함수가 true를 반환하면 통과해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: '{"status": "success"}' }],
      isError: false,
    };

    expect(() =>
      assertMcpContent(response, (text) => {
        const data = JSON.parse(text);
        return data.status === 'success';
      })
    ).not.toThrow();
  });

  it('매처 함수가 false를 반환하면 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: '{"status": "error"}' }],
      isError: false,
    };

    expect(() =>
      assertMcpContent(response, (text) => {
        const data = JSON.parse(text);
        return data.status === 'success';
      })
    ).toThrow();
  });

  it('특정 문자열 포함 여부를 검증할 수 있어야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'text', text: 'Hello World!' }],
      isError: false,
    };

    expect(() => assertMcpContent(response, (text) => text.includes('World'))).not.toThrow();
    expect(() => assertMcpContent(response, (text) => text.includes('Goodbye'))).toThrow();
  });

  it('텍스트 콘텐츠가 없으면 실패해야 함', () => {
    const response: McpToolResult = {
      content: [{ type: 'image', data: 'base64...' }],
      isError: false,
    };

    expect(() => assertMcpContent(response, () => true)).toThrow();
  });
});
