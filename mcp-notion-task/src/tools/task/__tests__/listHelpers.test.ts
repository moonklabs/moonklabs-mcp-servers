/**
 * listHelpers 단위 테스트
 */

import { describe, it, expect } from "vitest";
import { resolveAssignee } from "../listHelpers.js";

describe("listHelpers", () => {
  describe("resolveAssignee", () => {
    it("assignee가 지정되면 assignee를 반환해야 함 (useSessionUser 무시)", () => {
      const result = resolveAssignee(
        "other@example.com",
        true,
        "session@example.com"
      );
      expect(result).toBe("other@example.com");
    });

    it("assignee가 지정되면 세션이 없어도 assignee를 반환해야 함", () => {
      const result = resolveAssignee("other@example.com", true, undefined);
      expect(result).toBe("other@example.com");
    });

    it("assignee 없고 useSessionUser=true이고 세션 이메일이 있으면 세션 이메일 반환", () => {
      const result = resolveAssignee(undefined, true, "session@example.com");
      expect(result).toBe("session@example.com");
    });

    it("assignee 없고 useSessionUser=true이지만 세션 이메일이 없으면 undefined 반환", () => {
      const result = resolveAssignee(undefined, true, undefined);
      expect(result).toBeUndefined();
    });

    it("assignee 없고 useSessionUser=false이면 세션이 있어도 undefined 반환", () => {
      const result = resolveAssignee(undefined, false, "session@example.com");
      expect(result).toBeUndefined();
    });

    it("assignee 없고 useSessionUser=false이고 세션도 없으면 undefined 반환", () => {
      const result = resolveAssignee(undefined, false, undefined);
      expect(result).toBeUndefined();
    });

    it("빈 문자열 assignee는 falsy로 처리되어 세션 사용자로 fallback", () => {
      const result = resolveAssignee("", true, "session@example.com");
      expect(result).toBe("session@example.com");
    });
  });
});
