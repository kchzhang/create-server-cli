import type { H3Event } from "nitro/h3";
import { defineEventHandler } from "nitro/h3";
import { openApiSpec } from "./_openapi-data";

export default defineEventHandler((event: H3Event) => {
  event.res.headers.set("Content-Type", "application/json");
  return openApiSpec;
});
