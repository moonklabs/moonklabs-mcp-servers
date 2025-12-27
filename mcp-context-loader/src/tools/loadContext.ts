/**
 * load-context MCP 도구 등록
 *
 * 여러 문서 유형(PRD, Architecture, Epic 등)을 한 번에 로드하는 MCP 도구입니다.
 * AI 에이전트가 작업에 필요한 모든 컨텍스트를 효율적으로 얻을 수 있습니다.
 *
 * @module tools/loadContext
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import crypto from "crypto";
import { createMcpError, CacheManager, logger } from "@moonklabs/mcp-common";
import {
  loadContext,
  SUPPORTED_DOCUMENT_TYPES,
  type LoadContextResult,
} from "./loadContextLogic.js";

/** 캐시 TTL: 5분 (300초) */
const CACHE_TTL = 300;

/** 캐시 매니저 인스턴스 */
const cache = new CacheManager({ stdTTL: CACHE_TTL });

/**
 * 캐시 키 생성에 사용할 파라미터를 해시합니다.
 *
 * @param types - 문서 유형 배열
 * @param epicNum - Epic 번호 (선택)
 * @param storyId - 스토리 ID (선택)
 * @returns 해시 문자열 (8자)
 */
function hashCacheKey(
  types: string[],
  epicNum?: number,
  storyId?: string
): string {
  const parts = [
    [...types].sort().join(","),
    epicNum?.toString() ?? "",
    storyId ?? "",
  ];
  return crypto
    .createHash("md5")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 8);
}

/**
 * load-context 도구를 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 *
 * @example
 * ```typescript
 * import { registerLoadContextTool } from "./loadContext.js";
 *
 * const server = new McpServer({ name: "my-server", version: "1.0.0" });
 * registerLoadContextTool(server);
 * ```
 */
export function registerLoadContextTool(server: McpServer): void {
  server.registerTool(
    "load-context",
    {
      description:
        "여러 문서 유형을 한 번에 로드합니다. 지원 유형: prd, architecture, epic, story, project-context, brainstorming",
      inputSchema: z.object({
        document_types: z
          .array(z.string())
          .describe("로드할 문서 유형 배열 (예: [\"prd\", \"architecture\"])"),
        epic_num: z
          .number()
          .optional()
          .describe("특정 Epic 번호 (epic 타입용, 미구현)"),
        story_id: z
          .string()
          .optional()
          .describe("특정 스토리 ID (story 타입용, 미구현)"),
      }),
    },
    async ({ document_types, epic_num, story_id }) => {
      // 빈 배열 검증
      if (document_types.length === 0) {
        const error = createMcpError(
          "INVALID_PARAMS",
          "document_types 배열이 비어있습니다",
          `사용 가능한 유형: ${SUPPORTED_DOCUMENT_TYPES.join(", ")}`,
          { available_options: [...SUPPORTED_DOCUMENT_TYPES] }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(error, null, 2),
            },
          ],
          isError: true,
        };
      }

      try {
        // 캐시 키 생성 (epic_num, story_id 포함)
        const cacheKey = `context-loader:load-context:${hashCacheKey(document_types, epic_num, story_id)}`;

        // 캐시 히트 여부 확인 (getOrSet 호출 전에 판단)
        const wasCached = cache.has(cacheKey);

        // CacheManager.getOrSet() 사용 (AC #5)
        const loadResult = await cache.getOrSet(
          cacheKey,
          async () =>
            loadContext(document_types, {
              epicNum: epic_num,
              storyId: story_id,
            }),
          CACHE_TTL
        );

        // cached 플래그 추가
        const result = { ...loadResult, cached: wasCached };

        // 지원하지 않는 타입 경고 로그
        if (result.ignored_types.length > 0) {
          logger.warn(
            { ignored_types: result.ignored_types },
            "지원하지 않는 문서 유형이 무시되었습니다"
          );
        }

        // 성공 응답
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        // 예기치 않은 에러 처리
        const error = createMcpError(
          "INTERNAL_ERROR",
          `컨텍스트 로드 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`,
          "다시 시도하거나 지원 문서 유형을 확인해 보세요"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(error, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
