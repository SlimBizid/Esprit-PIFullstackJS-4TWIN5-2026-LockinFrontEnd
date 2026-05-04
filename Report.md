# Overview

<img width="1322" height="1124" alt="webpage" src="https://github.com/user-attachments/assets/16e892b8-b215-4567-83ef-b42310894769" />

# Accessibility

<img width="1322" height="1092" alt="webpage (1)" src="https://github.com/user-attachments/assets/08671182-6db3-4116-8c21-d9a517dc9ec2" />

## What we did

We designed the UI to be **keyboard-first**, **screen-reader friendly**, and **robust under user preferences** (contrast, motion, text size). The implementation is aligned with **WCAG 2.2 (AA) intent** for common success criteria (keyboard access, focus visibility, semantics, and non-text contrast). This section documents what is actually implemented in the frontend.

## Keyboard navigation & shortcuts (WCAG 2.1.1, 2.1.2, 2.4.1)

- **Skip link**: A “Skip to main content” link is rendered before the navbar and becomes visible on focus; it jumps to the main region and focuses it (main has `tabIndex={-1}`), enabling quick bypass of repeated navigation.
- **Challenge list shortcuts** (documented in-app via a shortcuts dialog):
  - Focus search: `/`, `Ctrl+K`, `Cmd+K`
  - Open shortcuts help: `?`, `F1`
  - Activate focused challenge: `Enter`, `Space`
  - The search input also exposes `aria-keyshortcuts` for discoverability.
- **Challenge page shortcuts** (documented in-app via a shortcuts dialog):
  - Submit: `Ctrl+Enter`, `Cmd+Enter`
  - Run test cases: `Ctrl+Shift+Enter`, `Cmd+Shift+Enter`
  - Help: `?`, `F1`
  - Back to list: `Alt+B`
  - Focus language selector: `Alt+L`
  - Prev/next test case: `Alt+,`, `Alt+.`
  - Copy match ID: `Alt+M`
- **Non-interference with typing**: global key handlers intentionally avoid firing when the user is currently typing in an input/textarea/contenteditable element.

## Focus management & overlays (WCAG 2.4.3, 2.4.7)

- **Focus-visible styling**: interactive controls use `focus-visible:*` rings and avoid “focus loss” by consistently styling focus states across buttons/links/inputs.
- **Accessible dialogs & sheets**: modals and slide-over panels are built on Radix primitives (Dialog/Sheet/Select), which provide expected accessibility behaviors (focus trapping, Escape-to-close, correct roles/attributes).
- **Explicit close affordances**: dialog and sheet close buttons include a visible icon plus an `sr-only` label (“Close”) for screen readers.

## Semantics, labels, and SR support (WCAG 1.3.1, 2.5.3)

- **Landmarks**: the layout uses semantic regions (e.g., `header`/`nav`/`main`) and sets navigation labels like `aria-label="Main navigation"`.
- **Form labeling**: inputs and selects are associated with `<Label htmlFor=...>`; where the visual label would be redundant, the label is still present via `sr-only`.
- **Icon buttons are named**: icon-only controls provide `aria-label` (e.g., “Open accessibility settings”, “Back to challenges”, “Open navigation menu”). Decorative icons are marked `aria-hidden`.
- **Errors are announced**: destructive feedback uses an Alert component with `role="alert"`, improving screen reader announcement of important errors.

## Visual accessibility settings (WCAG 1.4.3, 1.4.4, 2.3.3)

We provide user-tunable display preferences via an **Accessibility Settings** menu in the navbar (desktop + mobile):

- **Theme selection**: Light / Dark / System.
- **Text size scaling**: Default / Large / Extra Large (applied at the `html` root).
- **Reduce motion**: when enabled, animations/transitions are reduced globally.
- **High contrast mode**: swaps design tokens at the `html` root to increase contrast in both light and dark themes.
- **Persistence**: settings are stored in `localStorage` and re-applied on load for the current device.

## Verification

- **Lighthouse Accessibility audit**: reflected in the screenshot above.
- **Component-level tests**: dialogs/alerts are exercised with Testing Library to ensure content is reachable via roles/names (e.g., “Cancel”, “Close”, and `role="alert"`).

# Best Practices

<img width="1322" height="1092" alt="webpage (2)" src="https://github.com/user-attachments/assets/740db78c-81f4-48d0-a944-c369e0e90808" />

## What we did

We treated “best practices” as a mix of **code quality**, **safe defaults**, and **production readiness**. The goal was to keep the frontend maintainable and predictable while avoiding common SPA pitfalls.

## Code quality & maintainability

- **TypeScript everywhere**: the app is written in TS/TSX and type-checked as part of the build (`vite build && tsc`).
- **React StrictMode**: enabled at the root to surface unsafe lifecycle patterns and side effects early.
- **Consistent lint + formatting**: ESLint (TanStack config) + Prettier are wired into scripts (`lint`, `format`, `check`) to keep style consistent and catch issues before shipping.
- **Component-level tests**: Vitest + Testing Library are used to validate UI primitives and dialogs (roles, names, rendering behavior), improving long-term stability.
- **Static analysis hooks**: Sonar configuration is present to support code scanning/coverage reporting in CI.

## Configuration & environment hygiene

- **Environment variables**: external services (backend URL, site URL, Firebase) are configured via `VITE_*` env vars, keeping secrets and environment differences out of source.
- **Deterministic installs**: the Docker build uses `pnpm install --frozen-lockfile` to keep dependency resolution reproducible.

## Production delivery

- **SPA-safe routing in production**: deployments include rewrites / fallback to `index.html` (e.g., Vercel rewrites and Nginx `try_files`) so deep links work reliably.
- **Containerized build**: a multi-stage Docker build compiles the app and serves it from Nginx, keeping runtime images small and predictable.

# SEO

<img width="1322" height="1092" alt="webpage (3)" src="https://github.com/user-attachments/assets/daf67b26-097a-46c8-a9c3-c7d761093136" />

## What we did

Even though LockIN is a client-rendered app, we still implement a solid SEO baseline by shipping **static default metadata** in `index.html` and then **updating route-specific metadata at runtime** via a dedicated `<Seo />` component.

## Metadata strategy (title, description, robots)

- **Unique page titles**: every major route sets a unique `document.title` in the format `"<Page Title> | LockIN"`.
- **Meta description**: each route provides a meaningful summary (`<meta name="description" ...>`), keeping it short for SERP snippets.
- **Robots directives**: the default is `index,follow`, but pages that should not be indexed can override this (e.g., the challenge solving view sets `noindex,nofollow`).

## Canonical URLs (duplicate-content prevention)

- The app **upserts a canonical link tag** (`<link rel="canonical" ...>`) for each route.
- Canonicals are computed from `VITE_SITE_URL` (production base URL) with a safe fallback to `window.location.origin`.

## Social sharing (Open Graph + Twitter cards)

We generate consistent previews for sharing on social platforms:

- **Open Graph**: `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image`, `og:image:alt`.
- **Twitter**: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- A single share image (`/LogInCover.png`) is used for a consistent brand preview.

## Structured data (JSON-LD)

- Each route injects **Schema.org JSON-LD** (`<script type="application/ld+json">`).
- The schema uses `@type: WebSite` for the home page and `@type: WebPage` for other routes, including `name`, `description`, and `url`.

## Crawlability: `robots.txt` and `sitemap.xml`

- We generate a **minimal but valid sitemap** and robots file in `public/`.
- Generation is handled by a small script that outputs:
  - `public/sitemap.xml` (currently includes `/` and `/challenges`)
  - `public/robots.txt` with a `Sitemap:` pointer
- In production, the base URL is controlled by `VITE_SITE_URL`, ensuring sitemap + robots reflect the deployed domain.

## Notes / limitations

- Because metadata updates happen client-side, the best results are typically seen with crawlers that execute JavaScript. If stricter SEO requirements are needed (e.g., guaranteed crawler rendering), the next step would be SSR/prerendering for marketing pages.

---

# Performance

## What we did

Performance work focused on **shipping less JS initially**, **avoiding unnecessary work on navigation**, and **keeping runtime updates cheap**.

## Bundle & runtime optimizations

- **Route-based code splitting**: TanStack Router’s Vite plugin is configured with `autoCodeSplitting: true`, enabling smaller initial bundles and loading route code on demand.
- **Selective lazy-loading**: non-critical UI is loaded with `React.lazy` + `Suspense` (e.g., Footer and the Accessibility Settings menu), reducing the cost of first render.
- **React Compiler enabled**: Vite’s React plugin is configured with `babel-plugin-react-compiler` to reduce unnecessary re-renders where possible.

## Navigation & data fetching

- **Scroll restoration**: router scroll restoration is enabled to keep navigation predictable without extra custom logic.
- **Structural sharing**: router default structural sharing is enabled to reduce re-render churn when data structures are stable.
- **Query caching**: TanStack Query is used for server state, reducing repeated requests and keeping UI responsive (stale-while-revalidate patterns where appropriate).

## UX performance & perceived speed

- **Reduced motion option**: the accessibility setting can globally reduce animations/transitions, improving comfort and reducing GPU/CPU work on low-end devices.
- **Font performance hinting**: the HTML head uses `preconnect` for Google Fonts domains to speed up font fetch.

## Monitoring

- **Web Vitals plumbing**: the app includes `web-vitals` integration (CLS/INP/FCP/LCP/TTFB). It’s wired so a callback can be provided later to log or send metrics to analytics without changing the app architecture.
