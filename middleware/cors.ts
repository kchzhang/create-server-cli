import { defineEventHandler } from "nitro/h3";

// Allowed origins whitelist — update with your trusted domains
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "https://your-production-domain.com",
]);

export default defineEventHandler((event): void => {
  const origin = event.req.headers.get("origin");

  // Only set CORS headers for whitelisted origins
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    if (event.req.method === "OPTIONS") {
      event.res.status = 403;
    }
    return;
  }

  event.res.headers.set("Access-Control-Allow-Origin", origin);
  event.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  event.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
  event.res.headers.set("Access-Control-Allow-Credentials", "true");
  event.res.headers.set("Access-Control-Max-Age", "86400");

  if (event.req.method === "OPTIONS") {
    event.res.status = 204;
  }
});
