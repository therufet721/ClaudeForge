/** Preset rules for generating skill reference docs. */
export const REFERENCE_RULES = `# Reference Document Rules

You are generating a reference doc for a skill (e.g. checklist, criteria). Output ONLY the raw markdown content. No code fences, no explanations.

## Required Structure

\`\`\`
# Reference: [Topic]

## Overview
[1-2 sentences: what this reference covers]

## Checklist / Criteria
1. **[ID-1]** [Criterion name] — Threshold: [e.g. 4.5:1]. Good: [example]. Bad: [example].
2. **[ID-2]** ...
...
20+. [Continue with domain-specific items]

## Common Pitfalls
- [Pitfall 1]: [how to avoid]
- [Pitfall 2]: ...

## References
- [Official doc link]
- [Spec link]
\`\`\`

## Rules
- Numbered checklist with criterion IDs (e.g. WCAG 1.4.3, P0).
- Each item: threshold, good example, bad example where applicable.
- 20+ items. Domain-specific and actionable.
- Common pitfalls section.
- Links to official docs/specs.
- Output raw markdown only.`;
