# @reactwright/template-essay

MLA-style academic essay template for the Reactwright document engine.
US Letter, 1" margins, Times New Roman 12pt double-spaced, first-line
indented paragraphs, left-aligned bold section headings, hanging-
indent Works Cited at the back.

## When to use this over alternatives

- Pick `@reactwright/template-essay` for single MLA-style essays,
  undergraduate papers, term papers, or any short academic prose
  destined for double-spaced grading-friendly output.
- Pick `@reactwright/template-report` for technical or business
  reports (single-spaced, decimal section numbering).
- Pick `@reactwright/template-ieee` or
  `@reactwright/template-ieee-report` for IEEE-branded papers.
- Pick `@reactwright/template-book` for long-form chaptered prose
  at trade-paperback dimensions.

## Format conventions

- US Letter paper, 1" margins all sides.
- Body: Times New Roman 12pt, line-height 2.0 (double-spaced).
- Paragraphs: 0.5" first-line indent. The first paragraph after a
  heading is flush left (no indent).
- Title: 14pt bold centered.
- Author: 12pt italic centered below the title.
- Section headings (depth 1): 12pt bold, left-aligned, no numeric
  prefix. Headings are kept with the following paragraph (no orphan
  heads at the bottom of a page).
- Block quotes: 0.5" left + right indent, upright (no italic), no
  first-line indent.
- Inline code: monospace, no background or border.
- Works Cited (`role="bibliography"`): heading centered bold; entries
  with hanging indent (0.5" left margin negated by a -0.5" first-line
  indent) and no numeric prefix.
- Running header on page 2+: author's last name and page number, top
  right.

## Usage

```tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-essay";

export { Template };

export default function MyEssay() {
  return (
    <document title="The Question of Method" author="A. Author">
      <set running="author-lastname" value="Author" />

      <section title="Introduction">
        <p>
          Open with the thesis. Subsequent paragraphs in the same
          section pick up the 0.5" first-line indent automatically.
        </p>
        <p>The second paragraph indents; the first does not.</p>
      </section>

      <section title="A Closer Look">
        <p>
          Cite as you go <cite cite="smith2024" />. Sources resolve
          against the <code>refs</code> block at the back of the
          document.
        </p>

        <quote>
          <p>
            Block quotes are indented on both sides and lose the
            first-line indent. Use them for long extract quotations.
          </p>
        </quote>
      </section>

      <section title="Conclusion">
        <p>Wrap with a concluding paragraph.</p>
      </section>

      <refs>
        <ref-entry refKey="smith2024">
          Smith, A. (2024). <em>A Robust Method</em>. Publisher.
        </ref-entry>
      </refs>
    </document>
  );
}
```

The `<set running="author-lastname" value="Author" />` line is what
populates the top-right page-2+ header. Omit it if you do not need a
running header.

## Implementation notes

Styling is expressed entirely via the styling dialect (`<styles>` +
`<rule>`). The exported `ESSAY_STYLES` is the CSS-dialect source the
template binds. There is no engine-bypass CSS.

Section roles are not required — the template numbers nothing and
expects unrouted top-level `<section>`s for the body. The
`role="bibliography"` section is composed by the userland
`<Bibliography>` helper that the template includes after the body
slot; author-side, you provide entries via `<refs>` and the engine
collects them.

## Limitations

- **MLA header block** (author, instructor, course, date stacked at
  the top of page 1) is not built into the template. Authors who need
  it can add a small lead-in section before the first body section,
  or extend the template by adding a region above the body slot.
- **Single citation style.** Cites render as bare links to the Works
  Cited target by default; MLA parenthetical "(Author 12)" formatting
  is not currently computed by the engine. Authors who need it can
  hand-author the parenthetical in prose and let `<cite>` provide
  only the anchor.
