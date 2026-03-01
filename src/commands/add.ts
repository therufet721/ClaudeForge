import { existsSync } from "fs";
import { mkdir, realpath } from "fs/promises";
import { join, resolve } from "path";
import pc from "picocolors";
import { callClaude } from "../lib/anthropic.js";
import { parseForgeResponse } from "../lib/forge-parser.js";
import { safeWrite, sanitizeName } from "../lib/forge-writer.js";
import ora from "ora";
import type { ForgeAgent, ForgeSkill } from "../lib/forge-parser.js";

const ADD_SYSTEM = `You extend an existing .claude setup. Given the type and description, return a minimal JSON object:
- For "agent": { "agents": [{ name, persona, model, description, inputContract, outputContract }] }
  - description: when Claude should delegate to this agent (e.g. "Use when reviewing code quality")
- For "skill": { "skills": [{ name, description, agent, instructions, scripts?, references?, templates? }] }, "agent" is required (--to)
  - description: when Claude should auto-load this skill (e.g. "Use when auditing accessibility")
- For "command": { "commands": [{ name, description }] }
- For "hook": { "hooks": [{ name, event, content }] }
  - event: one of PreToolUse, PostToolUse, PostToolUseFailure, SessionStart, SessionEnd, Stop

Output ONLY valid JSON, no markdown. Use kebab-case for names.`;

/** Escape a string for safe use in YAML (double-quoted value). */
function escapeYamlString(s: string): string {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

const VALID_MODELS = ["sonnet", "opus", "haiku"] as const;
function validateModel(model: unknown): "sonnet" | "opus" | "haiku" {
  if (typeof model === "string" && VALID_MODELS.includes(model as (typeof VALID_MODELS)[number])) {
    return model as "sonnet" | "opus" | "haiku";
  }
  return "sonnet";
}

export async function addCommand(
  type: string,
  description: string | undefined,
  options: { to?: string }
) {
  const claudePath = resolve("./.claude");
  if (!existsSync(claudePath)) {
    console.error(pc.red("Error:") + " No .claude folder found. Run " + pc.cyan("claudesmith forge") + " first.");
    process.exit(1);
  }

  if (!description) {
    console.error(pc.red("Error:") + " Provide a description. Example: claudesmith add agent \"a deployment agent\"");
    process.exit(1);
  }

  if (type === "skill" && !options.to) {
    console.error(
      pc.red("Error:") +
        " Adding a skill requires --to <agent>. Example: " +
        pc.cyan("claudesmith add skill \"accessibility audit\" --to my-agent")
    );
    process.exit(1);
  }

  // Validate --to agent exists before generating anything (sanitize to prevent path traversal)
  if (type === "skill" && options.to) {
    let safeTo: string;
    try {
      safeTo = sanitizeName(options.to);
    } catch {
      console.error(pc.red("Error:") + ` Invalid agent name "${options.to}". Use kebab-case (e.g. my-agent).`);
      process.exit(1);
    }
    const agentFile = join(resolve("./.claude"), "agents", `${safeTo}.md`);
    if (!existsSync(agentFile)) {
      console.error(
        pc.red("Error:") + ` Agent "${options.to}" not found. ` +
        `Run ${pc.cyan("claudesmith visualize")} to see available agents.`
      );
      process.exit(1);
    }
  }

  let userMsg = `Add ${type}: ${description}`;
  if (options.to && type === "skill") userMsg += `\nAttach to agent: ${options.to}`;

  const spinner = ora("Generating...").start();
  const outputPath = resolve("./.claude");
  const rootReal = await realpath(outputPath);

  try {
    const response = await callClaude(ADD_SYSTEM, userMsg);

    // For hooks, parseForgeResponse requires an "agents" root key which hook responses
    // don't have — handle hooks with a direct JSON parse instead
    if (type === "hook") {
      let hookJson: { hooks?: Array<{ name: string; event: string; content: string }> };
      try {
        const raw = response.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
        hookJson = JSON.parse(raw);
      } catch {
        spinner.fail("Could not parse hook response as JSON");
        return;
      }
      const hook = hookJson.hooks?.[0];
      if (!hook) { spinner.fail("No hook in response"); return; }
      const safeName = sanitizeName(hook.name);
      await mkdir(join(outputPath, "hooks"), { recursive: true });
      await safeWrite(rootReal, join(outputPath, "hooks", safeName), hook.content);
      spinner.succeed(`Added hook: ${safeName} (${hook.event})`);
      console.warn(pc.yellow(`  ⚠ Review hooks/${safeName} before trusting its shell logic.`));
      return;
    }

    const parsed = parseForgeResponse(response);

    if (type === "agent" && parsed.agents?.length) {
      const agent: ForgeAgent = parsed.agents[0];
      const safeName = sanitizeName(agent.name);
      const description = agent.description ?? agent.persona?.split(/[.!?]/)[0]?.trim() ?? agent.name;
      const model = validateModel(agent.model);
      const content = `---
name: ${safeName}
description: ${escapeYamlString(description)}
tools: Read, Glob, Grep, Bash
model: ${model}
---

# ${safeName}

${agent.persona}

## Input
${agent.inputContract}

## Output
${agent.outputContract}
`;
      await mkdir(join(outputPath, "agents"), { recursive: true });
      await safeWrite(rootReal, join(outputPath, "agents", `${safeName}.md`), content);
      spinner.succeed(`Added agent: ${safeName}`);
    } else if (type === "skill" && parsed.skills?.length) {
      const skill: ForgeSkill = parsed.skills[0];
      const safeAgent = options.to ? sanitizeName(options.to) : sanitizeName(skill.agent);
      if (options.to) skill.agent = safeAgent;
      const safeSkillName = sanitizeName(skill.name);
      const skillDescription = skill.description
        ?? (skill.triggers?.slice(0, 2).join(". ") ?? skill.name);
      const skillDir = join(outputPath, "skills", safeSkillName);
      await mkdir(skillDir, { recursive: true });
      await mkdir(join(skillDir, "scripts"), { recursive: true });
      await mkdir(join(skillDir, "references"), { recursive: true });
      await mkdir(join(skillDir, "templates"), { recursive: true });
      const skillContent = `---
name: ${safeSkillName}
description: ${escapeYamlString(skillDescription)}
context: fork
agent: ${safeAgent}
---

# ${safeSkillName}

${skill.instructions}
`;
      await safeWrite(rootReal, join(skillDir, "SKILL.md"), skillContent);
      for (const script of skill.scripts ?? []) {
        const safeScript = sanitizeName(script.name);
        await safeWrite(rootReal, join(skillDir, "scripts", safeScript), script.content);
      }
      for (const ref of skill.references ?? []) {
        const safeRef = sanitizeName(ref.name);
        await safeWrite(rootReal, join(skillDir, "references", safeRef), ref.content);
      }
      for (const tmpl of skill.templates ?? []) {
        const safeTmpl = sanitizeName(tmpl.name);
        await safeWrite(rootReal, join(skillDir, "templates", safeTmpl), tmpl.content);
      }
      spinner.succeed(`Added skill: ${safeSkillName} (→ ${skill.agent})`);
    } else if (type === "command" && parsed.commands?.length) {
      const cmd = parsed.commands[0];
      const safeName = sanitizeName(cmd.name);
      await mkdir(join(outputPath, "commands"), { recursive: true });
      await safeWrite(rootReal, join(outputPath, "commands", `${safeName}.md`), `# ${safeName}\n\n${cmd.description}\n`);
      spinner.succeed(`Added command: /${safeName}`);
    } else {
      spinner.fail("Could not parse generated content");
    }
  } catch (e) {
    spinner.fail("Failed");
    throw e;
  }
}
