import { defineApiHandler } from "../../service/handler";

export default defineApiHandler(async (event) => {
  return { message: "Hello, World!", path: event.path };
});
