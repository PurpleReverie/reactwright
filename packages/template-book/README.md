# @reactwright/template-book

Long-form book template for the Reactwright document engine.
Trade-paperback dimensions (5.5" × 8.5"), chapter-based flow with
per-chapter running headers, a serif body face suitable for sustained
reading, and conventional front-matter / back-matter section roles.

## When to use this over alternatives

- Pick `@reactwright/template-book` for novels, memoirs, short
  story collections, or any long-form chaptered prose destined for
  printed-book dimensions.
- Pick `@reactwright/template-essay` for a single MLA-style essay.
- Pick `@reactwright/template-report` for technical reports.

## Format conventions

- Page: 5.5" × 8.5", trade paperback. `twoSided: true` so running
  chrome mirrors on facing pages.
- Margins: 0.75" all sides (uniform — see "Limitations" below for
  asymmetric-binding margins).
- Body: Georgia 10.5pt, line-height 1.35.
- Title page (`role="title-page"`): title 22pt bold centered,
  author/subtitle 12pt centered.
- Front-matter sections (`role="front-matter"`): centered heading in
  small caps with extra letter-spacing, centered paragraphs. Use for
  copyright, dedication, epigraph.
- Chapter sections (`role="chapter"`): page break before each
  chapter, large centered "Chapter N — Title" heading positioned a
  third of the way down the page, justified body paragraphs with
  1.5em first-line indent (0 indent on the paragraph that follows a
  heading).
- Section heads inside a chapter: 11pt bold italic, no numbering.
- Block quotes: 18pt left/right indent, no italic, no first-line
  indent.
- Back-matter sections (`role="back-matter"`): page break before,
  centered heading without numbering. Use for afterword,
  acknowledgments.
- Running headers (page 2+): chapter title on the inside (gutter)
  edge, book title on the outside (fore) edge — both italic 9pt.
- Footer: page number on the outside corner, 9pt.

## Usage

```tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-book";

export { Template };

export default function MyBook() {
  return (
    <document title="My Novel" author="A. Author">
      <section role="title-page" title="My Novel">
        <p>A. Author</p>
      </section>

      <section role="front-matter" title="Copyright">
        <p>© 2026 A. Author</p>
      </section>

      <section role="chapter" title="The First Day">
        <p>It was a bright cold day in April, and the clocks were striking thirteen.</p>
        <p>The body continues here…</p>
      </section>

      <section role="back-matter" title="Acknowledgments">
        <p>For those who made this possible.</p>
      </section>
    </document>
  );
}
```

## Limitations

- **Asymmetric binding margins** (wider inside margin for gutter
  bind, narrower outside margin) are not currently expressed: the
  engine does not yet expose `marginInside` / `marginOutside` on
  `@page`. The template uses uniform 0.75" margins as a compromise.
  Deferred to future engine work.
- **Roman-numeral front-matter pagination** (lowercase roman for
  front matter, arabic restarting at 1 for body) is not implemented.
  The engine's `<page-number />` always emits `counter(page)` as an
  integer. Deferred to future engine work; the workaround is to
  treat the front matter as unnumbered or accept arabic numbering.
- **Drop caps** on the first paragraph of each chapter are not
  expressed in the default rules — the styling dialect does not yet
  promote `initial-letter` / `::first-letter` first-letter sizing as
  a typed declaration. Authors can opt in by adding a role-rule with
  `dropCap` (see story-bible mockup) or by writing a small per-book
  rule against pass-through CSS via the standard role mechanism.

## Implementation notes

Styling is expressed entirely via the styling dialect (`<styles>` +
`<rule>`). The exported `BOOK_CSS` is an empty string. Section roles
(`title-page`, `front-matter`, `chapter`, `back-matter`) are
plain author-side roles — the template's rules use the `within:
{ kind: "section", role: "<name>" }` selector to scope chapter
typography. Adding a new section role to the book template is a
matter of adding a few `<rule>` bindings against the same shape.
