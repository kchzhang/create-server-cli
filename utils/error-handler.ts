import type { HTTPError, H3Event } from "nitro/h3";
import { ErrorCode } from "../types";
import { logger } from "./logger";

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

/** HTTP 状态码 → 业务错误码映射 */
const HttpStatusToErrorCode: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  405: ErrorCode.VALIDATION_ERROR,
  500: ErrorCode.UNKNOWN_ERROR,
};

/** 业务错误码 → 友好提示映射 */
const FRIENDLY_MESSAGES: Record<number, string> = {
  [ErrorCode.NOT_FOUND]: "请求的资源不存在",
  [ErrorCode.VALIDATION_ERROR]: "请求参数错误",
  [ErrorCode.UNAUTHORIZED]: "未授权，请先登录",
  [ErrorCode.FORBIDDEN]: "无权访问该资源",
  [ErrorCode.DB_CONNECTION_ERROR]: "服务暂时不可用，请稍后重试",
  [ErrorCode.DB_QUERY_ERROR]: "服务暂时不可用，请稍后重试",
};

/** Nitro 全局错误处理器 */
export default function globalErrorHandler(
  error: HTTPError,
  _event: H3Event
): ApiResponse {
  const statusCode = error.statusCode || 500;
  const errorCode = HttpStatusToErrorCode[statusCode] ?? ErrorCode.UNKNOWN_ERROR;

  // 404 特殊处理：统一返回友好提示
  if (statusCode === 404) {
    logger.warn(`404 Not Found: ${error.message || "unknown path"}`);
    return {
      code: ErrorCode.NOT_FOUND,
      message: "请求的资源不存在",
      data: null,
    };
  }

  // 其他错误：尝试用友好提示，兜底用通用提示
  const message =
    FRIENDLY_MESSAGES[errorCode] ||
    (statusCode < 500 ? error.statusText || error.message : "服务器内部错误，请稍后重试");

  if (statusCode >= 500) {
    logger.error(`Server Error [${statusCode}]: ${error.message}`, error);
  } else {
    logger.warn(`Client Error [${statusCode}]: ${error.message}`);
  }

  return {
    code: errorCode,
    message,
    data: null,
  };
}
