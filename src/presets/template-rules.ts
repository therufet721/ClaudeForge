/** Preset rules for generating skill template files. */
export const TEMPLATE_RULES = `# Template File Rules

You are generating a template for a skill. Output ONLY the raw markdown content. No code fences, no explanations.

## Required Structure

\`\`\`
# [Template Name]

## Usage
When to use: [e.g. after running accessibility audit].
How to fill: [step-by-step]. Replace each {{placeholder}} with your content.

## [Section 1]
{{placeholder_1}}
<!-- e.g. {{file_path}}: path to the file or directory to audit -->

## [Section 2]
{{placeholder_2}}
<!-- e.g. {{severity_filter}}: P0|P1|P2|all -->

## [Section 3]
...
\`\`\`

## Rules
- ## Usage first: when to use, how to fill, what each placeholder means.
- Use {{snake_case}} for placeholders. Inline comment or description for each.
- All sections required by the skill's output format. No empty sections.
- Example values in comments where helpful: \`<!-- e.g. {{paths}}: src/ components/ -->\`
- Output raw markdown only.`;
