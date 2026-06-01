# @reactwright/template-report

Technical and business report template for the Reactwright document
engine. US Letter, single-column, Times 11pt with comfortable line
spacing, optional executive-summary box, decimal section numbering
(`1.`, `1.1`, `1.1.1`), auto-numbered figure and table captions, and
a numeric `[N]` bibliography at the back.

## When to use this over alternatives

- Pick `@reactwright/template-report` for internal company reports,
  consulting deliverables, white papers, lab write-ups, or any
  professional document that wants decimal section numbering and a
  cover-page-style title block but does not need IEEE branding.
- Pick `@reactwright/template-ieee-report` for IEEE-branded long-form
  reports (Times serif, Roman section numbers, "Fig. 1." captions).
- Pick `@reactwright/template-ieee` for two-column IEEE conference
  papers.
- Pick `@reactwright/template-essay` for short MLA-style essays.

## Format conventions

- US Letter paper, 1" top/bottom margins, 1.25" left/right margins.
- Body: Times New Roman 11pt, line-height 1.4, justified.
- Title: 18pt bold centered.
- Author / date: 11pt italic centered below the title.
- Executive summary / abstract (`role="abstract"`): tinted box with
  bold uppercase heading and justified body inside.
- Section heads (depth 1): 13pt bold left-aligned, decimal numbering
  (`1.`, `2.`, `3.`, …). The numbering counter is reset for each
  top-level section; subsection counter resets on each new section.
- Subsection heads (depth 2): 11pt bold left-aligned, decimal
  numbering (`1.1`, `1.2`, `2.1`, …).
- Body paragraphs: block style — no first-line indent, 6pt top
  margin between paragraphs, justified. The first paragraph after a
  heading has its top margin suppressed (sits flush against the
  heading).
- Figure captions: 10pt italic centered "Figure N. …" below the
  figure, auto-numbered via the `report-figure` counter.
- Table captions: 10pt italic left-aligned "Table N. …" above the
  table, auto-numbered via the `report-table` counter.
- Tables: full-width, fixed-layout, 10pt, light grey rules around
  cells, bold header row on a grey tint with bolder top and bottom
  rules.
- Citations: `[N]` numeric via `target-counter`.
- Bibliography (`role="bibliography"`): 10pt with hanging indent and
  `[N]` numeric prefix.
- Running header on page 2+: document title italic top-left, page
  number top-right (both 9pt).
- Footer: `page-number / page-count` centered 9pt.

## Usage

```tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-report";

export { Template };

export default function MyReport() {
  return (
    <document title="Q3 Engineering Review" author="A. Author">
      <section role="abstract" title="Executive Summary">
        <p>
          Three-sentence digest of the report. The template renders
          this in a tinted box at the top of the body.
        </p>
      </section>

      <section title="Background">
        <p>
          Section-1 prose. Top-level headings auto-number as
          "1. Background", "2. Findings", and so on.
        </p>

        <section title="Prior work">
          <p>Subsection prose; depth-2 headings number as "1.1".</p>
        </section>
      </section>

      <section title="Findings">
        <p>
          Body prose with a citation <cite cite="kuhn1962" /> and a
          reference to the figure below.
        </p>

        <figure src="./build-times.png" caption="Build times by commit" />
      </section>

      <section title="Recommendations">
        <p>Closing paragraph.</p>
      </section>

      <refs>
        <ref-entry refKey="kuhn1962">
          T. S. Kuhn, <em>The Structure of Scientific Revolutions</em>,
          University of Chicago Press, 1962.
        </ref-entry>
      </refs>
    </document>
  );
}
```

## Implementation notes

Styling is expressed entirely via the styling dialect (`<styles>` +
`<rule>`). The exported `REPORT_STYLES` is the CSS-dialect source the
template binds; there is no engine-bypass CSS.

Section numbering is implemented through the dialect's `numbering`
declaration on the section-head classes — the engine emits the
counter machinery and the `report-subsection` counter resets when a
new `report-section` increment fires.

The bibliography is rendered by the userland `<Bibliography>` helper
that the template includes after the body slot (titled "References"
in this template). Author-side, supply entries via a `<refs>` block.

## Limitations

- **No cover page.** Title and author render at the top of page 1
  above the body, not on a dedicated cover. Authors who need a cover
  page can add a separate first section with the cover content and a
  `page-break` after it, or extend the template to register a
  cover-page regime.
- **No table of contents.** A TOC is not part of the default chrome.
  Authors who need one can add `<toc />` (deprecated, but functional)
  or compose a TOC from `<toc-data>` per the styling spec.
