import { readFile, readdir } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";
import pc from "picocolors";

export async function visualizeCommand(options: {
  format?: string;
  output?: string;
}) {
  const claudePath = resolve("./.claude");
  if (!existsSync(claudePath)) {
    console.error(pc.red("Error:") + " No .claude folder found.");
    process.exit(1);
  }

  const format = options.format ?? "terminal";
  let diagram = "";

  try {
    const workflowPath = join(claudePath, "orchestration", "workflow.json");
    if (existsSync(workflowPath)) {
      const data = await readFile(workflowPath, "utf-8");
      const workflow = JSON.parse(data);

      if (format === "mermaid") {
        diagram = workflowToMermaid(workflow);
      } else {
        diagram = workflowToTerminal(workflow);
      }
    } else {
      // Fallback: scan agents and skills
      const agentsDir = join(claudePath, "agents");
      const agents = existsSync(agentsDir)
        ? (await readdir(agentsDir)).filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", ""))
        : [];
      diagram = agents.length
        ? `Agents: ${agents.join(" → ")}\n\n(No workflow.json — run forge to generate full orchestration)`
        : "No agents or workflow found.";
    }

    if (options.output) {
      const { writeFile } = await import("fs/promises");
      await writeFile(resolve(options.output), diagram, "utf-8");
      console.log(pc.green("✓") + ` Written to ${options.output}`);
    } else {
      console.log("\n" + diagram + "\n");
    }
  } catch (e) {
    console.error(pc.red("Error:"), (e as Error).message);
    process.exit(1);
  }
}

function workflowToTerminal(w: {
  name?: string;
  agents?: string[];
  sequentialOrder?: string[];
  parallelGroups?: string[][];
  gates?: { waitsFor: string[]; then: string }[];
}): string {
  let out = (w.name ?? "Workflow") + "\n";
  out += "    │\n";

  // Prefer sequentialOrder (execution order) over raw unordered agents array
  const order = w.sequentialOrder ?? w.agents ?? [];
  const gates = w.gates ?? [];
  const parallelGroups = w.parallelGroups ?? [];

  // Show both sequential flow and parallel groups when both exist
  if (order.length) {
    for (let i = 0; i < order.length; i++) {
      const prefix = i === order.length - 1 && parallelGroups.length === 0 && gates.length === 0 ? "    └──▶" : "    ├──▶";
      out += `${prefix} [${order[i]}]\n`;
    }
  }
  if (parallelGroups.length) {
    for (const group of parallelGroups) {
      for (const a of group) {
        out += `    ├──▶ [${a}] (parallel)\n`;
      }
    }
  }

  for (const g of gates) {
    out += `    │\n`;
    out += `    └──▶ [${g.then}] ◀── waits for ${g.waitsFor.join(", ")}\n`;
  }

  out += "\n";
  return out;
}

/** Sanitize any string to a valid Mermaid node ID (alphanumeric + underscores only). */
function mermaidId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

function workflowToMermaid(w: {
  name?: string;
  agents?: string[];
  sequentialOrder?: string[];
  parallelGroups?: string[][];
  gates?: { waitsFor: string[]; then: string }[];
}): string {
  let md = "```mermaid\nflowchart TD\n";
  // Use sequentialOrder as single source of truth for nodes and arrows; merge with agents for any extras
  const order = w.sequentialOrder ?? w.agents ?? [];
  const agentsSet = new Set([...order, ...(w.agents ?? [])]);
  const allNodes = [...agentsSet];
  // Add parallel group members not already in order
  for (const group of w.parallelGroups ?? []) {
    for (const a of group) {
      if (!agentsSet.has(a)) {
        allNodes.push(a);
        agentsSet.add(a);
      }
    }
  }

  for (const a of allNodes) {
    md += `  ${mermaidId(a)}["${a.replace(/"/g, "'")}"]\n`;
  }
  for (let i = 0; i < order.length - 1; i++) {
    md += `  ${mermaidId(order[i])} --> ${mermaidId(order[i + 1])}\n`;
  }
  for (const g of w.gates ?? []) {
    for (const wf of g.waitsFor) {
      md += `  ${mermaidId(wf)} --> ${mermaidId(g.then)}\n`;
    }
  }
  md += "```\n";
  return md;
}
