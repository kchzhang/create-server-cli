import { defineEventHandler } from "nitro/h3";
import { success } from "@/utils/response";
import type { HelloResponse } from "@/types";

export default defineEventHandler(async (event) => {
  return success<HelloResponse>({ message: "Hello, World!", path: event.url.pathname });
});
