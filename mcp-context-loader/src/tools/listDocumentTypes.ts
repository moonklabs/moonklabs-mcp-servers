/**
 * list-document-types MCP 도구 등록
 *
 * load-context 도구에서 사용 가능한 문서 유형 목록과 설명을 반환합니다.
 * AI 에이전트가 올바른 document_type 파라미터를 전달할 수 있도록 도와줍니다.
 *
 * @module tools/listDocumentTypes
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "@moonklabs/mcp-common";
import { listDocumentTypes } from "./listDocumentTypesLogic.js";

/**
 * list-document-types 도구를 서버에 등록합니다.
 *
 * @param server - MCP 서버 인스턴스
 *
 * @example
 * ```typescript
 * import { registerListDocumentTypesTool } from "./listDocumentTypes.js";
 *
 * const server = new McpServer({ name: "my-server", version: "1.0.0" });
 * registerListDocumentTypesTool(server);
 * ```
 */
export function registerListDocumentTypesTool(server: McpServer): void {
  server.registerTool(
    "list-document-types",
    {
      description:
        "load-context 도구에서 사용 가능한 문서 유형 목록과 설명을 반환합니다",
      inputSchema: z.object({}),
    },
    async () => {
      // 문서 유형 목록 가져오기
      const documentTypes = listDocumentTypes();

      // 응답 구성
      const response = {
        status: "success" as const,
        document_types: documentTypes,
        total_count: documentTypes.length,
      };

      logger.info(
        { total_count: documentTypes.length },
        "문서 유형 목록 반환"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
}
