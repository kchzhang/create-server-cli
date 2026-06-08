#!/usr/bin/env node
import { Command } from "commander";
import { init } from "./commands/init.js";

const program = new Command();

program
  .name("base-server")
  .description("Scaffold a Nitro backend project from template")
  .version("1.0.0");

program
  .command("init")
  .argument("[name]", "project name")
  .description("Initialize a new Nitro backend project")
  .action(init);

program.parse();
