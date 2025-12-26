/**
 * MCP 응답 Assertion 헬퍼
 *
 * MCP 도구 결과를 검증하기 위한 assertion 함수들을 제공합니다.
 *
 * @module testing/assertions
 *
 * @remarks
 * **vitest 전용 모듈**
 *
 * 이 모듈은 vitest의 `expect` 함수에 직접 의존합니다.
 * Jest, Mocha 등 다른 테스트 프레임워크에서는 사용할 수 없습니다.
 *
 * 다른 프레임워크 지원이 필요한 경우:
 * 1. 해당 프레임워크의 assertion 라이브러리로 래핑하거나
 * 2. 프레임워크 독립적인 검증 함수를 별도로 구현하세요
 *
 * @example
 * ```typescript
 * import { assertMcpSuccess, assertMcpError, assertMcpContent } from '@moonklabs/mcp-common';
 *
 * // 성공 응답 검증
 * assertMcpSuccess(result);
 * assertMcpSuccess(result, 'expected text');
 *
 * // 에러 응답 검증
 * assertMcpError(result, 'NOTION_NOT_FOUND', 'Story를 찾을 수 없습니다');
 *
 * // 콘텐츠 매칭
 * assertMcpContent(result, (text) => text.includes('success'));
 * ```
 */

import type { McpToolResult, McpToolContent } from '../types/mcp.js';
import { expect } from 'vitest';

/**
 * MCP 성공 응답 검증
 *
 * isError가 false이고 content 배열이 존재하는지 확인합니다.
 * expectedText가 제공되면 텍스트 콘텐츠에 해당 문자열이 포함되어 있는지도 검증합니다.
 *
 * @param response - MCP 도구 결과
 * @param expectedText - 예상 텍스트 (선택)
 * @throws 검증 실패 시 vitest assertion 에러
 *
 * @example
 * ```typescript
 * // 기본 성공 검증
 * assertMcpSuccess(result);
 *
 * // 특정 텍스트 포함 검증
 * assertMcpSuccess(result, 'Story-1');
 * ```
 */
export function assertMcpSuccess(response: McpToolResult, expectedText?: string): void {
  expect(response, `Expected MCP response but got: ${JSON.stringify(response)}`).toBeDefined();
  expect(response.isError, `Expected isError to be false or undefined, got: ${response.isError}`).not.toBe(true);
  expect(Array.isArray(response.content), `Expected content to be an array, got: ${typeof response.content}`).toBe(
    true
  );
  expect(response.content.length, 'Expected content array to have at least one element').toBeGreaterThan(0);

  if (expectedText !== undefined) {
    const textContent = findTextContent(response.content);
    expect(textContent, 'Expected to find text content in response').toBeDefined();
    expect(textContent?.text, `Expected text content to contain "${expectedText}"`).toContain(expectedText);
  }
}

/**
 * MCP 에러 응답 검증
 *
 * isError가 true이고 content 배열에 에러 정보가 포함되어 있는지 확인합니다.
 *
 * @param response - MCP 도구 결과
 * @param expectedCode - 예상 에러 코드 (선택)
 * @param expectedMessage - 예상 에러 메시지 일부 (선택)
 * @throws 검증 실패 시 vitest assertion 에러
 *
 * @example
 * ```typescript
 * // 에러 응답 기본 검증
 * assertMcpError(result);
 *
 * // 특정 에러 코드 검증
 * assertMcpError(result, 'NOTION_NOT_FOUND');
 *
 * // 에러 코드와 메시지 모두 검증
 * assertMcpError(result, 'NOTION_NOT_FOUND', 'Story를 찾을 수 없습니다');
 * ```
 */
export function assertMcpError(
  response: McpToolResult,
  expectedCode?: string,
  expectedMessage?: string
): void {
  expect(response, `Expected MCP response but got: ${JSON.stringify(response)}`).toBeDefined();
  expect(response.isError, `Expected isError to be true, got: ${response.isError}`).toBe(true);
  expect(Array.isArray(response.content), `Expected content to be an array, got: ${typeof response.content}`).toBe(
    true
  );

  const textContent = findTextContent(response.content);
  expect(textContent, 'Expected to find text content in error response').toBeDefined();

  if (expectedCode !== undefined) {
    expect(textContent?.text, `Expected error text to contain code "${expectedCode}"`).toContain(expectedCode);
  }

  if (expectedMessage !== undefined) {
    expect(textContent?.text, `Expected error text to contain message "${expectedMessage}"`).toContain(expectedMessage);
  }
}

/**
 * MCP 콘텐츠 매칭 검증
 *
 * 사용자 정의 매처 함수를 사용하여 콘텐츠를 검증합니다.
 *
 * @param response - MCP 도구 결과
 * @param matcher - 텍스트 콘텐츠를 검증하는 함수 (true 반환 시 통과)
 * @throws 검증 실패 시 vitest assertion 에러
 *
 * @example
 * ```typescript
 * // 특정 패턴 검증
 * assertMcpContent(result, (text) => text.includes('success'));
 *
 * // JSON 파싱 후 검증
 * assertMcpContent(result, (text) => {
 *   const data = JSON.parse(text);
 *   return data.status === 'success';
 * });
 * ```
 */
export function assertMcpContent(
  response: McpToolResult,
  matcher: (text: string) => boolean
): void {
  expect(response, `Expected MCP response but got: ${JSON.stringify(response)}`).toBeDefined();
  expect(Array.isArray(response.content), `Expected content to be an array, got: ${typeof response.content}`).toBe(
    true
  );

  const textContent = findTextContent(response.content);
  expect(textContent, 'Expected to find text content in response').toBeDefined();
  expect(textContent?.text, 'Expected text content to exist').toBeDefined();

  const matchResult = matcher(textContent!.text!);
  expect(matchResult, `Matcher function returned false for text: ${textContent!.text}`).toBe(true);
}

/**
 * content 배열에서 첫 번째 텍스트 콘텐츠 찾기
 *
 * @param content - MCP 콘텐츠 배열
 * @returns 텍스트 콘텐츠 또는 undefined
 */
function findTextContent(content: McpToolContent[]): McpToolContent | undefined {
  return content.find((c) => c.type === 'text');
}
