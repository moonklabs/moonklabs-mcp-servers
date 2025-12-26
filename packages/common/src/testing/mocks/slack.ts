/**
 * Slack API Mock 함수 (Phase 2 대비 스텁)
 *
 * Epic 4 (mcp-slack-bugfix) 구현 시 완성 예정입니다.
 * 현재는 스텁 함수들만 제공됩니다.
 *
 * @module testing/mocks/slack
 *
 * @example
 * ```typescript
 * import { mockSlackMessage, mockSlackRateLimit } from '@moonklabs/mcp-common';
 *
 * // Phase 2에서 구현 예정
 * // const scope = mockSlackMessage({ channel: 'C123', text: 'Hello' });
 * ```
 */

import nock from 'nock';

/** Slack API 기본 URL */
const SLACK_API_BASE = 'https://slack.com/api';

/**
 * Slack 메시지 모킹 옵션
 *
 * @todo Epic 4 구현 시 완성
 */
export interface MockSlackMessageOptions {
  /** 채널 ID */
  channel: string;
  /** 메시지 텍스트 */
  text?: string;
  /** 메시지 타임스탬프 */
  ts?: string;
  /** 사용자 ID */
  user?: string;
}

/**
 * Slack 메시지 Mock 설정 (스텁)
 *
 * @todo Epic 4 (mcp-slack-bugfix) 구현 시 완성 예정
 *
 * @param _options - 모킹 옵션 (현재 미사용)
 * @returns nock.Scope
 *
 * @example
 * ```typescript
 * // Phase 2에서 구현 예정
 * const scope = mockSlackMessage({
 *   channel: 'C123456',
 *   text: 'Test message'
 * });
 * ```
 */
export function mockSlackMessage(_options: MockSlackMessageOptions): nock.Scope {
  // TODO: Epic 4 구현 시 완성
  // 현재는 기본 OK 응답만 반환
  return nock(SLACK_API_BASE)
    .post('/chat.postMessage')
    .reply(200, {
      ok: true,
      channel: _options.channel,
      ts: _options.ts ?? '1234567890.123456',
      message: {
        text: _options.text ?? 'Mock message',
        user: _options.user ?? 'U123456',
        ts: _options.ts ?? '1234567890.123456',
      },
    });
}

/**
 * Slack Rate Limit (429) Mock 설정 (스텁)
 *
 * @todo Epic 4 (mcp-slack-bugfix) 구현 시 완성 예정
 *
 * @param _retryAfter - 재시도까지 대기 시간 (초, 기본값: 60)
 * @returns nock.Scope
 *
 * @example
 * ```typescript
 * // Phase 2에서 구현 예정
 * mockSlackRateLimit(30);
 * ```
 */
export function mockSlackRateLimit(_retryAfter = 60): nock.Scope {
  // TODO: Epic 4 구현 시 완성
  return nock(SLACK_API_BASE)
    .persist()
    .post(/.*/)
    .reply(429, { ok: false, error: 'ratelimited' }, { 'Retry-After': String(_retryAfter) });
}

/**
 * Slack API 에러 Mock 설정 (스텁)
 *
 * @todo Epic 4 (mcp-slack-bugfix) 구현 시 완성 예정
 *
 * @param errorCode - Slack 에러 코드 (예: 'channel_not_found')
 * @returns nock.Scope
 */
export function mockSlackError(errorCode: string): nock.Scope {
  // TODO: Epic 4 구현 시 완성
  return nock(SLACK_API_BASE)
    .persist()
    .post(/.*/)
    .reply(200, { ok: false, error: errorCode });
}

/**
 * 모든 Slack Mock 정리
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   cleanupSlackMocks();
 * });
 * ```
 */
export function cleanupSlackMocks(): void {
  nock.cleanAll();
}
