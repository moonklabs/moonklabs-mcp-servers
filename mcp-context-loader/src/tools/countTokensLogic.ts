/**
 * 토큰 카운팅 순수 로직
 *
 * js-tiktoken을 사용하여 텍스트의 토큰 수를 계산합니다.
 * MCP 도구에서 분리된 순수 비즈니스 로직입니다.
 *
 * @module tools/countTokensLogic
 */

import { getEncoding, type Tiktoken } from "js-tiktoken";

/**
 * 지원하는 모델 목록
 */
export const SUPPORTED_MODELS = [
  "gpt-4",
  "gpt-3.5-turbo",
  "gpt-4o",
  "claude",
] as const;

/**
 * 지원 모델 타입
 */
export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

/**
 * 토큰 카운트 결과 타입
 */
export interface CountTokensResult {
  /** 토큰 수 */
  token_count: number;
  /** 사용된 모델명 */
  model: string;
}

/**
 * 모델별 인코딩 매핑
 *
 * | 모델 | 인코딩 |
 * |------|--------|
 * | gpt-4 | cl100k_base |
 * | gpt-3.5-turbo | cl100k_base |
 * | gpt-4o | o200k_base |
 * | claude | cl100k_base (호환) |
 */
const MODEL_ENCODING_MAP: Record<SupportedModel, "cl100k_base" | "o200k_base"> = {
  "gpt-4": "cl100k_base",
  "gpt-3.5-turbo": "cl100k_base",
  "gpt-4o": "o200k_base",
  "claude": "cl100k_base",
};

/**
 * 인코더 캐시 (성능 최적화)
 */
const encoderCache: Map<string, Tiktoken> = new Map();

/**
 * 모델에 해당하는 인코딩 이름을 반환합니다.
 *
 * @param model - 모델명
 * @returns 인코딩 이름 또는 지원하지 않는 모델이면 null
 */
export function getEncodingForModel(model: string): "cl100k_base" | "o200k_base" | null {
  if (model in MODEL_ENCODING_MAP) {
    return MODEL_ENCODING_MAP[model as SupportedModel];
  }
  return null;
}

/**
 * 지원하는 모델인지 확인합니다.
 *
 * @param model - 확인할 모델명
 * @returns 지원하는 모델이면 true
 */
export function isSupportedModel(model: string): model is SupportedModel {
  return SUPPORTED_MODELS.includes(model as SupportedModel);
}

/**
 * 텍스트의 토큰 수를 계산합니다.
 *
 * @param text - 토큰 수를 계산할 텍스트
 * @param model - 토크나이저 모델 (기본: gpt-4)
 * @returns 토큰 수와 사용된 모델
 *
 * @example
 * ```typescript
 * const result = countTokens("Hello, world!");
 * console.log(result.token_count); // 4
 * console.log(result.model); // "gpt-4"
 * ```
 */
export function countTokens(text: string, model: string = "gpt-4"): CountTokensResult {
  // 빈 텍스트 처리
  if (text === "") {
    return {
      token_count: 0,
      model,
    };
  }

  // 인코딩 결정
  const encodingName = getEncodingForModel(model);
  if (!encodingName) {
    // 지원하지 않는 모델은 기본 인코딩 사용
    // (에러 처리는 MCP 도구 레이어에서)
    throw new Error(`Unsupported model: ${model}`);
  }

  // 인코더 캐시에서 가져오거나 새로 생성
  let encoder = encoderCache.get(encodingName);
  if (!encoder) {
    encoder = getEncoding(encodingName);
    encoderCache.set(encodingName, encoder);
  }

  // 토큰 수 계산
  const tokens = encoder.encode(text);

  return {
    token_count: tokens.length,
    model,
  };
}
