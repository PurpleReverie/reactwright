# Getting started

This walkthrough takes you from an empty directory to a paginated PDF
in five minutes. Two paths are covered: the `create-reactwright-doc`
scaffolder for TSX-authored documents, and the
`@reactwright/markdown` workflow for Markdown-first authoring.

## Prerequisites

- **Node.js 20+** (CI runs on 22). `node --version` should print
  `v20` or higher.
- **Chromium** for PDF output. Either install `puppeteer`
  (bundles its own Chromium) into the document project, or have a
  system Chrome / Chromium binary that you can point at via
  `PUPPETEER_EXECUTABLE_PATH=/path/to/chrome`.
- **A package manager.** Examples use `npm`; `pnpm` and `yarn` work
  identically.

If you only want HTML output (no PDF), Chromium is not required.

## Path A — scaffold a TSX document

The fastest way to start. The scaffolder writes a single-file
document plus a `package.json` wired to the engine and a template.

```sh
npm create reactwright-doc my-essay -- --template=essay
cd my-essay
npm install
```

The directory now contains:

```
my-essay/
├── package.json        deps on reactwright + the chosen template
├── my-essay.tsx        starter content; edit this
└── README.md           build instructions for your document
```

Open `my-essay.tsx`. You'll see a starter `Document()` that exports
the content tree and re-exports `Template` from the template package.
Replace the placeholder prose with your essay's body.

Render to HTML and PDF:

```sh
npm run build
```

The build script invokes
`reactwright my-essay.tsx --format html,pdf --out .`, which produces
`my-essay.html` and `my-essay.pdf` alongside the source.
Open the HTML in a browser to preview; open the PDF in any PDF
viewer for the print-paginated form.

### Available templates

Pass any of these to `--template=`:

| Flag             | Package                                | Use for                       |
|------------------|----------------------------------------|-------------------------------|
| `essay`          | `@reactwright/template-essay`          | MLA-style academic essay      |
| `ieee`           | `@reactwright/template-ieee`           | IEEE conference paper, 2-col  |
| `ieee-report`    | `@reactwright/template-ieee-report`    | IEEE long-form, 1-col         |
| `report`         | `@reactwright/template-report`         | Business / technical report   |
| `book`           | `@reactwright/template-book`           | Long-form chaptered book      |
| `letter`         | `@reactwright/template-letter`         | Formal business letter        |

To rebuild with a different template, scaffold a new directory
(`npm create reactwright-doc my-paper -- --template=ieee`) or edit
your `package.json` to swap the template dependency and update the
`import { Template } from "…"` line in your `.tsx`.

### Editing content

Reactwright primitives are JSX intrinsics — lower-case tags that the
engine knows how to compile. The most common ones:

```tsx
<document title="…" author="…">    // root, exactly one
  <section title="…">              // sectioning + the section heading
    <p>Body paragraph.</p>
    <p>
      Inline <em>emphasis</em>, <strong>strength</strong>, and
      <code>code</code>. A citation <cite cite="key" />.
    </p>

    <figure src="./image.png" caption="The caption." />

    <table caption="Tabular data">
      <row>
        <cell header><p>Heading</p></cell>
        <cell><p>Body</p></cell>
      </row>
    </table>

    <quote>
      <p>A block quotation.</p>
    </quote>
  </section>

  <refs>
    <ref-entry refKey="key">
      Author. (2024). <em>Title</em>. Publisher.
    </ref-entry>
  </refs>
</document>
```

The full primitive vocabulary is documented in
[`api-reference.md`](./api-reference.md) and the canonical semantics
live in [`spec.md`](./spec.md).

## Path B — author in Markdown

If you prefer Markdown, the `@reactwright/markdown` package ships a
`reactwright-md` CLI that compiles Markdown (with YAML frontmatter)
through any of the templates above.

```sh
npm install @reactwright/markdown reactwright @reactwright/template-essay
```

Create `paper.md`:

```markdown
---
title: My Paper
author: A. Author
template: essay
references:
  - key: smith2024
    text: "Smith, A. (2024). *A Robust Method*. Publisher."
---

# Introduction

Open with the thesis. Cite as you go [@smith2024].

# Conclusion

Wrap with the conclusion.
```

Render:

```sh
npx reactwright-md paper.md
```

This writes `paper.html` and `paper.pdf` next to the source. Pass
`--template=ieee` (or any of the template flags above) to override
the frontmatter selection, `-o build/paper.pdf` to choose an output
location, or `--html-only` to skip PDF generation.

See the [`markdown package README`](../packages/markdown/README.md)
for the full Markdown-to-Reactwright mapping table.

## Rendering to PDF in CI

PDF rendering shells out to headless Chromium via puppeteer. In CI:

```sh
# Option 1 — bundle Chromium
npm install --no-save puppeteer

# Option 2 — use system Chromium
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
npm install --no-save puppeteer-core
```

Then `npm run build` (or `npx reactwright-md paper.md`) produces the
PDF as usual.

## What's next

- [`api-reference.md`](./api-reference.md) — every JSX intrinsic and
  its props.
- [`template-authoring.md`](./template-authoring.md) — write your own
  template instead of consuming a packaged one.
- [`styling-guide.md`](./styling-guide.md) — the `<styles>` + `<rule>`
  dialect, with recipes for common typographic effects.
- [`cli.md`](./cli.md) — the three CLIs (`reactwright`,
  `reactwright-md`, `create-reactwright-doc`) and their flags.
- [`spec.md`](./spec.md) — canonical engine semantics.
