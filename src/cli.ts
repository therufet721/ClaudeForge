#!/usr/bin/env node

import { createRequire } from "module";
import { program } from "commander";
import { authCommand } from "./commands/auth.js";
import { forgeCommand } from "./commands/forge.js";
import { addCommand } from "./commands/add.js";
import { visualizeCommand } from "./commands/visualize.js";
import { doctorCommand } from "./commands/doctor.js";
import { templateCommand } from "./commands/template.js";
import { runCommand } from "./commands/run.js";
import { startRepl } from "./repl.js";

const _require = createRequire(import.meta.url);
const VERSION: string = (_require("../package.json") as { version: string }).version;

program
  .name("claudeforge")
  .description(
    "One command. Complete .claude folder. Production-ready AI agent orchestration."
  )
  .version(VERSION);

// Auth
program
  .command("auth")
  .description("Authenticate with Anthropic (API key or Claude.ai)")
  .option("--status", "Show current auth state")
  .action((opts) => authCommand(opts));

// Forge - main command
program
  .command("forge")
  .description("Generate a complete .claude folder from a description")
  .argument("[description]", "What your agent system should do")
  .option("-f, --from <file>", "Read description from a file")
  .option("-o, --output <path>", "Target directory (default: ./.claude)")
  .option("--dry-run", "Show what would be generated without writing")
  .option("--model <model>", "Claude model (default: claude-sonnet-4-6)")
  .action((desc, opts) => forgeCommand(desc, opts));

// Add
program
  .command("add")
  .description("Add agent, skill, or template to existing .claude")
  .argument("<type>", "agent | skill | command | hook")
  .argument("[description]", "What to add")
  .option("-t, --to <agent>", "Attach skill to this agent")
  .action((type, desc, opts) => addCommand(type, desc, opts));

// Visualize
program
  .command("visualize")
  .description("Show orchestration as a terminal diagram")
  .option("-f, --format <format>", "Output format: terminal | mermaid")
  .option("-o, --output <file>", "Write to file instead of stdout")
  .action((opts) => visualizeCommand(opts));

// Doctor
program
  .command("doctor")
  .description("Scan .claude for problems and fix them")
  .option("-y, --yes", "Auto-fix all issues without prompting")
  .action((opts) => doctorCommand(opts));

// Template
program
  .command("template")
  .description("Browse and install community templates")
  .argument("[action]", "list | use | publish")
  .argument("[name]", "Template name")
  .action((action, name) => templateCommand(action, name));

// Run
program
  .command("run")
  .description("Test orchestration locally with live output")
  .argument("[input]", "Input to pass to the workflow")
  .action((input) => runCommand(input));

// Default: interactive REPL when no subcommand
if (!process.argv[2]) {
  startRepl();
} else {
  program.parse();
}
