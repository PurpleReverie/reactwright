# reactwright

## 0.2.0

### Minor Changes

- 55f9f72: Engine: add `<meta name="X">` content primitive and open slot names.

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

- c38a0c2: Bug-batch from `wit_writer_test` integration testing.

  Engine (`reactwright`):

  - `<list type="ol"|"ul">` now renders correctly in the HTML backend
    (previously every `<list>` rendered as `<ul>`). The `ordered`
    boolean prop still works; `type` is a sugar.
  - `<row header>` propagates a `header` flag to every child `<cell>`,
    which the HTML backend renders as `<th>`. Closes the parity gap
    with `@reactwright/markdown` table headers.
  - `<heading>` accepts inline-marked children additively:
    `<heading level={2}><em>Italic</em> heading</heading>` now works
    alongside the existing `title="…"` string form. `title` is now
    optional; the resolver derives a plain-text projection from
    children when only marks are supplied.
  - Reference-data intrinsics (`<bib-data>`, `<toc-data>`,
    `<list-of-data>`, `<index-data>`) accept a `render={fn}` prop
    for the entry callback. Eliminates the React "Functions are not
    valid as a React child" warning that fired on every build. The
    children-as-function form still works for back-compat; userland
    helpers (`Bibliography`, `Toc`, `ListOf`, `Index`) switched to
    the prop form.
  - Userland `Bibliography` / `Toc` / `ListOf` / `Index` now return
    `null` when their entry list is empty, instead of producing an
    orphan section header on a trailing blank page.
  - Factory errors (e.g. `<heading>` with no `title` or children)
    surface to the user as `[reactwright] <intrinsic>: <message>`
    with the original error in `.cause`, instead of the opaque
    `"Content renderer produced no root node."`.
  - Grammar violations (e.g. `<list>` with a non-`<item>` child,
    `<item>` with raw inline text) surface as
    `[reactwright] <parent> > <child>: <rule message>`, using the
    per-rule message strings already declared in `content/grammar.ts`.

  Template (`@reactwright/template-essay`):

  - Blockquote (`<quote>`) now has MLA-appropriate offset (left
    margin, single-line spacing, breathing room above and below)
    instead of being visually indistinguishable from body text.

  Template (`@reactwright/template-ieee-report`):

  - Tables now have visible header-row chrome (thin top/bottom rules)
    and a bottom rule on the last row, ported from the `template-ieee`
    conference template.
