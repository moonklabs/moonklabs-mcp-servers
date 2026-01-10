/**
 * 환경 변수 관리 모듈
 * 모든 환경 변수를 한 곳에서 타입 안전하게 관리합니다.
 */

// 필수 환경 변수 검증
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${key}`);
  }
  return value;
}

// 선택적 환경 변수 (기본값 제공)
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * 로그 레벨 타입
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * 애플리케이션 설정
 * 서버 시작 시 환경 변수를 로드하여 설정 객체 생성
 */
export interface Config {
  notion: {
    token: string;
    taskDatabaseId: string;
    sprintDatabaseId: string;
  };
  server: {
    port: number;
    host: string;
    logLevel: LogLevel;
  };
  auth: {
    required: boolean;
    usersConfigured: boolean;
  };
}

/**
 * 로그 레벨 파싱
 */
function parseLogLevel(value: string | undefined): LogLevel {
  const normalized = value?.toLowerCase();
  if (
    normalized &&
    ["debug", "info", "warn", "error", "silent"].includes(normalized)
  ) {
    return normalized as LogLevel;
  }
  return "info"; // 기본값
}

/**
 * 설정을 로드합니다.
 * 필수 환경 변수가 없으면 에러를 throw합니다.
 */
export function loadConfig(): Config {
  return {
    notion: {
      token: requireEnv("NOTION_TOKEN"),
      taskDatabaseId: requireEnv("NOTION_TASK_DATABASE_ID"),
      sprintDatabaseId: requireEnv("NOTION_SPRINT_DATABASE_ID"),
    },
    server: {
      port: parseInt(optionalEnv("PORT", "3434"), 10),
      host: optionalEnv("HOST", "0.0.0.0"),
      logLevel: parseLogLevel(process.env.LOG_LEVEL),
    },
    auth: {
      required: process.env.AUTH_REQUIRED !== "false",
      usersConfigured: !!process.env.AUTH_USERS,
    },
  };
}

// 싱글톤 설정 인스턴스 (lazy initialization)
let configInstance: Config | null = null;

/**
 * 설정 인스턴스를 가져옵니다.
 * 첫 호출 시 환경 변수를 로드합니다.
 */
export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
