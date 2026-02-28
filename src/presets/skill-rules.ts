/** Preset rules for generating SKILL.md files. */
export const SKILL_RULES = `# Skill File Rules (SKILL.md)

You are generating a Claude Code skill definition (.claude/skills/name/SKILL.md). Output ONLY the raw markdown content. No code fences, no explanations.

## Required Structure

\`\`\`
---
name: skill-name                          # lowercase, hyphens only; becomes /skill-name slash command
description: What this skill does and when Claude should load it automatically. E.g. "Runs a full accessibility audit on HTML/CSS/JS files. Use when the user asks to audit accessibility, check WCAG compliance, or find a11y issues."
argument-hint: [paths]                    # optional: shown in autocomplete, e.g. [path] or [issue-number]
disable-model-invocation: false           # true = only user can invoke via /name; false = Claude can also auto-load
allowed-tools: Read, Glob, Grep, Bash    # optional: tools permitted without extra confirmation when skill is active
context: fork                             # optional: "fork" to run in a subagent context (isolates the skill)
agent: general-purpose                    # optional: only when context: fork. Which subagent type to use.
---

# Skill Name (title case)

## Instructions

1. [Input parsing] Parse and validate input. Identify target (URL, paths, code, etc.). Reject invalid formats with clear error.

2. [Validation] Verify required fields present. Check accessibility of resources if applicable.

3. [Procedure step 1] Be prescriptive: "When X do Y. If Z then W."

4. [Procedure step 2] Include specific criteria, thresholds, or checks.

... (10-20 steps total)

N. [Output] Format output as specified. Include all required sections.

N+1. [Edge cases] Handle: partial input, timeouts, empty results. Never silently fail.
\`\`\`

## Rules
- description (RECOMMENDED): This is how Claude decides when to auto-invoke the skill. Be specific: include user intent phrases, synonyms, abbreviations (e.g. a11y for accessibility). 1-2 sentences covering what it does and when.
- disable-model-invocation: set true for action-oriented skills (deploy, commit) the user should invoke manually. Leave false for knowledge/reference skills Claude can load when relevant.
- context + agent: use "context: fork" to isolate execution in a subagent (prevents nesting, preserves main context).
- allowed-tools: restrict to only needed tools. Read-only skills: "Read, Glob, Grep". Action skills: add Bash, Write.
- Instructions: 10-20 numbered steps. Each step on its own line with blank line between.
- Must include: (1) Input parsing and validation, (2) Procedure with specific criteria/thresholds, (3) Output formatting, (4) Edge cases.
- Be prescriptive: "When you find X, do Y. If Z, then W." No vague steps.
- Output raw markdown only. First line must be \`---\`.`;
