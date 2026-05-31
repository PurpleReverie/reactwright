# Synthesized IR — Slice 5 Plan

Companion to `docs/styling-spec.md` and the slice 1 / slice 2 plans.
Closes the last gap in the styling-dialect contract: making every
rendered HTML element traceable to exactly one resolved-IR node, so
authors can address everything via `<rule match={...}>` without ever
reaching for `customCss`.

## 1. Problem

Today the dialect contract is "rules match IR nodes." It holds for
authored shapes (`paragraph`, `figure`, `section`, `ref-entry`, …),
but leaks for renderer-internal scaffold elements — the `<img>` inside
a figure, the `<h2>` and `<ol>` inside a bibliography, the section
title `<h2>`/`<h3>`. Those elements appear in the rendered HTML but
do not exist as IR nodes. A rule has nothing to bind to. Templates
fall back to `customCss` raw-CSS, which couples them to engine class
names and target-CSS quirks.

The slice-2.3 audit identified the residual `IEEE_CSS` lines that
remain blocked on this gap:

- `figure img { … }` — img has no IR identity
- `.reactwright-bibliography h2 { … }` — bibliography heading has no IR identity
- `.reactwright-bibliography ol { … }` — bibliography list has no IR identity
- `.reactwright-bibliography li { text-indent / padding-left }` — list-item is targetable (via the sourceNode plumbing) but `hanging-indent` is a slice-3 promoted concept
- `h2 + p, h3 + p, h4 + p { … }` — section heading has no IR identity, so "paragraph following heading" can't be expressed
- `table th, td, tr:last-child td, table p { … }` — partial: `cell` is an IR node, but `th`/`td`/`thead`/`tbody`/`tr:last-child` need position pseudos and pass-through allowlist additions

Three of those (heading-adjacent paragraph, table descendants, cell
positions) need orthogonal selector-vocabulary work; the rest need
synthesized IR.

## 2. Approach

Add a resolver phase that materializes renderer-internal elements as
first-class resolved-IR nodes. Authors target them with the same
`match={{kind:"…"}}` syntax used for authored nodes. Renderers stop
synthesizing HTML scaffold and instead walk their now-explicit
children.

Conceptually: **compound nodes become composite IR sub-trees, not
opaque atoms with a complicated emit function.**

### 2.1 New IR kinds introduced (slice 5 total)

| Kind | Synthesized from | Replaces in renderer |
|---|---|---|
| `section-heading` | `ResolvedSectionNode.title` | inline `<h2>…</h2>` emit in `renderSectionNode` |
| `figure-image` | `ResolvedFigureNode.src` | inline `<img>` emit in `renderFigureNode` |
| `bibliography-heading` | `ResolvedBibliographyNode.title` | inline `<h2>` emit in `renderBibliographyNode` |
| `bibliography-list` | implicit `<ol>` wrapper in `renderBibliographyNode` | inline `<ol>…</ol>` emit |
| `bibliography-list-item` | `ResolvedBibliographyEntry` × N | inline `<li>` emit; subsumes the sourceNode plumbing |

Each new kind is a normal `Resolved*Node` type with `className?: string`
and any kind-specific data. They participate in `applyRulesToTree`
exactly like authored kinds: a rule like `<rule match={{kind:"figure-image"}}>`
will land its className on the synthesized node, which `classAttr(node)`
then splices into the emitted `<img>` tag.

### 2.2 Synthesis location

Two options:

- **2.2.a — Eager expansion in the per-kind resolver.**
  `resolveSection` returns a `ResolvedSectionNode` whose first child
  is a `ResolvedSectionHeadingNode`. `resolveFigure` adds a
  `ResolvedFigureImageNode` to its children when `src` is set.
  `resolveBibliography` builds the three-level sub-tree.

- **2.2.b — Separate post-resolve expansion pass.**
  A new `expandSyntheticChildren(resolvedRoot)` step runs after
  `resolveDocument` and before `applyRulesToTree`. It walks the
  resolved tree and rewrites compound nodes in place.

**Recommendation: 2.2.a.** The per-kind resolver already builds the
node — adding one extra child is a local edit. A separate pass
duplicates the kind-dispatch logic and adds a phase to maintain.
The downside (kind resolvers now produce sub-trees instead of leaves)
is real but small: each affected resolver gains ~5 lines.

### 2.3 Walker / renderer changes

- `applyRulesToTree` (`src/styles/apply.ts`) already walks any
  `children`-bearing node. Adding new kinds to the union doesn't
  require walker changes, provided the new kinds expose `children`
  (or are leaf nodes).
- Renderers move their scaffold-emit lines into new per-kind
  renderer functions and replace the inline strings with a
  `renderResolvedChild(node.children[i])` call.

### 2.4 What does NOT change

- The dialect language. `<styles>` + `<rule>` syntax is unchanged;
  only the set of matchable kinds grows.
- The resolved-IR root shape (`ResolvedPageNode`) is unchanged.
- Authoring JSX (`<bibliography>`, `<figure>`, `<section>`) is
  unchanged — synthesized children are internal.
- The `sourceNode` plumbing added in slice 2.3 becomes redundant
  once `bibliography-list-item` exists (the list-item IS the rule
  binding target). Slice 5.3 removes the field.

## 3. Slice breakdown

Each sub-slice is one commit (or one tight commit train). All must
preserve `npm test`, `npm run check`, `npm run mockup:all` byte-diff,
and `npm run mockup:ieee-strict` PDF health.

### 3.1 Section heading exposure

- Add `ResolvedSectionHeadingNode` to `src/resolver/ir.ts`:
  ```ts
  export type ResolvedSectionHeadingNode = {
    kind: "section-heading";
    text: string;
    depth: number;        // 1 = h2, 2 = h3, …
    className?: string;
  };
  ```
- `resolveSection` prepends one to its `children` when `title` is set.
  Leaves `ResolvedSectionNode.title` populated for back-compat (renderer
  prefers child if present).
- `renderSectionNode` checks for a `section-heading` child; if present,
  emits via `renderSectionHeadingNode` instead of the inline `<h2>`.
  The slice-2.3 heading-lift (`classAttrWithBase(node,
  "reactwright-section-title", …)`) MOVES to `renderSectionHeadingNode`.
- IEEE template: replace
  `<rule match={{ kind: "section", depth: 1 }} className="ieee-section-head" />`
  with
  `<rule match={{ kind: "section-heading", depth: 1 }} className="ieee-section-head" />`.
  Same for subsection.
- Add a `<rule match={{ kind: "paragraph", follows: { kind: "section-heading" } }} className="ieee-heading-adjacent-p" />`
  and migrate `h2 + p, h3 + p, h4 + p { text-indent: 0 }` to
  `.ieee-heading-adjacent-p { text-indent: 0 }`.
- Update `CLAUDE.md` gotcha: "rule matching `kind:"section"` styles the
  whole section *block*; rule matching `kind:"section-heading"` styles
  the heading element." This *reverses* the 2.3 heading-lift behavior —
  the lift becomes scoped to the new node instead of being a
  renderer-side surprise.

### 3.2 Figure image exposure

- Add `ResolvedFigureImageNode` to `src/resolver/ir.ts`:
  ```ts
  export type ResolvedFigureImageNode = {
    kind: "figure-image";
    src: string;
    alt?: string;
    width?: string;
    height?: string;
    className?: string;
  };
  ```
- `resolveFigure` adds one to its `children` when `src` is set.
- `renderFigureNode` walks `children`; the `<img>` is rendered via
  `renderFigureImageNode` which reads `classAttr(node)`.
- IEEE template: add `<rule match={{ kind: "figure-image" }} className="ieee-figure-img" />`
  and migrate `figure img { max-width:100%; height:auto; display:block; margin:0 auto 4pt auto }`
  to `.ieee-figure-img { … }`.

### 3.3 Bibliography internals exposure

- Add three kinds to `src/resolver/ir.ts`:
  ```ts
  export type ResolvedBibliographyHeadingNode = {
    kind: "bibliography-heading";
    text: string;
    className?: string;
  };
  export type ResolvedBibliographyListNode = {
    kind: "bibliography-list";
    children: ReadonlyArray<ResolvedBibliographyListItemNode>;
    className?: string;
  };
  export type ResolvedBibliographyListItemNode = {
    kind: "bibliography-list-item";
    refKey: string;
    used: boolean;
    inline?: ReadonlyArray<ResolvedInlineNode>;
    text?: string;
    className?: string;
  };
  ```
- `resolveBibliography` builds the three-level sub-tree from
  `ctx.refEntries`. Removes the flat `entries` field (or keeps it as
  internal until the renderer migrates) — let the resolver feed the
  renderer the tree, not the flat list.
- `renderBibliographyNode` becomes a thin dispatcher over `children`.
  Three new per-kind renderers replace the inline emit string.
- IEEE template: add three rules:
  ```tsx
  <rule match={{ kind: "bibliography-heading" }} className="ieee-bib-heading" />
  <rule match={{ kind: "bibliography-list" }} className="ieee-bib-list" />
  <rule match={{ kind: "bibliography-list-item" }} className="ieee-bib-entry" />
  ```
  Migrate the three bib customCss blocks. Existing `kind:"ref-entry"`
  rule from slice 2.3e becomes the `bibliography-list-item` rule;
  remove `sourceNode` field from `ResolvedBibliographyEntry` (now
  unused).

### 3.4 Property-allowlist + selector-vocab gap fixes

Orthogonal to synthesized IR but completes the IEEE_CSS purge:

- Extend `cssPropertyMap` in `src/backends/html/css.ts` to accept
  `table-layout`, `word-wrap`, `overflow-wrap`. (Spec §10 decision
  was "known allowlist"; add to allowlist.)
- Add `:last-of-kind` selector pseudo to `src/styles/parser.ts` and
  `src/styles/selector.ts` (parallel to existing `:first`/`:last`).
  Allows `<rule match={{ kind: "row", index: "last-of-kind" }}>` for
  the last row's bottom border.
- Migrate the remaining table customCss to dialect rules using
  `kind:"cell" within:{kind:"table"}` + position pseudos.

### 3.5 Final purge + customCss deprecation prep

- IEEE_CSS should now contain only `hanging-indent` (slice-3
  property) — single line.
- Update `docs/styling-spec.md` §10 if any decision needs an
  amendment (none expected).
- Update `CLAUDE.md` flight table: slice 5 complete.
- Audit non-IEEE mockups to confirm none rely on the previously
  inline-emitted scaffold structure.

## 4. Non-goals

- Index-of internals (similar pattern: `<ul>` and `<li>` inside
  `<index>`). Defer to slice 5.6 if needed. Apply same recipe.
- TOC / list-of internals. Same deferral.
- Table `<thead>` / `<tbody>` wrapper synthesis. Skipped unless a
  mockup actually needs to target them; can fold into 5.4 if pressure
  emerges.
- The slice-3 promoted concepts (`hanging-indent`, `text-flow`,
  `indent`, `column-fit`, `caption-position`). Slice 3 work, not 5.
- Removal of `customCss` itself. Slice 4.

## 5. Risks

- **Renderer output divergence.** Refactoring the three big compound
  renderers (section, figure, bibliography) to walk children risks
  subtle byte-level output changes (attribute ordering, whitespace,
  data-attrs). Mitigate: snapshot the pre-refactor HTML for each
  mockup, byte-diff after each sub-slice. Any drift must be explained
  (intentional behavior change) or fixed (accidental regression).
- **Walker/apply behavior on new kinds.** `applyRulesToTree` tracks
  per-kind sibling indices for `:first`/`:last`/`:nth`. Adding
  `section-heading` as the first child of every section changes the
  index baseline for paragraphs ("first paragraph in a section" was
  index 0; now it's still index 0 because indices are per-kind, but
  this needs explicit verification with a test).
- **JSX prop-route back-compat.** `<figure src="…">` still wants
  `src` as a prop, not as a child. The synthesis is internal to
  resolution — authoring shape unchanged. Verify by leaving the
  IEEE mockup JSX untouched while migrating customCss.

## 6. Acceptance criteria

After slice 5.1–5.4:

- `mockups/ieee/template.tsx` `IEEE_CSS` is a single line containing
  only the slice-3-pending `hanging-indent`-shaped CSS.
- All tests pass; `npm run check` clean.
- Every mockup's HTML byte-identical or with explained diff.
- Every mockup's PDF healthy.
- New tests in `tests/styles-integration.test.tsx` for each new
  kind: a `<rule match={{kind:"section-heading"}}>` produces the
  class on the rendered `<h2>`; same for `figure-image`,
  `bibliography-heading`, `bibliography-list`, `bibliography-list-item`.
- A test asserting `<rule match={{kind:"paragraph", follows:{kind:"section-heading"}}}>`
  binds to the first paragraph after a section title.

## 7. After slice 5

- Slice 3 — promoted concepts (`indent`, `text-flow`, `column-fit`,
  `hanging-indent`, `caption-position`). Without these, IEEE_CSS
  still has one line. With them, it has zero.
- Slice 4 — `customCss` deprecation warning + engine class internal-
  prefix. Now meaningful: nothing should be reaching for `customCss`
  on any mockup.
- Slice 5.6+ — apply the same pattern to TOC, list-of, index if a
  template needs it.

## 8. Dispatch brief template for sub-agents

Each sub-slice can be dispatched independently. Brief includes:

1. Read `CLAUDE.md` "className propagation checklist" + this doc § the
   specific sub-slice.
2. Add the new resolved IR type to `src/resolver/ir.ts`.
3. Modify the source-side resolver (`src/resolver/{block,resolve}.ts`)
   to synthesize the new child(ren).
4. Add the per-kind renderer to `src/backends/html/{content,template}.ts`.
5. Update the parent compound renderer to dispatch via `children`
   instead of inline emit.
6. Migrate the corresponding `IEEE_CSS` block in
   `mockups/ieee/template.tsx` to `IEEE_STYLES` + a new `<rule>` in
   the template's `<styles>` block.
7. Add an integration test in `tests/styles-integration.test.tsx`.
8. Run `npm test && npm run check && npm run mockup:ieee-strict`.
9. Byte-diff `build/mockups/ieee-strict.html` against pre-change snapshot;
   the new class should be the only diff (plus removed customCss bytes).
10. Commit with message `Slice 5.X: …`.
