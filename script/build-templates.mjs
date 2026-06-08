import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.resolve(ROOT, "dist/cli/templates");

/** 需要从项目根目录复制到模板的根文件 */
const ROOT_FILES = [
  "server.ts",
  "nitro.config.ts",
  "tsconfig.json",
  "vite.config.ts",
  "Dockerfile",
  "docker-compose.yml",
  ".gitignore",
  ".dockerignore",
  ".env.example",
];

/** 需要整体复制的子目录 */
const DIRS = ["mapper", "middleware", "routes", "script", "service", "types"];

/** CLI 专属依赖（构建产物不需要） */
const CLI_DEPS = new Set([
  "chalk",
  "commander",
  "ejs",
  "fs-extra",
  "inquirer",
  "@types/ejs",
  "@types/fs-extra",
  "@types/inquirer",
]);

/** CLI 专属 package.json 字段 */
const CLI_FIELDS = new Set(["bin", "files"]);

/** CLI 专属脚本 */
const CLI_SCRIPTS = new Set(["cli:build"]);

/**
 * 从项目 package.json 生成模板的 package.json.ejs
 * - 移除 CLI 专属字段和依赖
 * - name / description 替换为 EJS 变量
 */
function generatePackageJsonEjs() {
  const pkg = fs.readJsonSync(path.join(ROOT, "package.json"));

  // 移除 CLI 专属字段
  for (const field of CLI_FIELDS) {
    delete pkg[field];
  }

  // 移除 CLI 专属脚本
  for (const script of CLI_SCRIPTS) {
    delete pkg.scripts[script];
  }

  // 移除 CLI 专属依赖
  for (const dep of CLI_DEPS) {
    delete pkg.dependencies[dep];
    delete pkg.devDependencies[dep];
  }

  // EJS 变量替换
  pkg.name = "<%= projectName %>";
  pkg.description = "<%= description %>";

  // 输出为 .ejs 文件
  const content = JSON.stringify(pkg, null, 2) + "\n";
  fs.writeFileSync(path.join(OUTPUT, "package.json.ejs"), content, "utf-8");
}

async function main() {
  // 清空输出目录
  await fs.emptyDir(OUTPUT);

  // 复制根文件
  for (const file of ROOT_FILES) {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      await fs.copy(src, path.join(OUTPUT, file));
    }
  }

  // 复制子目录
  for (const dir of DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) {
      await fs.copy(src, path.join(OUTPUT, dir));
    }
  }

  // 生成 package.json.ejs
  generatePackageJsonEjs();

  console.log("✓ Templates built to dist/cli/templates/");
}

main().catch((err) => {
  console.error("Failed to build templates:", err);
  process.exit(1);
});
