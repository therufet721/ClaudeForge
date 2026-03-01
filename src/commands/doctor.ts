import { readFile, readdir } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";
import pc from "picocolors";
import { sanitizeName } from "../lib/forge-writer.js";

interface Issue {
  type: "error" | "warning";
  file: string;
  message: string;
  fix?: string;
}

export async function doctorCommand(options: { yes?: boolean }) {
  const claudePath = resolve("./.claude");
  if (!existsSync(claudePath)) {
    console.error(pc.red("Error:") + " No .claude folder found.");
    process.exit(1);
  }

  console.log(pc.bold("\nScanning .claude/...\n"));

  const issues: Issue[] = [];

  // Check agents
  const agentsDir = join(claudePath, "agents");
  if (existsSync(agentsDir)) {
    const agentFiles = await readdir(agentsDir);
    for (const f of agentFiles.filter((x) => x.endsWith(".md"))) {
      const path = join(agentsDir, f);
      const content = await readFile(path, "utf-8");

      if (!content.includes("model:")) {
        issues.push({
          type: "warning",
          file: `agents/${f}`,
          message: "model not set — Claude Code will use its default",
          fix: "Add model: haiku|sonnet|opus to frontmatter",
        });
      }
      if (!content.match(/^description:/m)) {
        issues.push({
          type: "error",
          file: `agents/${f}`,
          message: "missing description field — Claude won't know when to delegate to this agent",
          fix: 'Add description: "Use when..." to YAML frontmatter',
        });
      }
    }
  }

  // Check skills
  const skillsDir = join(claudePath, "skills");
  if (existsSync(skillsDir)) {
    const skillDirs = await readdir(skillsDir);
    for (const sd of skillDirs) {
      const skillPath = join(skillsDir, sd, "SKILL.md");
      if (!existsSync(skillPath)) {
        issues.push({
          type: "error",
          file: `skills/${sd}/`,
          message: "skill directory has no SKILL.md",
          fix: "Create SKILL.md with name, description, and instructions",
        });
        continue;
      }
      const content = await readFile(skillPath, "utf-8");

      // Check for old triggers format (no longer valid)
      if (content.match(/^triggers:/m) && !content.match(/^description:/m)) {
        issues.push({
          type: "error",
          file: `skills/${sd}/SKILL.md`,
          message: 'uses deprecated "triggers:" field — Claude Code ignores it',
          fix: 'Replace triggers: [...] with description: "Use when..." in frontmatter',
        });
      } else if (!content.match(/^description:/m)) {
        issues.push({
          type: "warning",
          file: `skills/${sd}/SKILL.md`,
          message: "missing description field — Claude won't know when to auto-load this skill",
          fix: 'Add description: "Use when..." to YAML frontmatter',
        });
      }

      // Check agent reference is valid (sanitize to prevent path traversal)
      const agentMatch = content.match(/^agent:\s*(\S+)/m);
      if (agentMatch) {
        try {
          const safeAgent = sanitizeName(agentMatch[1]);
          const agentFile = join(claudePath, "agents", `${safeAgent}.md`);
          if (!existsSync(agentFile)) {
            issues.push({
              type: "error",
              file: `skills/${sd}/SKILL.md`,
              message: `references agent "${agentMatch[1]}" which doesn't exist`,
              fix: `Create agents/${safeAgent}.md or update the agent: field`,
            });
          }
        } catch {
          issues.push({
            type: "error",
            file: `skills/${sd}/SKILL.md`,
            message: `invalid agent name "${agentMatch[1]}" in agent: field`,
            fix: "Use a valid kebab-case agent name",
          });
        }
      }
    }
  }

  // Print issues
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");

  for (const i of errors) {
    console.log(pc.red("  ❌") + ` ${i.file} — ${i.message}`);
    if (i.fix) console.log(pc.gray("       Fix: ") + i.fix);
  }
  for (const i of warnings) {
    console.log(pc.yellow("  ⚠️") + `  ${i.file} — ${i.message}`);
    if (i.fix) console.log(pc.gray("       Suggested: ") + i.fix);
  }

  if (issues.length === 0) {
    console.log(pc.green("  ✅") + " No issues found.\n");
    return;
  }

  console.log(
    `\n${errors.length} error(s), ${warnings.length} warning(s) found.\n`
  );
  console.log(pc.gray("  Apply fixes manually using the suggestions above.\n"));
}
