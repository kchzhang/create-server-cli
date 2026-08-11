import { defineEventHandler, setResponseHeader } from "nitro/h3";

export default defineEventHandler((event) => {
  setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Documentation</title>
</head>
<body>
  <script id="api-reference" data-url="/docs/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
});
