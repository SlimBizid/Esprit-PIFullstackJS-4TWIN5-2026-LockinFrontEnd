# AI Usage (Disclosure)

This document discloses how AI tools were used during the design and implementation of this project.

## Tools used

- **GitHub Copilot (VS Code)**
  - **LLM**: **GPT-5.2** (Copilot Chat)
  - **Mode**: in-editor coding assistant for code suggestions, refactors, and documentation drafting.
- **CodeRabbit (AI PR reviewer)**
  - **LLM/Agent**: vendor-managed (model details abstracted by the service)
  - **Mode**: automated pull request review comments (code quality, edge cases, security/a11y/maintainability checks).

## Where AI was used (what it helped with)

### 1) Frontend (ByteBattle/)

- **UI scaffolding and component composition**
  - Drafting React components and wiring them to existing UI primitives.
  - Generating boilerplate for dialogs, forms, and route-level components.

- **Accessibility improvements and review**
  - Identifying missing accessible names/labels and suggesting `aria-*` usage.
  - Keyboard navigation patterns (global shortcuts, non-interference with typing).
  - Documenting accessibility measures and mapping them to WCAG intent.

- **SEO and metadata handling**
  - Drafting a reusable SEO helper component and documenting metadata strategy.
  - Generating Open Graph/Twitter meta tag checklists.

- **Performance and best practices write-ups**
  - Summarizing implemented performance patterns (code-splitting, lazy-loading).
  - Summarizing code-quality practices (linting, formatting, testing, typechecking).

- **Testing assistance**
  - Creating/adjusting unit tests with Vitest + Testing Library.
  - Suggesting assertions based on roles/names (e.g., dialog buttons, alerts).

### 2) Backend (ByteBattleBackend/)

- **API endpoint scaffolding**
  - Generating NestJS controller/service/module boilerplate from existing patterns.
  - Suggesting DTO shapes and validation approaches.

- **Debugging and error handling**
  - Translating stack traces/logs into likely root causes.
  - Proposing defensive error messages and edge-case handling.

- **Documentation and reporting**
  - Drafting Markdown documentation for the project report and audits.

## How AI output was handled (human-in-the-loop)

We did **not** blindly accept AI output. Typical workflow:

1. AI proposes code or a change.
2. We adapt it to match the project’s conventions (TanStack Router patterns, UI primitives, existing stores/hooks, etc.).
3. We run type checks/tests and fix any integration issues.
4. We review for correctness, security, and UX consistency.

## Representative prompts we used

Below are example prompts representative of what we used during development.

### Coding & scaffolding

- “Generate a React component for a confirmation dialog using our existing `Dialog` and `Button` primitives. It should accept `open`, `onOpenChange`, `title`, `description`, and `onConfirm` props, and be accessible by default.”
- “Create a keyboard-shortcuts help dialog component that renders a list of actions and key combos. Keep the markup semantic and ensure it’s screen-reader friendly.”
- “Given this TanStack Router route file, add global keyboard handlers for `?` and `F1` to open shortcut help, but do not trigger shortcuts while typing in inputs/textareas.”

### Debugging & refactors

- “This component re-renders too often—suggest refactors using memoization or structural sharing without changing the UX.”
- “We have a failing Vitest test related to dialog rendering—analyze what role/name queries we should use and fix the test.”

### Code review (CodeRabbit)

- “Review this PR for accessibility regressions (labels, focus states, keyboard support) and suggest fixes.”
- “Scan for unsafe error handling and missing input validation; point out any edge cases.”
- “Check for performance pitfalls (unnecessary re-renders, heavy dependencies, missing code-splitting opportunities).”

### Accessibility & WCAG

- “Audit this navbar and mobile sheet for a11y: ensure all icon-only buttons have accessible names, focus styles are visible, and dialogs/sheets have close labels.”
- “Write a short WCAG-aligned accessibility section for our report based on these files: skip link, keyboard shortcuts, dialog primitives, and high-contrast/reduced-motion toggles.”

### SEO

- “Create a small SEO utility component that sets title/description, canonical URL, Open Graph and Twitter meta tags, and JSON-LD structured data. Use `VITE_SITE_URL` as base URL.”
- “Document how `robots.txt` and `sitemap.xml` should be generated for a Vite SPA and how to point crawlers to the sitemap.”

### Documentation

- “Rewrite this Lighthouse report section into a concise Markdown explanation for accessibility, SEO, best practices, and performance—don’t invent features that aren’t present in code.”

## LLMs and agent usage

- **GitHub Copilot Chat (GPT-5.2)** was the primary assistant used inside VS Code.
- We used Copilot in both:
  - **Inline suggestion mode** (autocomplete while editing)
  - **Chat/agentic mode** (multi-step edits like updating documentation sections, searching the codebase for a11y/SEO hooks, and drafting report text)

## What AI did _not_ do

- AI did not independently merge PRs, deploy infrastructure, or make final security decisions.
- AI did not design the UI or define the overall architecture of the app.
- AI did not make the website responsive or implement the core logic of features (e.g., the challenge editor, test case runner, or authentication flows).
- Final implementation choices, integration, and verification were performed by the team.
