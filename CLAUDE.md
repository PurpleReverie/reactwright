# Reactwright — Contributor Guide

Reactwright is a React-authored document engine for paginated output
(HTML via Paged.js, PDF via headless Chromium). This file is the
architecture briefing for anyone — human or AI assistant — making code
changes in the monorepo. The canonical *behavioural* spec is
`docs/spec.md`; the styling-dialect spec is `docs/styling-spec.md`.
When this file and a spec disagree, the spec wins.

## Repo layout

```
.
├── packages/
│   ├── reactwright/             # the engine
│   ├── template-ieee/           # @reactwright/template-ieee
│   ├── template-essay/          # @reactwright/template-essay
│   ├── template-report/         # @reactwright/template-report
│   └── (cite-bibtex, cite-csl, code-highlight, charts,
│        create-reactwright-doc) — adapter stubs, not yet implemented
├── examples/                    # standalone sample documents
├── docs/                        # spec, styling-spec, decisions
├── .changeset/                  # changesets versioning state
├── pnpm-workspace.yaml          # packages/* + examples/*
├── turbo.json                   # build/test/check/mockup pipelines
└── tsconfig.base.json           # shared compiler options
```

Every package has its own `package.json`, `tsconfig.json`, and a
`README.md`. Engine sources live in `packages/reactwright/src/`; the
rest of this file describes that subtree.

## Engine architecture at a glance

```
content JSX ──[content/]──► contentIR
template JSX ──[template/]──► templateIR
                              ↓
                        [resolver/] ──► ResolvedPageNode
                              ↓
                        [backends/html/] ──► HTML
                              ↓
                        Paged.js ──► PDF (via backends/pdf/)
```

Two independent React reconcilers (content + template) produce
intermediate representations. The resolver merges them by substituting
`<slot>` with content regions. The HTML backend emits for Paged.js
(CSS Paged Media + GCPM polyfill). The PDF backend hands the HTML to
headless Chromium for print.

## Engine source tree (`packages/reactwright/src/`)

Each concern is a directory. The directory name carries the verb;
files inside name the sub-concern. `render.ts` is always the
orchestrator for that directory. `ir.ts` is always the type
definitions.

```
src/
├── shared/                      cross-cutting helpers
│   ├── prop-readers.ts            getString, getRequiredString, …
│   ├── reconciler-host-config.ts  createReconcilerHostConfigBase
│   └── insert-before.ts           insertBeforeInList<T>
├── content/                     JSX → content IR
│   ├── render.ts                  orchestrator: renderContentToIR
│   ├── host-config.ts             reconciler wiring
│   ├── grammar.ts                 parent→allowed-children table + appendSemanticChild
│   ├── factories.ts               per-intrinsic node constructors (dispatch table)
│   └── ir.ts
├── template/                    JSX → template IR
│   ├── render.ts                  orchestrator: renderTemplateToIR
│   ├── host-config.ts
│   ├── prop-readers.ts            template-specific readers (anchors, when, …)
│   ├── registry.ts                custom-intrinsic registry
│   ├── factories/                 per-intrinsic constructors
│   │   ├── index.ts                 dispatch table + createTemplateNode
│   │   ├── page.ts                  page, page-set
│   │   ├── regions.ts               region, layer, stack, row, columns, column, fixed
│   │   ├── margin-matter.ts         header, footer
│   │   ├── reference.ts             bibliography, toc, list-of, index
│   │   ├── decorations.ts           font, image, running, page-number, page-count
│   │   ├── footnotes.ts             footnote-area, sidenote-area
│   │   ├── rules.ts                 role-rule + four prop helpers
│   │   ├── styles.ts                styles, rule (styling dialect)
│   │   └── slot.ts                  slot + validateSlotName
│   └── ir.ts
├── styles/                      styling dialect (see docs/styling-spec.md)
│   ├── ir.ts                      Match, RuleAst, StylesheetAst, RuleBinding
│   ├── parser.ts                  CSS-superset parser → StylesheetAst
│   ├── selector.ts                matchNode(node, match, ctx) IR predicate
│   ├── apply.ts                   applyRulesToTree → per-node class lists
│   └── lower.ts                   StylesheetAst → CSS string
├── resolver/                    content IR + template IR → resolved IR
│   ├── resolve.ts                 orchestrator: resolveDocument + template-tree dispatch
│   ├── inline.ts                  per-inline-kind resolvers
│   ├── block.ts                   per-block-kind resolvers + resolveContentChild
│   ├── rules.ts                   RuleMaps, withVariant, assignRoleVariants
│   ├── collect.ts                 assign* (ids) + collect* (cite keys, ref entries)
│   ├── collect-styles.ts          collect <styles> + <rule> from template tree
│   ├── anchors.ts                 resolveFixedAnchor + normalizeCoordinate
│   └── ir.ts
└── backends/
    ├── html/                    resolved IR → HTML for Paged.js
    │   ├── render.ts              orchestrator: renderResolvedToHTML
    │   ├── content.ts             per-content-kind renderers + renderSectionNode
    │   ├── inline.ts              per-inline-kind renderers
    │   ├── template.ts            container renderers + renderResolvedChild dispatch
    │   ├── regime-flow.ts         renderRegimeFlowNode (substitutes body-slot)
    │   ├── css.ts                 build*Css + styleToInlineCss + cssPropertyMap
    │   ├── class-bindings.ts      classAttr / classListFor (rule-applied classes)
    │   ├── fonts.ts               KaTeX glue + buildFontHeadTags
    │   └── utils.ts               escapeHtml, anchorToCss, idAttr, …
    └── pdf/
        └── render.ts              buildPdfFromHtml + launchBrowser + withTempHtmlFile
```

## Key patterns

**Page-set (regime declaration).**
A `<page-set name="X">` declares one CSS Paged Media regime: geometry
(size, margin), chrome (header/footer), and body flow template. Its
`<slot name="body">` is a marker. When the resolver processes it,
body flow gets stored in `regimeFlows[X]` and chrome is hoisted as
direct page children. At render time, each `<section page="X">` is
wrapped in its regime's flow template (`renderRegimeFlowNode`).

**Role rules (semantic routing).**
`<role match="X" apply="Y" style={...} breakBefore="...">` maps content
`role="X"` to presentation variant `Y`. Style pass-through lets
templates define what variants look like without the engine baking in
role names. Resolved by `assignRoleVariants` using the `withVariant`
helper.

**Styling dialect (`<styles>` + `<rule>`).**
A typed CSS-superset operates on the resolved IR instead of HTML.
Authors write `<styles>{`.foo { color: red }`}</styles>` blocks of
named classes and bind them to IR patterns via
`<rule match={{ kind: "section", depth: 1 }} className="foo" />`.
Selectors are IR-shape predicates (`kind`, `role`, `depth`, `follows`,
`within`, `has`, …), not HTML selectors. Implementation:
`src/styles/{parser,selector,apply,lower}.ts`. Spec:
`docs/styling-spec.md`. The 12 binding decisions in spec §10 must be
re-read before any architectural call in this area — reversing one
requires a spec amendment, not an inline judgment.

**Running strings (`<set>` + `<running>`).**
Content: `<set running="chapter-title" value="..." />` captures
metadata. Template: `<running name="chapter-title" />` emits it. Wired
via CSS string-set + margin boxes.

**Body-stream auto-emit.**
If no top-level `<slot name="body">` consumes body content but
page-sets registered flows, the resolver appends a synthetic
`body-stream` node. Lets authors wire content by placing slot inside
page-set alone.

**Dispatch tables.**
`createContentNode`, `createTemplateNode`, and `renderResolvedChild`
are all dispatch maps (`Record<kind, handler>`), not switches. Adding
a primitive = adding one entry plus its factory/renderer.

## Where to add / modify

| Task | Files |
|------|-------|
| New content primitive | `content/ir.ts` (type) + `content/factories.ts` (constructor + dispatch entry) + `content/grammar.ts` (allowed-children rule) + `resolver/{inline,block}.ts` (resolver) + `backends/html/{content,inline}.ts` (renderer) |
| New template primitive | `template/ir.ts` + `template/factories/<category>.ts` (constructor) + `template/factories/index.ts` (dispatch entry) + `resolver/resolve.ts` (template-tree dispatch) + `backends/html/template.ts` (renderer) |
| New page-set behavior | `resolver/resolve.ts` (page-set case of `expandTemplateChild`) + `resolver/ir.ts` (regimeFlows type) |
| CSS Paged Media details | `backends/html/css.ts` |
| New style key | `backends/html/css.ts` (`cssPropertyMap`) |
| New role-rule attribute | `template/factories/rules.ts` (reader) + `resolver/rules.ts` (RoleRule + withVariant) + `backends/html/css.ts` (`buildRoleVariantCss`) |
| New styles-dialect selector key | `src/styles/ir.ts` (Match) + `src/styles/parser.ts` (lexer/parser) + `src/styles/selector.ts` (matchNode) + `src/styles/apply.ts` (walker context if combinator) |
| New styles-dialect declaration (promoted concept) | `src/styles/lower.ts` (lowering rule) + `tests/styles/lower.test.tsx` (per-property test) |
| Make a node selectable | see "className propagation checklist" below |

## className propagation checklist

Five touchpoints. Miss any one and `className` silently drops between
where the author writes it and where the renderer reads it.

1. **Source IR type** — add `className?: string` to the type in
   `src/content/ir.ts` or `src/template/ir.ts` (whichever side the
   primitive lives on).
2. **Resolved IR type** — add `className?: string` to the matching
   `Resolved*Node` type in `src/resolver/ir.ts`.
3. **Factory** — read it in the factory function. Use
   `readMetadata(props)` (content side, already includes className) or
   `readClassName(props)` (template side and inline content).
4. **Resolver function** — propagate it in the per-kind resolver with
   the standard idiom:
   `...(node.className != null ? { className: node.className } : {})`.
   Content resolvers live in `src/resolver/{inline,block}.ts`;
   template-side propagation lives in
   `src/resolver/resolve.ts:resolveTemplateContainer`.
5. **Renderer** — splice `classAttr(node)` (when emitting a tag with
   no engine-internal class) or `classAttrWithBase(node, ...baseClasses)`
   (when keeping a stable engine class like `reactwright-cite`) into
   the emitted HTML tag. Both helpers live in
   `src/backends/html/class-bindings.ts`.

Verification: write a one-line test in
`tests/styles-integration.test.tsx` that applies a rule to the new
kind and asserts the class appears in the rendered HTML.

## Gotchas

- **`cell` requires block children, not raw text.** Wrap values in
  `<p>` — the `examples/paper/components/data-table.tsx` `DataTable`
  shows the pattern. Grammar enforces it; symptom is "Content renderer
  produced no root node."
- **`npm test` glob needs both patterns.** sh doesn't recurse `**`
  alone. Script uses `'tests/*.test.tsx' 'tests/**/*.test.tsx'`. Don't
  collapse to a single glob.
- **`classAttr(node)` vs `classAttrWithBase(node, ...base)`:** plain
  `classAttr` when the renderer emits no engine-internal class;
  `classAttrWithBase` when the renderer keeps a stable engine class
  (e.g. `reactwright-cite`, `reactwright-math-block`) AND wants to
  merge in rule-applied classes.
- **Caption back-compat.** `figure` and `table` still accept
  `caption?: string` props. New JSX uses `<caption>…</caption>`
  child form, which the grammar routes to the parent's `captionNode`
  field. Renderer prefers `captionNode` over the legacy string.
- **`ResolvedTemplateRowNode` uses kind `"template-row"`**, not
  `"row"`. Template-side `<row>` JSX → template-IR kind `"row"` →
  resolved-IR kind `"template-row"`. The disambiguation exists because
  the content-side table `ResolvedRowNode` also uses `kind: "row"`;
  merging them in the `ResolvedChild` discriminated union would break
  narrowing.
- **`customCss` is deprecated.** Stays through 0.x. Removal targeted
  for v1.0. New work should reach for `<styles>` + `<rule>`.
- **`key` prop on intrinsics.** Don't try to add to
  `JSX.IntrinsicAttributes` — TypeScript's JSX checker doesn't honour
  the namespace augmentation reliably for cross-module-augmented
  namespaces. Add `key?: Key | null` directly to the prop types used
  by `.map(...)` loops (currently `RowProps`, `CellProps`).
- **Bibliography entries (and other aggregates) are not addressable as
  IR nodes by default.** `ResolvedBibliographyEntry` is a flat data
  carrier collected from `ctx.refEntries`; the `<li>` rendered for it
  has no node identity at render time. To make
  `<rule match={{kind:"ref-entry"}}>` work, the entry carries a
  `sourceNode` field and the renderer reads
  `classAttr(entry.sourceNode)`. The same pattern applies to TOC,
  list-of, and index entries.
- **Section heading vs. section wrapper.**
  `<rule match={{kind:"section"}}>` styles the wrapper `<section>`;
  `<rule match={{kind:"section-heading"}}>` styles the `<h2>`/`<h3>`.
  The resolver prepends a `ResolvedSectionHeadingNode`
  (`kind:"section-heading"`, `depth:N`) to every section's `children`,
  so heading bindings live on their own IR node. The section wrapper
  carries its OWN `classAttr(node)` for `kind:"section"` rules. To
  select "first paragraph after a heading", use
  `<rule match={{kind:"paragraph", follows:{kind:"section-heading"}}}>`.

## Conventions

- **Naming verbs:** `render*` (IR → HTML) · `resolve*` (IR → resolved
  IR) · `build*` (CSS strings) · `collect*` (tree walk → list) ·
  `assign*` (tree walk → mutate ids) · `read*` / `get*` (props
  extraction) · `*ToCss` / `*ToInlineCss` (style serialization).
- **One entry-point per concern.** `<dir>/render.ts` is always the
  orchestrator for that dir.
- **Subdirectory threshold.** Flat up to ~4 files in a concern;
  subdirectory beyond that (see `template/factories/`).
- **`index.ts` only re-exports.** No logic.
- **Cross-cutting helpers live in `src/shared/`.** Keep small.
- **Most engine files are under ~350 lines.** Use the source-tree map
  above to navigate; don't speculatively re-read large files.

## Workflow

From the repo root:

```sh
pnpm install            # one-time
pnpm test               # 129 unit tests across the workspace
pnpm check              # typecheck every package
pnpm mockup:all         # renders every example to HTML + PDF
```

Per-package:

```sh
pnpm --filter reactwright test
pnpm --filter @reactwright/template-ieee check
pnpm --filter @example/story-bible build
```

Single-mockup smoke test: `pnpm --filter @example/story-bible build`
exercises every regime + role-rule + drop-cap + running-string +
two-sided geometry + external font path in one ~3s run.

All mockups must produce healthy PDFs. If a PDF file size drops to
~900B, that regime's content was filtered out — likely a resolver bug.

For HTML-emit refactors, byte-diff `build/mockups/*.html` (or the
example's own `build/` output) against a pre-refactor snapshot to
confirm no behaviour drift.

## Test files (engine)

- `tests/content-render.test.tsx` — content reconciler unit tests
- `tests/template-render.test.tsx` — template reconciler unit tests
- `tests/resolver-integration.test.tsx` — slot fill + role rules + regimeFlows
- `tests/html-css.test.tsx` — @page rules, margin matter, role variant CSS, fonts, columns
- `tests/html-emission.test.tsx` — content emission, custom intrinsic, fixed overlay, toc / list-of / index / bibliography
- `tests/run-file.test.tsx` — CLI
- `tests/styles/parser.test.tsx` — CSS-dialect parser (selectors, pseudos, combinators, errors)
- `tests/styles/selector.test.tsx` — matchNode predicate (atomic keys + combinators + boolean)
- `tests/styles/apply.test.tsx` — class-application walker (sibling/depth tracking, caption-as-child)
- `tests/styles-integration.test.tsx` — end-to-end `<styles>+<rule>` through resolver and renderer
- `tests/row-caption-render.test.tsx` — template-row layout + caption-as-node rendering

## Spec vs. source

The spec (`docs/spec.md`) is canonical. When spec and code disagree,
trust the spec and file a bug against the code.

## Contributing

Changesets is the source of truth for versioning. Any change that
should ship to npm needs a `pnpm changeset` entry on the same branch.
See `CONTRIBUTING.md` for the full workflow.
