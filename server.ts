import { defineEventHandler, onResponse } from "nitro/h3";
import { logger } from "./service/logger";

export default defineEventHandler((event) => {
  event.context.requestId = crypto.randomUUID();
  event.context.timestamp = Date.now();

  logger.info(`${event.req.method} ${event.path}`, {
    requestId: event.context.requestId as string,
  });

  // 在响应前设置耗时 header 并记录日志
  return onResponse((response) => {
    const duration = Date.now() - (event.context.timestamp as number);
    event.res.headers.set("X-Response-Time", `${duration}ms`);
    logger.debug(`${event.req.method} ${event.path} ${event.res.status}`, {
      requestId: event.context.requestId as string,
      duration: `${duration}ms`,
    });
    return response;
  });
});
