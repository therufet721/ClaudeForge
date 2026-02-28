# Reference: UI Component Analysis

## Overview
Comprehensive checklist for reviewing and analyzing UI component code quality, covering accessibility, performance, maintainability, and user experience best practices.

## Checklist / Criteria
1. **WCAG-1.4.3** Color Contrast — Threshold: 4.5:1 for normal text, 3:1 for large text. Good: `#333` on `#fff` (12.6:1). Bad: `#999` on `#ccc` (1.6:1).
2. **WCAG-2.1.1** Keyboard Navigation — All interactive elements accessible via keyboard. Good: `tabIndex={0}` with focus handlers. Bad: Click-only buttons without keyboard support.
3. **WCAG-4.1.2** Semantic HTML — Use proper HTML elements for their intended purpose. Good: `<button>` for actions. Bad: `<div onClick={}>` for buttons.
4. **WCAG-1.3.1** ARIA Labels — Screen reader accessible content. Good: `aria-label="Close dialog"`. Bad: Icon buttons without labels.
5. **PERF-1** Bundle Size — Component bundle < 50KB gzipped. Good: Tree-shakeable exports. Bad: Importing entire utility libraries.
6. **PERF-2** Re-render Optimization — Minimize unnecessary re-renders. Good: `React.memo()`, `useMemo()`. Bad: Inline objects/functions in JSX.
7. **PERF-3** Image Optimization — Responsive images with proper formats. Good: `srcSet` with WebP fallbacks. Bad: Large PNGs for all screen sizes.
8. **MAINT-1** Component Size — Single component < 300 lines. Good: Focused, single-responsibility components. Bad: God components handling multiple concerns.
9. **MAINT-2** Prop Interface — Clear, typed prop definitions. Good: TypeScript interfaces with JSDoc. Bad: Untyped props with unclear purposes.
10. **MAINT-3** Testing Coverage — Unit tests for all public methods/props. Good: 90%+ coverage with edge cases. Bad: No tests or happy-path only.
11. **UX-1** Loading States — Clear feedback during async operations. Good: Skeleton screens, progress indicators. Bad: Frozen UI during loading.
12. **UX-2** Error Handling — Graceful degradation and error messages. Good: User-friendly error boundaries. Bad: White screens of death.
13. **UX-3** Touch Targets — Minimum 44px touch target size. Good: Properly sized buttons for mobile. Bad: Tiny clickable areas.
14. **RESP-1** Responsive Design — Works across all device sizes. Good: CSS Grid/Flexbox with breakpoints. Bad: Fixed pixel layouts.
15. **RESP-2** Mobile-First — Progressive enhancement approach. Good: Base styles for mobile, enhanced for desktop. Bad: Desktop-first with mobile afterthoughts.
16. **SEC-1** XSS Prevention — Sanitized user inputs and outputs. Good: `dangerouslySetInnerHTML` with sanitization. Bad: Raw HTML injection.
17. **SEC-2** Content Security Policy — CSP-compliant code. Good: No inline styles/scripts in production. Bad: Inline event handlers and styles.
18. **CODE-1** Naming Conventions — Consistent, descriptive naming. Good: `isSubmitButtonDisabled`. Bad: `flag1`, `temp`, `data`.
19. **CODE-2** CSS Organization — Structured, maintainable stylesheets. Good: CSS Modules or styled-components. Bad: Global CSS with !important overrides.
20. **CODE-3** Documentation — Comprehensive component docs. Good: Storybook stories with all variants. Bad: No usage examples or prop descriptions.
21. **API-1** Consistent Patterns — Follows established design system patterns. Good: Matches existing component APIs. Bad: One-off implementations breaking conventions.
22. **API-2** Extensibility — Supports customization without modification. Good: CSS custom properties, render props. Bad: Hardcoded styles and behaviors.
23. **COMPAT-1** Browser Support — Works in target browsers. Good: Progressive enhancement with polyfills. Bad: Modern JS without transpilation.
24. **COMPAT-2** Framework Agnostic — Reusable across different contexts. Good: Pure functions, standard APIs. Bad: Framework-specific implementations only.
25. **VISUAL-1** Design Consistency — Matches design system specifications. Good: Exact spacing, typography, colors. Bad: Approximated visual implementation.

## Common Pitfalls
- **Accessibility Afterthought**: Adding ARIA labels without understanding semantic HTML first. Use native elements before reaching for ARIA.
- **Premature Optimization**: Over-engineering performance before identifying actual bottlenecks. Profile first, optimize second.
- **Prop Drilling**: Passing props through multiple component layers. Use context, state management, or component composition patterns.
- **Styling Conflicts**: Global CSS overrides causing unexpected behavior. Scope styles with CSS Modules or CSS-in-JS.
- **Inconsistent Error States**: Different error handling patterns across components. Establish consistent error boundaries and fallback UIs.
- **Mobile Breakpoint Assumptions**: Designing for specific device sizes rather than content-driven breakpoints. Test across actual devices.
- **State Management Overuse**: Using complex state solutions for simple component state. Start with local state, scale up as needed.
- **Testing Implementation Details**: Testing internal component structure rather than user interactions. Focus on behavior, not implementation.

## References
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Web Performance Checklist](https://web.dev/performance/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [CSS Guidelines](https://cssguidelin.es/)
- [Component API Design](https://component.kitchen/eightshapes-system/articles/component-api-design/)