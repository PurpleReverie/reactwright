# Userland Compounds — Slice 6 Plan

Companion to `docs/spec.md`, `docs/styling-spec.md`, and the
slice 5 synthesized-IR plan. Slice 5 makes renderer-internal scaffold
addressable by `<rule>`. Slice 6 goes one level deeper and asks
whether the engine should be emitting that scaffold at all — or
whether compound semantic shapes ("bibliography", "table of contents",
"index", "list of figures", "abstract") belong in **userland helper
libraries** that compose lower-level primitives.

## Status

| Sub-slice | Subject | Status | Pointer |
|---|---|---|---|
| 6.1 | Engine primitives: `<list ordered>` + `<item>` reach parity (already in IR; add direct template-side equivalents + heading-as-block parity) | not started | §5.1 |
| 6.2 | Data-source primitives: `<bib-data>`, `<toc-data>`, `<list-of-data>`, `<index-data>` (template side, render-prop) | not started | §5.2 |
| 6.3 | Migrate `<bibliography>` → userland `<Bibliography>` in `mockups/ieee/components/` | not started | §5.3 |
| 6.4 | Migrate `<toc>`, `<list-of>`, `<index>` to userland helpers (one slice) | not started | §5.4 |
| 6.5 | `<abstract>`: decide between engine-thin-wrapper vs userland; default = keep, see §6 | not started | §5.5 |
| 6.6 | Deprecation: comment+warning on engine compounds; spec amendment; removal target v1.0 | not started | §5.6 |

Decisions inherited from earlier slices:
- `customCss` removal is a slice-4 concern. Userland-compound migration
  may *make use of* the dialect; it doesn't depend on `customCss` removal.
- `<refs>` + `<ref-entry>` (content side) are NOT compounds — they are
  data carriers that already participate in cross-ref machinery. They
  stay. See §2.1.
- The slice-5 synthesized-IR work (`section-heading`, `figure-image`,
  `bibliography-{heading,list,list-item}`) is **partially obsoleted** by
  slice 6: if `<bibliography>` is userland, the engine has no
  bibliography-internal scaffold to synthesize. Slice 5.3 (bibliography
  internals) can be **skipped** in favour of slice 6.3. Section-heading
  and figure-image stand independently.

## 1. Problem

The styling dialect contract is: `<rule match={...}>` matches IR nodes;
every rendered HTML element corresponds to exactly one IR node (slice-5
insight).

The engine today defines `bibliography` as a single template intrinsic
(`src/template/factories/reference.ts:11`, `src/template/ir.ts:309`,
`src/resolver/resolve.ts:385`, `src/backends/html/template.ts:208`)
whose renderer emits a `<section><h2><ol><li>…</section>` structure
with embedded counter wiring. That structure encodes semantic
decisions: the bibliography IS a section + heading + ordered list,
entries ARE numbered `[1]`, `[2]`, …. Correct for IEEE/ACM/APA-numeric;
wrong for screenplays (a "Cast" list), recipe books ("Sources"), or
author-date styles (unordered, sorted by surname). A non-numeric
template either skips `<bibliography>` and reinvents the cite/bib
coupling, or fights the engine via CSS.

Slice 5 said "make the compound's internal scaffold addressable as IR."
Slice 6 says: the compound shouldn't be in the engine. Engines provide
**primitives + machinery**; userland composes the semantic shape. The
engine retains the cross-reference contract (cite keys, anchor IDs,
counter names) — that's the load-bearing piece.

## 2. Current state — audit

For each compound, the wiring is: **template intrinsic factory** →
**template IR type** → **resolver expansion (reads collected data)** →
**HTML renderer (emits scaffold)**. The aggregation lives in
`src/resolver/collect.ts` and runs in `resolveDocument` at
`src/resolver/resolve.ts:602-613` *before* `resolveTemplateContainer` is
invoked, so the data is already in the `ResolveContext` when the
compound's case fires inside `expandTemplateChild`.

### 2.1 `<bibliography>`

| Concern | Location |
|---|---|
| JSX prop type | `src/public/jsx.d.ts:197` (BibliographyProps) |
| Factory | `src/template/factories/reference.ts:11-36` (`bibliographyNode`) |
| Dispatch entry | `src/template/factories/index.ts:40` |
| Template IR | `src/template/ir.ts:309-314` (`BibliographyNode`) |
| Resolved IR | `src/resolver/ir.ts:376-395` (`ResolvedBibliographyEntry`, `ResolvedBibliographyNode`) |
| Resolver | `src/resolver/resolve.ts:385-428` (`bibliography` case) |
| Renderer | `src/backends/html/template.ts:208-232` (`renderBibliographyNode`) |
| Dispatch entry | `src/backends/html/template.ts:288` |
| Counter wiring CSS | `src/backends/html/render.ts:60-65` (`counter-reset:reactwright-bib`, `counter-increment` on `ol > li`) |

Aggregation:
- Cite keys collected by `collectCiteKeysFromSlotMap`
  (`src/resolver/collect.ts:47`) at `resolve.ts:603`.
- `<refs>`/`<ref-entry>` content-side blocks scanned by
  `collectRefEntriesFromSlotMap` (`collect.ts:213`) at `resolve.ts:613`.
- Merge happens inline in `resolve.ts:385-428`: content-side entries
  first (with `used: ctx.citeKeys.has(key)`), then template-prop
  entries that don't collide, then placeholder entries for cited keys
  with no `<ref-entry>`. Ordering = document order of `<ref-entry>`
  appearances.

Cross-reference contract:
- `<cite cite="foo">` renders to `<a class="reactwright-cite" href="#reactwright-bib-foo">`
  (`src/backends/html/inline.ts` — `renderCiteNode`).
- `<li id="reactwright-bib-foo">` in the bibliography output
  (`template.ts:228`).
- CSS `counter-reset:reactwright-bib` on the `.reactwright-bibliography`
  section and `counter-increment:reactwright-bib` on its `ol > li`
  (`render.ts:64-65`); the cite's `::after` uses
  `target-counter(attr(href url), reactwright-bib)` (`render.ts:60`)
  to render `[1]`.

The cross-ref contract is **ID-only** and **counter-name-only**. As long
as the bibliography target list has `<li id="reactwright-bib-{key}">`
elements counter-incrementing the `reactwright-bib` counter on the
target page, citations resolve correctly. **No structural coupling.**

### 2.2 `<toc>`

Factory `src/template/factories/reference.ts:38` (`tocNode`); dispatch
`factories/index.ts:41`; template IR `src/template/ir.ts:322-328`;
resolved IR `src/resolver/ir.ts:345-352`; resolver case
`src/resolver/resolve.ts:358-371`; renderer
`src/backends/html/template.ts:182-193` (`renderTocNode`); counter CSS
`src/backends/html/render.ts:82-84` (leader-line + `target-counter(attr(href url), page)`).

Aggregation: `assignSectionIdsInSlotMap` (`collect.ts:122`) at
`resolve.ts:607` walks abstract + body, mints `reactwright-sec-{slug}`
IDs on sections, pushes `{ id, title, depth }` into `ctx.tocEntries`.
Resolver case filters by `depth <= child.depth ?? ∞`.

Cross-ref contract: ID + page-counter via `target-counter(attr(href url), page)`.
No structural coupling.

### 2.3 `<list-of>`

Factory `src/template/factories/reference.ts:53` (`listOfNode`); dispatch
`factories/index.ts:42`; template IR `src/template/ir.ts:332-337`;
resolved IR `src/resolver/ir.ts:354-365`; resolver
`src/resolver/resolve.ts:346-357`; renderer
`src/backends/html/template.ts:171-180`; counter CSS shared with TOC.

Aggregation: `assignAutoIdsAndCollectListOfInSlotMap`
(`collect.ts:181`) at `resolve.ts:609` mints `reactwright-fig-N` /
`-tbl-N` / `-eq-N` IDs, pushes into `ctx.listOf.{figure,table,equation}`.
Captions default to `Figure N` / `Table N` / `Equation N`
(`collect.ts:154,163,172`).

Cross-ref contract: same as TOC.

### 2.4 `<index>` (template back-matter)

Name overload: content-side `index` is an inline term marker
(`src/content/ir.ts:95`); template-side `index` is the back-matter
compound. Template IR kind is `"index-template"` (`src/template/ir.ts:316`),
resolved kind also `"index-template"` (`src/resolver/ir.ts:332`). The
JSX tag is plain `index` in both contexts; React routes by which tree
it's in.

Factory `src/template/factories/reference.ts:71`; dispatch
`factories/index.ts:43`; resolver `src/resolver/resolve.ts:372-384`;
renderer `src/backends/html/template.ts:195-206`. No counter CSS — index
uses page-counters on per-anchor `<a>` refs.

Aggregation: `assignIndexAnchorsInSlotMap` (`collect.ts:77`) at
`resolve.ts:605` mints `reactwright-idx-{slug}-{n}` anchor IDs on
`<index term>` markers; groups by term in
`ctx.indexEntries: Map<term, anchorIds[]>`. Resolver sorts by term
locale-aware.

Cross-ref contract: anchor ID + page-counter on each pageref `<a>`.

### 2.5 `<abstract>` — content side, not a true compound

`<abstract>` is content-side (`src/content/factories.ts:66-74`,
`src/content/ir.ts:272-278`, `src/content/grammar.ts:56`); resolves via
`resolveAbstractNode` (`src/resolver/block.ts:268`); renders via
`renderAbstractNode` (`src/backends/html/content.ts:182-192`).

Aggregation: none. `<abstract>` is a slot router — `buildSlotMap`
(`resolve.ts:189-191`) filters children by `kind === "abstract"` into
`slots.abstract`; the template's `<slot name="abstract">` consumes them.
Renderer emits `<section data-slot="abstract" class="reactwright-abstract">` +
children. No heading auto-emit, no counter, no structural decisions
beyond "section with this class." It's a one-element wrapper, not a
compound.

### 2.6 `<figure>`, `<table>`, etc. — NOT compounds

Per the brief: structural shapes (one IR node, one rendered element
family). The fact that `<figure>` renders `<figure><img><figcaption>`
is structural, not semantic aggregation. Slice-5.2 `figure-image` makes
the inner `<img>` addressable; that's orthogonal to slice 6.

## 3. Why userland composition resolves the conflict

A userland `<Bibliography>` body:

```tsx
<section role="bibliography" counter="reactwright-bib">
  <heading level={2} title="References" />
  <list ordered>
    {entries.map((e) => (
      <item key={e.key} id={`reactwright-bib-${e.key}`}>
        {/* inline IR substituted in */}
      </item>
    ))}
  </list>
</section>
```

Resolved IR contains `section`, `heading`, `list`, N × `item` — all
existing IR kinds with `className` support. Every rendered element ↔
one IR node. Rules like
`<rule match={{ kind: "heading", within: { kind: "section", role: "bibliography" } }} />`
just work. Slice-5.3 (synthesize bibliography internals) is obsoleted —
the internals are already first-class IR.

Cross-reference contract survives because it's just (a) `<li id="reactwright-bib-{key}">`
and (b) a counter named `reactwright-bib`. Userland emits the IDs; the
engine emits the counter CSS (`backends/html/render.ts:60-65`) which
keys on the counter name — agnostic to who counter-increments.

One gap: today's counter-reset/increment CSS targets
`.reactwright-bibliography` and `.reactwright-bibliography ol > li`
(`render.ts:64-65`). After migration that class no longer exists. Fix:
switch the selector to `[data-counter="reactwright-bib"]` +
`[data-counter="reactwright-bib"] ol > li`. The userland helper sets
the attribute via the new `counter` prop on `<section>` (§4.1).

(Alternative: have the userland helper emit counter rules via dialect
`numbering`/`numbering-reset` (slice 2.1, present in IEEE_STYLES at
`mockups/ieee/template.tsx:62-89`). More architecturally pure — counter
scoping is presentation. Defer to slice 7; the data-attr is easier to
ship.)

## 4. Proposed engine primitives

### 4.1 `<list ordered>` + `<item>` — already exist; need small additions

`list`/`item` exist (IR `src/content/ir.ts:206-221`, factory
`src/content/factories.ts:186-197`, grammar `src/content/grammar.ts:77-78`,
renderer `src/backends/html/content.ts:165-169`). Two gaps:

- **`<item id="…">`.** `ListItemNode` has no `id`; userland bib needs it
  for citation anchors. Add `id?: string`; mirror in
  `ResolvedListItemNode`; factory reads via `getNonEmptyStringIfPresent`;
  renderer adds `${idAttr(node.id)}`.

- **`<section counter="reactwright-bib">`.** For counter scoping per §3.
  Add `counter?: string` to `SectionNode` + resolved equivalent;
  renderer emits `data-counter="{value}"`. Narrow contract (not a
  general `dataAttrs` map) — easier to retire later if dialect
  `numbering` subsumes it.

### 4.2 `<heading>` — already exists; no changes

`heading` is in IR (`src/content/ir.ts:251-260`), factory
(`src/content/factories.ts:85`), grammar `BLOCK_KIND`
(`src/content/grammar.ts:33`), renderer `renderHeadingNode`. Userland
helpers write `<heading level={2} title="…" />` as a sibling inside
the section body. (Alternative: use `<section title>` and let slice-5.1
synthesize a `section-heading` child — both work; pick per helper.)

### 4.3 Data-source primitives

Four new template-side intrinsics. Each runs the same aggregation the
existing compound's resolver does, then exposes the resulting data to
a userland render-prop child.

**API: template-side intrinsic with a render-prop child.**

```tsx
<bib-data>
  {(entries) => (
    <section role="bibliography" counter="reactwright-bib">
      <heading level={2} title="References" />
      <list ordered>
        {entries.map((e) => (
          <item key={e.key} id={`reactwright-bib-${e.key}`}>
            <bib-entry-content for={e.key} />
          </item>
        ))}
      </list>
    </section>
  )}
</bib-data>
```

Render-prop is React-idiomatic and avoids a new Context provider. Factory
in `src/template/factories/reference.ts`:

```ts
export function bibDataNode(props: TemplateProps): BibDataNode {
  const render = props.children;
  if (typeof render !== "function") {
    throw new Error("`bib-data` requires a function child: (entries) => JSX");
  }
  return { kind: "bib-data", render };
}
```

Template IR:

```ts
export type BibDataNode = { kind: "bib-data"; render: (entries: BibDataEntry[]) => unknown };
export type BibDataEntry = { key: string; used: boolean; text?: string };
```

Resolver: a new `bib-data` case in `expandTemplateChild` (a) reads
`ctx.refEntries` + `ctx.citeKeys`, (b) runs the same merge logic
currently at `resolve.ts:385-428` to produce `entries`, (c) invokes
`render(entries)`, (d) runs `renderTemplateToIR` (re-entrant template
reconciler at `src/template/render.ts`) on the returned React node,
(e) recursively expands the resulting template subtree.

**Timing.** All aggregated data is final by the time
`resolveTemplateContainer` is invoked at `resolve.ts:614` — anchor
stamping + collect runs at lines 602-613. So `bib-data` reads a
snapshot. No new resolve phase needed.

**Inline-IR round-trip.** A bib entry's body is `ResolvedInlineNode[]`
(`src/resolver/ir.ts:293`). To put it inside a userland JSX render
function we either round-trip back to React elements (expensive,
lossy) or expose a placeholder. **Recommendation:** a new template
primitive `<bib-entry-content for="key" />` that the resolver
substitutes with `ctx.refEntries.get(key).children` inline at template
resolution time. The userland helper drops it inside an `<item>` and
never sees resolved-IR types. (Alternative: pass `e.children` as React
nodes via a one-shot React reconstruction; flagged in §8.)

The other three data sources are simpler — entry data is plain strings
+ IDs, no inline IR round-trip:

- `<toc-data>{(entries: { id; title; depth }[]) => …}</toc-data>`
- `<list-of-data of="figure">{(entries: { id; caption }[]) => …}</list-of-data>`
- `<index-data>{(entries: { term; anchorIds }[]) => …}</index-data>`

## 5. Slice breakdown

Each sub-slice is a single dispatched unit. Acceptance is `npm test`
+ `npm run check` + `npm run mockup:all` (all 5 PDFs healthy).

### 5.1 Engine primitive parity

**Goal:** make `<list>`, `<item>`, `<heading>` sufficient for userland
helpers. Add the minimal additions identified in §4.

**Files:**
- `src/content/ir.ts`: add `id?: string` to `ListItemNode`; add
  `counter?: string` to `SectionNode`.
- `src/content/factories.ts`: read both via `getNonEmptyStringIfPresent`.
- `src/resolver/ir.ts`: mirror on `ResolvedListItemNode`,
  `ResolvedSectionNode`.
- `src/resolver/block.ts`: propagate both in the per-kind resolvers.
- `src/backends/html/content.ts`: `renderListItemNode` adds `${idAttr(node.id)}`;
  `renderSectionNode` adds `data-counter` attribute when set.
- `src/public/jsx.d.ts`: prop type updates.

**Acceptance:**
- New tests in `tests/content-render.test.tsx` covering `item id` and
  `section counter`.
- No mockup output changes.

### 5.2 Data-source primitives

**Goal:** add four template intrinsics — `<bib-data>`, `<toc-data>`,
`<list-of-data>`, `<index-data>` — plus `<bib-entry-content>`
substitution.

**Files:**
- `src/template/ir.ts`: four new node types, each `{ kind, render }`.
- `src/template/factories/reference.ts` + `factories/index.ts`: four
  factories + dispatch entries. Each factory validates `props.children`
  is a function.
- `src/resolver/resolve.ts`: four cases in `expandTemplateChild`. Each
  (a) reads its data from `ctx`, (b) calls `render(entries)`, (c) runs
  `renderTemplateToIR` (`src/template/render.ts`) on the React result,
  (d) recursively calls `expandTemplateChild` on the produced subtree.
- `src/template/factories/reference.ts`: add `<bib-entry-content for="key">`
  as a template intrinsic; its resolver case looks up
  `ctx.refEntries.get(key).children` and returns those resolved inline
  nodes as the expansion. Template intrinsics can already expand to
  `ResolvedChild`, which includes inline content nodes — no IR-shape
  surgery needed.
- `src/backends/html/template.ts`: no new renderers (the data-source
  primitives have no direct render output; their resolution IS the
  expansion).

**Acceptance:** new tests in `tests/resolver-integration.test.tsx` for
each data source; existing mockups produce identical output.

**Risk:** `renderTemplateToIR` re-entrancy. The reconciler is constructed
fresh per call inside `renderTemplateToIR` (verify before dispatch).
If not safely re-entrant, add a guard or refactor.

### 5.3 Userland `<Bibliography>` in IEEE mockup

**Goal:** prove the data-source pattern end-to-end on the most complex
compound; migrate IEEE.

**Files:**
- `mockups/ieee/components/Bibliography.tsx` (NEW). Sketch:

```tsx
import "reactwright/jsx";
import React from "react";

export function Bibliography({ title = "References" }: { title?: string }): React.ReactElement {
  return (
    <bib-data>
      {(entries) => (
        <section role="bibliography" counter="reactwright-bib">
          <heading level={2} title={title} />
          <list ordered>
            {entries.map((e) => (
              <item key={e.key} id={`reactwright-bib-${e.key}`}>
                <bib-entry-content for={e.key} />
              </item>
            ))}
          </list>
        </section>
      )}
    </bib-data>
  );
}
```

- `mockups/ieee/template.tsx`: replace `<bibliography title="References" />`
  at line 271 with `<Bibliography />`. Import from `./components/Bibliography`.
- `mockups/ieee/index.ts`: add `Bibliography` to exports.
- `mockups/ieee/template.tsx` IEEE_STYLES (line 58-60): the
  `.ieee-bibliography` selector now binds via a rule:
  `<rule match={{ kind: "section", role: "bibliography" }} className="ieee-bibliography" />`.
- IEEE_CSS (`template.tsx:194-196`): remove
  `.reactwright-bibliography h2`, `.reactwright-bibliography ol`, and
  `.reactwright-bibliography li` rules; replace with dialect rules
  matching `kind: "heading", within: { kind: "section", role: "bibliography" }`
  etc. The counter-wiring CSS in `backends/html/render.ts:64-65`
  changes selector to `[data-counter="reactwright-bib"]` +
  `[data-counter="reactwright-bib"] ol > li`.
- Engine `<bibliography>` intrinsic stays, gets deprecation JSDoc:
  `@deprecated since 0.x, removed v1.0. Use a userland helper.`

**Acceptance:**
- IEEE mockup PDF byte-equivalent (or explained-diff) to pre-change.
- `npm run mockup:ieee-strict` healthy.
- New test in `tests/styles-integration.test.tsx`: a userland
  `<Bibliography>` produces the same bibliography output as the
  engine's `<bibliography>`.

### 5.4 Userland `<TOC>`, `<ListOf>`, `<Index>`

**Goal:** migrate the three simpler compounds; deprecate engine versions.

These are simpler than bibliography because entry data is plain strings,
not inline IR. No `<bib-entry-content>` analogue needed.

**Files:**
- `mockups/ieee/components/Toc.tsx`, `ListOf.tsx`, `Index.tsx` (NEW).
  No IEEE mockup currently *uses* these compounds (verify:
  `grep -rn '<toc\\b\\|<list-of\\b\\|<index\\b' mockups/ieee/`) — so
  these helpers ship without an in-mockup callsite. Add to
  `mockups/story-bible.tsx` or `mockups/treatise.tsx` as a smoke test
  if either uses them.
- Deprecate engine intrinsics with same JSDoc as bib.

**Recommendation: merge TOC + ListOf + Index into one slice.** The
machinery is parallel and the testing is parallel. Splitting yields
three near-identical PRs.

**Acceptance:**
- New tests for each in `tests/styles-integration.test.tsx`.
- Affected mockups untouched in output.

### 5.5 `<Abstract>` — three options

- **A: keep engine intrinsic, no userland helper.** Trivial one-element
  wrapper; engine already does exactly what a userland helper would.
  Authoring shape unchanged.
- **B: remove engine intrinsic.** Authors write `<section role="abstract">…</section>`
  directly. Slot router keys on `role`. Slightly more verbose at
  authoring.
- **C: keep both.** Two ways to do one thing — reject.

**Recommendation: B.** Defended in report; the engine knowing what
"abstract" means is exactly the coupling slice 6 exists to eliminate.

If B: replace `slots.abstract = document.children.filter(c => c.kind === "abstract")`
at `resolve.ts:189` with a role-aware filter. Update
`src/content/grammar.ts:56` to remove the `abstract` entry. Remove
`AbstractNode`, `ResolvedAbstractNode`, `resolveAbstractNode`,
`renderAbstractNode`. The `<section role="abstract">` already routes
through normal section renderer; the `data-slot="abstract"` attribute
can be emitted by the renderer when `role==="abstract"`.

If A only (and no userland helper): just leave it. Mark it in the spec
as preserved for ergonomics.

### 5.6 Deprecation pass

**Goal:** ship deprecation warnings on engine compounds; spec amendment.

**Files:**
- `src/template/factories/reference.ts`: each factory emits a one-time
  `console.warn` on first instantiation; JSDoc `@deprecated`.
- `docs/spec.md`: rewrite §"Template vocabulary" to drop
  `bibliography`/`toc`/`list-of`/`index` from the engine surface; add
  a "Userland helpers" section pointing to how to build them.
- `docs/styling-spec.md`: §2 audit table — strike the
  `reactwright-bibliography`, `reactwright-toc`, etc. class entries.
- `CLAUDE.md`: update flight table; add gotcha note about engine
  vs userland compounds.

**Removal at v1.0:** spec promise — engine intrinsics are removed at
v1.0. Until then, both forms work.

## 6. Risks & tradeoffs

**Ergonomics regression.** Without a helper, authors must compose
primitives by hand. Mitigation: ship a default helpers module at
`src/userland/` (or `defaults/`) exporting `<Bibliography>`, `<TOC>`,
`<ListOf>`, `<Index>` — ~150 LoC. Authors who don't pick a template
import this module. Engine intrinsics stay through 0.x as a back-compat
alias.

**Aggregation timing.** All collected data is final at `resolve.ts:602-613`
before `resolveTemplateContainer` runs. Data-source resolvers see an
immutable snapshot. **Single-pass corollary:** `<cite>` inside a
bib-entry's body won't register (cite-key collection ran already).
Decision: forbid cite/index inside bib-entry-content output; add a
runtime check.

**Spec evolution.** Engine spec (`docs/spec.md`) shrinks to machinery
(cite collection, anchor formats `reactwright-bib-{key}` etc., counter
names `reactwright-bib`/`reactwright-ref`, target-counter wiring). A
new `docs/userland.md` documents reference helpers and the
data-source primitive contract. Helper packages define **shape**, not
machinery.

**Cross-reference correctness — end-to-end trace** of `<cite cite="foo">`
→ `[1]` after migration:

1. `<cite cite="foo">` → `CiteNode` → `ResolvedCiteNode`
   → `<a class="reactwright-cite" href="#reactwright-bib-foo">`.
2. `collectCiteKeysFromSlotMap` adds `"foo"` to `ctx.citeKeys`
   (`resolve.ts:603`).
3. `<refs><ref-entry refKey="foo">…</ref-entry></refs>` →
   `collectRefEntriesFromSlotMap` puts it in `ctx.refEntries`
   (`resolve.ts:613`).
4. Template has `<Bibliography />` → expands to
   `<bib-data>{(entries) => …}</bib-data>` → resolver merges
   `ctx.refEntries` + `ctx.citeKeys` (same merge logic as today's
   `resolve.ts:385-428`), invokes `render(entries)`, re-runs template
   reconciler on the result.
5. `<item id="reactwright-bib-foo">` → `ResolvedListItemNode { id: "reactwright-bib-foo" }`.
   `<bib-entry-content for="foo" />` substituted with
   `ctx.refEntries.get("foo").children`.
6. Renderer emits `<section data-counter="reactwright-bib"><h2>References</h2><ol><li id="reactwright-bib-foo">…</li></ol></section>`.
7. Updated `STATIC_DEFAULTS_CSS`:
   `[data-counter="reactwright-bib"]{counter-reset:reactwright-bib}` +
   `[data-counter="reactwright-bib"] ol > li{counter-increment:reactwright-bib}`.
8. Paged.js resolves `target-counter(attr(href url), reactwright-bib)`
   on the cite's `::after` (`render.ts:60`) → `1`. Output: `[1]`.

End-to-end correct. Only engine change: step 7 selector shift.

## 7. What does NOT change

- JSX intrinsic surface for primitives: `section`, `figure`, `table`,
  `row`, `cell`, `paragraph`, `heading`, `list`, `item`, `link`,
  `code`, etc.
- The styling dialect (`<styles>`, `<rule>`, selectors, declarations).
- The `<rule>` system, role-rule system (`<role>` inside `<rules>`).
- Page-set / regime / slot / running-string / footnote-area /
  sidenote-area.
- Resolver phases: collect (cite, index, toc, list-of, refs),
  anchor stamp, target-counter wire, role-variant assignment, dialect
  rule application.
- `<refs>` + `<ref-entry>` content primitives.
- The cross-reference contract: counter names (`reactwright-bib`,
  `reactwright-ref`), anchor-id formats (`reactwright-bib-{key}`,
  `reactwright-sec-{slug}`, `reactwright-idx-{slug}-{n}`).
- Header / footer / margin-matter behavior.

## 8. Decisions (open questions resolved)

1. **Bib-entry-content substitution.** **Template primitive
   `<bib-entry-content for="key" />`.** Round-tripping resolved inline
   IR back to React elements is lossy and expensive; the placeholder
   model is direct and keeps userland code free of resolved-IR types.

2. **Counter-wiring CSS.** **Option A: `[data-counter="..."]` selector**
   in `STATIC_DEFAULTS_CSS`. Option B (userland dialect `numbering`)
   is more architecturally pure but blocks 6.3 on a slice-7-shaped
   side quest. A ships now; B is revisitable when slice 3 promoted
   concepts mature.

3. **`<abstract>` migration.** **Option B: remove engine intrinsic.**
   Authors write `<section role="abstract">…</section>`. The slot
   router keys on `role`. Removing one more semantic shape from the
   engine is the whole point of slice 6.

4. **Defaults helpers location.** **`src/userland/`.** Single repo;
   no monorepo split yet. Extractable later. Engine consumers who don't
   adopt a template helper package import from here.

5. **TOC/ListOf/Index in-mockup callsites.** **Ship helpers without
   in-mockup smoke tests; rely on `tests/styles-integration.test.tsx`.**
   Sub-agent for 6.4 verifies during dispatch which mockups actually
   reference these compounds.

6. **Slice 5.3 disposition.** **Dropped.** Superseded by 6.3.
   Bibliography internals get IR identity via userland composition
   (primitives the engine already exposes after 6.1+6.2), not via
   engine-side synthesis. Slice 5.1 + 5.2 stand independently.

## 9. Dispatch brief template

Each 6.x sub-slice can be dispatched independently after 6.1 + 6.2 land.
Sub-agent brief:

1. Read `CLAUDE.md` + this doc § the specific sub-slice.
2. For 6.1/6.2: add the new IR types, factories, resolver cases,
   renderer changes per §5.X file list.
3. For 6.3+: add the userland helper TSX, switch the mockup callsite,
   migrate dialect rules + STATIC_DEFAULTS_CSS selector update if any.
4. Add tests per §5.X acceptance criteria.
5. `npm test && npm run check && npm run mockup:all`.
6. Byte-diff `build/mockups/*.html` against pre-change snapshot. Any
   diff must be explained.
7. Commit `Slice 6.X: …`.
