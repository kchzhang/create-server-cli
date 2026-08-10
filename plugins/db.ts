import { definePlugin } from "nitro";
import { closePool } from "../mapper/pool";
import { logger } from "../utils/logger";
import { checkConnection } from "../mapper/mysql";

export default definePlugin(async (nitroApp) => {
  const ok = await checkConnection();
  if (ok) {
    logger.info("✅ Database connected successfully");
  } else {
    logger.error("❌ Database connection failed");
  }

  nitroApp.hooks.hook("close", async () => {
    logger.info("Server shutting down, closing connections...");
    await closePool();
    logger.info("All connections closed. Goodbye!");
  });
});
