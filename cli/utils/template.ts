import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import ejs from "ejs";
import type { InitAnswers } from "../prompts/init-prompts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../templates");

/** 仅渲染 package.json.ejs，其余文件为静态拷贝 */
export async function renderTemplate(
  targetDir: string,
  answers: InitAnswers
): Promise<void> {
  const ejsFile = path.join(TEMPLATE_DIR, "package.json.ejs");
  const content = await fs.readFile(ejsFile, "utf-8");
  const rendered = ejs.render(content, answers);
  await fs.writeFile(path.join(targetDir, "package.json"), rendered);
}
