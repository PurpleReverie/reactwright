# Reactwright

[![npm](https://img.shields.io/npm/v/reactwright?label=reactwright)](https://www.npmjs.com/package/reactwright)
[![License](https://img.shields.io/npm/l/reactwright)](./LICENSE)
[![Node](https://img.shields.io/node/v/reactwright)](#prerequisites)

**Author paginated documents in React.** Two reconcilers compile JSX
content and a template tree into CSS Paged Media HTML, then headless
Chromium prints it to PDF. Papers, essays, reports, screenplays,
story bibles, Tufte-style sidenote essays — all from the same engine.

> **Status: alpha (0.1.x on npm).** APIs may shift between 0.x
> releases. Output is stable across pinned versions.

## Quick start

The fastest path is the scaffolder — it sets up a starter project
wired to the template of your choice:

```sh
npm create reactwright-doc my-doc -- --template=essay

cd my-doc
npm install
npm run build
```

That produces `my-doc.html` and `my-doc.pdf` alongside the source.
Six templates ship out of the box: `essay`, `ieee`, `ieee-report`,
`report`, `book`, `letter`.

See [`docs/getting-started.md`](./docs/getting-started.md) for the
full walkthrough including the Markdown-first path.

## Install (manual)

If you'd rather wire your own project without the scaffolder:

```sh
# the engine
npm install reactwright react

# one or more templates
npm install @reactwright/template-essay
npm install @reactwright/template-ieee
npm install @reactwright/template-book        # any of the six

# optional: Markdown loader and CLI
npm install @reactwright/markdown
```

`reactwright` declares `react` as a peer dependency (works with React
19), so install React explicitly in your project.

## Workspace layout

This repository is a pnpm + Turborepo monorepo.

### Packages

| Package | npm | Source | Purpose |
|---|---|---|---|
| `reactwright` | [npm](https://www.npmjs.com/package/reactwright) | [src](./packages/reactwright) | The engine — content + template reconcilers, resolver, HTML/PDF backends. |
| `@reactwright/markdown` | [npm](https://www.npmjs.com/package/@reactwright/markdown) | [src](./packages/markdown) | Markdown (+ YAML frontmatter) loader and `reactwright-md` CLI. |
| `@reactwright/template-essay` | [npm](https://www.npmjs.com/package/@reactwright/template-essay) | [src](./packages/template-essay) | MLA-style academic-essay template. |
| `@reactwright/template-ieee` | [npm](https://www.npmjs.com/package/@reactwright/template-ieee) | [src](./packages/template-ieee) | IEEE conference-paper template (two-column). |
| `@reactwright/template-ieee-report` | [npm](https://www.npmjs.com/package/@reactwright/template-ieee-report) | [src](./packages/template-ieee-report) | IEEE long-form report template (single-column). |
| `@reactwright/template-report` | [npm](https://www.npmjs.com/package/@reactwright/template-report) | [src](./packages/template-report) | Business / technical report template. |
| `@reactwright/template-book` | [npm](https://www.npmjs.com/package/@reactwright/template-book) | [src](./packages/template-book) | Long-form chaptered book template (trade paperback). |
| `@reactwright/template-letter` | [npm](https://www.npmjs.com/package/@reactwright/template-letter) | [src](./packages/template-letter) | Formal business letter template. |
| `create-reactwright-doc` | [npm](https://www.npmjs.com/package/create-reactwright-doc) | [src](./packages/create-reactwright-doc) | `npm create` scaffolder. |
| `@reactwright/cite-bibtex` | — | [src](./packages/cite-bibtex) | BibTeX (`.bib`) citation adapter. ***Not yet implemented*** (private). |
| `@reactwright/cite-csl` | — | [src](./packages/cite-csl) | Citation Style Language adapter. ***Not yet implemented*** (private). |
| `@reactwright/code-highlight` | — | [src](./packages/code-highlight) | Shiki/Prism code-block adapter. ***Not yet implemented*** (private). |
| `@reactwright/charts` | — | [src](./packages/charts) | SVG chart primitives. ***Not yet implemented*** (private). |

The `@reactwright/*` scoped packages are published under the
[`reactwright` npm organization](https://www.npmjs.com/org/reactwright).
The unscoped `reactwright` and `create-reactwright-doc` follow the
convention used by `react`, `create-react-app`, `create-vite`, etc.

### Examples

[`examples/`](./examples) contains sample documents that consume the
engine plus a template package. They are workspace-only (not
published) — each is a runnable demonstration. See
[`examples/README.md`](./examples/README.md) for the full index and
a recommended reading order.

| Example | What it shows |
|---|---|
| `essay-sample` | Short MLA-style essay using `@reactwright/template-essay`. |
| `letter-sample` | One-page formal business letter using `@reactwright/template-letter`. |
| `book-sample` | Short novella using `@reactwright/template-book`. |
| `report-sample` | Technical report using `@reactwright/template-report`. |
| `ieee-strict` | Strict IEEE paper, single-file content. |
| `ieee-report-sample` | IEEE long-form report (single-column variant). |
| `markdown-sample` | End-to-end `reactwright-md` demo (Markdown + frontmatter). |
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

User-facing guides:

- [`docs/getting-started.md`](./docs/getting-started.md) — first
  document, end-to-end (scaffolder + Markdown paths).
- [`docs/api-reference.md`](./docs/api-reference.md) — every JSX
  intrinsic and its props (content side + template side).
- [`docs/cli.md`](./docs/cli.md) — `reactwright`, `reactwright-md`,
  and `create-reactwright-doc` reference.
- [`docs/template-authoring.md`](./docs/template-authoring.md) —
  write your own template from scratch.
- [`docs/styling-guide.md`](./docs/styling-guide.md) — the `<styles>`
  + `<rule>` dialect, with recipes.

Specifications and history:

- [`docs/spec.md`](./docs/spec.md) — canonical engine specification.
- [`docs/styling-spec.md`](./docs/styling-spec.md) — spec for the
  `<styles>` + `<rule>` styling dialect (twelve binding decisions in
  §10).
- [`docs/decisions.md`](./docs/decisions.md) — architectural
  decision log.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — workflow + commit style.

## License

MIT. See [`LICENSE`](./LICENSE).
