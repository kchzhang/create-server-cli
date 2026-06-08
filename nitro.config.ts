import { defineConfig } from "nitro";
import { closePool } from "./mapper/pool";
import { logger } from "./service/logger";

export default defineConfig({
  runtimeConfig: {
    db: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || "",
    },
  },
  hooks: {
    close: async () => {
      logger.info("Server shutting down, closing connections...");
      await closePool();
      logger.info("All connections closed. Goodbye!");
    },
  },
});
