#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { init } from "./commands/init.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

const program = new Command();

program
  .name("nsv")
  .description("Scaffold a Nitro backend project from template")
  .version(pkg.version);

program
  .command("init")
  .argument("[name]", "project name")
  .description("Initialize a new Nitro backend project")
  .action(init);

program.parse();
