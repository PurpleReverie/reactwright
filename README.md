# Reactwright

A React-authored document engine for paginated output (HTML via Paged.js, PDF via headless Chromium).

This repository is a pnpm + Turborepo monorepo.

## Packages

- [`packages/reactwright`](./packages/reactwright) — the core engine. Two-reconciler pipeline that compiles JSX content + template trees to CSS Paged Media HTML and PDF.
- `packages/template-ieee` — opinionated IEEE conference-paper template (extracted from the engine's mockups).
- `packages/template-essay` — opinionated MLA-style essay template.
- `packages/template-report` — opinionated technical/business report template.

## Examples

`examples/` contains sample documents that consume the engine plus a template package. They are workspace-only (not published).

## Getting started

```sh
pnpm install
pnpm test            # runs the engine's tests across the workspace
pnpm check           # type-checks every package
pnpm mockup:all      # builds every example's HTML + PDF
```

See `packages/reactwright/README.md` for engine usage details and `docs/spec.md` for the canonical specification.
