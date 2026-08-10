import { defineConfig } from "nitro";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  serverDir: "./",
  errorHandler: "./utils/error-handler.ts",
  alias: {
    "@": resolve(__dirname, "."),
    "@service": resolve(__dirname, "service"),
    "@mapper": resolve(__dirname, "mapper"),
    "@types": resolve(__dirname, "types"),
  },
  runtimeConfig: {
    db: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || "",
    },
  },
});
