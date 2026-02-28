import { existsSync } from "fs";
import { readFile, readdir } from "fs/promises";
import { join, resolve } from "path";
import pc from "picocolors";
import ora from "ora";
import { forgeCommand } from "./forge.js";
import { callClaude } from "../lib/anthropic.js";
import { loadConfig } from "../lib/config.js";
import { sanitizeName } from "../lib/forge-writer.js";
import { detectProjectContext, formatProjectContext } from "../lib/project-context.js";

interface Workflow {
  name?: string;
  description?: string;
  agents?: string[];
  sequentialOrder?: string[];
  gates?: { waitsFor: string[]; then: string }[];
}

export async function runCommand(input: string | undefined) {
  const claudePath = resolve("./.claude");
  const workflowPath = join(claudePath, "orchestration", "workflow.json");

  if (!existsSync(claudePath) || !existsSync(workflowPath)) {
    console.log(pc.cyan("\nNo .claude folder or incomplete setup. Creating one first...\n"));
    await forgeCommand(input, { output: "./.claude" });
    console.log();
  }

  if (!existsSync(workflowPath)) {
    console.error(pc.red("Error:") + " No workflow.json found. Run " + pc.cyan("claudeforge forge") + " first.\n");
    process.exit(1);
  }

  const workflowData = await readFile(workflowPath, "utf-8");
  const workflow = JSON.parse(workflowData) as Workflow;
  const agentOrder = workflow.sequentialOrder ?? workflow.agents ?? [];

  if (agentOrder.length === 0) {
    console.error(pc.red("Error:") + " No agents in workflow.\n");
    process.exit(1);
  }

  const config = await loadConfig();
  const userInput = input ?? "Process the current context (files, task, or request).";

  console.log(pc.bold("\n" + (workflow.name ?? "Orchestration") + "\n"));
  console.log(pc.gray((workflow.description ?? "") + "\n"));
  console.log(pc.cyan("Input:") + " " + userInput + "\n");
  console.log(pc.gray("─".repeat(50) + "\n"));

  let previousOutput = "";
  const startTime = Date.now();

  for (let i = 0; i < agentOrder.length; i++) {
    let agentName: string;
    try {
      agentName = sanitizeName(agentOrder[i]!);
    } catch {
      console.log(pc.yellow(`  ⚠ Skipping agent with unsafe name: "${agentOrder[i]}"\n`));
      continue;
    }
    const agentPath = join(claudePath, "agents", `${agentName}.md`);

    if (!existsSync(agentPath)) {
      console.log(pc.yellow(`  ⚠ Agent ${agentName} not found, skipping.\n`));
      continue;
    }

    const agentContent = await readFile(agentPath, "utf-8");
    const skills = await loadAgentSkills(claudePath, agentName);
    const systemPrompt = buildAgentPrompt(agentContent, skills);

    let userMessage: string;
    if (i === 0) {
      const projectCtx = await detectProjectContext();
      const projectSummary = formatProjectContext(projectCtx, 1500);
      userMessage =
        `## Repo context\n${projectSummary}\n\n` +
        `## User request\n${userInput}\n\n` +
        `Execute your role. Use the repo context (tech stack, structure) to inform your work. Provide your output in the format specified in your output contract.`;
    } else {
      userMessage =
        `Previous agent output:\n\n${previousOutput}\n\n---\n\n` +
        `Continue the workflow. Process the above and produce your output.`;
    }

    const spinner = ora(`  [${i + 1}/${agentOrder.length}] ${agentName}...`).start();

    try {
      const output = await callClaude(systemPrompt, userMessage, {
        model: config.defaults?.model,
        maxTokens: 8192,
      });

      spinner.succeed(`  [${i + 1}/${agentOrder.length}] ${agentName}`);
      console.log(pc.gray("\n  Output:\n"));
      const out = output.length > 800 ? output.slice(0, 800) + "\n  ..." : output;
      console.log(pc.white(out));
      console.log();

      previousOutput = output;
    } catch (err) {
      spinner.fail(`  [${i + 1}/${agentOrder.length}] ${agentName}`);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red("\n  Error:") + " " + msg);
      console.error(pc.yellow("  Skipping agent and continuing...\n"));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(pc.gray("─".repeat(50)));
  console.log(pc.green("\n✓ Orchestration complete in " + elapsed + "s\n"));
}

async function loadAgentSkills(claudePath: string, agentName: string): Promise<string[]> {
  const skillsDir = join(claudePath, "skills");
  if (!existsSync(skillsDir)) return [];

  const skillDirs = await readdir(skillsDir);
  const contents: string[] = [];

  for (const dir of skillDirs) {
    const skillPath = join(skillsDir, dir, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    const skillContent = await readFile(skillPath, "utf-8");
    const agentMatch = skillContent.match(/agent:\s*(\S+)/);
    if (agentMatch && agentMatch[1] === agentName) {
      contents.push(skillContent);
    }
  }

  return contents;
}

function buildAgentPrompt(agentContent: string, skillContents: string[]): string {
  let prompt = `You are executing as an agent in a multi-agent orchestration. Follow your role exactly.\n\n`;
  prompt += `## Your Agent Definition\n\n${agentContent}\n\n`;
  if (skillContents.length > 0) {
    prompt += `## Your Skills (follow these instructions)\n\n`;
    prompt += skillContents.join("\n\n---\n\n");
  }
  prompt += `\n\nExecute the user's request. Output in the format specified in your Output contract.`;
  return prompt;
}
