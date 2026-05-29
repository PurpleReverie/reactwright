# ReactDoc — Refactor Audit

Rules applied (the **diagnostic**):
1. **File >350 lines** → mark for split.
2. **Function >20 lines** → consider breaking down, or surface steps via in-scope lambdas.
3. **Mixed responsibility (utility / state / composition)** → strong refactor hint.

The **findings** these rules surface fall into three categories:
- **(A) redundant code** — literal or near-literal copy-paste, where one source of truth would do.
- **(B) bad approaches** — design choices that fight the language or hide intent.
- **(C) hard-to-intuit names** — reader has to read the body to understand what the function does.

The size and responsibility-mix rules aren't separate axes — they're how you spot A/B/C. A 381-line function is almost always a mega-switch (B); a 1500-line file makes parallel implementations easy to hide (A); a function whose name doesn't match its body fails (C).

Findings ordered by impact:
- **Tier 1** — long files with deep responsibility mixing.
- **Tier 2** — long but mostly flat declarations.
- **Tier 3** — cross-cutting smells.
- **Tier 4** — hard-to-intuit names.
- **Tier 5** — second-pass complements (smaller files, other concerns, rejected items).

---

## Tier 1 — Long files with deep responsibility mixing

### 1. `src/backends/html/render.ts` — 1553 lines, 81 functions

**Responsibility mix:**
- node rendering (utility) — `render*Node` family
- CSS string building (utility) — `build*Css`, `styleToInlineCss`
- tree walking + collection (state-shaped helpers) — `collectMarginMatter`, `collectAllLayers`, `collectUsedFontFamilies`, `collectTemplateFonts`, `collectRunningStringNames`
- regime-flow wrapping (state via module-level var) — `currentRegimeFlows`, `renderRegimeFlowChild`, `wrapRegimeContainer`
- math glue (utility) — `getKatex`, `renderTeX`, `hasMathNodes`
- orchestration (composition) — `renderResolvedToHTML`

The orchestrator at the bottom (`renderResolvedToHTML`) is fine. Everything else is jammed into one file.

**Functions over 20 lines:**

| Function | ~LOC | Issue | Category |
|---|---|---|---|
| `renderResolvedToHTML` | ~120 | Composition; long because it stitches every subsystem. Acceptable if subsystems are extracted. | — |
| `renderResolvedChild` | ~90 | 30-case switch. Pure dispatch; fine in shape but should live alongside the child renderers it dispatches to. | B (switch-as-dispatch) |
| `buildMarginMatterCss` | ~60 | Mixes anchor-mirror logic with per-when CSS emission. Inner `atPage*` lambdas help but the rule branches read as a wall. Split into `marginMatterCssForOneSidedEntry` / `marginMatterCssForMirroredEntry`. | B |
| `buildVariantRulesCss` | ~45 | One function emits break, numbering, dropCap, style. Extract `variantBreakCss`, `variantNumberingCss`, `variantDropCapCss`, `variantStyleCss`. | B |
| `renderSectionNode` | ~45 | After the recent regime-flow change. Mixes title heading, body emission, regime wrapping. The wrap branch should be a single `wrapInRegimeFlow(sectionHtml, regime)` helper. | B |
| `wrapRegimeContainer` | ~50 | Switch over container kinds; per-branch CSS emission is duplicated from `render{Region,Stack,Columns,Column,Fixed}Node`. **The biggest A-smell in the file** — two parallel implementations of region/stack/columns/fixed emission. | A |
| `styleToInlineCss` | ~70 | Mostly a `directMap` table loop plus stack-default branching. The 30+ entry directMap is fine as a constant; the function itself should split into `directMapDeclarations(style)` + `stackDefaults(kind)`. | B |
| `renderContentNode` | ~60 | 30-case dispatch. Same shape as `renderResolvedChild`. Fine as dispatch but should sit next to content node renderers in their own file. | B |
| `renderInlineNode` | ~35 | 17-case dispatch; same. | B |
| `collectMarginMatter` | ~30 | Tree walk + flow-name generation + HTML build. The flow-name counter is hidden state. Acceptable but the inner `visit` closure makes it harder to test in isolation. | — |
| `buildPageBackgroundLayersCss` | ~30 | Tree walk + per-regime grouping + CSS emission. Fine. | — |

**Recommended split** (8 files, each well under 350 lines):

```
src/backends/html/
├── render.ts             — renderResolvedToHTML (orchestrator only)
├── render-content.ts     — renderContentNode + renderParagraphNode/Figure/Table/Section/etc.
├── render-inline.ts      — renderInlineNode + em/strong/code/link/ref/cite/footnote/math-inline
├── render-template.ts    — renderResolvedChild + region/stack/columns/column/fixed/layer/image/toc/list-of/bibliography
├── render-regime-flow.ts — renderRegimeFlowChild + wrapRegimeContainer (after unifying with template renderers)
├── render-css.ts         — buildAtPageRule, buildPageRegimesCss, buildVariantRulesCss, buildRunningStringsCss, buildMarginMatterCss, buildFootnoteAreaCss, buildSidenoteAreaCss, styleToInlineCss, directMap
├── render-collectors.ts  — collectMarginMatter, collectAllLayers, collectUsedFontFamilies, collectTemplateFonts, collectRunningStringNames
├── render-fonts.ts       — buildFontHeadTags + KaTeX glue (or split KaTeX into render-math.ts)
└── render-html-utils.ts  — escapeHtml, anchorToCss, marginAnchorToCssBox, coordinateAnchorToCss, normalizeImageSrc, idAttr, normalizePageSize
```

**B-smell:** `let currentRegimeFlows: ... | undefined;` module-level variable, set at the top of `renderResolvedToHTML` and cleared at the bottom. This is implicit context that breaks under reentrancy or parallel renders. Thread it as an explicit `RenderCtx { regimeFlows, depth }` parameter through the renderers that need it. Same approach for the depth argument (currently a default param on `renderSectionNode`).

---

### 2. `src/resolver/resolve.ts` — 1421 lines, 60 functions

**Responsibility mix:**
- inline node resolvers (utility) — `resolveTextNode` … `resolveSidenoteNode` (~15 fns, each ~5 lines, fine)
- block node resolvers (utility) — `resolveParagraphNode` … `resolveSectionNode` (~15 fns, each ~10–15 lines, fine)
- rules system (utility + state) — `buildRuleMaps`, `collectRulesFromChildren`, `applyRule`, `findMatchingRole`, `applyResolvedRules`
- collectors with stamping (state-mutating utility) — `stampSectionIdsAndCollectToc`, `stampListOfAndCollect`, `stampIndexAnchorsAndCollect`, `collectCiteKeysFromNode`, `collectRefEntriesFromNode`
- template tree resolution (composition) — `resolveTemplateChild`, `resolveTemplateNode`
- orchestration (composition) — `resolveDocument`

The file is doing five separate jobs.

**Functions over 20 lines:**

| Function | ~LOC | Issue | Category |
|---|---|---|---|
| `resolveTemplateChild` | ~200 | **25-case switch.** Each case is its own small builder (~5–25 lines). Cleanest split: one file per category (slot, page-set, control, regions, image/font, list-of/toc/index/bibliography). | B |
| `resolveTemplateNode` | ~130 | 12-case switch. Mixes "real container" cases (page, region, layer, stack, columns, column, fixed, header, footer, custom) with throw-blocks for "should never appear here." | B |
| `applyResolvedRules` | ~110 | 14-case switch returning rebuilt nodes. The `text`/`page-break`/inline/etc. cases all collapse to "return node". The block cases each rebuild the node with `variant: findMatchingRole(...)`. Extract `withVariant(node, kind)` helper; collapse the no-op cases into a default. | A + B |
| `stampSectionIdsAndCollectToc` | ~30 | Tree walk + ID generation + entry push. Conflates ID-stamping with TOC-collection. Could split into `assignSectionId(node, used)` and `walkAndCollectToc`. | B + C |
| `stampListOfAndCollect` | ~40 | Three near-identical figure/table/equation branches; each has its own counter and ID scheme. Extract `assignAutoId(node, prefix, count, used)`. | A |
| `resolveDocument` | ~40 | Composition orchestrator. Fine. | — |
| `applyRule` | ~25 | Builds a RoleRule with spread of optional fields. The spread-on-optional pattern is repeated everywhere in this file (verbose but not wrong). | — |
| `buildRuleMaps` | ~25 | Initialises rules + walks template root. Fine. | — |

**Recommended split:**

```
src/resolver/
├── resolve.ts              — resolveDocument (orchestrator)
├── resolve-inline.ts       — resolve*Node for inline nodes
├── resolve-block.ts        — resolve*Node for block content nodes
├── resolve-template.ts     — resolveTemplateChild + resolveTemplateNode
├── resolve-rules.ts        — RuleMaps + buildRuleMaps + collectRulesFromChildren + applyRule + findMatchingRole + applyResolvedRules + ROLE_ON_ELEMENT_KIND
├── resolve-collect.ts      — stamp*/collect* (ID stamping, TOC, list-of, index anchors, cite keys, ref entries)
├── resolve-anchors.ts      — resolveFixedAnchor + normalizeCoordinate
└── ir.ts                   — (unchanged or split, see Tier 2)
```

The 25-case switches in `resolveTemplateChild` and `resolveTemplateNode` would also benefit from a **kind→handler dispatch map** at module load time, instead of a switch — easier to extend, easier to test per-kind.

---

### 3. `src/template/render.ts` — 866 lines, 19 functions

**Responsibility mix:**
- prop reading (utility) — `readOptionalObjectProp`, `mergeTemplateStyleGroups`, `readRequiredTemplateToken`, `readOptionalTemplateToken`, `readFixedAnchor`, `readAnchorsMap`, `readMarginAnchor`, `readMarginMatterWhen`, `readLayerWhen`, `readRegionPositioning`, `readFixedWhen`
- node factories (utility, but one giant function instead of N small ones) — `createTemplateNode`
- tree append rules (utility) — `appendTemplateChild`, `appendChildToTemplateContainer`, `insertBeforeInList`
- reconciler host config (composition) — `templateHostConfig`
- orchestrator (composition) — `renderTemplateToIR`

**Functions over 20 lines:**

| Function | ~LOC | Issue | Category |
|---|---|---|---|
| `createTemplateNode` | **~381** | **The single worst smell in the codebase.** 27-case switch, each case is "read props, validate, build node object." Each case is its own 5–60 line builder. The `role` case alone is 70 lines with four nested lambdas (`readBreak`, `readBreakInside`, `readDropCap`, `readNumbering`). | B (mega-switch) |
| `readFixedAnchor` | ~20 | Borderline. Fine. | — |
| `readAnchorsMap` | ~25 | Acceptable. | — |

The four inner lambdas inside the `role` case (`readBreak`, `readBreakInside`, `readDropCap`, `readNumbering`) aren't reusable, can't be tested in isolation, and add nesting depth. The user's rule #2 ("explicit steps via in-scope lambdas") was about *helping read the function* — these lambdas aren't in scope for the rest of the file and act more like leftover scaffolding. Promote to module-level helpers.

**Recommended split:**

```
src/template/
├── render.ts                  — renderTemplateToIR
├── host-config.ts             — templateHostConfig + appendTemplateChild + insertBeforeInList
├── node-factories/
│   ├── index.ts               — createTemplateNode (dispatch table: { page: pageNode, "page-set": pageSetNode, ... })
│   ├── page.ts                — pageNode, pageSetNode, pageRuleNode
│   ├── regions.ts             — regionNode, stackNode, columnsNode, columnNode, layerNode, fixedNode
│   ├── margin-matter.ts       — headerNode, footerNode
│   ├── reference.ts           — bibliographyNode, tocNode, listOfNode, indexTemplateNode
│   ├── decorations.ts         — fontNode, imageNode, runningNode, pageNumberNode, pageCountNode
│   ├── footnotes.ts           — footnoteAreaNode, sidenoteAreaNode
│   ├── rules.ts               — roleRuleNode (extract the four inner readers as module-level fns), pageRuleNode
│   └── slot.ts                — slotNode + validateSlotName
└── prop-readers.ts            — read*/merge* helpers
```

---

### 4. `src/content/render.ts` — 807 lines, 8 functions

**Responsibility mix:**
- node factories — `createContentNode`
- grammar enforcement — `appendSemanticChild` (parent-kind × allowed-child-kinds matrix)
- reconciler boilerplate — `contentHostConfig`
- orchestrator — `renderContentToIR`

**Functions over 20 lines:**

| Function | ~LOC | Issue | Category |
|---|---|---|---|
| `createContentNode` | **~324** | 27-case switch. Same shape as `createTemplateNode`. Each case 5–25 lines. | B |
| `appendSemanticChild` | **~223** | 14-branch switch on parent kind, each branch listing 7–14 `child.kind !== "..."` checks. **The "allowed inline primitives" and "allowed block primitives" sets are repeated 4–5 times** — pure copy-paste. The size *is* the redundancy. | A + B |
| `renderContentToIR` | ~35 | Composition orchestrator. Fine. | — |

**Recommended split:**

```
src/content/
├── render.ts             — renderContentToIR
├── host-config.ts        — contentHostConfig
├── node-factories.ts     — createContentNode as dispatch table + per-kind constructor functions
├── grammar.ts            — { parentKind → Set<allowedChildKind> } table + appendSemanticChild as one-line dispatch
└── ir.ts                 — (unchanged)
```

The grammar refactor is high-value: today's `appendSemanticChild` makes it impossible to see the grammar at a glance. After refactor it's literally a lookup table.

---

### 5. `src/public/jsx.d.ts` — 709 lines

**Responsibility mix:** half the file (~250 lines) is per-intrinsic prop type declarations — that's an irreducible glossary. The other half is **the same 60-entry `IntrinsicElements` block copy-pasted four times** (~115 lines × 4 = ~460 lines):

1. `declare module "react" { namespace JSX { interface IntrinsicElements { ... } } }`
2. `declare module "react/jsx-runtime" { namespace JSX { interface IntrinsicElements { ... } } }`
3. `declare module "react/jsx-dev-runtime" { namespace JSX { interface IntrinsicElements { ... } } }`
4. `declare global { namespace JSX { interface IntrinsicElements { ... } } }`

Byte-identical. Adding one intrinsic = four edits. Pure category-A.

**Fix:**
```ts
// Define once.
interface ReactDocIntrinsics {
  document: DocumentProps;
  section: SectionProps;
  /* …60 entries… */
}

// Reference four times.
declare module "react" {
  namespace JSX { interface IntrinsicElements extends ReactDocIntrinsics {} }
}
declare module "react/jsx-runtime" {
  namespace JSX { interface IntrinsicElements extends ReactDocIntrinsics {} }
}
// …same for jsx-dev-runtime and the global namespace
```

Cuts the file from ~709 → ~360 lines and makes new-primitive additions a one-line change. Zero risk.

---

## Tier 2 — Long files that are mostly flat declarations

Over 350 lines but not deeply problematic — long because there are many types. Split if it improves navigation.

### 6. `src/resolver/ir.ts` — 589 lines
Already split per-node type. Consider grouping into `ir/inline.ts`, `ir/block.ts`, `ir/template.ts`, `ir/page.ts`, exported from `ir/index.ts`.

### 7. `src/template/ir.ts` — 422 lines
Same pattern. Lower priority than the resolver IR (templates are less central to extending).

---

## Tier 3 — Cross-cutting smells

These show up in multiple files; fix once they're worth a sweep.

### A1. Repeated `(props as Record<string, unknown>)` casts
Both `content/render.ts` and `template/render.ts` are full of these. Pattern: `const v = typeof (props as Record<string, unknown>).X === "string" ? ((props as Record<string, unknown>).X as string).trim() : "";`

Category: A + B. The repetition is the redundancy; the type-erasure incantation is the bad approach.

**Fix:** a small typed reader module:
```ts
getString(props, key): string | undefined
getRequiredString(props, key, intrinsic): string
getNumber(props, key): number | undefined
getBoolean(props, key): boolean | undefined
getObject<T>(props, key): T | undefined
```
Replaces ~80% of the inline cast noise. Could live in `src/public/prop-readers.ts` and be shared by both reconcilers.

### A2. Duplicate `insertBeforeInList`
Identical 14-line helper in `content/render.ts` and `template/render.ts`. Extract to a shared utility.

### A3. Two near-identical reconciler host configs
`contentHostConfig` and `templateHostConfig` differ only in `createInstance`, `createTextInstance`, `appendInitialChild`, `appendChild`, and `resetTextContent`. Everything else (~50 lines of boilerplate per file) is duplicated.

**Fix:** a `createReconcilerHostConfig<NodeT, ContainerT>({ scope, createInstance, createTextInstance, appendChild, resetTextContent, containerOps })` factory. Saves ~80 lines total, and changes to reconciler shape only need to land in one place.

### D. Spread-on-optional pattern
`...(x != null ? { x } : {})` appears literally hundreds of times across `resolve.ts`, `template/render.ts`, `content/render.ts`. It's verbose but not wrong; only worth a sweep if other refactors are already touching the same code.

**Possible fix:** `compact({ x: maybeUndefined })` helper that strips `undefined` keys. Replaces 3–8 lines per node construction with one. Diminishing returns; low priority.

### B3. State-as-module-variable
`currentRegimeFlows` in `html/render.ts`. Also some `let katexImpl` cache (less harmful — it's a singleton).

**Fix:** `currentRegimeFlows` → thread a `RenderCtx` through. Optional `lazy<T>(loader)` for `katexImpl` if you want to standardise lazy singletons elsewhere.

### A4. Two parallel implementations of container rendering
`wrapRegimeContainer` (in regime-flow code) re-implements `renderRegionNode` / `renderStackNode` / `renderColumnsNode` / `renderColumnNode` / `renderFixedNode`. Same CSS, same structure, different inner content.

The 1553-line `html/render.ts` was big enough to hide a 50-line copy of code that already existed 700 lines away. The size enabled the redundancy.

**Fix:** the container renderers should take an `innerHtml: string` argument (or a `renderChildren: () => string` thunk) so both call sites use the same emitter. Eliminates the second copy entirely.

### B4. `bodyState: { consumed: boolean }` wrapper-as-mutable-ref
The wrapper object exists solely so the `consumed` flag survives across spread-copies of `ctx`. It's a workaround for the spread pattern. Reads as opaque.

**Better approach:** keep a stable mutable object inside the resolver and read/write it directly, *or* lift body-stream emission to a post-resolution step that doesn't need the flag at all.

### B6. Stale `as` casts past discriminator narrowing
Examples in `resolve.ts`: `(child as { children: ResolvedContentNode[] })` after a `kind === "ref-entry"` check; `node as unknown as { refKey: string; children: ResolvedInlineNode[] }`. These are tells that the IR union members aren't being narrowed correctly — possibly missing fields on `ResolvedContentNode` or a too-wide union somewhere.

**Better approach:** make the union members fully describe their fields so `node.kind === "X"` narrows to a struct without further casting.

---

## Tier 4 — Hard-to-intuit names

Names where a reader has to read the function body to understand what it does. Reader-tax > writer-tax.

| Current | Suggested | Why |
|---|---|---|
| `applyResolvedRules(node, rules)` | `assignRoleVariants(node, rules)` or `tagNodesWithVariants` | "Resolved" modifies the *target* not the rules; "rules" is generic but the function specifically applies role→variant assignments. Reads as "apply already-resolved rules" which is wrong. |
| `stampSectionIdsAndCollectToc` | split into `assignSectionIds` + `collectTocEntries` | "Stamp X and collect Y" advertises two responsibilities. If kept as one function, `assignIdsAndIndexToc` is at least less jargony. |
| `stampListOfAndCollect` | `assignAutoIdsAndCollectListOf` (or split) | "Stamp list of" parses as a fragment. "List of" alone doesn't name what it operates on. |
| `stampIndexAnchorsAndCollect` | `assignIndexAnchorsAndCollect` (or split) | "Stamp" is jargon for "assign an id"; not obvious to a new reader. The whole `stamp*` family wants either `assign*` or `mint*`. |
| `stampSectionIdsInSlotMap` / `stampListOfInSlotMap` / `stampIndexAnchorsInSlotMap` | rename per above | Same `stamp` issue, plus "InSlotMap" is a scope marker, not a verb; reads awkwardly. |
| `appendTemplateChild` vs `appendChildToTemplateContainer` | `appendToParentNode` vs `appendToRootContainer` | Two different jobs (node-vs-container) but the names are nearly identical. First reading suggests they're the same. |
| `appendSemanticChild` vs `appendChildToContainerNode` | same pattern, same fix | Mirror of the template-side names; same ambiguity. |
| `resolveTemplateChild` vs `resolveTemplateNode` | `expandTemplateChild` vs `resolveTemplateContainer` | The former fans out (returns `ResolvedChild[]`) and may produce many or zero nodes; the latter returns exactly one container. The names hide that distinction. "Expand" surfaces fan-out. |
| `formatToContent` | `numberingFormatToCssContent` | "Format" and "content" are both overloaded — could be anything. Specific: it converts a `numbering.format` template-string to a CSS `content:` declaration. |
| `buildVariantRulesCss` | `buildRoleVariantCss` | "Rules" overloads with `<rules>` JSX element AND with the resolver's `RuleMaps`. The output is per-variant CSS; the input is role rules. Naming the *output domain* is clearer. |
| `bodyState: { consumed: boolean }` | inline as a `bodyConsumedFlag` boolean ref; drop the wrapper object | The `State` wrapper hides that this is a single mutable boolean. |
| `renderRegimeFlowChild` | `renderRegimeFlowNode` | "Child" suggests structural position; the function actually dispatches on `kind` like any node renderer. |
| `pageRegimes` vs `regimeFlows` | `regimeDeclarations` vs `regimeFlowTemplates` | The two are different layers of the same concept (declared regime vs. its body-flow template). Current names sound interchangeable in skim-reading. |
| `RoleRule` (resolver internal) vs `RoleRuleNode` (template IR) vs `ResolvedRoleVariantRule` (resolver output) | `RoleRuleDecl` / `CompiledRoleRule` / `VariantCss` (or keep template IR name and rename only the others) | Three names for "a role rule at three pipeline stages" with no shared root word. New readers can't tell at a glance which is which. |
| `directMap` (in `html/render.ts`) | `cssPropertyMap` or `styleKeyToCssDeclaration` | "Direct" hints that this is the unmediated style passthrough, but the constant's actual content is "JS style key → CSS property name." A new reader has to read the body to confirm. |

### Naming patterns that are *good* and worth preserving as conventions

- `render*Node` for HTML emission per IR node.
- `resolve*Node` for IR → resolved IR.
- `build*Css` for CSS string builders.
- `collect*` for tree walks that produce a list/set.
- `read*` for prop-reading helpers in the template/content factories.
- `*ToCss` / `*ToInlineCss` for style serialization.

These already form a working vocabulary. The renames above mostly target functions that *don't* follow these conventions — once they do, the codebase reads more uniformly.

---

## Tier 5 — Second-pass complements

### 8. `src/cli/run-file.tsx` — 232 lines (under threshold)

Functions are well-sized. `runExternalFile` is ~40 lines (mostly orchestration of read → resolve → write). Acceptable.

**One A-smell:** `getDocumentComponent` and `getExternalTemplateComponent` are near-duplicates — both look for a candidate among `default`/`Content`/`content` or `Template`/`template`. Extract:
```ts
function pickComponent(mod: ExternalDocumentModule, names: string[]): React.ComponentType | null
```
Eliminates ~30 lines of duplication. Low priority; bundle with another touch.

### 9. `src/backends/pdf/render.ts` — 134 lines (under threshold)

`buildPdfFromHtml` is ~57 lines and mixes five steps: dynamic puppeteer load, browser launch options, HTML→temp file→navigate, Paged.js poll, PDF emit + cleanup. Category B.

The inline `evaluate(...)` string is a hand-written Paged.js polling loop. It's correctly written-as-source-string (the comment explains why — tsx/esbuild helpers would otherwise leak in), but it's hidden inside the main function instead of named.

`dumpHtmlBesidePdf` and the bottom-of-file `pathToFileURL` re-export feel orphaned — they're not referenced from anywhere I see. Worth a dead-code check.

**Fix:**
```ts
async function withTempHtmlFile<T>(html: string, dir: string, fn: (url: string) => Promise<T>): Promise<T>
async function waitForPagedJs(page: PageLike, timeoutMs: number): Promise<void>
async function launchBrowser(options: BuildPdfOptions): Promise<BrowserLike>
```

Then `buildPdfFromHtml` becomes a 12-line orchestrator. Touch it next time you're debugging a PDF.

### 10. `tests/pipeline.test.tsx` — 621 lines, 18 tests

The audit rules apply to tests too. This is the "everything-after-resolve" integration suite. Tests touch resolver output AND HTML backend AND CSS rules. That's three separate concerns in one file.

**Suggested split:**
```
tests/
├── resolver-integration.test.tsx   — slot fill, role rules, page-set/regimeFlows
├── html-css.test.tsx               — @page rules, margin matter, variant CSS, columns, fonts
├── html-content.test.tsx           — emitted content (figures, tables, math, links)
├── reference-graph.test.tsx        — toc, list-of, index, cite/bibliography, refs
└── pipeline.test.tsx               — kept for true end-to-end smoke tests
```

The recent rewrite of "resolver applies role rules and stores page-set body flow as a per-regime template" already belongs in the resolver split.

### 11. `tests/content-render.test.tsx` — 444 lines, 13 tests

Flat list of `content renderer supports X` tests, each a `renderContentToIR(...)` → `assert.deepEqual(...)`. Tests themselves are short and clear; the file is monotonous but uniform — no redundancy in the audit sense. Lower urgency than `pipeline.test.tsx`.

If you do split:
```
tests/content-render/
├── block.test.tsx        — document, section, p, figure, table, list, defs, code-block, pre, heading
├── inline.test.tsx       — em, strong, code, link, br, sub, sup, img, ref, m, cite
├── routing.test.tsx      — role/page/variant/id propagation, page-break
└── grammar.test.tsx      — "rejects non-document root", "rejects block in p", etc.
```

### 12. Magic strings (`node.kind === "section"` etc.) — examined, rejected

Discriminated unions on string kinds are *the* TypeScript IR pattern. Exhaustive switch narrowing, readable JSON when debugging, clean stack traces. Replacing with `const enum Kind` or symbols would harm all three for no real win.

The actual pain — `appendSemanticChild` repeating the same `"paragraph"|"figure"|"list"|...` allowed-set five times — is **not** a magic-string problem. It's a grammar-table problem already flagged in Tier 1 #4.

### 13. `throw new Error(...)` density — examined, rejected

Sweep counts:
- `content/render.ts`: 35
- `template/render.ts`: 28
- `resolve.ts`: 5
- `html/render.ts`: 4

The content + template throws are validation-on-construction inside the giant `createXxxNode` switches. They aren't generically reusable: each error message is per-intrinsic and per-prop and that's how you want it. Once the giant switches split into per-intrinsic constructor functions (Tier 1 #3 and #4), the throws live alongside their construction code, which is the right place for them.

Not a separate refactor target. Falls out for free with #3 and #4.

### 14. Registries (`fonts/registry.ts`, `template/registry.ts`) — clean

Both ~28 lines, single `Map`, three functions. No smell.

---

## Prioritization

Suggested order — high impact, low coupling first:

1. **Cross-cutting A3** (shared reconciler host-config factory) — single deduplication, lands cleanly, makes Tier 1 #3 + #4 easier.
2. **Tier 1 #5** (`jsx.d.ts` 4× block) — DRY the four `IntrinsicElements` blocks. ~5 minute mechanical change, ~350 lines saved.
3. **Cross-cutting A2** (`insertBeforeInList` dedup) — one-line lift.
4. **Tier 1 #4** + **Cross-cutting A1** (`content/render.ts` split + grammar table + typed prop readers).
5. **Tier 1 #3** (`template/render.ts` split — `createTemplateNode` → per-intrinsic factories, role-case inner lambdas to module level).
6. **Cross-cutting A4** (unify container rendering between regular renderers and `wrapRegimeContainer`) — prerequisite for cleanly splitting `html/render.ts` regime-flow code.
7. **Tier 1 #1** (`html/render.ts` split) — biggest file. Do this after A4.
8. **Cross-cutting B3** (`currentRegimeFlows` → `RenderCtx`) — folds into step 7.
9. **Tier 1 #2** (`resolver/resolve.ts` split). After #1, the dispatch-map and `withVariant` patterns will be established.
10. **Cross-cutting B4** (`bodyState` wrapper) — folds into step 9.
11. **Tier 4 naming sweep** — bundle each rename with whichever refactor is touching that call site (don't do a standalone naming PR).
12. **Tier 5 #10** (`pipeline.test.tsx` split by concern).
13. **Tier 5 #9** (`pdf/render.ts` extract `withTempHtmlFile`, `waitForPagedJs`, `launchBrowser`).
14. **Tier 5 #8** (`cli/run-file.tsx` `pickComponent` helper).
15. **Cross-cutting D** (`compact` helper for spread-on-optional) — only if other refactors are already in the same files.
16. **Cross-cutting B6** (stale `as` casts) — fix as you encounter them, not as a standalone pass.
17. **Tier 5 #11** (`content-render.test.tsx` optional split).
18. **Tier 2** — IR type files, only if file-length actively bothers navigation after Tier 1 is done.

Each step is independently shippable. Run `npm run test && npm run mockup:all` after each — PDF sizes should remain ≥ ~30 KB (a drop to ~900 B means content was silently dropped).
