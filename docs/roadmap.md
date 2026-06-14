# Roadmap

Forward-looking work tracked here so it survives context resets.
Decisions referenced as `Dn` live in `docs/decisions.md`. When a
roadmap item ships, move its plan (if substantial) to `docs/history/`
and delete the entry here.

## Track A — HTML-derived primitive expansion

Motivation: reactwright's inline and block vocabulary is a subset of
what richer markup languages (Pandoc-AST, MDX, Wit, AsciiDoc) emit.
The three-filter coverage policy is in **D13**. Order below is by
authoring-impact ROI, not implementation difficulty.

Each item is the standard 5-touchpoint pattern from CLAUDE.md
(IR type → resolved IR → factory → resolver → renderer) plus grammar,
dialect selector, tests, and a guide-page entry.

### Phase 1 — Block-level structural (highest ROI)

- [ ] **`<aside>`** — callout / pull-quote / infobox / warning.
  Block children. Fields: `id?`, `role?`, `variant?`, `page?`,
  `className?`. The `role` field is the variant axis (`warning`,
  `pullquote`, `info`) — templates style variants via the styles
  dialect; engine bakes in none.
- [ ] **`<thematic-break>`** — semantic divider, distinct from
  `<page-break>` (which is a layout signal). Default render: centered
  `* * *` via `::before`. Templates can override via dialect.
- [ ] **`<section-header>` / `<section-footer>`** — semantic header
  and footer of a `<section>`, distinct from template page chrome.
  Carries chapter epigraphs, "last updated" annotations, end-of-
  section dingbats.

### Phase 2 — Inline semantic distinctions

- [ ] **`<dfn>`** — defining instance of a term. Auto-collects to
  glossary/index. Fields: `term?` (defaults to text content), `id?`
  (auto-generated from term).
- [ ] **`<abbr>`** — abbreviation with `expansion`. Resolver tracks
  first occurrence (per-document or per-section, template-configurable).
  New dialect selector predicate: `isFirstMention: true`.
- [ ] **`<work-title>`** — title of a work in prose (HTML-`<cite>`
  semantics). Distinct kind from `CiteNode` (which is a reference).
  Default render: italic.

### Phase 3 — Table refinements

- [ ] **`<colgroup>` / `<col>`** — column-level metadata on
  `<table>`. Optional `colgroups: ColGroupNode[]` field on `TableNode`.
  Grammar requires colgroup before rows. Closes the 731_report
  workaround documented in `scratch/731-rewrite/notes.md` (workaround #5).
- [ ] **`<thead>` / `<tbody>` / `<tfoot>` row groups** — `head?` and
  `foot?` fields on `TableNode`; renderer emits `<thead>` / `<tfoot>`
  with `display: table-header-group` so headers repeat on page break.

### Phase 4 — Neutral inline container

- [ ] **`<inline>` and `<block>` primitives** — chosen over `<span>`/
  `<div>` because the names announce intent (neutral container for
  class/role attachment). Accept `role?`, `className?`, children.
  Required for AST-bridge work where source kinds don't map to a
  semantic engine primitive. See **D13** for the spec call.

### Phase 5 — Second-wave inline (batched)

Ship as one changeset; each is the same minimal shape as
`<work-title>`.

- [ ] `<mark>` (highlight)
- [ ] `<del>` / `<ins>` (tracked edits)
- [ ] `<kbd>` / `<samp>` / `<var>` (technical writing)
- [ ] `<time datetime>` (machine-readable date)
- [ ] `<small>` (fine print)
- [ ] `<q>` (inline quotation; auto quote marks per `language`)

### Phase 6 — Deferred

- [ ] `<ruby>` / `<rt>` — only when CJK content appears in scope.
- [ ] Multi-panel `<figure>` (sub-figures a/b/c) — wait for real example.
- [ ] `<details>` / `<summary>` — needs print-semantics design call.

## Track B — Doc-friction follow-ups (from `scratch/731-rewrite/notes.md`)

Surfaced by composing a real-shape paper. Ranked by impact, not
sequenced into a phase yet.

- [ ] **Pandoc multi-cite `[@a; @b]` in `@reactwright/markdown`** —
  split the bracket capture on `;` in `expandTextExtensions`, emit one
  `<cite>` per key. Pure markdown-package change.
- [ ] **Dialect error-message improvements** — duplicate-class error
  should suggest merging; unsupported-pseudo error should name the
  available alternatives (e.g. `:first-of-type` → "use `:first`").
- [ ] **Bibliography helper layer documentation** — `<Bibliography>`
  composes a *template* data-source (`<bib-data>`), not a content
  primitive. One JSDoc line on the userland export.
- [ ] **Accept `:first-of-type` / `:first-child` as `:first` synonyms**
  — small parser change reducing the CSS-familiarity tax.
- [ ] **Per-pseudo styling for `prefix:` / `suffix:`** — design call.
  Today the inserted content can't be styled differently from the
  parent (the IEEE "**Abstract—** *text*" pattern is the canonical
  case). Options in friction #6 of the scratch notes.
- [ ] **Table colgroup** — covered by Track A Phase 3.

## Track C — Documentation site (dogfood)

**Decision: the documentation IS a reactwright project. See D12.**

Authoring the docs in reactwright forces us to use every primitive
in anger (the strongest possible drift check) and showcases the
engine to readers who arrive at the docs. The site initially targets
PDF (the only render target today); when web-HTML lands as a render
target, the same source compiles to a browsable site without rewrite.

### Site structure (target)

```
packages/docs-site/             new package
  src/
    pages/
      01-getting-started.tsx
      02-mental-model.tsx
      03-content-layer.tsx         every content primitive
      04-template-layer.tsx        every template primitive
      05-styles-dialect.tsx
      06-page-design.tsx
      07-recipes.tsx
      08-from-html-or-css.tsx
      09-from-markdown.tsx
      10-bridging-other-asts.tsx
      11-extending.tsx
      12-troubleshooting.tsx
    template/                      doc-site template
      DocsTemplate.tsx
      ChromeAndNav.tsx
  build/                           PDF + (later) HTML output
```

### What each guide must contain

- `03-content-layer.tsx` and `04-template-layer.tsx` — for EACH
  primitive: one-line intent, JSX signature with every prop type,
  allowed children (from grammar), allowed parents, default rendering
  behavior, selector targets, 2–3 example snippets minimal → realistic,
  common mistakes, cross-refs to composing primitives.
- `05-styles-dialect.tsx` — selector grammar (every `Match` key with
  visual diagrams of `follows`/`within`/`has`), pseudos, combinators,
  declarations (every cssPropertyMap entry + promoted concepts),
  what we deliberately DON'T support (element-name selectors, raw
  `::before`/`::after`, media queries, etc.), error catalog.
- `08-from-html-or-css.tsx` — side-by-side: "HTML you would write"
  → "reactwright you'd write." Same for CSS → dialect. Highlights
  non-obvious deltas.
- `10-bridging-other-asts.tsx` — the Wit-bridge brainstorm
  generalized; how to walk a source AST to JSX; the neutral-container
  decision (D13); fallback strategy for unknown node kinds.
- `12-troubleshooting.tsx` — every error message engine emits, used
  as the section heading (so the message itself is searchable).

### Doc-site-specific engineering

- [ ] **Prop-table generator** — script that walks `content/ir.ts`
  and `template/ir.ts`, extracts type fields, emits a stub per
  primitive. Narrative stays hand-written; prop tables stay in sync
  with IR by regeneration.
- [ ] **Live-example check** — every JSX snippet in the docs is
  compiled in CI. A code block that no longer type-checks fails
  the build.
- [ ] **Render-output diff** — for each example, capture the
  HTML output side-by-side with the source on the page.
- [ ] **Status frontmatter** — every guide page declares
  `status: stable | beta | experimental` and `lastVerifiedAgainst:
  <engine version>`. Stale pages flag visibly.

### Order of work

1. Scaffold `packages/docs-site/` package + template + the
   doc-site's own `DocsTemplate`.
2. Write `02-mental-model.tsx` and `05-styles-dialect.tsx` first
   — highest delta-from-CSS-expectation, where lack of docs hurts
   most.
3. Scaffold prop-table generator. Run it to seed `03` and `04`.
4. Hand-write narrative in `03` and `04`.
5. Write `06`, `07`, `08`, `09` in any order.
6. Write `10`, `11`, `12` as the engine grows / bridge work lands.

### Acceptance

- New contributor reads `01 → 02 → 05` in 30 min and understands
  the model.
- Every primitive shipped in Track A has a section in `03` or `04`
  before its changeset releases.
- `12-troubleshooting.tsx` contains every error string engine emits.

## Track D — Future render targets

Context behind the docs-as-reactwright decision (D12). Not work
items yet — placeholders so the engine's seams accommodate them.

- [ ] **Web HTML render target** — same resolved IR, different
  backend. Unlike `backends/html/` (which emits Paged.js-flavored
  HTML for paginated PDF), this would emit responsive, navigable
  HTML for browser consumption. First consumer: the docs site.
- [ ] **EPUB render target** — same resolved IR, EPUB packaging.
- [ ] **Plain-text / markdown round-trip** — for diff-friendly review.

## Track E — Bridges

- [ ] **`@reactwright/wit`** — Wit AST → JSX bridge. Design notes
  in this conversation (`wit-react/WitContent` shape). Will exercise
  Track A Phase 4 (neutral containers) and dictate primitive priorities
  in Track A Phase 5.
- [ ] **`@reactwright/pandoc`** — Pandoc-AST → JSX bridge. Pandoc
  Inline has 25 variants; we currently cover ~10. The variant gap is
  the prioritization input for Track A Phase 5.

## Carry-overs (engine-only, not bucketed elsewhere)

- [ ] **`customCss` removal** — targeted for v1.0 (per existing
  spec note and D8). Block on consumers reaching zero usage.
