import type { H3Event } from "nitro/h3";
import { ErrorCode, ErrorCodeToHttpStatus, ValidationError } from "../types";
import type { PaginatedData } from "../types";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T>(data: T, message = "ok"): ApiResponse<T> {
  return { code: ErrorCode.SUCCESS, message, data };
}

export function fail(
  message: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  data: null = null
): ApiResponse {
  return { code, message, data };
}

/** 设置 HTTP 状态码并返回错误响应 */
export function failWithStatus(
  event: H3Event,
  message: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR
): ApiResponse {
  event.res.status = ErrorCodeToHttpStatus[code] || 500;
  return fail(message, code);
}

/** 分页响应 */
export function paginated<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<PaginatedData<T>> {
  return success({
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export function handleApiError(event: H3Event, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal Server Error";

  // 如果是参数校验错误，返回 400
  if (error instanceof ValidationError) {
    return failWithStatus(event, error.message, ErrorCode.VALIDATION_ERROR);
  }

  return failWithStatus(event, message, ErrorCode.UNKNOWN_ERROR);
}


