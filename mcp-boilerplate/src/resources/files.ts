/**
 * 파일 리소스 예제
 * 정적 리소스와 동적 리소스 템플릿 사용법을 보여줍니다.
 */

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * 파일 관련 리소스들을 서버에 등록합니다.
 * @param server MCP 서버 인스턴스
 */
export function registerFileResources(server: McpServer): void {
  // 정적 리소스 - 고정 URI로 접근 가능
  server.registerResource(
    "기본 인사말",
    "greeting://default",
    {
      description: "기본 인사말 텍스트를 제공합니다.",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: "greeting://default",
          text: "안녕하세요! MCP 서버에 오신 것을 환영합니다.",
        },
      ],
    })
  );

  // 정적 리소스 - 설정 정보
  server.registerResource(
    "서버 설정",
    "config://server",
    {
      description: "현재 서버의 설정 정보를 JSON 형식으로 제공합니다.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "config://server",
          text: JSON.stringify(
            {
              name: "mcp-boilerplate",
              version: "1.0.0",
              features: ["tools", "resources", "prompts"],
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // 정적 리소스 - 도움말
  server.registerResource(
    "시작하기 가이드",
    "help://getting-started",
    {
      description: "MCP 서버 사용 방법에 대한 가이드입니다.",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "help://getting-started",
          text: `# MCP Boilerplate 시작하기

## 사용 가능한 도구

### 인사 도구
- \`greet\`: 이름을 입력하면 인사말을 반환합니다.
- \`multi-greet\`: 여러 번 인사합니다.

### 계산기 도구
- \`add\`: 덧셈
- \`subtract\`: 뺄셈
- \`multiply\`: 곱셈
- \`divide\`: 나눗셈
- \`calculate\`: 복합 계산

## 사용 가능한 프롬프트
- \`greeting-template\`: 인사말 템플릿
- \`summarize-template\`: 요약 템플릿
`,
        },
      ],
    })
  );

  // 동적 리소스 템플릿 - URI 파라미터 사용
  const userProfileTemplate = new ResourceTemplate("user://{userId}/profile", {
    // list 콜백: 이 템플릿과 일치하는 모든 리소스를 나열
    list: async () => ({
      resources: [
        {
          uri: "user://1/profile",
          name: "홍길동 프로필",
          mimeType: "application/json",
        },
        {
          uri: "user://2/profile",
          name: "김철수 프로필",
          mimeType: "application/json",
        },
        {
          uri: "user://3/profile",
          name: "이영희 프로필",
          mimeType: "application/json",
        },
      ],
    }),
  });

  server.registerResource(
    "사용자 프로필",
    userProfileTemplate,
    {
      description: "특정 사용자의 프로필 정보를 반환합니다.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const userId = variables.userId as string;

      // 실제 구현에서는 데이터베이스나 API에서 데이터를 가져옵니다
      const mockProfiles: Record<string, object> = {
        "1": { id: "1", name: "홍길동", email: "hong@example.com" },
        "2": { id: "2", name: "김철수", email: "kim@example.com" },
        "3": { id: "3", name: "이영희", email: "lee@example.com" },
      };

      const profile = mockProfiles[userId] || {
        error: "사용자를 찾을 수 없습니다.",
        userId,
      };

      return {
        contents: [
          {
            uri: uri.toString(),
            text: JSON.stringify(profile, null, 2),
          },
        ],
      };
    }
  );
}
