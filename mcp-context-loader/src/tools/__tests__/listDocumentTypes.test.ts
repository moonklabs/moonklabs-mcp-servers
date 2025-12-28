/**
 * list-document-types 도구 테스트
 *
 * @module tools/__tests__/listDocumentTypes.test
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  listDocumentTypes,
  DOCUMENT_TYPE_METADATA,
  type DocumentTypeInfo,
} from "../listDocumentTypesLogic.js";
import {
  SUPPORTED_DOCUMENT_TYPES,
  type DocumentType,
} from "../loadContextLogic.js";
import { registerListDocumentTypesTool } from "../listDocumentTypes.js";

describe("listDocumentTypesLogic", () => {
  describe("listDocumentTypes", () => {
    it("should return array of 6 document types", () => {
      const result = listDocumentTypes();
      expect(result).toHaveLength(6);
    });

    it("should return DocumentTypeInfo with all required fields", () => {
      const result = listDocumentTypes();

      for (const info of result) {
        expect(info).toHaveProperty("type");
        expect(info).toHaveProperty("description");
        expect(info).toHaveProperty("example");
        expect(info).toHaveProperty("glob_pattern");
      }
    });

    it("should match SUPPORTED_DOCUMENT_TYPES exactly", () => {
      const result = listDocumentTypes();
      const types = result.map((info) => info.type);

      expect(types).toEqual(expect.arrayContaining([...SUPPORTED_DOCUMENT_TYPES]));
      expect(types).toHaveLength(SUPPORTED_DOCUMENT_TYPES.length);
    });

    it("should have non-empty description for each type", () => {
      const result = listDocumentTypes();

      for (const info of result) {
        expect(info.description).toBeTruthy();
        expect(info.description.length).toBeGreaterThan(0);
      }
    });

    it("should have valid example paths containing file extension or pattern", () => {
      const result = listDocumentTypes();

      for (const info of result) {
        expect(info.example).toBeTruthy();
        // 예시는 .md 확장자 또는 glob 패턴을 포함해야 함
        expect(
          info.example.includes(".md") || info.example.includes("*")
        ).toBe(true);
      }
    });

    it("should have valid glob patterns", () => {
      const result = listDocumentTypes();

      for (const info of result) {
        expect(info.glob_pattern).toBeTruthy();
        // glob 패턴은 .md 확장자를 포함해야 함
        expect(info.glob_pattern).toContain(".md");
      }
    });

    it("should include specific known types", () => {
      const result = listDocumentTypes();
      const types = result.map((info) => info.type);

      expect(types).toContain("prd");
      expect(types).toContain("architecture");
      expect(types).toContain("epic");
      expect(types).toContain("story");
      expect(types).toContain("project-context");
      expect(types).toContain("brainstorming");
    });
  });

  describe("DOCUMENT_TYPE_METADATA", () => {
    it("should have metadata for all SUPPORTED_DOCUMENT_TYPES", () => {
      for (const docType of SUPPORTED_DOCUMENT_TYPES) {
        expect(DOCUMENT_TYPE_METADATA[docType]).toBeDefined();
      }
    });

    it("should have non-empty description for each metadata entry", () => {
      for (const docType of SUPPORTED_DOCUMENT_TYPES) {
        const metadata = DOCUMENT_TYPE_METADATA[docType];
        expect(metadata.description).toBeTruthy();
        expect(metadata.description.length).toBeGreaterThan(5);
      }
    });

    it("should have valid example for each metadata entry", () => {
      for (const docType of SUPPORTED_DOCUMENT_TYPES) {
        const metadata = DOCUMENT_TYPE_METADATA[docType];
        expect(metadata.example).toBeTruthy();
        expect(metadata.example).toContain("_bmad-output");
      }
    });

    it("should have valid glob_pattern for each metadata entry", () => {
      for (const docType of SUPPORTED_DOCUMENT_TYPES) {
        const metadata = DOCUMENT_TYPE_METADATA[docType];
        expect(metadata.glob_pattern).toBeTruthy();
        expect(metadata.glob_pattern).toContain(".md");
      }
    });

    it("prd metadata should be correct", () => {
      const prdMeta = DOCUMENT_TYPE_METADATA["prd"];
      expect(prdMeta.description).toContain("PRD");
      expect(prdMeta.glob_pattern).toContain("prd");
    });

    it("architecture metadata should be correct", () => {
      const archMeta = DOCUMENT_TYPE_METADATA["architecture"];
      expect(archMeta.description).toContain("아키텍처");
      expect(archMeta.glob_pattern).toContain("architecture");
    });

    it("story metadata should be correct", () => {
      const storyMeta = DOCUMENT_TYPE_METADATA["story"];
      expect(storyMeta.description).toContain("스토리");
      expect(storyMeta.glob_pattern).toContain("stories");
    });
  });
});

describe("list-document-types MCP 도구", () => {
  let server: McpServer;
  let client: Client;

  // callTool 결과 타입 정의
  interface CallToolResult {
    isError?: boolean;
    content: Array<{ type: string; text?: string }>;
  }

  beforeEach(async () => {
    // MCP 서버 및 클라이언트 설정
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });

    // 도구 등록
    registerListDocumentTypesTool(server);

    // 인메모리 트랜스포트로 연결
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it("파라미터 없이 호출 시 성공해야 한다", async () => {
    const result = await client.callTool({
      name: "list-document-types",
      arguments: {},
    }) as CallToolResult;

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const content = result.content[0];
    expect(content.type).toBe("text");
  });

  it("응답에 status, document_types, total_count가 포함되어야 한다", async () => {
    const result = await client.callTool({
      name: "list-document-types",
      arguments: {},
    }) as CallToolResult;

    const content = result.content[0];
    if (content.type !== "text" || !content.text) {
      throw new Error("Expected text content");
    }

    const response = JSON.parse(content.text);

    expect(response.status).toBe("success");
    expect(response.document_types).toBeDefined();
    expect(Array.isArray(response.document_types)).toBe(true);
    expect(response.total_count).toBe(6);
  });

  it("document_types 배열의 각 항목에 필수 필드가 있어야 한다", async () => {
    const result = await client.callTool({
      name: "list-document-types",
      arguments: {},
    }) as CallToolResult;

    const content = result.content[0];
    if (content.type !== "text" || !content.text) {
      throw new Error("Expected text content");
    }

    const response = JSON.parse(content.text);

    for (const docType of response.document_types) {
      expect(docType).toHaveProperty("type");
      expect(docType).toHaveProperty("description");
      expect(docType).toHaveProperty("example");
      expect(docType).toHaveProperty("glob_pattern");
    }
  });

  it("total_count가 document_types 배열 길이와 일치해야 한다", async () => {
    const result = await client.callTool({
      name: "list-document-types",
      arguments: {},
    }) as CallToolResult;

    const content = result.content[0];
    if (content.type !== "text" || !content.text) {
      throw new Error("Expected text content");
    }

    const response = JSON.parse(content.text);

    expect(response.total_count).toBe(response.document_types.length);
  });
});
