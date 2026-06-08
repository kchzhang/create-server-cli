import mysql from "mysql2/promise";
import { useRuntimeConfig } from "nitro/runtime-config";
import { logger } from "../service/logger";
import { getPoolRef, setPoolRef } from "./pool";
import type { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2/promise";

export function getPool(): mysql.Pool {
  const existing = getPoolRef();
  if (existing) return existing;

  const config = useRuntimeConfig().db;
  const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    bigNumberStrings: true,
    decimalNumbers: true,
    supportBigNumbers: true,
    dateStrings: true,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  setPoolRef(pool);
  logger.info("MySQL connection pool created");
  return pool;
}

/** 便捷查询方法 */
export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

/** 便捷单行查询 */
export async function queryOne<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T[number] | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** 执行写操作 (INSERT/UPDATE/DELETE) */
export async function execute(
  sql: string,
  params?: any[]
): Promise<OkPacket | ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute<OkPacket | ResultSetHeader>(sql, params);
  return result;
}

export async function checkConnection(): Promise<boolean> {
  const pool = getPool();
  let conn;
  try {
    conn = await pool.getConnection();
    logger.info("Pool connection successful", { threadId: conn.threadId });
    return true;
  } catch (error) {
    logger.error("Pool connection test failed", error);
    return false;
  } finally {
    if (conn) conn.release();
  }
}
