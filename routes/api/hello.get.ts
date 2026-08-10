import { defineEventHandler } from "nitro/h3";
import { success } from "@/utils/response";

export default defineEventHandler(async (event) => {
  return success({ message: "Hello, World!", path: event.url.pathname });
});
