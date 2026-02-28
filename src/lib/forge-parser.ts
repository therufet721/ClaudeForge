export interface ForgeAgent {
  name: string;
  persona: string;
  model: "sonnet" | "opus" | "haiku";
  description?: string;
  tools?: string[];
  inputContract: string;
  outputContract: string;
  handoffTo?: string[];
  dependsOn?: string[];
  failureBehavior?: string;
}

export interface ForgeSkill {
  name: string;
  /** Legacy internal field — mapped to YAML `description` on output */
  triggers: string[];
  description?: string;
  agent: string;
  instructions: string;
  scripts?: { name: string; content: string }[];
  references?: { name: string; content: string }[];
  templates?: { name: string; content: string }[];
}

export interface ForgeWorkflow {
  name: string;
  description: string;
  parallelGroups?: string[][];
  sequentialOrder?: string[];
  gates?: { waitsFor: string[]; then: string }[];
}

export interface ForgeCommand {
  name: string;
  description: string;
}

export interface ForgeHook {
  name: string;
  event: string;
  content: string;
}

export interface ForgeResponse {
  agents: ForgeAgent[];
  skills: ForgeSkill[];
  workflow: ForgeWorkflow;
  commands: ForgeCommand[];
  hooks: ForgeHook[];
}

/** Extract a balanced JSON object from text, skipping braces inside strings. */
function extractBalancedJson(text: string, start: number): string | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote: string | null = null;
  const end = text.length;

  for (let i = start; i < end; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (inString) {
      if (c === quote) inString = false;
      continue;
    }
    if ((c === '"' || c === "'") && !inString) {
      inString = true;
      quote = c;
      continue;
    }
    if (c === "{") {
      depth++;
      continue;
    }
    if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseForgeResponse(text: string): ForgeResponse {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // Prefer exact root object start: {"agents":
  let jsonStr: string | null = null;
  const exactStart = cleaned.indexOf('{"agents":');
  if (exactStart >= 0) {
    jsonStr = extractBalancedJson(cleaned, exactStart);
  }

  // Fallback: response doesn't start with {, search for "agents": and extract
  if (!jsonStr && !cleaned.startsWith("{")) {
    const agentsIdx = cleaned.indexOf('"agents":');
    const braceStart = agentsIdx >= 0 ? cleaned.lastIndexOf("{", agentsIdx) : -1;
    if (braceStart >= 0) {
      jsonStr = extractBalancedJson(cleaned, braceStart);
    }
  }

  // Direct parse if it already starts with {
  if (!jsonStr && cleaned.startsWith("{")) {
    jsonStr = cleaned;
  }

  if (jsonStr) {
    cleaned = jsonStr;
  }

  if (!cleaned.startsWith("{") || !cleaned.includes('"agents":')) {
    const preview = cleaned.slice(0, 80).replace(/\n/g, " ");
    throw new Error(
      `Claude response did not contain valid JSON. Expected object with "agents" key. ` +
        `Response starts with: "${preview}...". Try /forge again.`
    );
  }

  try {
    const parsed = JSON.parse(cleaned) as ForgeResponse;
    return {
      agents: parsed.agents ?? [],
      skills: parsed.skills ?? [],
      workflow: parsed.workflow ?? { name: "Workflow", description: "" },
      commands: parsed.commands ?? [],
      hooks: parsed.hooks ?? [],
    };
  } catch (e) {
    const preview = cleaned.slice(0, 80).replace(/\n/g, " ");
    throw new Error(
      `Failed to parse Claude response as JSON: ${(e as Error).message}. ` +
        `Response starts with: "${preview}..."`
    );
  }
}
