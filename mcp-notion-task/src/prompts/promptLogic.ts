/**
 * 프롬프트 템플릿의 비즈니스 로직
 * 순수 함수로 구성되어 테스트하기 쉬움
 */

/**
 * 인사 프롬프트를 생성합니다.
 * @param name 사용자 이름
 * @param style 인사 스타일 (formal, casual, friendly)
 * @returns 생성된 프롬프트
 */
export function createGreetingPrompt(
  name: string,
  style: 'formal' | 'casual' | 'friendly' = 'friendly'
): string {
  const styleGuide =
    style === 'formal'
      ? '격식체를 사용하여 정중하게'
      : style === 'casual'
        ? '반말을 사용하여 편하게'
        : '친근하면서도 예의 바르게';

  return `${name}님에게 ${styleGuide} 인사해주세요. 오늘 날씨나 기분에 대한 짧은 대화도 포함해주세요.`;
}

/**
 * 텍스트 요약 프롬프트를 생성합니다.
 * @param text 요약할 텍스트
 * @param length 요약 길이 (short, medium, long)
 * @returns 생성된 프롬프트
 */
export function createSummarizePrompt(
  text: string,
  length: 'short' | 'medium' | 'long' = 'medium'
): string {
  const lengthGuide =
    length === 'short'
      ? '1-2문장으로 매우 간단하게'
      : length === 'long'
        ? '상세하게 주요 포인트를 모두 포함하여'
        : '적절한 길이로';

  return `다음 텍스트를 ${lengthGuide} 요약해주세요:\n\n${text}`;
}

/**
 * 코드 리뷰 프롬프트를 생성합니다.
 * @param code 리뷰할 코드
 * @param language 프로그래밍 언어
 * @param focus 리뷰 초점 (security, performance, readability, all)
 * @returns 생성된 프롬프트
 */
export function createCodeReviewPrompt(
  code: string,
  language: string = '코드',
  focus: 'security' | 'performance' | 'readability' | 'all' = 'all'
): string {
  const focusAreas =
    focus === 'security'
      ? '보안 취약점에 초점을 맞춰'
      : focus === 'performance'
        ? '성능 최적화에 초점을 맞춰'
        : focus === 'readability'
          ? '가독성과 유지보수성에 초점을 맞춰'
          : '전반적인 품질을 평가하여';

  return `다음 ${language} 코드를 ${focusAreas} 리뷰해주세요. 개선점이 있다면 구체적인 제안과 함께 알려주세요:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}
