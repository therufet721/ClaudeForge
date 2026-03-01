/**
 * Writes .claude folder from structure + per-file generated content.
 */
import { mkdir, writeFile, realpath, chmod } from "fs/promises";
import { join, resolve } from "path";
import type { ForgeStructure } from "./forge-structure.js";

/** Normalize path for cross-platform comparison (handles Windows backslashes). */
function normalizePath(p: string): string {
  return resolve(p).replace(/\\/g, "/");
}

/**
 * Sanitizes an AI-generated name for safe use as a single filesystem path
 * component (no directory separators, no `..`, no leading dots).
 * Throws if the result would be empty or unsafe.
 */
export function sanitizeName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-") // replace unsafe chars with hyphen
    .replace(/\.{2,}/g, ".")           // collapse consecutive dots — prevents ".."
    .replace(/^[.\-]+/, "")            // no leading dots or hyphens
    .slice(0, 100);                    // hard length cap

  if (!cleaned || /^[-]+$/.test(cleaned)) {
    throw new Error(`Unsafe or empty name rejected: "${name}"`);
  }
  return cleaned;
}

/**
 * Resolves a path and verifies it is still inside `rootDir`.
 * Guards against symlink-based path traversal attacks.
 * Cross-platform: works on Windows (backslashes) and Unix.
 */
export async function safeWrite(rootReal: string, filePath: string, content: string): Promise<void> {
  const absPath = resolve(filePath);
  const parentDir = resolve(absPath, "..");
  let parentReal: string;
  try {
    parentReal = await realpath(parentDir);
  } catch (err) {
    throw new Error(`Cannot resolve parent directory: ${parentDir}. ${(err as Error).message}`);
  }
  const rootNorm = normalizePath(rootReal);
  const parentNorm = normalizePath(parentReal);
  const isInside = parentNorm === rootNorm || parentNorm.startsWith(rootNorm + "/");
  if (!isInside) {
    throw new Error(`Path traversal detected: ${absPath} is outside ${rootReal}`);
  }
  await writeFile(absPath, content, "utf-8");
}

export async function writeClaudeFolder(
  basePath: string,
  structure: ForgeStructure,
  files: {
    agents: Map<string, string>;
    skills: Map<string, string>;
    scripts: Map<string, string>; // key: "skillName/scripts/scriptName"
    references: Map<string, string>;
    templates: Map<string, string>;
    commands: Map<string, string>;
    hooks: Map<string, string>;
    workflowMd: string;
    orchestrationMd: string;
  }
): Promise<void> {
  const dirs = [
    join(basePath, "agents"),
    join(basePath, "skills"),
    join(basePath, "orchestration"),
    join(basePath, "commands"),
    join(basePath, "hooks"),
  ];
  for (const dir of dirs) await mkdir(dir, { recursive: true });

  // Resolve the canonical root once — all writes are validated against it
  let rootReal: string;
  try {
    rootReal = await realpath(basePath);
  } catch (err) {
    throw new Error(`Cannot resolve output directory: ${basePath}. ${(err as Error).message}`);
  }

  // Agents
  for (const a of structure.agents) {
    const safeName = sanitizeName(a.name);
    const content = files.agents.get(a.name);
    if (content) await safeWrite(rootReal, join(basePath, "agents", `${safeName}.md`), content);
  }

  // Skills
  for (const s of structure.skills) {
    const safeSkillName = sanitizeName(s.name);
    const skillDir = join(basePath, "skills", safeSkillName);
    await mkdir(skillDir, { recursive: true });
    await mkdir(join(skillDir, "scripts"), { recursive: true });
    await mkdir(join(skillDir, "references"), { recursive: true });
    await mkdir(join(skillDir, "templates"), { recursive: true });

    const skillContent = files.skills.get(s.name);
    if (skillContent) await safeWrite(rootReal, join(skillDir, "SKILL.md"), skillContent);

    for (const scriptName of s.scripts ?? []) {
      const safeScript = sanitizeName(scriptName);
      const content = files.scripts.get(`${s.name}/scripts/${scriptName}`);
      if (content) await safeWrite(rootReal, join(skillDir, "scripts", safeScript), content);
    }
    for (const refName of s.references ?? []) {
      const safeRef = sanitizeName(refName);
      const content = files.references.get(`${s.name}/references/${refName}`);
      if (content) await safeWrite(rootReal, join(skillDir, "references", safeRef), content);
    }
    for (const tmplName of s.templates ?? []) {
      const safeTmpl = sanitizeName(tmplName);
      const content = files.templates.get(`${s.name}/templates/${tmplName}`);
      if (content) await safeWrite(rootReal, join(skillDir, "templates", safeTmpl), content);
    }
  }

  // Orchestration
  const workflowJson = JSON.stringify(
    {
      name: structure.workflow.name,
      description: structure.workflow.description,
      agents: structure.agents.map((a) => a.name),
      sequentialOrder: structure.workflow.sequentialOrder,
      parallelGroups: structure.workflow.parallelGroups,
      gates: structure.workflow.gates,
    },
    null,
    2
  );
  await safeWrite(rootReal, join(basePath, "orchestration", "workflow.json"), workflowJson);
  const order = structure.workflow.sequentialOrder;
  const toMermaidId = (name: string) => name.replace(/[^a-zA-Z0-9]/g, "_");
  const nodes =
    order.length > 0
      ? order.map((a) => `  ${toMermaidId(a)}["${a}"]`).join("\n")
      : "  empty[No agents in workflow]";
  const arrows =
    order.length > 1
      ? order.slice(0, -1).map((a, i) => `  ${toMermaidId(a)} --> ${toMermaidId(order[i + 1])}`).join("\n")
      : "";
  const workflowMd =
    files.workflowMd ||
    `# ${structure.workflow.name}\n\n${structure.workflow.description}\n\n\`\`\`mermaid\nflowchart TD\n${nodes}\n${arrows}\n\`\`\`\n`;
  const orchestrationMd =
    files.orchestrationMd ||
    `# Orchestration: ${structure.workflow.name}\n\n${structure.workflow.description}\n\n## Agents\n\n${structure.agents.map((a) => `### ${a.name}\n${a.roleSummary}\n`).join("\n")}`;
  await safeWrite(rootReal, join(basePath, "orchestration", "workflow.md"), workflowMd);
  await safeWrite(rootReal, join(basePath, "orchestration", "ORCHESTRATION.md"), orchestrationMd);

  // Commands
  for (const c of structure.commands) {
    const safeName = sanitizeName(c.name);
    const content = files.commands.get(c.name);
    if (content) await safeWrite(rootReal, join(basePath, "commands", `${safeName}.md`), content);
  }

  // Hooks — written as executable scripts
  const writtenHooks: string[] = [];
  for (const h of structure.hooks) {
    const content = files.hooks.get(h.name);
    if (content) {
      const safeName = sanitizeName(h.name);
      const hookPath = join(basePath, "hooks", safeName);
      await safeWrite(rootReal, hookPath, content);
      await chmod(hookPath, 0o755);
      writtenHooks.push(safeName);
    }
  }
  if (writtenHooks.length > 0) {
    console.warn(`  ⚠ ${writtenHooks.length} hook(s) written (${writtenHooks.join(", ")}) — review before trusting shell logic.`);
  }

  // CLAUDE.md
  const claudeMd = formatClaudeMd(structure);
  await safeWrite(rootReal, join(basePath, "CLAUDE.md"), claudeMd);
}

function formatClaudeMd(structure: ForgeStructure): string {
  const { workflow, agents, skills } = structure;
  let md = `# Claude Agent Registry\n\n`;
  md += `## Workflow: ${workflow.name}\n\n${workflow.description}\n\n`;
  md += `## Agents\n\n`;
  for (const a of agents) {
    const agentSkills = skills.filter((s) => s.agent === a.name);
    md += `### ${a.name}\n- ${a.roleSummary}\n`;
    if (agentSkills.length) md += `- Skills: ${agentSkills.map((s) => s.name).join(", ")}\n`;
    md += "\n";
  }
  md += `## Skills\n\n`;
  for (const s of skills) {
    md += `- **${s.name}** (${s.agent}): ${s.description ?? s.purposeSummary}\n`;
  }
  return md;
}
