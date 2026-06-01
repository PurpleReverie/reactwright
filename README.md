# Reactwright

**Author paginated documents in React.** Two reconcilers compile JSX
content and a template tree into CSS Paged Media HTML, then headless
Chromium prints it to PDF. Papers, essays, reports, screenplays,
story bibles, Tufte-style sidenote essays — all from the same engine.

> **Status: alpha.** APIs may shift between 0.x releases. Output is
> stable across pinned versions.

## Quick start

```sh
# scaffold a new document
npm create reactwright-doc my-doc -- --template=essay

cd my-doc
npm install
npm run build
```

See [`docs/getting-started.md`](./docs/getting-started.md) for the
full walkthrough.

## Workspace layout

This repository is a pnpm + Turborepo monorepo.

### Packages

| Package | Purpose |
|---|---|
| [`reactwright`](./packages/reactwright) | The engine — content + template reconcilers, resolver, HTML/PDF backends. |
| [`@reactwright/markdown`](./packages/markdown) | Markdown (+ YAML frontmatter) loader and `reactwright-md` CLI. |
| [`@reactwright/template-essay`](./packages/template-essay) | MLA-style academic-essay template. |
| [`@reactwright/template-ieee`](./packages/template-ieee) | IEEE conference-paper template (two-column). |
| [`@reactwright/template-ieee-report`](./packages/template-ieee-report) | IEEE long-form report template (single-column). |
| [`@reactwright/template-report`](./packages/template-report) | Business / technical report template. |
| [`@reactwright/template-book`](./packages/template-book) | Long-form chaptered book template (trade paperback). |
| [`@reactwright/template-letter`](./packages/template-letter) | Formal business letter template. |
| [`create-reactwright-doc`](./packages/create-reactwright-doc) | `npm create` scaffolder. |
| [`@reactwright/cite-bibtex`](./packages/cite-bibtex) | BibTeX (`.bib`) citation adapter. ***Not yet implemented*** (private; not on npm). |
| [`@reactwright/cite-csl`](./packages/cite-csl) | Citation Style Language adapter. ***Not yet implemented*** (private; not on npm). |
| [`@reactwright/code-highlight`](./packages/code-highlight) | Shiki/Prism code-block adapter. ***Not yet implemented*** (private; not on npm). |
| [`@reactwright/charts`](./packages/charts) | SVG chart primitives. ***Not yet implemented*** (private; not on npm). |

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
