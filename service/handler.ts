import type { H3Event } from "nitro/h3";
import { readBody, getQuery } from "nitro/h3";
import { success, failWithStatus, handleApiError } from "./response";
import { ErrorCode, ValidationError } from "../types";
import { logger } from "./logger";

type AsyncHandler<T> = (event: H3Event) => Promise<T>;

interface HandlerOptions {
  /** 是否校验请求体 */
  validateBody?: (body: any) => { success: boolean; errors?: string[] };
  /** 是否校验查询参数 */
  validateQuery?: (query: any) => { success: boolean; errors?: string[] };
}

export function defineApiHandler<T>(
  handler: AsyncHandler<T>,
  options: HandlerOptions = {}
) {
  return async (event: H3Event) => {
    try {
      // 校验请求体
      if (options.validateBody) {
        const body = await readBody(event);
        const result = options.validateBody(body);
        if (!result.success) {
          return failWithStatus(
            event,
            result.errors?.join("; ") || "Validation failed",
            ErrorCode.VALIDATION_ERROR
          );
        }
      }

      // 校验查询参数
      if (options.validateQuery) {
        const query = getQuery(event);
        const result = options.validateQuery(query);
        if (!result.success) {
          return failWithStatus(
            event,
            result.errors?.join("; ") || "Validation failed",
            ErrorCode.VALIDATION_ERROR
          );
        }
      }

      const data = await handler(event);
      return success(data);
    } catch (error) {
      if (error instanceof ValidationError) {
        return failWithStatus(event, error.message, ErrorCode.VALIDATION_ERROR);
      }
      logger.error(`API Error: ${event.req.method} ${event.path}`, error);
      return handleApiError(event, error);
    }
  };
}

export { success, failWithStatus as fail, handleApiError } from "./response";
export { ValidationError } from "../types";
