import { readFile } from "fs/promises";
import { resolve } from "path";
import prompts from "prompts";
import pc from "picocolors";
import ora from "ora";
import { callClaude } from "../lib/anthropic.js";
import { loadConfig } from "../lib/config.js";
import { parseForgeStructure, STRUCTURE_PROMPT } from "../lib/forge-structure.js";
import { detectProjectContext, formatProjectContext } from "../lib/project-context.js";
import {
  generateAgentFile,
  generateSkillFile,
  generateCommandFile,
  generateHookFile,
  generateOrchestrationFiles,
  generateScriptFile,
  generateReferenceFile,
  generateTemplateFile,
} from "../lib/forge-generate.js";
import { writeClaudeFolder } from "../lib/forge-writer.js";


export async function forgeCommand(
  description: string | undefined,
  options: {
    from?: string;
    output?: string;
    dryRun?: boolean;
    model?: string;
  }
) {
  const outputPath = resolve(options.output ?? "./.claude");
  const config = await loadConfig();

  let finalDescription = description;

  if (!finalDescription) {
    console.log(pc.bold("\n╔══════════════════════════════════════════════════╗"));
    console.log(pc.bold("║") + "           ClaudeForge — Agent Builder            " + pc.bold("║"));
    console.log(pc.bold("╚══════════════════════════════════════════════════╝\n"));

    const responses = await prompts([
      {
        type: "text",
        name: "description",
        message: "Describe what your agent system should do:",
        initial: "Accessibility expert needed",
      },
    ]);

    if (!responses.description) return;
    finalDescription = responses.description as string;
  } else if (options.from) {
    const filePath = resolve(options.from);
    finalDescription = await readFile(filePath, "utf-8");
  }

  const model = options.model ?? config.defaults?.model;
  const userInput = finalDescription!;

  const spinner = ora("Step 1/2: Creating structure...").start();

  try {
    const projectCtx = await detectProjectContext();
    const projectSummary = formatProjectContext(projectCtx, 2000);

    // Phase 1: Structure only (which files to create)
    const structureRes = await callClaude(
      STRUCTURE_PROMPT,
      `## Repo context (use to tailor agents/skills to the tech stack)\n${projectSummary}\n\n` +
        `## User request\n"${userInput}"\n\n` +
        `Output ONLY the JSON structure. No other text.`,
      { model, maxTokens: 4096 }
    );
    const structure = parseForgeStructure(structureRes);
    spinner.succeed("Structure created");

    if (options.dryRun) {
      console.log(pc.cyan("\n[DRY RUN] Structure:\n"));
      console.log(JSON.stringify(structure, null, 2));
      return;
    }

    const agents = new Map<string, string>();
    const skills = new Map<string, string>();
    const scripts = new Map<string, string>();
    const references = new Map<string, string>();
    const templates = new Map<string, string>();
    const commands = new Map<string, string>();
    const hooks = new Map<string, string>();

    // Phase 2: Generate all files in parallel (agents, skills, commands, hooks, orchestration)
    console.log(pc.gray("  Generating files in parallel...\n"));

    let workflowMd = "";
    let orchestrationMd = "";

    await Promise.all([
      // Agents — critical path, propagate errors
      ...structure.agents.map(async (a) => {
        const s = ora(`  agents/${a.name}.md`).start();
        agents.set(a.name, await generateAgentFile(a, userInput, model));
        s.succeed(`  agents/${a.name}.md`);
      }),

      // Skills + supporting files — critical path, propagate errors
      ...structure.skills.map(async (sk) => {
        const agent = structure.agents.find((x) => x.name === sk.agent) ?? {
          name: sk.agent, model: "sonnet" as const, roleSummary: "", description: "",
        };
        const s = ora(`  skills/${sk.name}/SKILL.md`).start();
        skills.set(sk.name, await generateSkillFile(sk, agent, userInput, model));
        s.succeed(`  skills/${sk.name}/SKILL.md`);

        await Promise.all([
          ...(sk.scripts ?? []).map(async (scriptName) => {
            const ss = ora(`  skills/${sk.name}/scripts/${scriptName}`).start();
            scripts.set(`${sk.name}/scripts/${scriptName}`, await generateScriptFile(scriptName, sk, userInput, model));
            ss.succeed(`  skills/${sk.name}/scripts/${scriptName}`);
          }),
          ...(sk.references ?? []).map(async (refName) => {
            const rr = ora(`  skills/${sk.name}/references/${refName}`).start();
            references.set(`${sk.name}/references/${refName}`, await generateReferenceFile(refName, sk, userInput, model));
            rr.succeed(`  skills/${sk.name}/references/${refName}`);
          }),
          ...(sk.templates ?? []).map(async (tmplName) => {
            const tt = ora(`  skills/${sk.name}/templates/${tmplName}`).start();
            templates.set(`${sk.name}/templates/${tmplName}`, await generateTemplateFile(tmplName, sk, userInput, model));
            tt.succeed(`  skills/${sk.name}/templates/${tmplName}`);
          }),
        ]);
      }),

      // Commands — non-critical, degrade gracefully
      ...structure.commands.map(async (cmd) => {
        const s = ora(`  commands/${cmd.name}.md`).start();
        try {
          commands.set(cmd.name, await generateCommandFile(cmd, userInput, model));
          s.succeed(`  commands/${cmd.name}.md`);
        } catch (e) {
          s.warn(`  commands/${cmd.name}.md (skipped: ${(e as Error).message})`);
        }
      }),

      // Hooks — non-critical, degrade gracefully
      ...structure.hooks.map(async (hook) => {
        const s = ora(`  hooks/${hook.name}`).start();
        try {
          hooks.set(hook.name, await generateHookFile(hook, userInput, model));
          s.succeed(`  hooks/${hook.name}`);
        } catch (e) {
          s.warn(`  hooks/${hook.name} (skipped: ${(e as Error).message})`);
        }
      }),

      // Orchestration docs — captures result into outer variables
      generateOrchestrationFiles(structure, userInput, model).then((result) => {
        const s = ora("  orchestration/...").start();
        workflowMd = result.workflowMd;
        orchestrationMd = result.orchestrationMd;
        s.succeed("  orchestration/workflow.md, ORCHESTRATION.md");
      }),
    ]);

    const writeSpinner = ora("\nStep 2/2: Writing files...").start();
    await writeClaudeFolder(outputPath, structure, {
      agents, skills, scripts, references, templates, commands, hooks, workflowMd, orchestrationMd,
    });
    writeSpinner.succeed("Files written");

    const agentCount = structure.agents.length;
    const skillCount = structure.skills.length;
    console.log(pc.green("\n  ✓") + ` ${agentCount} agents, ${skillCount} skills`);
    structure.agents.forEach((a) => console.log(pc.green("  ✓") + ` ${a.name}`));
    structure.skills.forEach((s) => console.log(pc.green("  ✓") + ` ${s.name}`));
    console.log(pc.green("  ✓") + " CLAUDE.md updated\n");
    console.log(pc.bold("Done.") + " Your .claude folder is ready.\n");
    console.log("Run: " + pc.cyan("claude \"review this PR\"") + " — your agents will handle the rest.\n");
  } catch (err) {
    // spinner was already succeed'd after Phase 1 — don't call .fail() on it
    const errMsg = err instanceof Error ? err.message : String(err);
    const apiMsg = (err as { error?: { error?: { message?: string } } })?.error?.error?.message;
    console.error(pc.red("\n✗ Generation failed"));

    if (apiMsg) {
      console.error(pc.red("✗") + " " + apiMsg);
      if (apiMsg.includes("credit") || apiMsg.includes("balance")) {
        console.error(pc.gray("\nAdd credits at: https://console.anthropic.com/account/billing\n"));
      }
    } else {
      console.error(pc.red("✗") + " " + errMsg);
    }
    process.exit(1);
  }
}
