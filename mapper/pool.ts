import type mysql from "mysql2/promise";
import { logger } from "../service/logger";

let _pool: mysql.Pool | null = null;

/** 获取当前连接池引用 */
export function getPoolRef(): mysql.Pool | null {
  return _pool;
}

/** 设置连接池引用 */
export function setPoolRef(pool: mysql.Pool): void {
  _pool = pool;
}

/** 优雅关闭连接池 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    logger.info("MySQL connection pool closed");
  }
}
