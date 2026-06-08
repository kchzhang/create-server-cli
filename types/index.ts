/** 业务错误码枚举 */
export enum ErrorCode {
  // 通用
  SUCCESS = 0,
  UNKNOWN_ERROR = -1,
  VALIDATION_ERROR = 1001,
  NOT_FOUND = 1002,
  UNAUTHORIZED = 1003,
  FORBIDDEN = 1004,
  // 数据库
  DB_CONNECTION_ERROR = 2001,
  DB_QUERY_ERROR = 2002,
}

/** 业务错误码 → HTTP 状态码映射 */
export const ErrorCodeToHttpStatus: Record<number, number> = {
  [ErrorCode.SUCCESS]: 200,
  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.DB_CONNECTION_ERROR]: 503,
  [ErrorCode.DB_QUERY_ERROR]: 500,
};

/** 参数校验错误 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** 分页请求参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应数据 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
