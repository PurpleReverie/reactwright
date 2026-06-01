# Reactwright examples

Each subdirectory here is a runnable Reactwright document — a
content tree (TSX or Markdown) paired with a template, set up to
render to HTML and PDF via the engine. Examples are workspace-only
(`private: true` in their `package.json`); they exist to demonstrate
the engine, not to be installed from npm.

To run a single example:

```sh
pnpm --filter @example/<name> mockup
```

To render every example (slow — a few minutes for the full suite):

```sh
pnpm mockup:all
```

Each mockup writes HTML + PDF into `build/mockups/<name>.{html,pdf}`
(or, for the multi-file `paper` example, `build/examples/paper.{html,pdf}`).

The table below is ordered roughly from simplest to most complex,
which is also the recommended reading order if you are learning the
engine.

| Example                                       | Template                           | What it demonstrates                                                                       |
|-----------------------------------------------|------------------------------------|--------------------------------------------------------------------------------------------|
| [`essay-sample`](./essay-sample/)             | `@reactwright/template-essay`      | Short MLA-style essay. Three sections, one block quote, inline citations, Works Cited.     |
| [`letter-sample`](./letter-sample/)           | `@reactwright/template-letter`     | One-page formal business letter exercising every named region.                             |
| [`book-sample`](./book-sample/)               | `@reactwright/template-book`       | Short novella: title page, copyright + dedication, three chapters, afterword.              |
| [`report-sample`](./report-sample/)           | `@reactwright/template-report`     | Technical report with executive summary, four numbered sections, figure, table.            |
| [`ieee-strict`](./ieee-strict/)               | `@reactwright/template-ieee`       | Strict IEEE conference paper from a single-file content document.                          |
| [`ieee-report-sample`](./ieee-report-sample/) | `@reactwright/template-ieee-report`| IEEE long-form report — single-column variant with Roman numerals, "Fig. 1." captions.     |
| [`markdown-sample`](./markdown-sample/)       | `@reactwright/template-essay`      | End-to-end demo of the `reactwright-md` CLI; Markdown with YAML frontmatter and refs.      |
| [`newsletter`](./newsletter/)                 | inline template                    | Multi-column newsletter: `<columns widths>`, masthead overlay via `<fixed>`, page-tint `<layer>`. |
| [`field-notes`](./field-notes/)               | inline template                    | Tufte-style essay: `<sidenote>` + `<sidenote-area>`, glossary via `<defs>`, drop caps, declarative `<font>`. |
| [`treatise`](./treatise/)                     | inline template                    | Academic paper: abstract, auto-numbered figure captions, `<ref>`, footnotes, math, list-of, toc. |
| [`paper`](./paper/)                           | `@reactwright/template-ieee`       | Substantial multi-file IEEE paper — one file per section, CSV-driven tables, typed citation catalogue. |
| [`story-bible`](./story-bible/)               | inline template                    | The repo's best smoke test: three regimes (chapter / portrait plate / script) routed via `<page-set>`, role rules, drop caps, running strings, two-sided geometry, external fonts. |

## What to read first

- **New to Reactwright:** start with `essay-sample` and
  `letter-sample` — small content files that let you see the
  content-tree → template → PDF pipeline end-to-end without
  layout complexity.
- **Learning the styling dialect:** open the template source for
  the example you're studying (e.g.
  `packages/template-essay/src/template.tsx`) and read the
  `<styles>` block alongside the rendered PDF.
- **Building a multi-file authoring workflow:** read `paper`. It
  splits a single document across one TSX file per section plus
  shared infrastructure (a typed citation catalogue, a CSV-driven
  `<DataTable>` component).
- **Stress-testing the engine:** `story-bible` is the densest
  smoke test in the repo. Three page regimes, role-rule routing,
  drop caps, running strings, two-sided geometry, and external
  font loading in one ~3-second build.
- **Authoring in Markdown:** `markdown-sample` shows the
  `reactwright-md` CLI workflow — YAML frontmatter selects the
  template, body Markdown maps to Reactwright primitives, and the
  same engine pipeline renders the PDF.
