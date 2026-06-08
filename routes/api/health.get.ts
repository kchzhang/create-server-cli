import { defineEventHandler } from "nitro/h3";
import { checkConnection } from "../../mapper/mysql";

export default defineEventHandler(async () => {
  const dbOk = await checkConnection();
  const status = dbOk ? "healthy" : "degraded";

  return {
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? "up" : "down",
    },
  };
});
