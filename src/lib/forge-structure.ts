/**
 * Phase 1: Structure only. Lists which files to create. No content.
 * Sent to Claude with user input → get filenames and minimal metadata.
 */
import { extractJson } from "./json-utils.js";

export interface StructureAgent {
  name: string;
  model: "sonnet" | "opus" | "haiku";
  roleSummary: string;
  description: string;
  tools?: string[];
  handoffTo?: string[];
  dependsOn?: string[];
}

export interface StructureSkill {
  name: string;
  agent: string;
  description: string;
  purposeSummary: string;
  scripts?: string[]; // filenames e.g. ["audit.py"]
  references?: string[]; // filenames e.g. ["wcag-checklist.md"]
  templates?: string[]; // filenames e.g. ["report.md"]
}

export interface StructureCommand {
  name: string;
  summary: string;
}

export interface StructureHook {
  name: string;
  event: string;
  summary: string;
}

export interface StructureWorkflow {
  name: string;
  description: string;
  sequentialOrder: string[];
  parallelGroups?: string[][];
  gates?: { waitsFor: string[]; then: string }[];
}

export interface ForgeStructure {
  agents: StructureAgent[];
  skills: StructureSkill[];
  commands: StructureCommand[];
  hooks: StructureHook[];
  workflow: StructureWorkflow;
}

export function parseForgeStructure(text: string): ForgeStructure {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  const json = extractJson(cleaned);
  let p: ForgeStructure;
  try {
    p = JSON.parse(json) as ForgeStructure;
  } catch (e) {
    const preview = json.slice(0, 120).replace(/\n/g, " ");
    throw new Error(
      `Failed to parse structure from Claude response: ${(e as Error).message}. ` +
      `Response starts with: "${preview}...". Try running forge again.`
    );
  }

  return {
    agents: p.agents ?? [],
    skills: p.skills ?? [],
    commands: p.commands ?? [],
    hooks: p.hooks ?? [],
    workflow: p.workflow ?? { name: "Workflow", description: "", sequentialOrder: [] },
  };
}

export const STRUCTURE_PROMPT = `You are ClaudeSmith. Given the user's request, output ONLY a JSON structure listing which files to create. No content. Just filenames and minimal metadata.

Output ONLY this JSON (no other text, first char {, last char }):

{
  "agents": [
    {
      "name": "kebab-case",
      "model": "sonnet",
      "roleSummary": "1 sentence: who they are and their domain",
      "description": "When Claude should delegate to this agent. Start with 'Use when...' or 'Invoke when...'. Be specific about user intents and situations.",
      "tools": ["Read", "Glob", "Grep"],
      "handoffTo": [],
      "dependsOn": []
    }
  ],
  "skills": [
    {
      "name": "kebab-case",
      "agent": "agent-name",
      "description": "What this skill does and when Claude should load it. Include user intent phrases and synonyms. E.g. 'Runs accessibility audit. Use when user asks to audit a11y, check WCAG compliance, or find accessibility issues.'",
      "purposeSummary": "1 sentence: what this skill does",
      "scripts": ["script.py"],
      "references": ["checklist.md"],
      "templates": ["report.md"]
    }
  ],
  "commands": [
    { "name": "command-name", "summary": "1 sentence shown in autocomplete" }
  ],
  "hooks": [
    {
      "name": "pre-tool-use.sh",
      "event": "PreToolUse",
      "summary": "1 sentence: what this hook does and why"
    }
  ],
  "workflow": {
    "name": "Workflow Name",
    "description": "1-2 sentences",
    "sequentialOrder": ["agent1", "agent2"]
  }
}

Rules:
- agent.description: specific delegation criteria for Claude Code. Not a repeat of roleSummary.
- agent.tools: list only the Claude Code tools this agent needs (Read, Write, Edit, Bash, Glob, Grep, WebFetch, Task). Omit array to inherit all.
- skill.description: natural language Claude uses to decide when to auto-load this skill.
- hooks.event: use Claude Code lifecycle events — PreToolUse, PostToolUse, PostToolUseFailure, SessionStart, SessionEnd, Stop, Notification, PermissionRequest.
- scripts, references, templates: optional arrays of filenames. Omit or [] if none.
- roleSummary, purposeSummary, summary: 1 sentence each.
- sequentialOrder must list all agent names in execution order.`;
