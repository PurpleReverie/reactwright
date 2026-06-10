---
"reactwright": minor
"@reactwright/markdown": minor
---

Engine: add `<meta name="X">` content primitive and open slot names.

- `<meta name="X">value</meta>` (or `<meta name="X" value="..." />`)
  populates `slots[X]` with the resolved inline children. Templates
  consume named slots via `<slot name="X" />`. The engine carries no
  opinion about slot semantics — author, doi, keywords, affiliation
  are all opaque labels.
- `validateSlotName` and `:slot(name)` accept any non-empty identifier.
  The canonical names (title, author, abstract, body) still exist and
  are populated from `DocumentNode` scalars + body stream as before;
  meta entries with those names append to the same bucket.
- Resolved meta nodes render as `<div data-meta="X">…</div>`. Style
  via `<rule match={{ kind: "meta" }}>` (all) or
  `<rule match={{ kind: "meta", attr: { name: "doi" } }}>` (one).
- Unknown slot lookups expand to empty instead of throwing.

Engine: HTML backend ships overflow-wrap defaults on `code` and `pre`
so long unbreakable strings (URLs, identifiers) wrap inside their
column rather than overflowing the page. Layout safety, not styling —
templates can still restyle code cosmetics.

Engine: styles dialect promotes `flow-span: container | none` as a
backend-agnostic concept. The HTML backend lowers it to
`column-span: all | none`. Authors get a portable name; the dialect
stays decoupled from CSS Paged Media specifics.

Markdown: image-only paragraphs (`![alt](src)` alone in a paragraph)
are lifted to `<figure>` with the alt text as caption. Mixed
inline-with-prose images stay as inline `<img>`. Eliminates the need
for post-render HTML surgery to wrap markdown images in figures.

Engine: chrome `when` policy on `<header>` and `<footer>` accepts
four new values: `left`, `right`, `blank`, `not-blank`. Maps to CSS
Paged Media `@page :left`, `:right`, `:blank` selectors. Scope is
whatever the chrome lives in — inside a `<page-set>`, `first-page`
already means first-of-regime (no separate keyword needed).

Engine: new `<page-variant name="V">` template primitive, declared
inside `<page-set name="P">`. Registers a derived regime `P__V`
that overlays the parent's style and inherits chrome / body flow
per-anchor. Sections opt in via `<section page="P" pageVariant="V">`.
Solves chapter-opener pages, feature spreads, and other one-off
page treatments without needing a fully separate page-set.

  - Variant style: shallow merge over parent style.
  - Variant body flow: variant's own flow if declared, else inherits
    parent's flow (so authors who only want to change geometry don't
    need to repeat their region/columns layout).
  - Variant chrome: variant's own chrome plus parent chrome at any
    anchor (or layer slot) the variant doesn't itself define. Each
    inherited entry gets its own running element so Paged.js can
    reference it per derived `@page` rule.
  - One level deep — variants cannot nest variants.

The styles dialect can already target sections by variant via
`<rule match={{ kind: "section", attr: { pageVariant: "opener" } }}>`
— no new selector key needed.
