/**
 * 로깅 모듈
 * 로그 레벨을 지원하는 구조화된 로거
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel = "info";
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * 로그 레벨 설정
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 현재 로그 레벨 반환
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * 자식 로거 생성 (컨텍스트 포함)
   */
  child(context: string): Logger {
    const childLogger = new Logger(
      this.context ? `${this.context}:${context}` : context
    );
    childLogger.setLevel(this.level);
    return childLogger;
  }

  /**
   * 로그 레벨이 활성화되어 있는지 확인
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * 로그 출력
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.isLevelEnabled(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.context && { context: this.context }),
      ...(data && Object.keys(data).length > 0 && { data }),
    };

    const output = this.format(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  /**
   * 로그 엔트리 포맷팅
   */
  private format(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
      silent: "",
    };
    const reset = "\x1b[0m";

    const levelStr = `${levelColors[entry.level]}${entry.level.toUpperCase().padEnd(5)}${reset}`;
    const contextStr = entry.context ? `[${entry.context}] ` : "";
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";

    return `${entry.timestamp} ${levelStr} ${contextStr}${entry.message}${dataStr}`;
  }

  /**
   * DEBUG 레벨 로그
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  /**
   * INFO 레벨 로그
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  /**
   * WARN 레벨 로그
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  /**
   * ERROR 레벨 로그
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  /**
   * HTTP 요청 로깅 (INFO 레벨)
   */
  request(
    method: string,
    path: string,
    data?: Record<string, unknown>
  ): void {
    this.info(`→ ${method} ${path}`, data);
  }

  /**
   * HTTP 응답 로깅 (INFO 레벨)
   */
  response(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    data?: Record<string, unknown>
  ): void {
    const statusColor =
      statusCode >= 500
        ? "\x1b[31m"
        : statusCode >= 400
          ? "\x1b[33m"
          : "\x1b[32m";
    const reset = "\x1b[0m";
    this.info(
      `← ${method} ${path} ${statusColor}${statusCode}${reset} ${durationMs}ms`,
      data
    );
  }
}

// 환경 변수에서 로그 레벨 파싱
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

// 루트 로거 인스턴스 (싱글톤)
const rootLogger = new Logger();

/**
 * 루트 로거 초기화 (서버 시작 시 호출)
 */
export function initLogger(level?: LogLevel): void {
  const logLevel = level ?? parseLogLevel(process.env.LOG_LEVEL);
  rootLogger.setLevel(logLevel);
  rootLogger.debug("Logger initialized", { level: logLevel });
}

/**
 * 루트 로거 반환
 */
export function getLogger(): Logger {
  return rootLogger;
}

/**
 * 컨텍스트가 포함된 자식 로거 생성
 */
export function createLogger(context: string): Logger {
  return rootLogger.child(context);
}

export { Logger };
