/** Preset rules for generating SKILL.md files.
 * Aligned with awesome-claude-skills: https://github.com/ComposioHQ/awesome-claude-skills
 */
export const SKILL_RULES = `# Skill File Rules (SKILL.md)

You are generating a Claude Code skill definition (.claude/skills/name/SKILL.md). Output ONLY the raw markdown content. No code fences around the whole output, no meta-explanations.

Follow the structure and best practices from the awesome-claude-skills repository. Skills should solve real problems, include clear examples, and be portable across Claude.ai, Claude Code, and API.

## Frontmatter (YAML between ---)

\`\`\`
---
name: skill-name
description: One-sentence description of what this skill does and when to use it. Use third-person: "This skill should be used when..." or "Use when...". Include user intent phrases, synonyms, abbreviations (e.g. a11y for accessibility).
argument-hint: [paths]                    # optional: shown in autocomplete, e.g. [path] or [issue-number]
disable-model-invocation: false           # true = only user can invoke via /name (deploy, commit); false = Claude can auto-load when relevant
allowed-tools: Read, Glob, Grep, Bash     # optional: restrict to needed tools. Read-only: "Read, Glob, Grep". Action: add Bash, Write, Edit.
context: fork                             # optional: "fork" to run in subagent (isolates execution). Use for heavy or side-effect workflows.
agent: agent-name                         # when context: fork. Use custom agent from .claude/agents/ or built-in: Explore, Plan, general-purpose.
---
\`\`\`

## Required Sections (in order)

### 1. # Skill Name (title case)
Brief intro paragraph: what the skill helps users accomplish.

### 2. ## When to Use This Skill
- Bullet list of concrete situations that trigger this skill
- Be specific: "Preparing release notes for a new version" not "When you need release notes"

### 3. ## What This Skill Does
1. **Capability 1**: One-line description
2. **Capability 2**: One-line description
3. ... (4-8 capabilities)

### 4. ## How to Use
Include example prompts in code blocks so users know what to say:

\`\`\`
Basic example prompt a user might type
\`\`\`

\`\`\`
More specific example with options
\`\`\`

### 5. ## Instructions
Numbered procedural steps. Use **imperative/infinitive form** (verb-first): "To accomplish X, do Y" not "You should do X".

1. **Understand the scope** — Ask clarifying questions. Identify target (paths, URLs, etc.).
2. **Validate input** — Reject invalid formats with clear error. Check accessibility of resources.
3. **Procedure steps** — Be prescriptive: "When X do Y. If Z then W." Include specific criteria, thresholds, or checks.
4. **Output** — Format output as specified. Include all required sections.
5. **Edge cases** — Handle partial input, timeouts, empty results. Never silently fail.

For complex skills: 10-20 steps. For simple skills: 5-8 steps. Each step on its own line with blank line between.

### 6. ## Example
**User**: "Example prompt a user would type"

**Output**:
\`\`\`
Show what the skill produces (markdown, code, or structured output)
\`\`\`

### 7. ## Tips (optional but recommended)
- Tip 1
- Tip 2

### 8. ## Common Use Cases (optional)
- Use case 1
- Use case 2

## Bundled Resources (reference from Instructions)
If the skill has scripts/, references/, or templates/ in its directory, reference them in the Instructions:
- **scripts/**: Executable code for deterministic or repeated tasks. "Run scripts/validate.sh to..."
- **references/**: Docs Claude loads when needed. "See references/schema.md for..."
- **templates/**: Output templates. "Use templates/report.md as the output format."

Keep SKILL.md lean. Move detailed schemas, API docs, long examples to references/. Avoid duplication.

## Rules
- description: Specific about user intents. Include synonyms (a11y, accessibility). 1-2 sentences.
- Writing style: Imperative/infinitive. "To accomplish X, do Y." Objective, instructional.
- Examples: Real, practical prompts users would actually type.
- Confirm before destructive operations. Never silently fail.
- Output raw markdown only. First line must be \`---\`.`;
