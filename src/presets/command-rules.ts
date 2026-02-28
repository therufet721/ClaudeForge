/** Preset rules for generating command .md files. */
export const COMMAND_RULES = `# Command File Rules

You are generating a Claude Code slash command definition (.claude/commands/name.md). Output ONLY the raw markdown content. No code fences, no explanations.

## Required Structure

\`\`\`
---
description: One sentence shown in the /command autocomplete menu. E.g. "Runs a full WCAG 2.1 AA accessibility audit on specified paths."
argument-hint: [paths]        # optional: hint shown during autocomplete, e.g. [path] or [issue-number] [format]
allowed-tools: Read, Bash     # optional: tools permitted without extra confirmation for this command
---

# command-name

## Description
[Substantial paragraph] What it does, when to use it, parameters (with types/defaults), and at least one concrete example. E.g. "Runs full accessibility audit on specified paths. Use before PRs or after design changes. Accepts: $ARGUMENTS (space-separated paths, default: current dir). Example: /full-audit src/components/ produces a WCAG 2.1 AA report."

## Usage
How to invoke: \`/command-name [args]\` or natural language. List supported args if any.
Arguments available: \`$ARGUMENTS\` (all args as string), \`$1\`, \`$2\` (positional).

## Example
\`/command-name [args]\` — concrete example with expected outcome. E.g. \`/full-audit .\` — audits current directory, outputs report to stdout.
\`\`\`

## Rules
- Frontmatter: include \`description\` (shown in autocomplete) and \`argument-hint\` if the command accepts args.
- Use kebab-case for command name.
- Use \`$ARGUMENTS\` or \`$1\`/\`$2\` in the body to reference user-supplied args.
- Description: one substantial paragraph with what, when, params, example. Not generic.
- Example: must show real invocation and expected result.
- Output raw markdown only. First line must be \`---\`.`;
