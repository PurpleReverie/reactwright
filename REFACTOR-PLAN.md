# ReactDoc — Refactor Plan

Source of findings: `AUDIT.md`. This document turns those findings into ordered, shippable phases.

## How to read this plan

Each phase is one shippable unit (one PR, possibly multiple commits). A phase has:

- **Goal** — one line: what is true after this lands that wasn't true before.
- **Audit refs** — which AUDIT.md findings this phase resolves.
- **Steps** — numbered, in order. Each step is a discrete edit.
- **After-state** — concrete file/code shape post-phase.
- **Validation gate** — exact commands + expected results. If the gate fails, do not merge.
- **Out of scope** — explicit list of things tempting to fold in but that belong to a later phase.

Phases are ordered by **dependency**, not by impact. Earlier phases install patterns (shared helpers, naming conventions) that later phases consume. Don't skip ahead.

## Conventions established up front

Adopted across all phases. Calling them out here so every phase can refer back.

### Naming verbs

| Verb | Use for | Example |
|---|---|---|
| `render*` | IR-node → HTML/string emission | `renderSectionNode` |
| `resolve*` | content IR + template IR → resolved IR | `resolveTemplateNode` |
| `build*` | construct a CSS string / config block | `buildAtPageRule` |
| `collect*` | walk a tree, return a list/set | `collectMarginMatter` |
| `assign*` | walk a tree, mutate fields (replaces `stamp*`) | `assignSectionIds` |
| `read*` | extract a typed value from raw `props` | `readFixedAnchor` |
| `get*` | pure lookup against a registry/map | `getTemplateIntrinsic` |
| `*ToCss` / `*ToInlineCss` | style serialization | `coordinateAnchorToCss` |

New code must follow these. Renames of existing functions land in the phase that touches that function's call sites — **no standalone rename PR**.

### Validation gate (run after every phase)

```
npm run check          # tsc --noEmit; must be clean
npm run test           # all 47+ tests pass
npm run mockup:all     # all 9 mockups produce PDFs ≥ ~30 KB
```

If any mockup PDF drops to ~900 B, content was silently dropped — revert. The threshold is enforced by visual inspection of the `build/mockups/` sizes after each phase.

### Project structure rules

These rules apply every time a phase creates a new file or directory. The goal is a tree where a glance at `ls src/<concern>/` tells you what's in there without opening anything.

1. **The directory name carries the verb. Files inside name the concern.** Inside `src/resolver/` use `rules.ts`, not `resolve-rules.ts`. Inside `src/backends/html/` use `css.ts`, not `render-css.ts`. The directory already says "resolve" / "render"; repeating it on every filename is noise.
2. **One entry-point file per concern, named after the concern.** `content/render.ts`, `template/render.ts`, `resolver/resolve.ts`, `backends/html/render.ts`. Always the orchestrator that ties the rest together. Never a hub of helpers.
3. **Flat layout up to ~4 files in a concern; subdirectory beyond that.** Below the threshold, a flat directory is faster to scan. Above it, group into named subdirectories. The threshold isn't strict — use judgment when one file is much larger than the others.
4. **Subdirectories also follow rule 1.** `template/factories/page.ts`, not `template/factories/template-page-factory.ts`.
5. **Cross-cutting helpers live in `src/shared/`.** Anything imported by more than one concern. Don't grow this — three or four files maximum; if it bloats, the helper probably belongs inside a concern.
6. **Don't deepen the tree past three levels.** `src/backends/html/` is the floor; no `src/backends/html/render/content/`.
7. **`index.ts` only re-exports.** Use it inside a subdirectory to give the parent a single import point. Never put logic there.

### Out-of-scope guardrails

Across all phases, **do not**:
- Rename existing functions outside the phase that touches their call sites.
- Add `compact()` or any other small DRY helper unless its first consumer is also in this PR.
- Change behavior. These are mechanical refactors. Behavior changes belong in separate PRs with their own tests.
- Touch the `docs/spec.md`. Spec evolution is a separate workstream.
- Deepen the directory tree past the structure shown in "Target project structure" below.

---

## Target project structure (after all phases land)

This is what `src/` looks like after phase 7. Every phase's "After-state" block should converge on this tree; if a phase's output diverges from this shape, the phase is wrong, not the tree.

```
src/
├── index.ts                          (public package entry)
├── shared/                           — cross-cutting helpers
│   ├── prop-readers.ts
│   ├── reconciler-host-config.ts
│   └── insert-before.ts
├── content/                          — JSX → content IR
│   ├── render.ts                       orchestrator: renderContentToIR
│   ├── host-config.ts                  reconciler wiring
│   ├── grammar.ts                      parent→allowed-children table + appendSemanticChild
│   ├── factories.ts                    per-intrinsic node constructors (dispatch table)
│   └── ir.ts                           type definitions
├── template/                         — JSX → template IR
│   ├── render.ts                       orchestrator: renderTemplateToIR
│   ├── host-config.ts
│   ├── prop-readers.ts                 template-specific readers (anchors, when, ...)
│   ├── registry.ts                     custom intrinsic registry
│   ├── factories/                      per-intrinsic constructors
│   │   ├── index.ts                    dispatch table + createTemplateNode export
│   │   ├── page.ts
│   │   ├── regions.ts
│   │   ├── margin-matter.ts
│   │   ├── reference.ts
│   │   ├── decorations.ts
│   │   ├── footnotes.ts
│   │   ├── rules.ts
│   │   └── slot.ts
│   └── ir.ts
├── resolver/                         — content IR + template IR → resolved IR
│   ├── resolve.ts                      orchestrator: resolveDocument
│   ├── inline.ts                       inline node resolvers
│   ├── block.ts                        block content node resolvers
│   ├── template.ts                     expandTemplateChild + resolveTemplateContainer
│   ├── rules.ts                        RuleMaps + assignRoleVariants + withVariant
│   ├── collect.ts                      assign*/collect* (id stamping, toc, lof, index, refs)
│   ├── anchors.ts                      resolveFixedAnchor + normalizeCoordinate
│   └── ir.ts
├── backends/
│   ├── html/                         — resolved IR → HTML for Paged.js
│   │   ├── render.ts                   orchestrator: renderResolvedToHTML + RenderCtx
│   │   ├── content.ts                  per-content-kind renderers
│   │   ├── inline.ts                   per-inline-kind renderers
│   │   ├── template.ts                 per-template-kind renderers
│   │   ├── regime-flow.ts              renderRegimeFlowNode + wrapInRegimeFlow
│   │   ├── css.ts                      build*Css + styleToInlineCss + cssPropertyMap
│   │   ├── collectors.ts               collect*
│   │   ├── fonts.ts                    buildFontHeadTags + KaTeX glue
│   │   └── utils.ts                    escapeHtml, anchorToCss, normalizeImageSrc, idAttr
│   └── pdf/                          — HTML → PDF
│       └── render.ts                   buildPdfFromResolved + buildPdfFromHtml + small helpers
├── cli/
│   └── run-file.tsx                    CLI entry: runExternalFile
├── fonts/
│   └── registry.ts                     font definition registry
├── public/                           — package public surface
│   ├── contract.ts
│   └── jsx.d.ts                        (post phase 1: ~360 lines, single ReactDocIntrinsics)
├── types/                            — third-party ambient typings
│   ├── react-reconciler.d.ts
│   └── reactdoc-jsx.d.ts
└── examples/                         — small runnable demos
    ├── minimal.tsx
    ├── template.tsx
    ├── resolve.tsx
    └── html.tsx
```

**Top-level rule:** ten directories at the `src/*` level, each with a single clear responsibility named by the directory itself. New work fits in one of these or warrants explicit promotion to a new sibling — no nesting underneath an existing concern just to "find a place" for it.

A new phase that wants to add a directory not on this tree needs to justify it in the phase description.

---

## Phase 0 — Prelude: shared helpers

**Goal:** create the small shared modules that phases 1–9 will consume. Lands first so later phases can import freely.

**Audit refs:** A1, A2, A3 (cross-cutting), A7 (cross-cutting).

**Steps:**

1. Create `src/shared/` directory.
2. Add `src/shared/prop-readers.ts` with typed reader helpers:
   ```ts
   export function getString(props: object, key: string): string | undefined
   export function getRequiredString(props: object, key: string, intrinsic: string): string
   export function getTrimmedString(props: object, key: string): string | undefined
   export function getNumber(props: object, key: string): number | undefined
   export function getBoolean(props: object, key: string): boolean | undefined
   export function getObject<T extends object>(props: object, key: string): T | undefined
   ```
   Each throws on the wrong type with a consistent message shape. Use these everywhere a `(props as Record<string, unknown>).X` cast appears today. **Do not import yet.** Consumers land in phases 2 and 3.
3. Add `src/shared/reconciler-host-config.ts`:
   ```ts
   export function createReconcilerHostConfig<NodeT, ContainerT, PropsT>(deps: {
     scope: string;
     createInstance: (type: string, props: PropsT) => NodeT;
     createTextInstance: (text: string) => NodeT;
     appendChild: (parent: NodeT, child: NodeT) => void;
     appendChildToContainer: (container: ContainerT, child: NodeT) => void;
     resetTextContent: (instance: NodeT) => void;
     containerOps: { /* insertBefore, removeChild, etc. */ };
   }): HostConfig
   ```
   The ~50 lines of identical boilerplate from `contentHostConfig` and `templateHostConfig` live here. Phase 2 and 3 each shrink to a ~15-line `createXxxHostConfig(deps)` call.
4. Add `src/shared/insert-before.ts` with the canonical `insertBeforeInList<T>(items, child, beforeChild)` and delete the two existing copies in phases 2 and 3.

**After-state:**
```
src/shared/
├── prop-readers.ts
├── reconciler-host-config.ts
└── insert-before.ts
```
Nothing imports them yet. Phase 0 is a pure addition.

**Validation gate:** standard. New files don't affect mockups.

**Out of scope:** any consumer migration. The point of phase 0 is to land the helpers cleanly without coupling to the larger refactors.

---

## Phase 1 — `jsx.d.ts` 4× block dedup

**Goal:** adding a new JSX intrinsic is a one-line change, not four.

**Audit refs:** Tier 1 #5.

**Steps:**

1. In `src/public/jsx.d.ts`, define `interface ReactDocIntrinsics { ... }` containing the 60-entry intrinsic table — exactly once, at the top.
2. Replace each of the four `interface IntrinsicElements { ... }` blocks (in `declare module "react"`, `"react/jsx-runtime"`, `"react/jsx-dev-runtime"`, and `declare global`) with `interface IntrinsicElements extends ReactDocIntrinsics {}`.
3. Leave per-intrinsic prop type declarations (`DocumentProps`, `SectionProps`, etc.) where they are — those are the irreducible glossary.

**After-state:**
- `jsx.d.ts` drops from 709 → ~360 lines.
- `npm run check:intellisense` (the consumer fixture) still passes.

**Validation gate:**
```
npm run check
npm run check:intellisense
npm run test
npm run mockup:all
```

**Out of scope:** consolidating prop type declarations (e.g. shared `ContentMetadataProps`). The 4× block fix is mechanical and contained; consolidating glossary entries is a follow-up.

---

## Phase 2 — `content/render.ts` split + grammar table

**Goal:** content grammar is readable at a glance; adding a content primitive touches one ~20-line file, not the middle of a 300-line switch.

**Audit refs:** Tier 1 #4 (`createContentNode`, `appendSemanticChild`), A1 (typed prop readers), A2 (host config factory), A3 (insertBeforeInList).

**Steps:**

1. Final `src/content/` layout (matches target tree):
   ```
   src/content/
   ├── render.ts             (orchestrator, ~30 lines)
   ├── host-config.ts        (new)
   ├── grammar.ts            (new)
   ├── factories.ts          (new — per-intrinsic constructors as a dispatch table)
   └── ir.ts                 (unchanged)
   ```
2. **`grammar.ts`** — declarative table:
   ```ts
   const INLINE_KINDS = new Set<SemanticKind>([
     "text", "em", "strong", "code", "link", "br",
     "sub", "sup", "img", "ref", "footnote", "m",
     "cite", "index", "sidenote"
   ]);
   const BLOCK_KINDS = new Set<SemanticKind>([
     "paragraph", "figure", "table", "blockquote", "list",
     "code-block", "pre", "defs", "heading", "math",
     "refs", "page-break", "set-running"
   ]);

   type GrammarRule = { allowed: Set<SemanticKind>; message: string };
   export const GRAMMAR: Record<SemanticKind, GrammarRule | "leaf"> = {
     paragraph: { allowed: INLINE_KINDS, message: "`p` may only contain inline primitives." },
     section:   { allowed: BLOCK_KINDS,  message: "`section` may only contain block primitives." },
     /* ... */
   };

   export function appendSemanticChild(parent: SemanticContainerNode, child: SemanticNode): void {
     // ~10 lines: lookup, allowed-check, push.
   }
   ```
3. **`factories.ts`** — replace `createContentNode` switch with a dispatch table:
   ```ts
   const FACTORIES: Record<string, (props: ContentProps) => SemanticNode> = {
     document: documentNode,
     section:  sectionNode,
     p:        paragraphNode,
     /* ... 27 entries */
   };
   export function createContentNode(type: string, props: ContentProps): SemanticNode {
     const factory = FACTORIES[type];
     if (factory == null) throw new Error(`Unsupported content intrinsic: ${type}`);
     return factory(props);
   }
   ```
   Each factory is a separately-named function in the same file. If `factories.ts` later grows past 350 lines, promote it to `factories/` (subdirectory, mirroring the template side) — but the rules of phase 9 apply: only if there's real pain.
4. **All factories** use `getString` / `getRequiredString` etc. from `src/shared/prop-readers.ts` — no `(props as Record<string, unknown>)` casts remain.
5. **`host-config.ts`** — wraps `createReconcilerHostConfig` from `src/shared/`, providing the content-specific `createInstance`, `appendChild`, and `resetTextContent` overrides.
6. **`render.ts`** keeps `renderContentToIR` (the orchestrator). Should drop to ~30 lines.

**After-state:**
- `content/render.ts` < 50 lines.
- `content/grammar.ts` < 100 lines (the table + the 10-line dispatch).
- `content/factories.ts` ~250 lines (will split in phase 9 only if real navigation pain).
- `content/host-config.ts` ~30 lines.
- Zero `(props as Record<string, unknown>)` in this module.
- `tests/content-render.test.tsx` passes unchanged.

**Validation gate:**
```
npm run test                          # content-render tests pass
npm run mockup:all                    # all PDFs healthy
# spot-check: grep -r "props as Record" src/content/  → empty
```

**Out of scope:**
- Splitting `factories.ts` further into a `factories/` subdirectory. Hold for phase 9 — only act if real navigation pain shows up.
- Renaming `appendSemanticChild` per Tier 4. This phase touches its definition, but the new shape is so much shorter that the rename pays off less. Defer the rename to whichever future phase touches its call sites.

---

## Phase 3 — `template/render.ts` split + role-case lambda promotion

**Goal:** same as phase 2 but for templates. `createTemplateNode` becomes a dispatch table; the four `role`-case inner lambdas become module-level helpers.

**Audit refs:** Tier 1 #3, A1, A2, A3, B (role-case inline lambdas).

**Steps:**

1. Final `src/template/` layout (matches target tree). Because template has many more intrinsics than content, `factories/` is a subdirectory from day one:
   ```
   src/template/
   ├── render.ts                  (orchestrator, ~30 lines)
   ├── host-config.ts             (new)
   ├── prop-readers.ts            (template-specific readers: readFixedAnchor, readMarginAnchor, etc.)
   ├── registry.ts                (unchanged)
   ├── factories/                 (per-intrinsic constructors)
   │   ├── index.ts               (dispatch table + createTemplateNode export)
   │   ├── page.ts                (pageNode, pageSetNode, pageRuleNode)
   │   ├── regions.ts             (region/stack/columns/column/layer/fixed)
   │   ├── margin-matter.ts       (header, footer)
   │   ├── reference.ts           (bibliography, toc, list-of, index-template)
   │   ├── decorations.ts         (font, image, running, page-number, page-count)
   │   ├── footnotes.ts           (footnote-area, sidenote-area)
   │   ├── rules.ts               (role-rule + page-rule)
   │   └── slot.ts                (slot + validateSlotName)
   └── ir.ts                      (unchanged)
   ```
2. **Promote role-case lambdas** to module-level functions in `factories/rules.ts`:
   ```ts
   function readBreakValue(props: object, key: string): BreakValue | undefined
   function readBreakInside(props: object): "auto" | "avoid" | undefined
   function readDropCap(props: object): RoleDropCap | undefined
   function readNumbering(props: object): RoleNumbering | undefined
   ```
   These are now reusable and individually testable. The `roleRuleNode` factory calls them directly.
3. Replace `(props as Record<string, unknown>)` casts with `src/shared/prop-readers.ts`. Template-specific readers (`readFixedAnchor`, `readMarginAnchor`, `readLayerWhen`, etc.) move to `template/prop-readers.ts` and use the shared primitives internally.
4. `host-config.ts` uses the shared factory from phase 0.
5. `render.ts` keeps only `renderTemplateToIR`.

**After-state:**
- `template/render.ts` < 50 lines.
- No file in `template/factories/` exceeds 200 lines.
- Zero `(props as Record<string, unknown>)` in this module.
- `tests/template-render.test.tsx` passes unchanged.

**Validation gate:** standard.

**Out of scope:**
- Renaming `appendTemplateChild` / `appendChildToTemplateContainer` per Tier 4. Same rationale as phase 2.
- Touching `ir.ts` — it's a Tier 2 file, not blocking anything.

---

## Phase 4 — Unify container rendering in `html/render.ts`

**Goal:** there is exactly one implementation each of region/stack/columns/column/fixed rendering. `wrapRegimeContainer` no longer duplicates the canonical renderers.

**Audit refs:** A4 (cross-cutting). **Blocks phase 5** — do not start phase 5 until phase 4 lands.

**Steps:**

1. Refactor `renderRegionNode`, `renderStackNode`, `renderColumnsNode`, `renderColumnNode`, `renderFixedNode` to accept an `innerHtml: string` parameter instead of computing children inline:
   ```ts
   function renderRegionNode(node: ResolvedRegionNode, innerHtml: string): string
   ```
   Existing call sites build `innerHtml` first (via `node.children.map(renderResolvedChild).join("")`) and pass it.
2. Refactor `renderRegimeFlowChild` so it walks the regime flow tree, calls the same canonical renderers, and substitutes the body-slot marker with the section HTML. Delete `wrapRegimeContainer` entirely.
3. Verify the rendered HTML for `mockups/story-bible.tsx` is identical (byte-compare `build/mockups/story-bible.html` before/after).

**After-state:**
- `wrapRegimeContainer` deleted.
- One implementation per container kind.
- `mockups/story-bible.html` byte-identical to pre-refactor.

**Validation gate:**
```
npm run mockup:story-bible
diff <pre-refactor html> build/mockups/story-bible.html  # must be empty
npm run mockup:all
```

**Out of scope:** any other split or rename in `html/render.ts`. This phase is one focused change so phase 5 can split a now-coherent file.

---

## Phase 5 — `html/render.ts` split + `RenderCtx`

**Goal:** the 1553-line file becomes 8 focused files; `currentRegimeFlows` module-level mutable becomes an explicit `RenderCtx`.

**Audit refs:** Tier 1 #1, B3 (currentRegimeFlows), A4 (already resolved in phase 4).

**Steps:**

1. Introduce `type RenderCtx = { regimeFlows?: Record<string, ResolvedChild[]>; depth: number; };` at the top of the new `render.ts`.
2. Thread `ctx: RenderCtx` through every renderer that needed `currentRegimeFlows` or `depth`. Delete the module-level `let currentRegimeFlows`.
3. Final `src/backends/html/` layout (matches target tree). The directory says "html"; the files don't need to repeat "render-":
   ```
   src/backends/html/
   ├── render.ts             (orchestrator: renderResolvedToHTML + RenderCtx type)
   ├── content.ts            (renderContentNode + per-content-kind renderers)
   ├── inline.ts             (renderInlineNode + per-inline-kind renderers)
   ├── template.ts           (renderResolvedChild + per-template-kind renderers)
   ├── regime-flow.ts        (renderRegimeFlowNode — renamed from renderRegimeFlowChild per Tier 4)
   ├── css.ts                (buildAtPageRule, buildPageRegimesCss, buildRoleVariantCss, buildRunningStringsCss, buildMarginMatterCss, buildFootnoteAreaCss, buildSidenoteAreaCss, styleToInlineCss, cssPropertyMap)
   ├── collectors.ts         (collectMarginMatter, collectAllLayers, collectUsedFontFamilies, collectTemplateFonts, collectRunningStringNames)
   ├── fonts.ts              (buildFontHeadTags + KaTeX glue)
   └── utils.ts              (escapeHtml, anchorToCss, marginAnchorToCssBox, coordinateAnchorToCss, normalizeImageSrc, idAttr, normalizePageSize)
   ```
4. Convert `renderResolvedChild`, `renderContentNode`, `renderInlineNode` from switches to dispatch maps inside their respective files. Each map is `Record<NodeKind, (node, ctx) => string>`.
5. Split `buildMarginMatterCss` into `marginMatterCssForOneSidedEntry(entry)` + `marginMatterCssForMirroredEntry(entry)`. Move both into `css.ts`.
6. Split `buildVariantRulesCss` into `variantBreakCss`, `variantNumberingCss`, `variantDropCapCss`, `variantStyleCss`. Move into `css.ts`.
7. Split `styleToInlineCss` into `directMapDeclarations(style)` + `stackDefaults(kind)`. Move into `css.ts`.
8. Split `renderSectionNode`: extract `wrapInRegimeFlow(sectionHtml, regime, ctx)`. The section renderer's body shrinks to "render heading + render children + (maybe) wrap."
9. Rename `directMap` → `cssPropertyMap` per Tier 4. Rename `renderRegimeFlowChild` → `renderRegimeFlowNode`. Rename `formatToContent` → `numberingFormatToCssContent`. Rename `buildVariantRulesCss` → `buildRoleVariantCss` (after the split in step 6 this only affects the exported orchestrator name).

**After-state:**
- No file in `backends/html/` exceeds 350 lines.
- No function in `backends/html/` exceeds 60 lines (with most well under 30).
- No module-level mutable variables. `RenderCtx` is explicit.
- The output HTML for all 9 mockups is byte-identical to pre-refactor.

**Validation gate:**
```
# byte-diff every mockup html
for m in treatise field-notes chapter-three newsletter cover ieee ieee-long long-form story-bible; do
  diff <pre-refactor> build/mockups/$m.html
done
npm run mockup:all
```

**Out of scope:** resolver-side changes. Save for phase 6.

---

## Phase 6 — `resolver/resolve.ts` split + `withVariant` + `bodyState` cleanup

**Goal:** the 1421-line resolver splits into 6 focused files; `applyResolvedRules` shrinks via `withVariant`; the `bodyState` wrapper goes away.

**Audit refs:** Tier 1 #2, B4 (bodyState), Tier 4 naming for `applyResolvedRules` and `stamp*`.

**Steps:**

1. Final `src/resolver/` layout (matches target tree). Same convention as `backends/html/` — directory says "resolve", files don't repeat it:
   ```
   src/resolver/
   ├── resolve.ts              (orchestrator: resolveDocument)
   ├── inline.ts               (per-inline-kind resolvers)
   ├── block.ts                (per-block-kind resolvers)
   ├── template.ts             (expandTemplateChild + resolveTemplateContainer as dispatch maps)
   ├── rules.ts                (RuleMaps + buildRuleMaps + applyRule + findMatchingRole + assignRoleVariants + withVariant + ROLE_ON_ELEMENT_KIND)
   ├── collect.ts              (assign*/collect* family — renamed from stamp*)
   ├── anchors.ts              (resolveFixedAnchor + normalizeCoordinate)
   └── ir.ts                   (unchanged for now; phase 8 if it ever splits)
   ```
2. **`withVariant(node, rules)`** in `rules.ts`:
   ```ts
   function withVariant<T extends { kind: string; role?: string; variant?: string }>(
     node: T, rules: RuleMaps
   ): T {
     if (node.role == null) return node;
     const apply = findMatchingRole(node.role, node.kind, rules);
     return apply != null ? { ...node, variant: apply } : node;
   }
   ```
   Then `applyResolvedRules` becomes ~30 lines: walk children, apply `withVariant`. The 14-case switch collapses to "do I have children worth walking? if yes, walk; if not, return."
3. **`bodyState` cleanup**: lift body-stream emission to a post-resolution step. After `resolveTemplateNode` returns, check whether the resolved children contain any expanded body content; if not but `regimeFlows.size > 0`, append the `body-stream` node. Delete `bodyState` from `ResolveContext`.
4. **Rename `stamp*` → `assign*`**:
   - `stampSectionIdsAndCollectToc` → split into `assignSectionIds(node, used)` + `collectTocEntries(node, depth, entries)`.
   - `stampListOfAndCollect` → `assignAutoIds(node, prefix, count, used)` + `collectListOfEntries(node, kind, buckets)`. Or keep combined as `assignAutoIdsAndCollectListOf`.
   - `stampIndexAnchorsAndCollect` → `assignIndexAnchors(node, counts) + collectIndexEntries`.
   - The `*InSlotMap` wrappers all become `*ForSlotMap(slots, ...)` for clarity (or just `applyXxxToSlotMap`).
5. **Rename `applyResolvedRules` → `assignRoleVariants`** per Tier 4. Update all call sites.
6. **Rename `resolveTemplateChild` → `expandTemplateChild`** (returns `ResolvedChild[]`, signals fan-out). Update call sites.
7. Convert the 25-case switch in `expandTemplateChild` to a dispatch map keyed on `kind`. Same for the 12-case switch in `resolveTemplateNode`.

**After-state:**
- No file in `resolver/` (except `ir.ts`) exceeds 350 lines.
- No function exceeds 60 lines.
- No `bodyState` wrapper.
- `tests/pipeline.test.tsx` passes (it tests `regimeFlows` shape — should still hold).

**Validation gate:** standard, plus:
```
grep -r "stamp" src/resolver/  # empty
grep -r "applyResolvedRules" src/  # empty
grep -r "bodyState" src/  # empty
```

**Out of scope:** Tier 2 split of `resolver/ir.ts`. Save for phase 9.

---

## Phase 7 — `pipeline.test.tsx` split + `pdf/render.ts` cleanup + `cli/run-file.tsx` `pickComponent`

**Goal:** small, mostly-mechanical hygiene that doesn't belong inside the larger phases.

**Audit refs:** Tier 5 #8, #9, #10.

**Steps:**

1. Split `tests/pipeline.test.tsx`:
   ```
   tests/
   ├── resolver-integration.test.tsx   (slot fill, role rules, page-set/regimeFlows)
   ├── html-css.test.tsx               (@page rules, margin matter, variant CSS, columns, fonts)
   ├── html-content.test.tsx           (figures, tables, math, links)
   ├── reference-graph.test.tsx        (toc, list-of, index, cite/bibliography, refs)
   └── pipeline.test.tsx               (true end-to-end smoke tests only)
   ```
   Each new file imports only what it needs. Run `npm run test` and confirm the test count is unchanged.
2. `pdf/render.ts`:
   - Extract `withTempHtmlFile`, `waitForPagedJs`, `launchBrowser` from `buildPdfFromHtml`.
   - `buildPdfFromHtml` shrinks to ~12 lines of orchestration.
   - Verify `dumpHtmlBesidePdf` and `pathToFileURL` re-export are dead (`grep -r dumpHtmlBesidePdf src/` etc.). Delete if unreferenced.
3. `cli/run-file.tsx`:
   - Extract `pickComponent(mod, names): ComponentType | null`.
   - `getDocumentComponent` and `getExternalTemplateComponent` each shrink to a one-liner.

**After-state:**
- No test file exceeds 350 lines.
- `pdf/render.ts`'s `buildPdfFromHtml` is < 20 lines.
- No dead-code re-exports.

**Validation gate:** standard.

**Out of scope:** `content-render.test.tsx` split (lower priority; only do it later if navigation pains return).

---

## Phase 8 — Tier 2 IR file splits (optional)

**Goal:** `resolver/ir.ts` (589) and `template/ir.ts` (422) split by category, only if file size still hurts navigation after phases 1–7.

**Audit refs:** Tier 2.

**Trigger:** skip this phase entirely unless someone has actively complained about jumping around in those two files since phase 6 landed. Long files of flat type declarations are tolerable.

**Steps (if triggered):**

1. Promote `src/resolver/ir.ts` to `src/resolver/ir/` (subdirectory; filenames don't need an `ir-` prefix because the directory says it):
   ```
   src/resolver/ir/
   ├── index.ts        (re-exports — entry point for `import { ... } from "./ir"`)
   ├── inline.ts       (ResolvedTextNode, EmNode, ... up through SidenoteNode)
   ├── block.ts        (ResolvedSectionNode, ParagraphNode, FigureNode, ...)
   ├── template.ts     (ResolvedRegionNode, StackNode, ColumnsNode, LayerNode, FixedNode, HeaderNode, FooterNode, ...)
   └── page.ts         (ResolvedPageNode, ResolvedPageRegime, ResolvedBodySlotNode, ResolvedBodyStreamNode)
   ```
   Existing `import ... from "./ir.js"` keeps working because `ir/index.ts` re-exports everything.
2. Same pattern for `src/template/ir/`.
3. Verify no consumer needs a deeper path than `./ir` — keep the rule-5 boundary that `index.ts` only re-exports.

**Validation gate:** standard. No behavior changes — purely module-graph rearrangement.

**Out of scope:** any IR type *changes*. This is rename-and-re-export only.

---

## Phase 9 — Long-tail tidy-up

**Goal:** the smaller renames and helpers that didn't fit naturally into a larger phase.

**Audit refs:** D (spread-on-optional), B6 (stale `as` casts), Tier 5 #11 (content-render.test.tsx split).

**Triggers:** these are opportunistic. Do not schedule them as a single PR; fold each into the next PR that touches the relevant code.

**Items:**

- `compact({ x: maybe })` helper for spread-on-optional pattern. Only adopt if a phase is already editing a node factory.
- Tighten `as` casts in `resolve.ts` once you understand why they were needed — usually points to an IR union member that should carry the missing field.
- Split `content-render.test.tsx` into `block/inline/routing/grammar` subfolders only if you start grepping past it.
- Naming sweep for anything not already covered (`pageRegimes` → `regimeDeclarations`, `regimeFlows` → `regimeFlowTemplates`, `RoleRule` family unification). Each rename folds into the PR that touches its call sites.

---

## Cross-phase checklist

Before merging any phase:

- [ ] `npm run check` clean.
- [ ] `npm run test` all green; test count not regressed.
- [ ] `npm run mockup:all` succeeds; all 9 PDFs in `build/mockups/` ≥ ~30 KB.
- [ ] If the phase touched the HTML backend, byte-diff at least one mockup HTML against pre-refactor.
- [ ] No new module-level `let` or `var`.
- [ ] No new `(x as Record<string, unknown>)` casts.
- [ ] No standalone renames — every rename rides along with a structural change.
- [ ] Phase scope respected. No "while I'm in here..." additions.

## Dependencies summary

```
Phase 0 (shared helpers) ──┬──> Phase 1 (jsx.d.ts)
                           ├──> Phase 2 (content/) ─┐
                           ├──> Phase 3 (template/) ┤
                           └──> Phase 7 (small wins) │
                                                    │
Phase 4 (unify containers) ─> Phase 5 (html/ split)│
                                                    │
Phase 5 ─> Phase 6 (resolver split)                 │
                                                    │
Phase 6 ─> Phase 8 (IR splits, optional)            │
                                                    │
Anywhere ─> Phase 9 (long tail, opportunistic) <────┘
```

Phases 1, 2, 3, 7 can ship in parallel after phase 0. Phase 4 must precede phase 5. Phase 5 should precede phase 6 so the dispatch-map pattern is already established. Phase 8 is optional and gated on actual navigation pain.

## Out of scope for the whole plan

These are deliberately excluded; they belong to separate workstreams:

- **Behavior changes.** Any change that affects the generated HTML/PDF is not a refactor and should be its own PR with its own tests.
- **Spec evolution.** `docs/spec.md` updates are a separate workstream.
- **Performance work.** Multi-pass tree walks, lazy KaTeX, etc. — separate concern.
- **Test coverage gaps.** Adding tests for currently-untested behavior (e.g. `regimeFlows` substitution edge cases) is its own PR.
- **Dependency-graph audit.** Whether content/ may import resolver/ etc. — separate concern.
- **Accessibility / output quality.** ARIA, semantic HTML — separate concern.

If any of these become blocking during a refactor phase, stop, capture the blocker as a follow-up issue, and continue the refactor in a way that preserves the blocker for later resolution.
