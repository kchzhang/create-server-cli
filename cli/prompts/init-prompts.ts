import inquirer from "inquirer";

export interface InitAnswers {
  projectName: string;
  description: string;
}

export async function runPrompts(name?: string): Promise<InitAnswers> {
  return inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "项目名称:",
      default: name || "my-server",
      validate: (v: string) => /^[\w-]+$/.test(v) || "仅支持字母、数字、-、_",
    },
    {
      type: "input",
      name: "description",
      message: "项目描述:",
      default: "A Nitro server project",
    },
  ]);
}
