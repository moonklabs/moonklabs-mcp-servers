/**
 * Task 도구 통합 테스트
 * 실제 Notion API를 호출하여 전체 워크플로우 검증
 */

import { describe, it, expect, afterAll } from "vitest";
import { TEST_CONFIG, trackCreatedTask, cleanupTestData, delay } from "./setup.js";

// Logic 함수 import
import { listTasks } from "../../tools/task/listLogic.js";
import { getTask } from "../../tools/task/getLogic.js";
import { getTaskContent } from "../../tools/task/getContentLogic.js";
import { getMySprintTasks } from "../../tools/task/mySprintLogic.js";
import { createTask } from "../../tools/task/createLogic.js";
import { updateTask } from "../../tools/task/updateLogic.js";
import { updateTaskStatus } from "../../tools/task/updateStatusLogic.js";
import { addTaskLogAfterChangelog } from "../../tools/task/addLogLogic.js";
import { archiveTask } from "../../tools/task/archiveLogic.js";
import { getHelpContent } from "../../tools/task/helpLogic.js";

// 유틸리티
import { emailToUserId } from "../../utils/emailToUserId.js";

// 테스트 후 정리
afterAll(async () => {
  await cleanupTestData();
});

describe("Task 통합 테스트", () => {
  describe("조회 테스트", () => {
    it("listTasks: 전체 목록 조회", async () => {
      const tasks = await listTasks(undefined, "last_edited_time", "descending", 5);

      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.length).toBeLessThanOrEqual(5);

      // 첫 번째 작업 구조 검증
      const task = tasks[0];
      expect(task).toHaveProperty("id");
      expect(task).toHaveProperty("title");
      expect(task).toHaveProperty("status");

      console.log(`✓ listTasks: ${tasks.length}개 작업 조회`);
      await delay(300);
    }, 30000);

    it("listTasks: 상태 필터링", async () => {
      const tasks = await listTasks(
        { status: "진행 중" },
        "last_edited_time",
        "descending",
        10
      );

      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);

      // 모든 작업이 "진행 중" 상태인지 확인
      tasks.forEach((task) => {
        expect(task.status).toBe("진행 중");
      });

      console.log(`✓ listTasks (status): ${tasks.length}개 "진행 중" 작업 조회`);
      await delay(300);
    }, 30000);

    it("listTasks: 담당자 필터링", async () => {
      // userId를 UUID로 변환
      const assigneeId = await emailToUserId(TEST_CONFIG.testEmail);

      const tasks = await listTasks(
        { assignee: assigneeId, includeSubAssignee: true },
        "last_edited_time",
        "descending",
        10
      );

      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);

      console.log(`✓ listTasks (assignee): ${tasks.length}개 작업 조회 (${TEST_CONFIG.testUserId})`);
      await delay(300);
    }, 60000);

    it("getTask: 페이지 ID로 조회", async () => {
      // 먼저 작업 목록에서 하나 가져오기
      const tasks = await listTasks(undefined, "last_edited_time", "descending", 1);
      expect(tasks.length).toBeGreaterThan(0);

      const taskId = tasks[0].id;
      const task = await getTask(taskId);

      expect(task).toBeDefined();
      expect(task.id).toBe(taskId);
      expect(task.title).toBeDefined();
      expect(task.status).toBeDefined();

      console.log(`✓ getTask: "${task.title}" 조회`);
      await delay(300);
    }, 30000);

    it("getTask: MKL-XXX 형식으로 조회", async () => {
      // 먼저 작업 목록에서 작업 ID가 있는 작업 찾기
      const tasks = await listTasks(undefined, "last_edited_time", "descending", 10);
      const taskWithId = tasks.find((t) => t.taskId && t.taskId.startsWith("MKL-"));

      if (!taskWithId) {
        console.log("⊘ getTask (MKL-XXX): 건너뜀 (작업 ID가 없는 작업만 존재)");
        return;
      }

      const task = await getTask(taskWithId.taskId!);

      expect(task).toBeDefined();
      expect(task.taskId).toBe(taskWithId.taskId);
      expect(task.title).toBeDefined();

      console.log(`✓ getTask (${task.taskId}): "${task.title}" 조회`);
      await delay(300);
    }, 30000);

    it("getTaskContent: 본문 조회", async () => {
      // 작업 목록에서 하나 선택
      const tasks = await listTasks(undefined, "last_edited_time", "descending", 1);
      expect(tasks.length).toBeGreaterThan(0);

      const taskId = tasks[0].id;
      const content = await getTaskContent(taskId, 20);

      expect(content).toBeDefined();
      expect(typeof content).toBe("string");

      console.log(`✓ getTaskContent: ${content.length}자 조회`);
      await delay(300);
    }, 30000);

    it("getMySprintTasks: 스프린트 작업 조회", async () => {
      const result = await getMySprintTasks(
        TEST_CONFIG.testEmail,
        TEST_CONFIG.sprintNumber,
        undefined,
        true,
        20
      );

      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.sprintId).toBeDefined();

      console.log(`✓ getMySprintTasks: 스프린트 ${TEST_CONFIG.sprintNumber}, ${result.tasks.length}개 작업`);
      await delay(300);
    }, 60000);

    it("getHelpContent: 도움말 조회 (API 호출 없음)", () => {
      const helpAll = getHelpContent("all");
      const helpWorkflow = getHelpContent("workflow");
      const helpStatus = getHelpContent("status");
      const helpSprint = getHelpContent("sprint");

      expect(helpAll).toBeDefined();
      expect(typeof helpAll).toBe("string");
      expect(helpAll.length).toBeGreaterThan(0);

      expect(helpWorkflow).toContain("워크플로우");
      expect(helpStatus).toContain("상태");
      expect(helpSprint).toContain("스프린트");

      console.log("✓ getHelpContent: 4가지 도움말 조회 완료");
    });
  });

  describe("생성/수정 테스트", () => {
    let testTaskId: string;

    it("createTask: 새 작업 생성", async () => {
      const task = await createTask({
        title: `[통합테스트] ${new Date().toISOString()}`,
        status: "시작 전",
        userId: TEST_CONFIG.testUserId,
        priority: "낮음",
        issueType: "작업",
        tags: ["테스트"],
        content: "# 통합 테스트\n\n이 작업은 자동으로 생성된 테스트 작업입니다.",
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toContain("[통합테스트]");
      expect(task.status).toBe("시작 전");

      testTaskId = task.id;
      trackCreatedTask(testTaskId);

      console.log(`✓ createTask: "${task.title}" 생성 (${testTaskId})`);
      await delay(500);
    }, 30000);

    it("updateTask: 제목 및 속성 수정", async () => {
      expect(testTaskId).toBeDefined();

      const updatedTask = await updateTask(testTaskId, {
        title: `[통합테스트-수정됨] ${new Date().toISOString()}`,
        priority: "중간",
        // memo: "테스트 작업 수정 완료", // 메모 속성이 데이터베이스에 없음
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.title).toContain("[통합테스트-수정됨]");
      expect(updatedTask.priority).toBe("중간");

      console.log(`✓ updateTask: 제목 및 우선순위 수정`);
      await delay(500);
    }, 30000);

    it("updateTaskStatus: 상태 변경", async () => {
      expect(testTaskId).toBeDefined();

      const updatedTask = await updateTaskStatus(testTaskId, "진행 중");

      expect(updatedTask).toBeDefined();
      expect(updatedTask.status).toBe("진행 중");

      console.log(`✓ updateTaskStatus: "시작 전" → "진행 중"`);
      await delay(500);
    }, 30000);

    it("addTaskLogAfterChangelog: 로그 추가", async () => {
      expect(testTaskId).toBeDefined();

      const result = await addTaskLogAfterChangelog(
        testTaskId,
        "테스트 진행 로그입니다.",
        TEST_CONFIG.testUserId,
        "progress"
      );

      expect(result).toBeDefined();
      expect(result.blockCount).toBeGreaterThan(0);

      console.log(`✓ addTaskLogAfterChangelog: 로그 추가 완료 (${result.blockCount}개 블록)`);
      await delay(500);
    }, 30000);

    it("archiveTask: 작업 보관", async () => {
      expect(testTaskId).toBeDefined();

      const result = await archiveTask(testTaskId);
      expect(result).toEqual({ success: true });

      console.log(`✓ archiveTask: 작업 보관 완료 (${testTaskId})`);
      await delay(300);
    }, 30000);
  });
});
