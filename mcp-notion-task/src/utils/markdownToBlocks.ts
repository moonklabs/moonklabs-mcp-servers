/**
 * Markdown ↔ Notion 블록 변환 유틸리티
 * @tryfabric/martian 라이브러리를 래핑합니다.
 */

import { markdownToBlocks as martianToBlocks } from "@tryfabric/martian";
import type { LogType, LOG_TYPE_ICONS } from "../notion/types.js";

/**
 * Markdown 문자열을 Notion 블록 배열로 변환
 */
export function markdownToBlocks(markdown: string): any[] {
  return martianToBlocks(markdown);
}

/**
 * Notion 블록 배열을 Markdown 문자열로 변환
 * 지원하는 블록 타입: heading, paragraph, bulleted_list_item, numbered_list_item, to_do, code, divider
 */
export function blocksToMarkdown(blocks: any[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const type = block.type;

    switch (type) {
      case "heading_1":
        lines.push(`# ${extractRichText(block.heading_1.rich_text)}`);
        break;

      case "heading_2":
        lines.push(`## ${extractRichText(block.heading_2.rich_text)}`);
        break;

      case "heading_3":
        lines.push(`### ${extractRichText(block.heading_3.rich_text)}`);
        break;

      case "paragraph":
        lines.push(extractRichText(block.paragraph.rich_text));
        break;

      case "bulleted_list_item":
        lines.push(`- ${extractRichText(block.bulleted_list_item.rich_text)}`);
        break;

      case "numbered_list_item":
        lines.push(`1. ${extractRichText(block.numbered_list_item.rich_text)}`);
        break;

      case "to_do":
        const checked = block.to_do.checked ? "[x]" : "[ ]";
        lines.push(`- ${checked} ${extractRichText(block.to_do.rich_text)}`);
        break;

      case "code":
        const lang = block.code.language || "";
        const code = extractRichText(block.code.rich_text);
        lines.push("```" + lang);
        lines.push(code);
        lines.push("```");
        break;

      case "divider":
        lines.push("---");
        break;

      case "quote":
        lines.push(`> ${extractRichText(block.quote.rich_text)}`);
        break;

      case "callout":
        const icon = block.callout.icon?.emoji || "💡";
        lines.push(`> ${icon} ${extractRichText(block.callout.rich_text)}`);
        break;

      default:
        // 지원하지 않는 블록은 무시
        break;
    }

    lines.push(""); // 블록 사이 빈 줄
  }

  return lines.join("\n").trim();
}

/**
 * Rich Text 배열에서 플레인 텍스트 추출
 */
function extractRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";

  return richText
    .map((item) => {
      let text = item.text?.content || item.plain_text || "";

      // 어노테이션 적용
      const ann = item.annotations;
      if (ann) {
        if (ann.bold) text = `**${text}**`;
        if (ann.italic) text = `_${text}_`;
        if (ann.strikethrough) text = `~~${text}~~`;
        if (ann.code) text = `\`${text}\``;
      }

      // 링크 처리
      if (item.text?.link?.url) {
        text = `[${text}](${item.text.link.url})`;
      }

      return text;
    })
    .join("");
}

/**
 * 진행 로그 블록 생성
 * Changelog 섹션에 추가할 로그 항목을 Notion 블록으로 생성합니다.
 */
export function createLogBlocks(
  content: string,
  author: string,
  logType: LogType = "progress"
): any[] {
  const now = new Date();
  const timestamp = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 로그 타입 아이콘
  const iconMap: Record<LogType, string> = {
    progress: "🔄 진행",
    blocker: "🚧 블로커",
    decision: "✅ 결정",
    note: "📌 메모",
  };

  const header = `### ${timestamp} | @${author} | ${iconMap[logType]}`;
  const fullContent = `${header}\n${content}`;

  return markdownToBlocks(fullContent);
}
