# neurips-sample

A complete NeurIPS 2025 paper rendered from Markdown through
[`@reactwright/template-neurips`](../../packages/template-neurips).

## Build

```sh
pnpm --filter @example/neurips-sample mockup
```

Writes `build/examples/neurips-sample.html` and
`build/examples/neurips-sample.pdf`. The script also prints a row of smoke
checks (author block, section numbering, figure/table captions, references,
checklist, entity handling).

## What it demonstrates

- **`sample.md`** — the paper content: front matter (title, structured
  `authors`, `abstract`) plus Markdown body sections that stress-test the
  template — ordered/unordered lists, inline + block math, inline code, a
  block quote, a depth-3 subsubsection ("3.2.1"), a figure (a solo-image
  paragraph, lifted to `<figure>`), a captioned table (`Table:` paragraph
  lifted to the table caption), an Acknowledgments section, an author-year
  References section, and a two-section Appendix (lettered A / B with an
  "A.1" subsection).
- **`build.tsx`** — the orchestrator. It parses the Markdown, builds the
  multi-author block (`authorMetas`), injects the abstract as a
  `role="abstract"` section, tags the References / Acknowledgments sections
  with their roles, lifts the table caption, appends the
  `NeurIPSChecklist`, and renders HTML + PDF. It also undoes any
  double-encoded HTML entities before the PDF pass.

Compare the output page-by-page against the official `neurips_2025.pdf`:
single-column body, centered title between rules, centered author block,
centered indented abstract, Arabic-numbered bold headings, "Figure 1:" and
"Table 1:" captions, the references list, the lettered appendix, and the
Paper Checklist.

To rasterize either PDF to per-page PNGs for a close visual diff:

```sh
node ../../scripts/pdf-to-images.mjs ../../build/examples/neurips-sample.pdf --dpi 150
```
