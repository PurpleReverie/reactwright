# @reactwright/template-ieee-report

IEEE technical-report template for the Reactwright document engine.
Single-column long-form layout for white papers, working papers, and
internal IEEE technical reports. Carries the IEEE brand (Times serif,
italic "Abstract—" preamble, Roman-numeral section numbering,
"Fig. 1." captions, bracketed numeric citations) but with breathing
room appropriate to longer documents.

## When to use this over alternatives

- Pick `@reactwright/template-ieee` for conference papers, two-column
  IEEE submissions, or anything destined for an IEEE proceedings.
- Pick `@reactwright/template-ieee-report` for IEEE-branded long-form
  documents (white papers, internal reports, technical memos) where
  the two-column conference layout would compress the prose too much.
- Pick `@reactwright/template-report` for generic business or
  technical reports that do not need IEEE typographic conventions.

## Format conventions

- US Letter paper, 1" top/bottom margins, 1.25" inner/outer margins.
- Body: Times New Roman 11pt, line-height 1.4.
- Title: 18pt bold centered. Author block: 11pt italic centered.
  Affiliation line: 9pt centered (use `<author>` for author and an
  initial `<p>` styled centered for the affiliation, or rely on the
  author block alone).
- Abstract: 10pt regular, italic preamble "Abstract—".
- Section heads: 12pt bold ALL CAPS, Roman-numeral numbering
  (`I.`, `II.`, …).
- Subsection heads: 11pt bold italic, alpha numbering
  (`A.`, `B.`, …).
- Sub-subsection heads: 11pt italic, decimal-close numbering
  (`1)`, `2)`, …).
- Body paragraphs: 0.25" first-line indent. First paragraph after a
  heading is flush left.
- Figure captions: 9pt "Fig. 1. …" centered below.
- Table captions: 9pt "TABLE I. …" ALL CAPS centered above.
- Bibliography: 9pt with hanging indent and numeric `[N]` prefix.
- Citations: `[N]` numeric via `target-counter(reactwright-bib)`.
- Running header (page 2+): document title centered italic 9pt.
- Footer: page number centered 9pt.

## Usage

```tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-ieee-report";

export { Template };

export default function MyReport() {
  return (
    <document title="…" author="…">
      <section role="abstract" title="">
        <p><em>Abstract</em>—Your abstract text here…</p>
      </section>

      <section title="Introduction">
        <p>Body prose with citations <cite cite="knuth1984" />.</p>
      </section>

      <refs>
        <ref-entry refKey="knuth1984">
          D. E. Knuth, <em>The TeXbook</em>. Reading, MA: Addison-Wesley,
          1984.
        </ref-entry>
      </refs>
    </document>
  );
}
```

## Implementation notes

Styling is expressed entirely via the styling dialect (`<styles>` +
`<rule>`). The exported `IEEE_REPORT_CSS` is an empty string kept for
forward compatibility — there is no engine-bypass CSS. The userland
`<Bibliography>` helper renders the back-matter references list; the
template's rules target the `section role="bibliography"` shape it
composes.
