# @reactwright/template-neurips

NeurIPS 2025 single-column conference-paper template for the Reactwright
document engine. Matched to the official `neurips_2025.sty` /
`neurips_2025.pdf` style files: US Letter, a 5.5in × 9in centered text
block, Times 10pt justified body, a 17pt bold title bracketed by
horizontal rules, a centered multi-author block, a centered indented
abstract, Arabic-numbered bold section headings, "Figure N:" / "Table N:"
captions, an author-year references list, and the required NeurIPS Paper
Checklist.

## When to use this over alternatives

- Pick `@reactwright/template-neurips` for NeurIPS submissions, preprints,
  or camera-ready papers (Main / Datasets & Benchmarks / Position / Creative
  AI / Workshop tracks all share this single-column layout).
- Pick `@reactwright/template-ieee` for the two-column IEEE conference
  layout.
- Pick `@reactwright/template-report` / `@reactwright/template-essay` for
  non-conference documents.

## Format conventions (matched to `neurips_2025.pdf`)

- US Letter; text block 5.5in wide × 9in tall, centered (margins: 1in
  top/bottom, 1.5in left/right).
- Body: Times New Roman 10pt, 11pt leading, justified, **no** first-line
  indent; paragraphs separated by a 5.5pt skip.
- Title: 17pt bold, centered between a 4pt rule above and a 1pt rule below.
- Authors: centered block(s) below the title — **bold** name, regular
  affiliation/address, monospace email. Co-authors sit side by side.
- Abstract: centered bold "Abstract" heading (12pt) with the paragraph
  indented 0.5in on both margins, 10pt justified.
- Section headings: flush-left, bold, Arabic-numbered. Level 1 is 12pt
  ("1 Title"); levels 2–3 are 10pt ("1.1", "1.1.1"). References,
  Acknowledgments, and the Paper Checklist are **unnumbered**.
- Figure captions: "Figure N: …" 9pt, centered below the figure.
- Table captions: "Table N: …" 9pt, centered above the table; tables use
  booktabs-style horizontal rules only (no vertical rules).
- References: 9pt, hanging indent, plain text. NeurIPS allows author-year
  or numeric; this template ships the author-year (APA-style) form. There
  is no BibTeX step — entries are authored as a `role="bibliography"`
  section.
- Footer: page number on pages 2+; the first page carries the conference
  notice instead (matching the compiled example).

### Submission vs. preprint vs. final

The template defaults to the clean **final/preprint** look (no margin line
numbers, no "Submitted to…" banner). The first-page footer notice is
configurable via the `notice` prop:

```tsx
<Template />                                  {/* default: the NeurIPS 2025 track line */}
<Template notice="Preprint." />               {/* arXiv-style preprint */}
<Template notice="" />                         {/* suppress the notice entirely */}
```

Margin line numbers (the anonymized submission style) are intentionally not
reproduced — Paged.js has no line-number primitive.

## Exports

| Export | Purpose |
|--------|---------|
| `Template` | The page template. Optional prop `{ notice?: string }`. |
| `NEURIPS_STYLES` | The styling-dialect block, if you want to compose it into your own `<styles>`. |
| `NEURIPS_CSS` | Empty string, kept for forward-compatibility / parity. |
| `authorMetas(authors)` | Build the `<meta name="author">` entries for the multi-author block. |
| `AuthorCard` | The inner card for one author (name / affiliation / address / email). |
| `NeurIPSChecklist` | Emit the required Paper Checklist as a `role="checklist"` section. |
| `CHECKLIST_QUESTIONS` | The verbatim 2025 checklist questions (16 entries). |

## Slot contract

The template fills four slots:

| Slot | Filled by | Notes |
|------|-----------|-------|
| `title` | `<document title="…">` | Rendered as the bracketed 17pt title. |
| `author` | `<meta name="author">…</meta>` (one per author) | Use `authorMetas(...)`; the single-string `author` prop is **not** used. |
| `abstract` | `<section role="abstract" title="Abstract">` | Centered heading + indented paragraph. |
| `body` | everything else | Numbered sections, figures, tables, references, checklist. |

### Section roles the template keys off

Set these on back-matter `<section>`s; anything without a special role is a
numbered body section:

| `role` | Effect |
|--------|--------|
| `"abstract"` | Routed to the abstract slot; centered bold heading. |
| `"bibliography"` | References — unnumbered heading, 9pt hanging-indent entries. |
| `"unnumbered"` | Acknowledgments etc. — unnumbered bold heading. |
| `"appendix"` | Appendix — lettered headings (A, B; subsections A.1, B.1). |
| `"checklist"` | Paper Checklist — page break + plain numbered list (see `NeurIPSChecklist`). |

## Usage

```tsx
import "reactwright/jsx";
import React from "react";
import { Template, authorMetas, NeurIPSChecklist } from "@reactwright/template-neurips";

export { Template };

export default function MyPaper() {
  return (
    <document title="A Faithful NeurIPS Paper">
      {authorMetas([
        { name: "A. Author", affiliation: "Some University", address: "City, Country", email: "a@uni.edu" },
        { name: "B. Coauthor", affiliation: "Another Lab", address: "City, Country", email: "b@lab.org" }
      ])}

      <section role="abstract" title="Abstract">
        <p>One-paragraph abstract, indented on both margins.</p>
      </section>

      <section title="Introduction">
        <p>Body prose. Inline citations are plain author-year text (Author, 2024).</p>
        <section title="Background">
          <p>Depth-2 headings are numbered 1.1, 1.2, …</p>
        </section>
      </section>

      <section title="Conclusion">
        <p>Closing remarks.</p>
      </section>

      <section role="unnumbered" title="Acknowledgments">
        <p>Unnumbered, per NeurIPS convention.</p>
      </section>

      <section role="bibliography" title="References">
        <p>Author, A. (2024). A paper title. Venue.</p>
        <p>Other, B. (2023). Another paper. Venue.</p>
      </section>

      <NeurIPSChecklist
        answers={[
          { answer: "Yes", justification: "…" }
          /* remaining questions fall back to [TODO] */
        ]}
      />
    </document>
  );
}
```

## Supported Markdown

The companion example (`examples/neurips-sample`) renders a paper straight
from Markdown via `@reactwright/markdown`:

- Headings (`#`, `##`, `###`) → numbered sections / subsections.
- Solo-image paragraphs (`![alt](src)`) → a `<figure>` with the alt text as
  the "Figure N:" caption.
- A `Table: caption` paragraph immediately before a Markdown table → the
  table's "Table N:" caption.
- Emphasis, inline code, links, ordered/unordered lists, block quotes
  (indented like LaTeX's `quote`), inline math (`$…$`) and block math
  (`$$…$$`).
- Front matter supplies `title`, the structured `authors` list, and the
  `abstract`; the build script injects the author block, the abstract
  section, and the checklist, and tags back-matter sections by position
  (everything after References becomes a lettered appendix).

## The Paper Checklist

Every NeurIPS paper must end with the Paper Checklist (papers omitting it
are desk-rejected; it does not count toward the page limit).
`NeurIPSChecklist` emits the full, verbatim 2025 list of 16 questions as a
`role="checklist"` section — page-broken, with an unnumbered heading and a
plain numbered list of Question / Answer / Justification triples. Pass your
per-question `answers` (Yes / No / NA + a 1–2 sentence justification);
anything omitted renders as `[TODO]`. `CHECKLIST_QUESTIONS` exposes the raw
question data if you'd rather lay it out yourself.

## Implementation notes

All styling is expressed through the styling dialect (`<styles>` +
`<rule>`); `NEURIPS_CSS` is an empty string. Section numbering is wired with
dialect counters (`nips-sec` / `nips-sub` / `nips-subsub`), and the
back-matter sections are excluded from the counter by role. The references
list is authored content (a `role="bibliography"` section) rather than the
template-side `<Bibliography>` data-source helper, so author-year entries
stay plain text and the section orders naturally before the checklist.

Appendix subsection numbering ("A.1") mixes an upper-alpha counter with a
decimal one. The `numbering` dialect concept applies a single counter-style
to its whole format, so the mixed case is expressed instead with the `prefix`
concept plus a pass-through `counter-increment` — no raw `customCss` needed.

To eyeball rendered output against the official `neurips_2025.pdf`, the repo
ships `scripts/pdf-to-images.mjs` (wraps poppler's `pdftoppm`):

```sh
node scripts/pdf-to-images.mjs build/examples/neurips-sample.pdf --dpi 150
```
