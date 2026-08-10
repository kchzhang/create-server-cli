import { defineApiHandler } from "../../utils/handler";

export default defineApiHandler(async (event) => {
  return { message: "Hello, World!", path: event.path };
});
