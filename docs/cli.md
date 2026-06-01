# CLI reference

Reactwright ships three command-line tools:

| CLI                       | Package                          | What it does                                        |
|---------------------------|----------------------------------|-----------------------------------------------------|
| `reactwright`             | `reactwright`                    | Render a `.tsx` document file to HTML and/or PDF.   |
| `reactwright-md`          | `@reactwright/markdown`          | Render a Markdown (`.md`) file to HTML and PDF.     |
| `create-reactwright-doc`  | `create-reactwright-doc`         | Scaffold a new document project.                    |

All three respect Node's standard `--help` / `-h` flag and exit
non-zero on error with a message on stderr.

## `reactwright`

Render a TSX document file through the engine.

### Synopsis

```sh
reactwright <input.tsx> [--format html,pdf,png] [--out <dir>]
```

The input file must export:

- `default`, `Content`, or `content` — the content tree (a React
  component returning `<document>…</document>`).
- *Optionally* `Template` or `template` — the template component. If
  omitted, a minimal A4 default template is used.

### Flags

| Flag       | Argument          | Default                  | Description                                                  |
|------------|-------------------|--------------------------|--------------------------------------------------------------|
| `--format` | `html\|pdf\|png`  | `html`                   | Comma-separated formats to emit. Repeatable in one flag.     |
| `--out`    | `<dir>`           | `./build/reactwright-run`| Output directory. Created if missing.                        |

Output file names are derived from the input's base name. For
`paper.tsx`, the outputs are `paper.html`, `paper.pdf`, and/or
`paper-001.png`, `paper-002.png`, … (PNG mode emits one image per
page).

### PDF / PNG requirements

PDF and PNG rendering shell out to Chromium via puppeteer. Install
one of:

```sh
npm install puppeteer        # bundles its own Chromium
npm install puppeteer-core  # uses system Chrome via PUPPETEER_EXECUTABLE_PATH
```

### Examples

Render to HTML only:

```sh
reactwright paper.tsx
# writes build/reactwright-run/paper.html
```

Render to HTML and PDF in a custom directory:

```sh
reactwright paper.tsx --format html,pdf --out dist
# writes dist/paper.html and dist/paper.pdf
```

Render to per-page PNGs (useful for thumbnails):

```sh
reactwright paper.tsx --format png --out previews
# writes previews/paper-001.png, paper-002.png, ...
```

### Programmatic API

The CLI is a thin wrapper over `runExternalFile`:

```ts
import { runExternalFile } from "reactwright";

const result = await runExternalFile({
  inputPath: "./paper.tsx",
  outDir: "./dist",
  formats: ["html", "pdf"]
});
// result.htmlPath, result.pdfPath
```

## `reactwright-md`

Render a Markdown file (with optional YAML frontmatter) through any
Reactwright template.

### Synopsis

```sh
reactwright-md <input.md> [options]
```

The frontmatter `template` field selects the template; passing
`--template=` overrides it.

### Flags

| Flag                 | Argument       | Default                          | Description                                  |
|----------------------|----------------|----------------------------------|----------------------------------------------|
| `--template=<name>`  | template flag  | `essay` (or frontmatter value)   | Override the template. `essay`, `ieee`, `report`, etc. |
| `-o`, `--output=<path>` | file path   | next to the input file           | Output base path; both `.html` and `.pdf` are written. |
| `--html-only`        | —              | off                              | Skip PDF generation.                         |
| `-h`, `--help`       | —              | —                                | Show help and exit.                          |

### Examples

Render with the template named in the frontmatter:

```sh
reactwright-md paper.md
# writes paper.html and paper.pdf next to paper.md
```

Override the template:

```sh
reactwright-md paper.md --template=ieee
```

Write to a custom location, HTML only:

```sh
reactwright-md paper.md -o build/paper.pdf --html-only
# writes build/paper.html; skips PDF
```

### Frontmatter

Any YAML key is accessible to the chosen template, but two are
canonical:

- `template:` — selects the template package
  (`essay` → `@reactwright/template-essay`, etc.).
- `title:`, `author:` — passed to `<document>`.
- `references:` — list of `{ key, text }` entries that become
  `<ref-entry>` blocks at the end of the document.

See the [markdown package README](../packages/markdown/README.md) for
the full Markdown-to-Reactwright mapping table.

## `create-reactwright-doc`

Scaffold a new document directory wired to the engine and one of the
official templates.

### Synopsis

```sh
npm create reactwright-doc <name> -- --template=<template>
npx create-reactwright-doc <name> --template=<template>
```

### Templates (`--template=`)

| Flag           | Package                                | Description                                        |
|----------------|----------------------------------------|----------------------------------------------------|
| `essay`        | `@reactwright/template-essay`          | MLA-style academic essay (default).                |
| `ieee`         | `@reactwright/template-ieee`           | IEEE conference paper, two columns.                |
| `ieee-report`  | `@reactwright/template-ieee-report`    | IEEE long-form, single column.                     |
| `report`       | `@reactwright/template-report`         | Business / technical report.                       |
| `book`         | `@reactwright/template-book`           | Long-form chaptered book.                          |
| `letter`       | `@reactwright/template-letter`         | Formal business letter.                            |

### What it writes

For `npm create reactwright-doc my-doc -- --template=essay`:

```
my-doc/
├── package.json     deps: reactwright + the chosen template
├── my-doc.tsx       starter content + re-exported Template
└── README.md        build instructions for this document
```

The `package.json` script is
`"build": "reactwright my-doc.tsx --format html,pdf --out ."` so
`npm run build` invokes the engine on your TSX file once dependencies
are installed, writing the HTML and PDF alongside the source.

### Examples

Default (essay):

```sh
npm create reactwright-doc thesis-draft
```

Conference paper:

```sh
npm create reactwright-doc shannon-paper -- --template=ieee
```

Trade-paperback novel:

```sh
npm create reactwright-doc my-novel -- --template=book
```

### Expected output

```
✓ Created my-doc/

  my-doc/
  ├── package.json
  ├── my-doc.tsx
  └── README.md

Next steps:
  cd my-doc
  npm install
  npm run build
```

The scaffolder refuses to overwrite an existing directory and exits
non-zero with an explanation.
