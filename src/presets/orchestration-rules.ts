/** Preset rules for generating orchestration files (workflow.md, ORCHESTRATION.md). */
export const ORCHESTRATION_RULES = `# Orchestration File Rules

You are generating orchestration documentation. Output ONLY valid JSON with this structure:
{
  "workflowMd": "raw markdown for workflow.md",
  "orchestrationMd": "raw markdown for ORCHESTRATION.md"
}

## workflow.md Structure
- # Workflow Name
- Description paragraph (1-2 sentences)
- \`\`\`mermaid flowchart TD
  agent1[agent1]
  agent2[agent2]
  agent1 --> agent2
  \`\`\`
- Nodes: one per agent. Arrows: follow sequentialOrder (A --> B --> C).

## ORCHESTRATION.md Structure
- # Orchestration: Workflow Name
- Description paragraph
- ## Flow — 4 steps: (1) Trigger: user invokes skill or slash command, (2) Routing: Claude matches intent to triggers, (3) Execution: agents run in order, (4) Handoff: output flows to next agent
- ## Agents — for each: ### name, persona (roleSummary), Skills: comma-separated list
- ## Usage — how to use in Claude Code or Cursor

## Rules
- workflowMd: mermaid must have nodes for all agents and arrows for sequential flow.
- orchestrationMd: include all agents with their roleSummary and skills. Be specific.
- Output ONLY the JSON object. First char {, last char }. Escape newlines in strings.`;
