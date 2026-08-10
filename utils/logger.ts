import fs from "fs";
import path from "path";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL || "info") as LogLevel;
const logDir = process.env.LOG_DIR || "logs";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function formatMessage(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

/** 获取当天日志文件路径 */
function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.resolve(logDir, `${date}.log`);
}

/** 写入日志到磁盘（追加模式） */
function writeToFile(formatted: string): void {
  try {
    const filePath = getLogFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(filePath, formatted + "\n", "utf-8");
  } catch {
    // 写盘失败不影响主流程
  }
}

function log(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) return;
  const formatted = formatMessage(level, message, meta);
  // 控制台输出
  const consoleFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  consoleFn(formatted);
  // 写入磁盘（仅 info 及以上级别）
  if (LEVEL_PRIORITY[level] >= LEVEL_PRIORITY["info"]) {
    writeToFile(formatted);
  }
}

export const logger = {
  debug(message: string, meta?: unknown) {
    log("debug", message, meta);
  },
  info(message: string, meta?: unknown) {
    log("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    log("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    log("error", message, meta);
  },
};
