# Reactwright

> Write paginated documents in React. Get HTML for the browser and PDF for the printer — without LaTeX, without InDesign, without writing CSS Paged Media by hand.

Reactwright is a document engine. You compose your *content* in JSX
(`<document>`, `<section>`, `<p>`, `<figure>`, `<cite>`) and your
*template* in a separate JSX tree (`<page>`, `<region>`, `<columns>`,
`<header>`, `<footer>`). Two React reconcilers compile each tree to
an intermediate representation; a resolver joins them; the engine
emits paginated HTML and renders it to PDF through Paged.js inside
headless Chromium.

```
content JSX  ─┐
              ├──► resolver ──► paginated HTML ──► Paged.js ──► PDF
template JSX ─┘
```

The same content can be re-skinned by swapping templates. The same
template can host any content. Numbering, cross-references, page
counts, footnotes, bibliographies, tables of contents, and indices
all resolve automatically.

## Why

LaTeX is brilliant and brutal. The browser is now a fully capable
typesetting engine — it does kerning, ligatures, hyphenation,
hanging punctuation, justified text, multi-column flow, named
running headers, and footnote floats. Reactwright gives that
substrate a writer-facing language without making you learn CSS.

## Status

`0.1.0` — first published cut. The architecture has rendered a
credible IEEE conference paper, a Tufte-style essay with sidenotes,
a two-sided novel chapter, a multi-column newsletter, and an
academic treatise. API will change pre-`1.0`; expect breakage
between minor versions.

## Install

```bash
npm install reactwright
```

Peer dependency: `react@^19`. PDF output requires `puppeteer` or
`puppeteer-core` and either a bundled Chromium or one available via
`PUPPETEER_EXECUTABLE_PATH`.

## A 30-line example

```tsx
// paper.tsx
import "reactwright/jsx";

export function Template() {
  return (
    <page page={{ size: "a4", margin: "25mm" }}>
      <stack gap="6mm">
        <region style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region>
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}

export default function Paper() {
  return (
    <document title="A First Reactwright Paper" author="Your Name">
      <section title="Introduction">
        <p>Hello world.</p>
      </section>
    </document>
  );
}
```

Render it:

```bash
node --import tsx ./node_modules/reactwright/src/cli/run-file.tsx \
  ./paper.tsx --format html,pdf --out ./out
```

Outputs `./out/paper.html` and `./out/paper.pdf`.

## What's in the box

**Content primitives.** `document`, `section`, `p`, `em`, `strong`,
`code`, `link`, `quote`, `list` / `item`, `figure` (+ `caption`),
`table` (+ `caption`) / `row` / `cell`, `code-block`, `defs` / `def`,
`math`, `cite`, `footnote`, `sidenote`, `index`, `ref`, `set running`
/ `running`, plus `refs` / `ref-entry` for bibliography registration.

**Template primitives.** `page`, `page-set` (named-page regimes),
`region`, `stack` (vertical-flex), `row` (horizontal-flex), `columns`
/ `column`, `layer` (backgrounds), `fixed` (overlays), `slot`,
`header`, `footer`, `footnote-area`, `sidenote-area`, `font`
(font-face), `rules` containing `role` (semantic→presentation
routing) and `page` rules, plus back-matter generators `toc`,
`list-of`, `bibliography`, `index`.

**Styling primitives.** `styles` (CSS-dialect block over the IR),
`rule` (selector + className binding). Author writes a CSS-superset
dialect targeting our typed selectors (`kind`, `role`, `depth`,
`follows`, `within`, `has`, …) instead of HTML element names. See
[docs/styling-spec.md](https://github.com/PurpleReverie/reactwright/blob/main/docs/styling-spec.md).

**Output formats.** `html` (Paged.js-ready), `pdf` (headless
Chromium print), `png` (one image per page, useful for visual
diffing and AI-assisted review).

## Architecture in one line

Reactwright is two React reconcilers, an intermediate-representation
resolver, an HTML emitter, and a Chromium printing harness. Each
piece is a few hundred lines; together they replace a corpus of TeX
that took thirty years to write.

See [docs/spec.md](https://github.com/PurpleReverie/reactwright/blob/main/docs/spec.md)
for the full specification and
[docs/styling-spec.md](https://github.com/PurpleReverie/reactwright/blob/main/docs/styling-spec.md)
for the styling system.

## Pre-built templates

The companion `@reactwright/template-ieee` package ships an IEEE
conference paper template + typed bibliography helper that
demonstrates the authoring pattern other formats can copy:

```tsx
import { Template, createBibliography, IEEEFrontMatter } from "@reactwright/template-ieee";

const refs = createBibliography({
  knuth1984: { authors: "D. E. Knuth", title: "The TeXbook",
                publisher: "Addison-Wesley", year: 1984 },
});

export { Template };
export default function Paper() {
  return (
    <document title="…" author="…">
      <IEEEFrontMatter abstract="…" indexTerms="…" />
      <section title="Introduction">
        <p>… <refs.Cite k="knuth1984" /> …</p>
      </section>
      <refs.RefList />
    </document>
  );
}
```

TypeScript catches typos in citation keys at compile time.

## License

MIT. See [LICENSE](LICENSE).
