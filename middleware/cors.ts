import { defineEventHandler } from "nitro/h3";

export default defineEventHandler((event) => {
  const origin = event.req.headers.get("origin") || "*";

  event.res.headers.set("Access-Control-Allow-Origin", origin);
  event.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  event.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
  event.res.headers.set("Access-Control-Allow-Credentials", "true");
  event.res.headers.set("Access-Control-Max-Age", "86400");

  if (event.req.method === "OPTIONS") {
    event.res.status = 204;
  }
});
