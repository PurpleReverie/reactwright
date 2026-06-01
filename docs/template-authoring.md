# Template authoring guide

A Reactwright template is a small React component that describes the
*shape* of a paginated document — page geometry, running chrome,
slot wiring, and typography — leaving the actual prose to whatever
content tree the engine pairs it with at render time.

This guide walks through writing a template from a single-slot
minimum up through chrome, role-scoped typography, and packaging it
on npm. The companion docs are
[`api-reference.md`](./api-reference.md) for prop details,
[`spec.md`](./spec.md) for canonical engine semantics, and
[`styling-guide.md`](./styling-guide.md) for the dialect recipes.

## The `Template` contract

A template is a function component that returns a tree of *template
intrinsics*. The convention is:

```tsx
import "reactwright/jsx";

export function Template() {
  return (
    <page page={{ size: "letter", marginTop: "1in", /* … */ }}>
      {/* … */}
    </page>
  );
}
```

Three contract details:

- The exported name is `Template` (capital `T`). The CLI also accepts
  `template` (lowercase) as a fallback.
- The function takes no props. (Templates do not parameterize over
  the content tree; they shape it.)
- The returned tree's root is a `<page>` or a `<page-set>`. Most
  templates start with a single `<page>` as the root.

Content files re-export the template so the CLI can pair them:

```tsx
// my-essay.tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-essay";

export { Template };

export default function Document() {
  return <document title="…" author="…">{/* … */}</document>;
}
```

The engine renders the content tree to *content IR*, the template
tree to *template IR*, then resolves slot placement and rule
bindings before emitting HTML for Paged.js.

## The minimal viable template

The smallest template is a page with one body slot:

```tsx
import "reactwright/jsx";

export function Template() {
  return (
    <page
      page={{ size: "letter", marginTop: "1in", marginBottom: "1in",
              marginLeft: "1in", marginRight: "1in" }}
      typography={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "12pt",
        lineHeight: 1.5
      }}
    >
      <region>
        <slot name="body" />
      </region>
    </page>
  );
}
```

That alone is enough to render a body-only document — `<document>`
content flows into the slot, paragraphs and sections inherit the
typography, and Paged.js paginates the result.

Two slots get you a title + body:

```tsx
<region style={{ textAlign: "center", marginBottom: "12pt" }}>
  <slot name="title" />
  <slot name="author" />
</region>
<region>
  <slot name="body" />
</region>
```

Four slot names are valid: `"title"`, `"author"`, `"abstract"`, and
`"body"`. `<document title>` populates the title slot;
`<document author>` populates author; `<section role="abstract">`
populates abstract; and everything else flows into body. If no slot
named `"body"` is present, the engine auto-emits one at the end (see
spec §6.6).

## Adding chrome

Running headers and footers attach to the page via `<header>` and
`<footer>` intrinsics. They render inside the page's CSS Paged Media
margin boxes.

```tsx
<page page={{ /* … */ }}>
  <header
    anchor="top-right"
    when="not-first-page"
    typography={{ fontSize: "9pt", fontStyle: "italic" }}
  >
    <running name="document-title" /> · <page-number />
  </header>

  <footer anchor="bottom-center" typography={{ fontSize: "9pt" }}>
    <page-number /> / <page-count />
  </footer>

  <region><slot name="body" /></region>
</page>
```

Available anchors include `top-left`, `top-center`, `top-right`,
`bottom-left`, `bottom-center`, `bottom-right`, plus the two-sided
forms `top-inside`, `top-outside`, `bottom-inside`, `bottom-outside`
(used when the page geometry sets `twoSided: true`). The full anchor
list is in [`spec.md` §6](./spec.md).

The `when` prop controls visibility: `"first-page"` shows only on
page 1, `"not-first-page"` skips page 1, omitted shows everywhere.

### Running strings

`<running name="…">` reads a value the document set with
`<set running="…" value="…" />` somewhere in the content tree. The
running value sticks until the next `<set>`.

A common pattern is a per-chapter running header:

```tsx
// Content:
<section role="chapter" title="The First Day">
  <set running="chapter-title" value="The First Day" />
  …
</section>

// Template:
<header anchor="top-outside" when="not-first-page">
  <running name="chapter-title" />
</header>
```

Built-in running strings include `document-title` (auto-set from
`<document title>`) and `author-lastname` (set by the author in the
content tree; the engine does not parse names).

## Section roles and scoped styling

The `role` prop on `<section>` is the primary way content tells the
template "this section deserves special typography." A template
declares the styling for each role by binding rules against
`within: { kind: "section", role: "<name>" }`.

A book template, for instance, recognises four roles:

```tsx
<rule
  match={{ kind: "section-heading", within: { kind: "section", role: "chapter" } }}
  className="chapter-heading"
/>
<rule
  match={{ kind: "paragraph", within: { kind: "section", role: "chapter" } }}
  className="chapter-body-p"
/>
<rule
  match={{ kind: "section", role: "title-page" }}
  className="title-page"
/>
```

Content opts in by tagging sections:

```tsx
<section role="title-page" title="My Novel">
  <p>A. Author</p>
</section>

<section role="chapter" title="The First Day">
  <p>…</p>
</section>
```

A role is just a string. The template defines what it means.

### Page routing

If a section needs an entirely different page geometry (a
plate-illustration page in the middle of a novel, say), declare a
named `<page-set>` and route the section to it with the `page` prop:

```tsx
// Template:
<page-set name="plate" style={{ /* full-bleed geometry */ }}>
  <region><slot name="body" /></region>
</page-set>

// Content:
<section page="plate" title="">
  <img src="./plate.jpg" />
</section>
```

The section's content flows into that page-set's body slot. See
[`spec.md`](./spec.md) for the full regime model.

## Styling with `<styles>` + `<rule>`

The modern path. Templates declare named classes in a `<styles>`
block (CSS superset) and bind them to IR shapes via `<rule>`
elements.

```tsx
import "reactwright/jsx";

const STYLES = `
  .body-p { margin: 0; text-indent: 1.5em; }
  .heading-adjacent-p { text-indent: 0; }
  .section-head { font-size: 13pt; font-weight: bold; margin: 14pt 0 4pt; }
`;

export function Template() {
  return (
    <page page={{ /* … */ }} typography={{ /* … */ }}>
      <styles>{STYLES}</styles>

      <rule match={{ kind: "section-heading", depth: 1 }}
            className="section-head" />
      <rule match={{ kind: "paragraph" }} className="body-p" />
      <rule match={{ kind: "paragraph", follows: { kind: "section-heading" } }}
            className="heading-adjacent-p" />

      <region><slot name="body" /></region>
    </page>
  );
}
```

The `match` value is a typed predicate against the resolved IR — see
the [styling guide](./styling-guide.md) for combinators (`within`,
`follows`, `not`, `or`, `has`) and the
[styling spec](./styling-spec.md) for the full grammar. The §10
binding decisions in the styling spec are load-bearing; read them
once before designing your own template's style architecture.

## A complete worked example

Here is a full template that demonstrates the patterns above —
two-sided book pages, running per-chapter chrome, role-scoped
typography, and dialect styling:

```tsx
import "reactwright/jsx";

const STYLES = `
  .title-page {
    text-align: center;
    margin-top: 30%;
  }
  .title-page-h {
    font-size: 22pt;
    font-weight: bold;
    margin-bottom: 18pt;
  }

  .chapter-heading {
    font-size: 18pt;
    text-align: center;
    margin: 0 0 24pt 0;
  }
  .chapter-body-p {
    margin: 0;
    text-indent: 1.5em;
    text-align: justify;
  }
  .chapter-body-p-first {
    text-indent: 0;
  }
`;

export function Template() {
  return (
    <page
      page={{
        size: "5.5in 8.5in",
        marginTop: "0.75in", marginBottom: "0.75in",
        marginLeft: "0.75in", marginRight: "0.75in",
        twoSided: true
      }}
      typography={{
        fontFamily: "Georgia, serif",
        fontSize: "10.5pt",
        lineHeight: 1.35
      }}
    >
      <styles>{STYLES}</styles>

      {/* Title page (suppressed numbering + chrome) */}
      <rule match={{ kind: "section", role: "title-page" }}
            className="title-page" />
      <rule match={{ kind: "section-heading",
                     within: { kind: "section", role: "title-page" } }}
            className="title-page-h" />

      {/* Chapters */}
      <rule match={{ kind: "section-heading",
                     within: { kind: "section", role: "chapter" } }}
            className="chapter-heading" />
      <rule match={{ kind: "paragraph",
                     within: { kind: "section", role: "chapter" } }}
            className="chapter-body-p" />
      <rule match={{ kind: "paragraph",
                     follows: { kind: "section-heading" },
                     within: { kind: "section", role: "chapter" } }}
            className="chapter-body-p-first" />

      {/* Two-sided chrome: chapter title inside (gutter), book title outside */}
      <header anchor="top-inside" when="not-first-page"
              typography={{ fontStyle: "italic", fontSize: "9pt" }}>
        <running name="chapter-title" />
      </header>
      <header anchor="top-outside" when="not-first-page"
              typography={{ fontStyle: "italic", fontSize: "9pt" }}>
        <running name="document-title" />
      </header>
      <footer anchor="bottom-outside" typography={{ fontSize: "9pt" }}>
        <page-number />
      </footer>

      <region><slot name="body" /></region>
    </page>
  );
}
```

A content file consumes it by tagging sections with `role` and
emitting per-chapter `<set running="chapter-title" />`:

```tsx
<document title="My Novel" author="A. Author">
  <section role="title-page" title="My Novel">
    <p>A. Author</p>
  </section>

  <section role="chapter" title="The First Day">
    <set running="chapter-title" value="The First Day" />
    <p>It was a bright cold day in April…</p>
  </section>
</document>
```

## Packaging conventions

To publish a template on npm, follow the structure of
`packages/template-book` (or `template-letter`):

```
my-template/
├── package.json
├── README.md
├── tsconfig.json
└── src/
    └── template.tsx     export function Template + export const MY_STYLES
```

A minimal `package.json`:

```json
{
  "name": "@you/template-resume",
  "version": "0.1.0",
  "license": "MIT",
  "type": "module",
  "main": "./src/template.tsx",
  "exports": {
    ".": "./src/template.tsx"
  },
  "files": ["src", "LICENSE", "README.md"],
  "peerDependencies": {
    "reactwright": "^0.2.0",
    "react": "^19.0.0"
  }
}
```

The `main` and `exports` point straight at the TSX source —
Reactwright templates are not pre-compiled; the engine consumes them
through `tsx` (or your toolchain's TS loader). `peerDependencies`
keeps `reactwright` and `react` out of the bundle.

The README should follow the pattern of the official templates:

1. One-paragraph intro stating dimensions, body face, and what's
   special about the template.
2. "When to use this over alternatives" — a short bulleted
   comparison.
3. "Format conventions" — the typographic decisions, bulleted.
4. "Usage" — a complete runnable TSX snippet.
5. Optional "Implementation notes" and "Limitations" — honest
   admissions of gaps and design choices.

See [`packages/template-book/README.md`](../packages/template-book/README.md)
for a canonical example.

## Where to learn more

- [`api-reference.md`](./api-reference.md) — every intrinsic and its
  props in one place.
- [`styling-guide.md`](./styling-guide.md) — worked recipes for the
  `<styles>` + `<rule>` dialect.
- [`spec.md`](./spec.md) — canonical semantics: regimes, anchors,
  layers, the rule pipeline, the resolver.
- [`styling-spec.md`](./styling-spec.md) — the dialect's full
  selector and declaration grammar, plus the §10 binding decisions.
