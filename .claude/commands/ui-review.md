---
description: Reviews UI components and provides detailed improvement suggestions for design, accessibility, and user experience.
argument-hint: [component-paths]
allowed-tools: Read
---

# ui-review

## Description
Performs comprehensive UI component analysis including design consistency, accessibility compliance, user experience patterns, and code quality. Use before component releases, during design reviews, or when refactoring UI elements. Accepts component file paths or directories (default: current directory). Evaluates visual hierarchy, interaction patterns, responsive behavior, color contrast, semantic HTML, and provides actionable recommendations. Example: `/ui-review src/components/Button` analyzes the Button component and suggests improvements for accessibility, styling consistency, and UX best practices.

## Usage
Invoke with `/ui-review [paths]` or describe components naturally like "review the header component for UX issues".
Arguments available: `$ARGUMENTS` (space-separated paths to components or directories), defaults to current directory if no paths specified.

## Example
`/ui-review src/components/Modal src/pages/Dashboard` — analyzes Modal component and Dashboard page, providing detailed feedback on accessibility compliance, design consistency, interaction patterns, and specific code improvements with priority rankings.