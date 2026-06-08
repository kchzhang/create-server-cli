import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../templates");

/** 需要排除的文件（EJS 模板已由 renderTemplate 处理） */
const EXCLUDE_FILES = new Set(["package.json.ejs"]);

/** 递归拷贝模板目录中除 .ejs 以外的所有文件到目标目录 */
export async function copyStaticFiles(targetDir: string): Promise<void> {
  await copyDir(TEMPLATE_DIR, targetDir);
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (!EXCLUDE_FILES.has(entry.name)) {
      await fs.copy(srcPath, destPath);
    }
  }
}
