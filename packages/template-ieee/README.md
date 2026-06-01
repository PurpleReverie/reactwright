# @reactwright/template-ieee

IEEE conference-paper template for the Reactwright document engine.
US Letter paper with strict IEEE margins, full-width title block at
the top of page 1, two-column body, Roman-numeral section numbering,
"Fig. 1." auto-numbered captions, "TABLE I." caption headers, and
bracketed numeric `[N]` citations resolved against a numbered
References list.

## When to use this over alternatives

- Pick `@reactwright/template-ieee` for IEEE conference submissions,
  proceedings papers, or anything that needs the canonical two-column
  IEEE conference layout.
- Pick `@reactwright/template-ieee-report` for IEEE-branded long-form
  documents (white papers, internal reports) where the two-column
  conference layout would compress prose. Same brand, single column.
- Pick `@reactwright/template-report` for non-IEEE business or
  technical reports.
- Pick `@reactwright/template-essay` for MLA-style undergraduate
  papers.

## Format conventions

- US Letter paper, IEEE margins (19.05mm top, 25.4mm bottom, 15.875mm
  left/right).
- Body: Times New Roman 10pt, line-height 1.15, justified.
- Title block (page-1 spans both columns): 24pt centered.
- Body: two columns, 3.5" each, 0.167" gutter.
- Abstract (`role="abstract"`): 9pt bold-italic, justified, "Abstract—"
  em-dash preamble.
- Section heads (depth 1): 10pt small caps, centered, Roman-numeral
  numbering (`I.`, `II.`, `III.`, …). The References heading is
  excluded from the Roman-numeral counter.
- Subsections (depth 2): 10pt italic, flush left, alpha numbering
  (`A.`, `B.`, `C.`, …).
- First paragraph after any heading is flush left (no first-line
  indent); subsequent body paragraphs carry a 1em indent.
- Figure captions: 8pt "Fig. N. …" centered below the figure,
  auto-numbered via the `ieee-figure` counter.
- Table captions: 8pt "TABLE I. …" small caps above the table,
  auto-numbered via the `ieee-table` Roman counter.
- Tables: fixed-layout, 8pt, top + bottom rule, italic header row.
- Equations: numbered `(1)`, `(2)` via the `ieee-equation` counter.
- Citations: `[N]` numeric, resolved against `target-counter` on the
  References target IDs.
- References (`role="bibliography"`): 8pt, numbered `[1]`, `[2]`, …,
  hanging indent.
- Running header on page 2+: document title, italic 8pt centered.
- Footer: page number centered 8pt.

## Usage

```tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-ieee";

export { Template };

export default function MyPaper() {
  return (
    <document title="A Robust Approach" author="A. Author and B. Coauthor">
      <section role="abstract" title="">
        <p>
          <em>Abstract</em>—Your abstract text appears here. Keep it
          to one paragraph; the template formats the em-dash preamble
          and bold-italic styling automatically.
        </p>
      </section>

      <section title="Introduction">
        <p>
          Body prose with citations <cite cite="shannon1948" />. The
          template emits the bracketed numeric form.
        </p>
      </section>

      <section title="Related Work">
        <section title="Prior approaches">
          <p>Subsection prose; depth-2 headings are alpha-numbered.</p>
        </section>
      </section>

      <section title="Conclusion">
        <p>Closing remarks.</p>
      </section>

      <refs>
        <ref-entry refKey="shannon1948">
          C. E. Shannon, "A mathematical theory of communication,"
          <em>Bell Syst. Tech. J.</em>, vol. 27, no. 3, pp. 379–423,
          1948.
        </ref-entry>
      </refs>
    </document>
  );
}
```

## Implementation notes

The template went through a heavy migration to the styling dialect.
`IEEE_CSS` is now an empty string kept for forward-compatibility; the
exported `IEEE_STYLES` carries every typographic rule as classes
bound via `<rule>` blocks against the resolved IR (`section-heading`,
`paragraph`, `cell`, `caption`, etc.).

Two role-rule bindings remain in a `<rules>` block: one applies a
numbered-figure counter when `<figure variant="numbered" />` is used,
and one applies an equation counter to `<math variant="numbered" />`.
The rest is plain `<rule match>` against IR shape.

The bibliography is rendered by the userland `<Bibliography>` helper
that the template includes after the body slot. Author-side, supply
entries via a `<refs>` block; the engine collects them and the
helper composes the back-matter section.
