/**
 * get-story-context MCP 도구 등록
 *
 * 스토리 ID로 스토리 파일을 찾아 파싱하고 구조화된 컨텍스트를 반환합니다.
 * AI 에이전트가 특정 스토리의 정보(제목, AC, Tasks)를 효율적으로 얻을 수 있습니다.
 *
 * @module tools/getStoryContext
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import crypto from "crypto";
import { CacheManager, logger, createMcpError } from "@moonklabs/mcp-common";
import {
  getStoryContext,
  listAvailableStories,
  formatStoryResponse,
  type GetStoryContextResult,
  type FormattedStoryResponse,
} from "./getStoryContextLogic.js";
import { countTokens } from "./countTokensLogic.js";

/** 캐시 TTL: 5분 (300초) */
const CACHE_TTL = 300;

/** 캐시 매니저 인스턴스 */
const cache = new CacheManager({ stdTTL: CACHE_TTL });

/**
 * 캐시 키 생성에 사용할 파라미터를 해시합니다.
 *
 * @param storyId - 스토리 ID
 * @param basePath - 기본 경로 (선택)
 * @param includeRawContent - 원본 마크다운 포함 여부
 * @param includeLinkedDocuments - 연결 문서 포함 여부
 * @returns 해시 문자열 (8자)
 */
function hashCacheKey(
  storyId: string,
  basePath?: string,
  includeRawContent?: boolean,
  includeLinkedDocuments?: boolean,
  formatResponse?: boolean
): string {
  const parts = [
    storyId.toLowerCase(),
    basePath ?? "",
    includeRawContent ? "raw" : "",
    includeLinkedDocuments === false ? "no-linked" : "linked",
    formatResponse === false ? "no-format" : "formatted",
  ];
  return crypto
    .createHash("md5")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 8);
}

/**
 * get-story-context 도구를 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 *
 * @example
 * ```typescript
 * import { registerGetStoryContextTool } from "./getStoryContext.js";
 *
 * const server = new McpServer({ name: "my-server", version: "1.0.0" });
 * registerGetStoryContextTool(server);
 * ```
 */
export function registerGetStoryContextTool(server: McpServer): void {
  server.registerTool(
    "get-story-context",
    {
      description:
        "스토리 ID로 스토리 파일을 찾아 구조화된 컨텍스트(제목, AC, Tasks)를 반환합니다. 다양한 ID 형식 지원: '1.3', 'Story-1.3', 'story-1-3', '2-4a'",
      inputSchema: z.object({
        story_id: z
          .string()
          .describe(
            "스토리 ID (예: '1.3', 'Story-1.3', 'story-1-3', '2-4a')"
          ),
        include_raw_content: z
          .boolean()
          .optional()
          .describe("원본 마크다운 내용 포함 여부 (기본값: false)"),
        include_linked_documents: z
          .boolean()
          .optional()
          .describe("연결된 문서(Epic, Architecture) 포함 여부 (기본값: true)"),
        format_response: z
          .boolean()
          .optional()
          .describe("구조화된 포맷팅 응답 여부 (기본값: true). story/epic/architecture/suggestion 섹션으로 포맷팅"),
      }),
    },
    async ({ story_id, include_raw_content, include_linked_documents, format_response }) => {
      // story_id 검증
      if (!story_id || story_id.trim() === "") {
        const availableStories = await listAvailableStories();
        const error = createMcpError(
          "INVALID_PARAMS",
          "story_id가 비어있습니다",
          `사용 가능한 스토리: ${availableStories.join(", ") || "없음"}`,
          { available_options: availableStories }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
          isError: true,
        };
      }

      try {
        // 캐시 키 생성 (includeLinkedDocuments, format_response 포함)
        const cacheKey = `context-loader:get-story-context:${hashCacheKey(story_id, undefined, include_raw_content, include_linked_documents, format_response)}`;

        // 캐시에서 먼저 조회 (에러는 캐싱하지 않음)
        let result: GetStoryContextResult | undefined = cache.get(cacheKey);
        const wasCached = result !== undefined;

        // 캐시 미스 시 실제 조회
        if (!result) {
          result = await getStoryContext({
            storyId: story_id,
            includeRawContent: include_raw_content,
            includeLinkedDocuments: include_linked_documents,
          });

          // 성공한 결과만 캐싱 (에러는 캐싱하지 않음)
          if (result.success) {
            cache.set(cacheKey, result, CACHE_TTL);
          }
        }

        // 성공 여부에 따른 응답
        if (result.success && result.data) {
          // format_response 옵션 (기본값: true)
          const shouldFormat = format_response !== false;

          // 응답 데이터 구성
          let responseData: {
            status: "success";
            data: typeof result.data | FormattedStoryResponse;
            cached: boolean;
          };

          if (shouldFormat) {
            // FormattedStoryResponse로 변환 (AC1, AC2, AC6)
            const formattedData = formatStoryResponse(result.data);
            responseData = {
              status: "success" as const,
              data: formattedData,
              cached: wasCached,
            };
          } else {
            // 원본 StoryContext 그대로 반환
            responseData = {
              status: "success" as const,
              data: result.data,
              cached: wasCached,
            };
          }

          const responseText = JSON.stringify(responseData, null, 2);
          const tokenCount = countTokens(responseText).token_count;

          // token_count 포함 최종 응답
          const response = {
            ...responseData,
            token_count: tokenCount,
          };

          logger.info(
            { story_id, cached: wasCached, token_count: tokenCount, formatted: shouldFormat },
            "스토리 컨텍스트 로드 완료"
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } else {
          // 에러 응답 (캐시에서 온 에러도 포함)
          logger.warn(
            { story_id, error_code: result.error?.error_code },
            "스토리 컨텍스트 로드 실패"
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.error, null, 2),
              },
            ],
            isError: true,
          };
        }
      } catch (err) {
        // 예기치 않은 에러 처리
        const errorMessage =
          err instanceof Error ? err.message : String(err);

        logger.error({ error: errorMessage }, "스토리 컨텍스트 로드 중 예외 발생");

        const error = createMcpError(
          "INTERNAL_ERROR",
          `스토리 컨텍스트 로드 중 오류 발생: ${errorMessage}`,
          "스토리 파일 경로와 권한을 확인하세요"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
          isError: true,
        };
      }
    }
  );
}
