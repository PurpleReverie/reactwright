# ReactDoc — Project Instructions

ReactDoc is a React-authored document engine for paginated output (HTML via Paged.js, PDF via headless Chromium).

## Architecture at a glance

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

Two independent React reconcilers (content + template) produce intermediate representations. Resolver merges them by substituting `<slot>` with content regions. HTML backend emits for Paged.js (CSS Paged Media + GCPM polyfill).

## Project structure

Each concern is a directory under `src/`. The directory name carries the verb; files inside name the sub-concern. `render.ts` is always the orchestrator. `ir.ts` is always the type definitions.

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
│   │   ├── styles.ts                styles, rule (new dialect — see src/styles/)
│   │   └── slot.ts                  slot + validateSlotName
│   └── ir.ts
├── styles/                      styling dialect (see docs/styling-spec.md)
│   ├── ir.ts                      Match, RuleAst, StylesheetAst, RuleBinding
│   ├── parser.ts                  CSS-superset parser → StylesheetAst
│   ├── selector.ts                matchNode(node, match, ctx) IR predicate
│   ├── apply.ts                   applyRulesToTree → per-node class lists
│   └── lower.ts                   StylesheetAst → CSS string
├── resolver/                    content IR + template IR → resolved IR
│   ├── resolve.ts                 orchestrator: resolveDocument + template-tree dispatch  [flagged: split]
│   ├── inline.ts                  per-inline-kind resolvers
│   ├── block.ts                   per-block-kind resolvers + resolveContentChild
│   ├── rules.ts                   RuleMaps, withVariant, assignRoleVariants
│   ├── collect.ts                 assign* (ids) + collect* (cite keys, ref entries)
│   ├── collect-styles.ts          collect <styles> + <rule> from template tree
│   ├── anchors.ts                 resolveFixedAnchor + normalizeCoordinate
│   └── ir.ts                      [flagged: split per-domain]
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

**Page-set (regime declaration):**
A `<page-set name="X">` declares one CSS Paged Media regime: geometry (size, margin), chrome (header/footer), and body flow template. Its `<slot name="body">` is a marker. When the resolver processes it, body flow gets stored in `regimeFlows[X]` and chrome is hoisted as direct page children. At render time, each `<section page="X">` is wrapped in its regime's flow template (`renderRegimeFlowNode`).

**Role rules (semantic routing):**
`<role match="X" apply="Y" style={...} breakBefore="...">` maps content `role="X"` to presentation variant `Y`. Style pass-through lets templates define what variants look like without the engine baking in role names. Resolved by `assignRoleVariants` (formerly `applyResolvedRules`) using the `withVariant` helper.

**Styling dialect (`<styles>` + `<rule>`):**
A typed CSS-superset operates on the resolved IR instead of HTML. Authors write `<styles>{`.foo { color: red }`}</styles>` blocks of named classes and bind them to IR patterns via `<rule match={{ kind: "section", depth: 1 }} className="foo" />`. Selectors are IR-shape predicates (`kind`, `role`, `depth`, `follows`, `within`, `has`, …), not HTML selectors. Implementation: `src/styles/{parser,selector,apply,lower}.ts`. Spec: `docs/styling-spec.md`. Slice plan: `docs/styling-slice-1-plan.md`. Slice 1 ships pass-through CSS only; slices 2–3 add `numbering`, `prefix`/`suffix`, `wrap`, `break`, `indent`, `text-flow`, `column-fit`.

**Running strings (`<set>` + `<running>`):**
Content: `<set running="chapter-title" value="..." />` captures metadata. Template: `<running name="chapter-title" />` emits it. Wired via CSS string-set + margin boxes.

**Body-stream auto-emit:**
If no top-level `<slot name="body">` consumes body content but page-sets registered flows, the resolver appends a synthetic `body-stream` node. Lets authors wire content by placing slot inside page-set alone.

**Dispatch tables:**
`createContentNode`, `createTemplateNode`, and `renderResolvedChild` are all dispatch maps (`Record<kind, handler>`), not switches. Adding a primitive = adding one entry plus its factory/renderer.

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
| Make a node selectable | give it `className?: string` in both `content/ir.ts` (or `template/ir.ts`) and `resolver/ir.ts` (Resolved*Node), and propagate through the resolver |

## Conventions

- **Naming verbs:** `render*` (IR → HTML) · `resolve*` (IR → resolved IR) · `build*` (CSS strings) · `collect*` (tree walk → list) · `assign*` (tree walk → mutate ids) · `read*` / `get*` (props extraction) · `*ToCss` / `*ToInlineCss` (style serialization).
- **One entry-point per concern:** `<dir>/render.ts` is always the orchestrator for that dir.
- **Subdirectory threshold:** flat up to ~4 files in a concern; subdirectory beyond that (see `template/factories/`).
- **`index.ts` only re-exports.** No logic.
- **Cross-cutting helpers live in `src/shared/`.** Keep small.

## Testing / validation

- **Unit tests:** `npm run test` (100 tests across `tests/*.test.tsx` and `tests/styles/*.test.tsx`)
- **Integration tests:** `npm run mockup:all` (renders 5 mockups; PDFs are live validation)
- **Type check:** `npm run check`
- **Single-mockup smoke test:** `npm run mockup:story-bible` exercises every regime + role-rule + drop-cap + running-string + two-sided geometry + external font path in one ~3s run.

All 5 mockups must produce healthy PDFs. Check file sizes: if a PDF drops to ~900B, that regime's content was filtered out (likely a resolver bug).

For HTML-emit refactors, byte-diff `build/mockups/*.html` against a pre-refactor snapshot to confirm no behavior drift.

## Test files

- `tests/content-render.test.tsx` — content reconciler unit tests
- `tests/template-render.test.tsx` — template reconciler unit tests
- `tests/resolver-integration.test.tsx` — slot fill + role rules + regimeFlows
- `tests/html-css.test.tsx` — @page rules, margin matter, role variant CSS, fonts, columns
- `tests/html-emission.test.tsx` — content emission, custom intrinsic, fixed overlay, toc / list-of / index / bibliography
- `tests/run-file.test.tsx` — CLI
- `tests/styles/parser.test.tsx` — CSS-dialect parser (selectors, pseudos, combinators, errors)
- `tests/styles/selector.test.tsx` — matchNode predicate (atomic keys + combinators + boolean)
- `tests/styles/apply.test.tsx` — class-application walker (sibling/depth tracking, caption-as-child)
- `tests/styles-integration.test.tsx` — end-to-end <styles>+<rule> through resolver and renderer
- `tests/row-caption-render.test.tsx` — template-row layout + caption-as-node rendering

## Spec vs. source

**The spec (`docs/spec.md`) is canonical.** When spec and code disagree, trust the spec.

## Context-saving notes

- The codebase is now uniformly small files (most < 350 lines). Use the project-structure tree above to navigate; don't re-read large files speculatively.
- `regimeFlows` map is the load-bearing concept: per-regime body templates, instantiated per section at render time.
- Don't thread an explicit `RenderCtx` through the HTML renderers — `renderScopeRegimeFlows` is a documented module-level variable in `backends/html/content.ts` because the call chain through 15+ functions made threading not worth it.
- `npm run mockup:all` is fast (~5s); run after any structural change.
- `npm run mockup:story-bible` is the single best end-to-end smoke test (3s).
