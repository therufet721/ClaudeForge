/**
 * Phase 2: Per-file generation. Each file gets its own Claude call with preset rules.
 */
import { callClaude } from "./anthropic.js";
import type { ForgeStructure, StructureAgent, StructureSkill } from "./forge-structure.js";
import {
  AGENT_RULES,
  SKILL_RULES,
  COMMAND_RULES,
  HOOK_RULES,
  ORCHESTRATION_RULES,
  SCRIPT_RULES,
  REFERENCE_RULES,
  TEMPLATE_RULES,
} from "../presets/index.js";

/** Extract a balanced JSON object, correctly skipping braces inside strings. */
function extractJson(text: string): string {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  if (start < 0) throw new Error("No JSON in response");

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") { depth++; continue; }
    if (c === "}") {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  throw new Error("Unbalanced JSON in response");
}

export async function generateAgentFile(
  agent: StructureAgent,
  userInput: string,
  model?: string
): Promise<string> {
  const sys = AGENT_RULES;
  const user = `User request: "${userInput}"

Generate the agent file for: ${agent.name}

Context:
- roleSummary: ${agent.roleSummary}
- description (for YAML frontmatter — when Claude delegates to this agent): ${agent.description}
- model: ${agent.model}
${agent.tools?.length ? `- tools: ${agent.tools.join(", ")}` : ""}
${agent.handoffTo?.length ? `- handoffTo (workflow info, include in body): ${agent.handoffTo.join(", ")}` : ""}
${agent.dependsOn?.length ? `- dependsOn (workflow info, include in body): ${agent.dependsOn.join(", ")}` : ""}

Output ONLY the raw markdown. No code fences.`;

  const res = await callClaude(sys, user, { model, maxTokens: 4096 });
  return res.trim();
}

export async function generateSkillFile(
  skill: StructureSkill,
  agent: StructureAgent,
  userInput: string,
  model?: string
): Promise<string> {
  const sys = SKILL_RULES;
  const user = `User request: "${userInput}"

Generate the skill file for: ${skill.name} (agent: ${skill.agent})

Context:
- purposeSummary: ${skill.purposeSummary}
- description (for YAML frontmatter — when Claude auto-loads this skill): ${skill.description}
- agent persona: ${agent.roleSummary}
${skill.scripts?.length ? `- scripts to create: ${skill.scripts.join(", ")}` : ""}
${skill.references?.length ? `- references to create: ${skill.references.join(", ")}` : ""}
${skill.templates?.length ? `- templates to create: ${skill.templates.join(", ")}` : ""}

Output ONLY the raw markdown. No code fences.`;

  const res = await callClaude(sys, user, { model, maxTokens: 8192 });
  return res.trim();
}

export async function generateCommandFile(
  cmd: { name: string; summary: string },
  userInput: string,
  model?: string
): Promise<string> {
  const sys = COMMAND_RULES;
  const user = `User request: "${userInput}"

Generate the command file for: ${cmd.name}

Context:
- summary: ${cmd.summary}

Output ONLY the raw markdown. No code fences.`;

  const res = await callClaude(sys, user, { model, maxTokens: 1024 });
  return res.trim();
}

export async function generateHookFile(
  hook: { name: string; event: string; summary: string },
  userInput: string,
  model?: string
): Promise<string> {
  const sys = HOOK_RULES;
  const user = `User request: "${userInput}"

Generate the hook file: ${hook.name} (event: ${hook.event})

Context:
- summary: ${hook.summary}

Output ONLY the raw script content. No code fences.`;

  const res = await callClaude(sys, user, { model, maxTokens: 2048 });
  return res.trim();
}

export async function generateOrchestrationFiles(
  structure: ForgeStructure,
  userInput: string,
  model?: string
): Promise<{ workflowMd: string; orchestrationMd: string }> {
  const sys = ORCHESTRATION_RULES;
  const agents = structure.agents;
  const skills = structure.skills;
  const user = `User request: "${userInput}"

Generate orchestration docs.

Context:
- workflow: ${structure.workflow.name}
- description: ${structure.workflow.description}
- sequentialOrder: ${JSON.stringify(structure.workflow.sequentialOrder)}
- agents: ${agents.map((a) => `${a.name} (${a.roleSummary})`).join("; ")}
- skills: ${skills.map((s) => `${s.name}→${s.agent}`).join(", ")}

Output ONLY the JSON: { "workflowMd": "...", "orchestrationMd": "..." }`;

  const res = await callClaude(sys, user, { model, maxTokens: 4096 });
  const json = extractJson(res);
  const p = JSON.parse(json) as { workflowMd: string; orchestrationMd: string };
  return { workflowMd: p.workflowMd?.trim() ?? "", orchestrationMd: p.orchestrationMd?.trim() ?? "" };
}

export async function generateScriptFile(
  scriptName: string,
  skill: StructureSkill,
  userInput: string,
  model?: string
): Promise<string> {
  const sys = SCRIPT_RULES;
  const ext = scriptName.split(".").pop() ?? "py";
  const user = `User request: "${userInput}"

Generate script for skill "${skill.name}": ${scriptName}

Context:
- skill purpose: ${skill.purposeSummary}
- agent: ${skill.agent}

Output ONLY the raw script. No code fences. Language: ${ext === "py" ? "Python" : ext === "js" ? "JavaScript" : "appropriate for extension"}.`;

  const res = await callClaude(sys, user, { model, maxTokens: 4096 });
  return res.trim();
}

export async function generateReferenceFile(
  refName: string,
  skill: StructureSkill,
  userInput: string,
  model?: string
): Promise<string> {
  const sys = REFERENCE_RULES;
  const user = `User request: "${userInput}"

Generate reference doc for skill "${skill.name}": ${refName}

Context:
- skill purpose: ${skill.purposeSummary}
- agent: ${skill.agent}

Output ONLY the raw markdown. No code fences.`;

  const res = await callClaude(sys, user, { model, maxTokens: 4096 });
  return res.trim();
}

export async function generateTemplateFile(
  tmplName: string,
  skill: StructureSkill,
  userInput: string,
  model?: string
): Promise<string> {
  const sys = TEMPLATE_RULES;
  const user = `User request: "${userInput}"

Generate template for skill "${skill.name}": ${tmplName}

Context:
- skill purpose: ${skill.purposeSummary}
- agent: ${skill.agent}

Output ONLY the raw markdown. No code fences.`;

  const res = await callClaude(sys, user, { model, maxTokens: 2048 });
  return res.trim();
}
