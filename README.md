# Reactwright

**Author paginated documents in React.** Two reconcilers compile JSX
content and a template tree into CSS Paged Media HTML, then headless
Chromium prints it to PDF. Papers, essays, reports, screenplays,
story bibles, Tufte-style sidenote essays — all from the same engine.

> **Status: alpha.** APIs may shift between 0.x releases. Output is
> stable across pinned versions.

## Quick start

```sh
# scaffold a new document (stub — see packages/create-reactwright-doc)
npm create reactwright-doc my-doc -- --template=essay

cd my-doc
npm install
npm run build
```

## Workspace layout

This repository is a pnpm + Turborepo monorepo.

### Packages

| Package | Purpose |
|---|---|
| [`reactwright`](./packages/reactwright) | The engine — content + template reconcilers, resolver, HTML/PDF backends. |
| [`@reactwright/template-ieee`](./packages/template-ieee) | IEEE conference-paper template. |
| [`@reactwright/template-essay`](./packages/template-essay) | MLA-style academic-essay template. |
| [`@reactwright/template-report`](./packages/template-report) | Technical/business-report template. |
| [`@reactwright/cite-bibtex`](./packages/cite-bibtex) | BibTeX (`.bib`) citation adapter. *Stub.* |
| [`@reactwright/cite-csl`](./packages/cite-csl) | Citation Style Language adapter. *Stub.* |
| [`@reactwright/code-highlight`](./packages/code-highlight) | Shiki/Prism code-block adapter. *Stub.* |
| [`@reactwright/charts`](./packages/charts) | SVG chart primitives. *Stub.* |
| [`create-reactwright-doc`](./packages/create-reactwright-doc) | `npm create` scaffolder. *Stub.* |

### Examples

[`examples/`](./examples) contains sample documents that consume the
engine plus a template package. They are workspace-only (not
published) — each is a runnable demonstration.

| Example | What it shows |
|---|---|
| `essay-sample` | Short MLA-style essay using `@reactwright/template-essay`. |
| `report-sample` | Technical report using `@reactwright/template-report`. |
| `ieee-strict` | Strict IEEE paper, single-file content. |
| `paper` | Multi-file IEEE paper — sections per file, CSV-driven tables, typed citations. |
| `story-bible` | Three regimes in one document (chapter / portrait plate / script). |
| `treatise` | Academic paper with inline template, footnotes, math, list-of, toc. |
| `newsletter` | Multi-column layout with masthead overlay. |
| `field-notes` | Tufte-style essay with sidenotes, glossary, index. |

## Developing in this repo

### Prerequisites

- Node.js ≥ 20 (CI uses 22)
- pnpm ≥ 9
- Headless Chromium for `mockup:all` — either install Chrome locally
  or set `PUPPETEER_EXECUTABLE_PATH` to a Chromium binary

### Commands

```sh
pnpm install               # install all workspace deps

pnpm test                  # 129-test engine suite
pnpm check                 # typecheck every package
pnpm mockup:all            # render every example to HTML + PDF

# per-package
pnpm --filter reactwright test
pnpm --filter @reactwright/template-ieee check
pnpm --filter @example/story-bible mockup
```

### Versioning + releases

Reactwright uses [Changesets](https://github.com/changesets/changesets)
for versioning. Any change that should ship to npm needs a changeset
on the same branch:

```sh
pnpm changeset
```

Pick the packages that changed and the bump kind (`patch` / `minor` /
`major`); commit the resulting `.changeset/*.md` file. On merge to
`main`, the release workflow opens a "Version Packages" PR; merging
that PR publishes the bumped packages.

## Documentation

- [`docs/spec.md`](./docs/spec.md) — canonical engine specification.
- [`docs/styling-spec.md`](./docs/styling-spec.md) — spec for the
  `<styles>` + `<rule>` styling dialect (twelve binding decisions in
  §10).
- [`docs/decisions.md`](./docs/decisions.md) — architectural
  decision log.
- [`CLAUDE.md`](./CLAUDE.md) — contributor-facing architecture guide
  (source-tree map, dispatch tables, gotchas).
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — workflow + commit style.

## License

MIT. See [`LICENSE`](./LICENSE).
