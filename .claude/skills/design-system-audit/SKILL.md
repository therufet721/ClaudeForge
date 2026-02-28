---
name: design-system-audit
description: Audits design system consistency and usage. Use when user wants to check design tokens, component consistency, or design system compliance.
argument-hint: [paths]
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash
context: fork
agent: ui-expert
---

# Design System Audit

## Instructions

1. [Input parsing] Parse and validate input paths or directories. Default to current directory if none provided. Reject invalid path formats with clear error message.

2. [Validation] Verify target paths exist and are accessible. Check for common frontend file types (CSS, SCSS, JS, JSX, TS, TSX, Vue, Svelte).

3. [Design token discovery] Scan for design token files (tokens.json, variables.css, _variables.scss, theme.js). Extract color palettes, typography scales, spacing systems, and breakpoints.

4. [Component inventory] Identify all UI components across the codebase. Catalog by type: buttons, inputs, cards, modals, navigation, layout components.

5. [Consistency analysis] Compare component implementations for variations in: styling approaches, prop APIs, naming conventions, accessibility patterns.

6. [Token usage audit] Check how design tokens are consumed. Flag hardcoded values that should use tokens. Identify unused tokens.

7. [Typography compliance] Verify font families, sizes, weights, and line heights match design system specifications. Flag inconsistent text styling.

8. [Color compliance] Audit color usage against defined palette. Flag improper color combinations, accessibility contrast issues, brand color misuse.

9. [Spacing analysis] Check margin, padding, and gap usage against spacing scale. Flag magic numbers and inconsistent spacing patterns.

10. [Component variants] Analyze if components properly support all defined variants (sizes, states, themes). Check for missing or incomplete implementations.

11. [Accessibility audit] Review components for ARIA labels, keyboard navigation, focus management, and semantic HTML structure.

12. [Documentation gaps] Identify components lacking proper documentation, usage examples, or prop definitions.

13. [Dependency analysis] Check for conflicting CSS frameworks, duplicate utility classes, or competing design systems.

14. [Performance impact] Assess CSS bundle size, unused styles, and potential optimization opportunities.

15. [Cross-platform consistency] If applicable, compare component implementations across different platforms or frameworks.

16. [Migration recommendations] Identify legacy patterns that need updating to current design system standards.

17. [Output formatting] Generate comprehensive audit report with: executive summary, findings by category, priority issues, recommendations, and implementation roadmap.

18. [Edge cases] Handle missing design tokens gracefully. Report partial audits when some files are inaccessible. Provide fallback analysis for non-standard project structures.