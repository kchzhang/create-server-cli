import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";
import { createGenerator } from "ts-json-schema-generator";

// ─── OpenAPI 类型定义（内联，避免额外依赖） ──────────────────────────────────
interface OpenAPISchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  $ref?: string;
  description?: string;
  [key: string]: any;
}

interface OpenAPIParameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: OpenAPISchema;
  description?: string;
}

interface OpenAPIMediaType {
  schema: OpenAPISchema | { $ref: string };
}

interface OpenAPIRequestBody {
  required: boolean;
  content: Record<string, OpenAPIMediaType>;
}

interface OpenAPIResponse {
  description: string;
  content?: Record<string, OpenAPIMediaType>;
}

interface OpenAPIOperation {
  summary?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
}

interface OpenAPIPathItem {
  [method: string]: OpenAPIOperation;
}

interface OpenAPIDocument {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, OpenAPIPathItem>;
  components?: { schemas?: Record<string, OpenAPISchema> };
}

// ─── 配置 ────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ROUTES_DIR = path.join(ROOT, "routes");
const OUTPUT_FILE = path.join(ROOT, "routes", "docs", "_openapi-data.ts");
const TSCONFIG_PATH = path.join(ROOT, "tsconfig.json");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

// ─── 路由文件扫描 ────────────────────────────────────────────────────────────
interface RouteInfo {
  filePath: string;
  method: HttpMethod;
  url: string;
}

/**
 * 将 Nitro 文件路由约定转换为 URL 路径
 * routes/api/health.get.ts → /api/health
 * routes/api/users/[id].get.ts → /api/users/{id}
 * routes/api/users/[...slug].get.ts → /api/users/{slug}
 */
function filePathToUrl(relPath: string): string {
  let url = relPath.replace(/\\/g, "/");

  // 去掉 .{method}.ts 后缀
  url = url.replace(/\.(get|post|put|patch|delete)\.ts$/, "");

  // [id] → {id}
  url = url.replace(/\[([^\]]+)\]/g, (_, name) => `{${name}}`);

  // [...slug] → {slug}
  url = url.replace(/\{\.\.\.(\w+)\}/g, "{$1}");

  // index → /
  url = url.replace(/\/index$/, "");

  if (!url.startsWith("/")) url = "/" + url;

  return url;
}

function extractMethod(fileName: string): HttpMethod | null {
  const match = fileName.match(/\.(get|post|put|patch|delete)\.ts$/);
  return match ? (match[1] as HttpMethod) : null;
}

function scanRoutes(dir: string, base = ""): RouteInfo[] {
  const results: RouteInfo[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);

    if (entry.isDirectory()) {
      // 跳过 docs 目录（文档路由，非 API 路由）
      if (entry.name === "docs") continue;
      results.push(...scanRoutes(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      const method = extractMethod(entry.name);
      if (!method) continue;

      // 跳过以下划线开头的文件（内部路由）
      if (entry.name.startsWith("_")) continue;

      const url = filePathToUrl(relPath);
      results.push({ filePath: fullPath, method, url });
    }
  }

  return results;
}

// ─── TypeScript 类型提取 ─────────────────────────────────────────────────────
interface ExtractedTypes {
  inputTypes: { name: string; kind: "body" | "query" }[];
  outputType: string | null;
}

/**
 * 从路由处理器 AST 中提取输入/输出类型信息
 * - readBody<T> → body Input DTO
 * - getQuery<T> → query Input DTO
 * - 返回类型 → Output DTO（自动解包 ApiResponse<T>）
 */
function extractTypesFromRoute(filePath: string): ExtractedTypes {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf-8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const inputTypes: { name: string; kind: "body" | "query" }[] = [];
  let outputType: string | null = null;

  function visit(node: ts.Node) {
    // 检测 readBody<T> / getQuery<T> 调用
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isIdentifier(expr)) {
        const fnName = expr.text;
        if (
          (fnName === "readBody" || fnName === "getQuery") &&
          node.typeArguments &&
          node.typeArguments.length > 0
        ) {
          const typeArg = node.typeArguments[0];
          const kind = fnName === "readBody" ? "body" : "query";
          inputTypes.push({ name: typeToString(typeArg), kind });
        }
      }
    }

    // 检测 export default defineEventHandler(async () => { ... }) 返回类型
    if (
      ts.isExportAssignment(node) &&
      ts.isCallExpression(node.expression)
    ) {
      const callExpr = node.expression;
      if (ts.isIdentifier(callExpr.expression)) {
        const fnName = callExpr.expression.text;
        if (fnName === "defineEventHandler" && callExpr.arguments.length > 0) {
          const handler = callExpr.arguments[0];
          if (callExpr.typeArguments && callExpr.typeArguments.length > 0) {
            outputType = typeToString(callExpr.typeArguments[0]);
          } else {
            outputType = inferReturnType(handler);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  function inferReturnType(handler: ts.Expression): string | null {
    let returnType: string | null = null;

    if (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) {
      if (handler.type) {
        returnType = typeToString(handler.type);
      } else {
        const body = handler.body;
        if (ts.isBlock(body)) {
          ts.forEachChild(body, (stmt) => {
            if (ts.isReturnStatement(stmt) && stmt.expression) {
              if (ts.isCallExpression(stmt.expression)) {
                returnType = inferTypeFromCall(stmt.expression);
              }
            }
          });
        } else {
          // 简写箭头函数: () => expr
          if (ts.isCallExpression(body)) {
            returnType = inferTypeFromCall(body);
          }
        }
      }
    }

    return returnType;
  }

  function inferTypeFromCall(call: ts.CallExpression): string | null {
    if (ts.isIdentifier(call.expression)) {
      const fnName = call.expression.text;
      // success<T>(data) → 解包为 T
      if (fnName === "success" && call.typeArguments && call.typeArguments.length > 0) {
        return typeToString(call.typeArguments[0]);
      }
      // paginated<T>(...) → 解包为 PaginatedData<T>
      if (fnName === "paginated" && call.typeArguments && call.typeArguments.length > 0) {
        return `PaginatedData<${typeToString(call.typeArguments[0])}>`;
      }
    }
    return null;
  }

  function typeToString(typeNode: ts.TypeNode): string {
    return typeNode.getText(sourceFile).trim();
  }

  /**
   * 解包 Promise<T> 为 T，因为运行时返回的是 T 而非 Promise<T>
   */
  function unwrapPromise(typeName: string): string {
    const match = typeName.match(/^Promise<(.+)>$/);
    return match ? match[1] : typeName;
  }

  visit(sourceFile);

  // 解包 Promise 包装
  if (outputType) {
    outputType = unwrapPromise(outputType);
  }

  return { inputTypes, outputType };
}

// ─── JSON Schema 生成 ────────────────────────────────────────────────────────
let schemaGenerator: ReturnType<typeof createGenerator> | null = null;

function getSchemaGenerator() {
  if (schemaGenerator) return schemaGenerator;

  const config = {
    path: path.join(ROOT, "types/index.ts"),
    tsconfig: TSCONFIG_PATH,
    type: "*" as const,
    skipTypeCheck: true,
    additionalPaths: [path.join(ROOT, "utils/response.ts")],
  };

  schemaGenerator = createGenerator(config);
  return schemaGenerator;
}

/**
 * 将 TypeScript 类型名转为 JSON Schema
 * 返回 { schema, definitions } 其中 schema 可能包含 $ref，definitions 需要被收集
 */
function typeToSchema(typeName: string): { schema: OpenAPISchema; definitions: Record<string, any> } | null {
  try {
    const generator = getSchemaGenerator();
    const fullSchema = generator.createSchema(typeName);
    const def = fullSchema.definitions?.[typeName];

    if (!def) return null;

    // 主 schema 使用 $ref
    const schema: OpenAPISchema = { $ref: `#/definitions/${typeName}` };
    const definitions = fullSchema.definitions || {};

    return { schema, definitions };
  } catch (err) {
    // 类型可能无法解析，返回 null
    return null;
  }
}

// ─── OpenAPI 文档构建 ────────────────────────────────────────────────────────
function buildOpenAPIDoc(routes: RouteInfo[]): OpenAPIDocument {
  const doc: OpenAPIDocument = {
    openapi: "3.1.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
    },
    paths: {},
  };

  const allSchemas: Record<string, OpenAPISchema> = {};

  for (const route of routes) {
    const { inputTypes, outputType } = extractTypesFromRoute(route.filePath);

    const pathItem: OpenAPIPathItem = {};
    const operation: OpenAPIOperation = {
      summary: `${route.method.toUpperCase()} ${route.url}`,
      tags: extractTags(route.url),
      responses: {
        "200": {
          description: "Successful response",
        },
      },
    };

    // 处理路径参数
    const pathParams = extractPathParams(route.url);
    if (pathParams.length > 0) {
      operation.parameters = pathParams.map((p) => ({
        name: p,
        in: "path",
        required: true,
        schema: { type: "string" },
      }));
    }

    // 处理输入类型
    for (const input of inputTypes) {
      if (input.kind === "body") {
        const result = typeToSchema(input.name);
        if (result) {
          operation.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: result.schema,
              },
            },
          };
          collectDefinitions(result.definitions, allSchemas);
        } else {
          operation.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object", description: input.name },
              },
            },
          };
        }
      } else if (input.kind === "query") {
        const result = typeToSchema(input.name);
        if (result) {
          const def = result.definitions[input.name];
          const queryParams = schemaToQueryParams(def || result.schema, input.name);
          operation.parameters = [
            ...(operation.parameters || []),
            ...queryParams,
          ];
          collectDefinitions(result.definitions, allSchemas);
        }
      }
    }

    // 处理输出类型
    if (outputType) {
      const result = typeToSchema(outputType);
      if (result) {
        operation.responses["200"].content = {
          "application/json": {
            schema: result.schema,
          },
        };
        collectDefinitions(result.definitions, allSchemas);
      } else {
        operation.responses["200"].content = {
          "application/json": {
            schema: { type: "object", description: outputType },
          },
        };
      }
    }

    pathItem[route.method] = operation;
    doc.paths[route.url] = pathItem;
  }

  // 添加 components/schemas
  if (Object.keys(allSchemas).length > 0) {
    doc.components = {
      schemas: allSchemas,
    };
  }

  // 内联 $ref 为组件引用
  inlineRefs(doc, allSchemas);

  return doc;
}

function extractTags(url: string): string[] {
  const parts = url.split("/").filter(Boolean);
  if (parts.length > 1) {
    return [parts[0]];
  }
  return ["default"];
}

function extractPathParams(url: string): string[] {
  const matches = url.match(/\{(\w+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

function schemaToQueryParams(
  schema: OpenAPISchema,
  typeName: string
): OpenAPIParameter[] {
  const params: OpenAPIParameter[] = [];
  if (schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      const propSchema = prop as OpenAPISchema;
      params.push({
        name,
        in: "query",
        required: schema.required?.includes(name) ?? false,
        schema: { type: propSchema.type || "string" },
        description: propSchema.description || `${typeName}.${name}`,
      });
    }
  }
  return params;
}

function collectDefinitions(
  definitions: Record<string, any>,
  target: Record<string, OpenAPISchema>
) {
  for (const [name, def] of Object.entries(definitions)) {
    if (!target[name]) {
      target[name] = def as OpenAPISchema;
    }
  }
}

/**
 * 将内联 $ref（如 #/definitions/XXX）转为 #/components/schemas/XXX
 */
function inlineRefs(doc: OpenAPIDocument, schemas: Record<string, any>) {
  const refMap: Record<string, string> = {};
  for (const name of Object.keys(schemas)) {
    refMap[`#/definitions/${name}`] = `#/components/schemas/${name}`;
  }

  function replaceRef(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(replaceRef);
    if (obj.$ref && typeof obj.$ref === "string") {
      obj.$ref = refMap[obj.$ref] || obj.$ref;
    }
    for (const key of Object.keys(obj)) {
      if (key !== "$ref") {
        obj[key] = replaceRef(obj[key]);
      }
    }
    return obj;
  }

  replaceRef(doc);
}

// ─── 主入口 ──────────────────────────────────────────────────────────────────
export async function generateOpenAPI() {
  console.log("Scanning routes...");
  const routes = scanRoutes(ROUTES_DIR);

  if (routes.length === 0) {
    console.log("No routes found.");
    return;
  }

  console.log(`Found ${routes.length} routes:`);
  for (const r of routes) {
    console.log(`  ${r.method.toUpperCase().padEnd(6)} ${r.url}`);
  }

  console.log("\nGenerating OpenAPI document...");
  const doc = buildOpenAPIDoc(routes);

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tsContent = `// Auto-generated by generate-openapi — DO NOT EDIT\nexport const openApiSpec = ${JSON.stringify(doc, null, 2)} as const;\n`;
  fs.writeFileSync(OUTPUT_FILE, tsContent, "utf-8");
  console.log(`\nOpenAPI document generated: ${OUTPUT_FILE}`);
}

// 直接执行时自动运行
generateOpenAPI().catch((err) => {
  console.error("Failed to generate OpenAPI document:", err);
  process.exit(1);
});
