---
name: component-analysis
description: Analyzes UI components for structure, styling, and best practices. Use when user asks to review components, check UI code, analyze frontend architecture, or evaluate component quality.
argument-hint: [component-path]
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash
context: fork
agent: ui-expert
---

# Component Analysis

## Instructions

1. [Input parsing] Parse and validate input component path or code. Accept React/Vue/Angular components, HTML/CSS files, or component directories. Reject if no valid UI component found.

2. [File discovery] Use Glob to find related files: component file, styles (.css/.scss/.styled), tests, stories, documentation. Map component structure and dependencies.

3. [Structure analysis] Examine component architecture: props/interfaces, state management, lifecycle methods, composition patterns. Check for separation of concerns and single responsibility principle.

4. [Styling evaluation] Analyze CSS/styling approach: methodology (BEM, CSS modules, styled-components), responsive design, accessibility considerations, performance implications.

5. [Accessibility audit] Check ARIA attributes, semantic HTML, keyboard navigation, color contrast, focus management. Identify WCAG compliance issues.

6. [Performance assessment] Evaluate bundle size impact, render performance, unnecessary re-renders, optimization opportunities (memoization, lazy loading).

7. [Code quality review] Check naming conventions, code organization, readability, maintainability. Look for anti-patterns, code smells, or overly complex logic.

8. [Design system compliance] If design system present, verify component follows established patterns, tokens, spacing, typography conventions.

9. [Reusability analysis] Assess component flexibility, prop API design, composability. Check if component is too specific or overly generic.

10. [Testing coverage] Examine existing tests for completeness. Identify untested scenarios, edge cases, or missing accessibility tests.

11. [Documentation review] Check if component has proper documentation: usage examples, prop descriptions, design guidelines.

12. [Browser compatibility] Identify potential cross-browser issues, unsupported CSS features, or JavaScript compatibility concerns.

13. [Security considerations] Check for XSS vulnerabilities, unsafe prop handling, or insecure external dependencies.

14. [Bundle analysis] If build tools available, analyze webpack bundle impact, tree-shaking effectiveness, unnecessary imports.

15. [Generate recommendations] Create prioritized list of improvements: critical issues, performance optimizations, best practice suggestions.

16. [Create report] Format findings using component-report.md template. Include code examples, before/after suggestions, and implementation guidance.

17. [Score calculation] Assign component quality score (1-100) based on: structure (20%), styling (20%), accessibility (25%), performance (15%), maintainability (20%).

18. [Edge cases] Handle: incomplete components, missing dependencies, build errors, inaccessible files. Provide partial analysis when possible with clear limitations noted.