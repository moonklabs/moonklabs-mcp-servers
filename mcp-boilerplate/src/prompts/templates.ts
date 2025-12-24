/**
 * 프롬프트 템플릿 예제
 * 재사용 가능한 프롬프트 템플릿 정의 방법을 보여줍니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * 프롬프트 템플릿들을 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerPromptTemplates(server: McpServer): void {
  // 인사말 프롬프트
  server.registerPrompt(
    "greeting-template",
    {
      description: "사용자에게 친절하게 인사하는 프롬프트입니다.",
      argsSchema: {
        name: z.string().describe("인사할 사용자의 이름"),
        style: z
          .enum(["formal", "casual", "friendly"])
          .optional()
          .describe("인사 스타일"),
      },
    },
    async ({ name, style }) => {
      const styleGuide =
        style === "formal"
          ? "격식체를 사용하여 정중하게"
          : style === "casual"
            ? "반말을 사용하여 편하게"
            : "친근하면서도 예의 바르게";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `${name}님에게 ${styleGuide} 인사해주세요. 오늘 날씨나 기분에 대한 짧은 대화도 포함해주세요.`,
            },
          },
        ],
      };
    }
  );

  // 요약 프롬프트
  server.registerPrompt(
    "summarize-template",
    {
      description: "텍스트를 요약하는 프롬프트입니다.",
      argsSchema: {
        text: z.string().describe("요약할 텍스트"),
        length: z
          .enum(["short", "medium", "long"])
          .optional()
          .describe("요약 길이"),
        format: z
          .enum(["paragraph", "bullets", "numbered"])
          .optional()
          .describe("출력 형식"),
      },
    },
    async ({ text, length, format }) => {
      const lengthGuide =
        length === "short"
          ? "1-2문장으로 매우 간단하게"
          : length === "long"
            ? "상세하게 주요 포인트를 모두 포함하여"
            : "적절한 길이로";

      const formatGuide =
        format === "bullets"
          ? "글머리 기호 목록 형식으로"
          : format === "numbered"
            ? "번호 매기기 목록 형식으로"
            : "문단 형식으로";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `다음 텍스트를 ${lengthGuide} ${formatGuide} 요약해주세요:\n\n${text}`,
            },
          },
        ],
      };
    }
  );

  // 코드 리뷰 프롬프트
  server.registerPrompt(
    "code-review-template",
    {
      description: "코드를 리뷰하는 프롬프트입니다.",
      argsSchema: {
        code: z.string().describe("리뷰할 코드"),
        language: z.string().optional().describe("프로그래밍 언어"),
        focus: z
          .enum(["security", "performance", "readability", "all"])
          .optional()
          .describe("리뷰 초점"),
      },
    },
    async ({ code, language, focus }) => {
      const lang = language || "코드";
      const focusAreas =
        focus === "security"
          ? "보안 취약점에 초점을 맞춰"
          : focus === "performance"
            ? "성능 최적화에 초점을 맞춰"
            : focus === "readability"
              ? "가독성과 유지보수성에 초점을 맞춰"
              : "전반적인 품질을 평가하여";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `다음 ${lang} 코드를 ${focusAreas} 리뷰해주세요. 개선점이 있다면 구체적인 제안과 함께 알려주세요:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``,
            },
          },
        ],
      };
    }
  );

  // 번역 프롬프트
  server.registerPrompt(
    "translate-template",
    {
      description: "텍스트를 번역하는 프롬프트입니다.",
      argsSchema: {
        text: z.string().describe("번역할 텍스트"),
        targetLanguage: z.string().describe("목표 언어 (예: 영어, 일본어, 중국어)"),
        tone: z
          .enum(["formal", "casual", "technical"])
          .optional()
          .describe("번역 톤"),
      },
    },
    async ({ text, targetLanguage, tone }) => {
      const toneGuide =
        tone === "formal"
          ? "격식체로"
          : tone === "technical"
            ? "전문 용어를 사용하여 기술적으로"
            : "자연스럽게";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `다음 텍스트를 ${targetLanguage}로 ${toneGuide} 번역해주세요:\n\n${text}`,
            },
          },
        ],
      };
    }
  );
}
