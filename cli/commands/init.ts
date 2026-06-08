import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { runPrompts } from "../prompts/init-prompts.js";
import { renderTemplate } from "../utils/template.js";
import { copyStaticFiles } from "../utils/copy.js";

export async function init(name?: string) {
  const answers = await runPrompts(name);
  const targetDir = path.resolve(process.cwd(), answers.projectName);

  // 检查目标目录
  if (fs.existsSync(targetDir)) {
    const { overwrite } = await import("inquirer").then((m) =>
      m.default.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `目录 ${answers.projectName} 已存在，是否覆盖？`,
          default: false,
        },
      ])
    );
    if (!overwrite) {
      console.log(chalk.yellow("已取消"));
      return;
    }
    fs.removeSync(targetDir);
  }

  fs.ensureDirSync(targetDir);

  // 渲染 EJS 模板
  await renderTemplate(targetDir, answers);

  // 拷贝静态文件
  await copyStaticFiles(targetDir);

  // 初始化 git
  console.log(chalk.cyan("\n初始化 Git 仓库..."));
  const { execSync } = await import("child_process");
  try {
    execSync("git init", { cwd: targetDir, stdio: "pipe" });
    console.log(chalk.green("✓ Git 仓库已初始化"));
  } catch {
    console.log(chalk.yellow("⚠ Git 初始化失败，请手动执行 git init"));
  }

  // 完成提示
  console.log(
    chalk.green("\n✓ 项目创建成功！") +
      chalk.cyan(`\n\n  cd ${answers.projectName}`) +
      chalk.cyan("\n  pnpm install") +
      chalk.cyan("\n  pnpm dev\n")
  );
}
