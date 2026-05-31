# Styling — Slice 1 Implementation Plan

Companion to `docs/styling-spec.md`. Implements the foundation layer of the styling spec: `<styles>` blocks, `<rule match className>`, and `className="..."` on JSX nodes. Pass-through CSS properties only. No promoted concepts yet (no `numbering`, `prefix`, `wrap`, `break`, `indent`, etc. — those land in slices 2–3).

After this slice, the IEEE template's "targets engine class directly" lines (~14 of 32) can move out of `customCss` into `<styles>` + `<rule>`. The other 18 lines stay in `customCss` until later slices.

## 1. Goals

1. Parser for a strict-subset CSS dialect (selectors over IR + property:value declarations).
2. New JSX primitives: `<styles>`, `<rule>`, plus a `className` prop on existing layout/content nodes.
3. A class-application pass that walks the resolved IR, evaluates rule selectors, and tags matching nodes with class names.
4. Lowering pipeline that emits the compiled CSS into the document `<style>` block.
5. The IEEE template migrates ~14 lines of customCss to the new system; existing customCss remains for the rest.
6. Captions become first-class IR nodes (decision #8 dependency).
7. Template-side `<row>` primitive added (horizontal-flex symmetric to `<stack>`).
8. Zero regression: all 47 existing tests pass; all 5 mockups produce byte-identical PDFs except where the IEEE template intentionally migrates a rule.

## 2. Non-goals

- Numbering, prefix/suffix, wrap, break, indent, text-flow, column-fit (slices 2–3).
- Deprecating `<role on=…>` (kept; later desugared to `<rule>` in slice 4).
- Deprecating `customCss` (slice 4).
- Importable stylesheets via `<styles src=…>` or typed import handle.
- Discriminated-union typing of `Match` per kind.
- Caption styling that requires `numbering` or `prefix` — captions are IR-selectable but styled via pass-through CSS only.

## 3. The dialect — slice 1 grammar

```
stylesheet     := (rule-block)*
rule-block     := selector-list "{" declarations "}"
selector-list  := selector ("," selector)*
selector       := atom (combinator atom)*
combinator     := whitespace      ; descendant ("within")
                | ">"             ; direct child ("parent")
                | "+"             ; adjacent sibling ("follows")
atom           := "." class-name
                | kind-name
                | kind-name "[" attr-test "]"
                | ":has(" selector ")"
                | ":not(" selector ")"
                | ":first" | ":last" | ":nth(" integer ")"
                | ":slot(" slot-name ")"
                | ":role(" role-name ")"
                | ":variant(" variant-name ")"
                | ":depth(" depth-test ")"
attr-test      := name | name "=" value
depth-test     := integer | "gte:" integer | "lte:" integer | integer "-" integer
declarations   := (declaration ";")*
declaration    := property ":" value
```

**Selector atoms map to `Match` keys:**

| CSS-form | `Match` shape |
|---|---|
| `paragraph` | `{ kind: "paragraph" }` |
| `section:depth(1)` | `{ kind: "section", depth: 1 }` |
| `cite[role=numbered]` | `{ kind: "cite", role: "numbered" }` |
| `cell[header]` | `{ kind: "cell", attr: { header: true } }` |
| `figure :has(caption)` | `{ kind: "figure", has: { kind: "caption" } }` |
| `section paragraph` | `{ kind: "paragraph", within: { kind: "section" } }` |
| `section > paragraph` | `{ kind: "paragraph", parent: { kind: "section" } }` |
| `section + paragraph` | `{ kind: "paragraph", follows: { kind: "section" } }` |
| `:slot(abstract) paragraph` | `{ kind: "paragraph", slot: "abstract" }` |
| `.masthead` | `{ class: "masthead" }` (for completeness; rare) |

**Declarations:** any CSS property name and value pair. Slice 1 is type-checked only against an allow-list of pass-through CSS properties (the same set already in `cssPropertyMap`). Unknown properties produce a build warning, not an error — the dialect is meant to grow.

**Out of scope for slice 1 grammar:**
- `@-rules` (no `@media`, `@import`, `@page` in `<styles>` — `@page` already exists on `<page page={...}>`).
- Nesting (no `& > .foo` form).
- `:is()`, `:where()`, `:nth-child()` (the limited `:nth(N)` is enough).
- Custom properties / CSS variables (`--foo: ...`).
- Vendor prefixes — engine adds them during lowering.

## 4. File plan

### New files

```
src/styles/
├── ir.ts            Match, SelectorAst, RuleAst, DeclarationAst, StylesheetAst types
├── parser.ts        parseStylesheet(input: string): StylesheetAst — hand-rolled lexer+parser
├── selector.ts      matchNode(node, match, context): boolean — IR-traversal selector evaluator
├── apply.ts         applyRulesToTree(content, rules): Map<nodeId, ClassName[]> — class application pass
├── lower.ts         lowerStylesheet(stylesheet, classBindings): string — emits CSS
└── index.ts         re-exports

tests/styles/
├── parser.test.tsx
├── selector.test.tsx
├── apply.test.tsx
└── lower.test.tsx
```

### Modified files

| File | Change |
|---|---|
| `src/content/ir.ts` | Add `CaptionNode { kind:"caption", children }` and make `caption` field on `figure`/`table` accept `string \| CaptionNode \| undefined` (backwards compatible). Add `className?: string` to all content nodes that can carry it. |
| `src/content/grammar.ts` | Add `caption` to allowed children of `figure` and `table`; `caption: { allowed: INLINE_KINDS }`. |
| `src/content/factories.ts` | Add `caption` factory; existing `figure`/`table` factories accept caption-as-node child. |
| `src/template/ir.ts` | Add `RowNode { kind:"row", gap?, style?, className?, children }`. Add `className?: string` field to every node that has `style?: TemplateStyle`. Add `StylesNode { kind:"styles", source: string }`, `RuleNode { kind:"rule", match: Match, className: string }`. |
| `src/template/factories/` | New file `styles.ts` (one factory for `<styles>`, one for `<rule>`). Extend `regions.ts` for `<row>`. |
| `src/template/grammar.ts` (or wherever child rules live) | Allow `<styles>` and `<rule>` as siblings of `<rules>`; allow them anywhere `<rules>` is allowed today. |
| `src/template/host-config.ts` | `<styles>` accepts a single text child (the CSS source). |
| `src/resolver/resolve.ts` | After existing resolution, call `applyRulesToTree` to compute per-node class bindings; store on `ResolvedPageNode.classBindings`. Promote caption strings on figure/table into `CaptionNode` IR (for back-compat with the existing prop-based API). |
| `src/resolver/ir.ts` | Add `classBindings: Map<nodeId, string[]>` and `stylesheet: StylesheetAst` to `ResolvedPageNode`. |
| `src/backends/html/render.ts` | Call `lowerStylesheet(page.stylesheet, page.classBindings)` and inject result into the style block, after `STATIC_DEFAULTS_CSS` and before `customCss`. Reads `node.className` and rule-applied classes for each rendered element. |
| `src/backends/html/template.ts` | New `renderRowNode` for the template-side `<row>` primitive. |
| `src/backends/html/content.ts` | New `renderCaptionNode`; existing `renderFigureNode`/`renderTableNode` emit child captions instead of attribute captions. |
| `src/public/jsx.d.ts` | New JSX intrinsics: `styles`, `rule`, `row`, `caption`. Add `className?: string` to all relevant prop types. |

## 5. TypeScript types

```ts
// src/styles/ir.ts

export type Match = {
  kind?: string;
  role?: string;
  variant?: string;
  depth?: number | { gte?: number; lte?: number };
  index?: "first" | "last" | number;
  id?: string;
  attr?: Record<string, unknown>;
  class?: string;

  follows?: Match;
  precedes?: Match;
  parent?: Match;
  within?: Match;
  has?: Match;
  slot?: SlotName;
  not?: Match;
  and?: Match[];
  or?: Match[];
};

export type DeclarationAst = {
  property: string;     // CSS property name (we don't enforce a typed enum here; slice 4 may)
  value: string;        // raw value text
  source: SourceLoc;    // for error messages
};

export type SelectorAst = Match;

export type RuleAst = {
  selectors: SelectorAst[];      // selector-list (comma-separated)
  declarations: DeclarationAst[];
  className?: string;            // set when the rule is `<rule className="x">`-style; null for raw CSS-selector form
  source: SourceLoc;
};

export type StylesheetAst = {
  rules: RuleAst[];
  classes: Map<string, RuleAst>; // .class-name → its rule (for className="x" lookup; duplicate-detection happens here)
};

export type SourceLoc = { line: number; column: number; file?: string };
```

```ts
// src/template/ir.ts additions

export type StylesNode = {
  kind: "styles";
  source: string;        // raw CSS text content
};

export type RuleNode = {
  kind: "rule";
  match: Match;
  className: string;
  // No declarations on <rule> itself in slice 1 — declarations live in a <styles> block
  // keyed by className. Slice 2 may add inline declaration support.
};

// And every layout-container and content node gains an optional className field.
```

## 6. Module structure & call flow

```
JSX reconciliation
  └─ template tree contains <styles> nodes and <rule> nodes (collected like <role>s)
  └─ content tree contains className props on nodes

Resolution (src/resolver/resolve.ts)
  ├─ existing: slot fill, role-rule application, anchor stamping, aggregate collection
  └─ new:
      ├─ collect StylesNodes and RuleNodes from template tree
      ├─ parse all <styles> source strings → StylesheetAst (parser.ts)
      ├─ for each RuleNode, register a (Match → className) binding
      ├─ walk resolved content tree, evaluate every (Match → className) binding,
      │  accumulate per-node class lists  (apply.ts)
      └─ store classBindings and stylesheet on ResolvedPageNode

Render (src/backends/html/render.ts)
  ├─ existing: build @page, body-text, margin-matter, etc.
  └─ new:
      ├─ lowerStylesheet(stylesheet, classBindings) → CSS string  (lower.ts)
      └─ inject CSS string into <style>, after STATIC_DEFAULTS_CSS, before customCss
```

## 7. Parser — hand-roll plan

A two-stage parser: lexer → AST builder. ~300 LOC total target.

### Lexer tokens

```
WS               whitespace
LBRACE   '{'
RBRACE   '}'
LPAREN   '('
RPAREN   ')'
LBRACKET '['
RBRACKET ']'
COLON    ':'
SEMI     ';'
COMMA    ','
GT       '>'
PLUS     '+'
DOT      '.'
EQ       '='
HYPHEN   '-'
IDENT    [A-Za-z_][A-Za-z0-9_-]*
STRING   "..."  or  '...'
NUMBER   integer | decimal
COMMENT  /* ... */     (stripped, not emitted)
```

### Parse functions

```
parseStylesheet()    → StylesheetAst
parseRuleBlock()     → RuleAst
parseSelectorList()  → SelectorAst[]
parseSelector()      → SelectorAst (one selector, combinators)
parseAtom()          → Partial<Match>
parsePseudoClass()   → Partial<Match>   (:slot, :role, :depth, etc.)
parseAttrTest()      → Partial<Match>
parseDeclaration()   → DeclarationAst
```

### Errors

Every parser function tracks `line` and `column`. Errors are `{ message, source: SourceLoc }`. Surface in build output with the source file (filled in by caller; the parser itself only knows offsets within the string).

### Test fixtures

```
tests/styles/parser.test.tsx covers:
  - simple class declaration:     .foo { color: red; }
  - element selector:             paragraph { font-size: 10pt; }
  - selector with pseudo:         section:depth(1) { ... }
  - attribute test:               cell[header] { ... }
  - multiple combinators:         figure > caption + paragraph { ... }
  - selector list:                .a, .b { ... }
  - :has, :not:                   figure:has(caption) { ... }
  - :slot:                        :slot(abstract) paragraph { ... }
  - comments stripped:            /* ... */ .foo { ... }
  - multiline declarations
  - duplicate-class error:        .foo { ... } .foo { ... }  → error
  - unknown property warning:     .foo { unknown-prop: 5; } → warning
  - invalid selector error:       .foo > { ... } → error with line:col
```

## 8. Selector evaluator — `matchNode`

```ts
function matchNode(node: ResolvedNode, match: Match, ctx: MatchContext): boolean
```

`ctx` carries the tree state needed for combinators:
```ts
type MatchContext = {
  parent: ResolvedNode | null;
  ancestors: ResolvedNode[];     // for `within`
  siblings: ResolvedNode[];      // for `follows`, `precedes`
  siblingIndex: number;
  rootSlot: SlotName | null;     // for `:slot(...)`
};
```

Algorithm:
1. Check atomic match keys against `node`. Fail fast on any miss.
2. Recurse into combinators with appropriate context.
3. Boolean operators (`and`/`or`/`not`) recurse on the same node.

Cost: O(rules × nodes × selector-depth). For our sizes (typically ~50 rules × ~1000 nodes × ~3 combinator depth) this is trivially fast at build time.

### Tests

```
tests/styles/selector.test.tsx covers:
  - kind match
  - role match
  - depth equality + range
  - attr test (boolean, string, number)
  - follows / parent / within / has
  - slot (after slot substitution)
  - not / and / or composition
  - nested combinators
```

## 9. Class application — `applyRulesToTree`

```ts
function applyRulesToTree(
  root: ResolvedDocumentNode,
  bindings: RuleBinding[]
): Map<NodeId, string[]>
```

`bindings` is the flat list of `(Match → className)` pairs collected from `<rule>` JSX nodes. The function walks the IR depth-first, evaluates every binding against every node, and accumulates per-node class lists.

Nodes need stable ids for the map key. We already stamp `id` during resolution (`assignIds`); slice 1 ensures every selectable kind has one.

### Tests

```
tests/styles/apply.test.tsx covers:
  - single binding applied to all matching nodes
  - multiple bindings, multiple classes per node
  - non-matching binding produces no class
  - className from JSX prop merges with rule-applied classes
```

## 10. Lowering — `lowerStylesheet`

```ts
function lowerStylesheet(
  stylesheet: StylesheetAst,
  classBindings: Map<NodeId, string[]>
): string
```

Per slice 1, the lowering is straightforward:
1. Each named class in the stylesheet emits a CSS class rule: `.{className} { property:value; ... }`.
2. Each raw-selector rule in `<styles>` (CSS-syntax form, no class) emits a CSS rule keyed off a generated marker class; the marker is applied to matching nodes during class application.
3. Pass-through CSS properties go through verbatim. Unknown properties are emitted with a build warning logged.

### Tests

```
tests/styles/lower.test.tsx covers:
  - named class → CSS class rule
  - raw selector → marker class + CSS rule
  - duplicate-class detection: parser error, never reaches lower
  - property warning, not error
  - output is deterministic byte order
```

## 11. JSX integration

### New intrinsics

```tsx
<styles>{`
  .section-head { font-size: 10pt; }
  paragraph:depth(1) { text-indent: 0; }
`}</styles>

<rule match={{ kind: "section", depth: 1 }} className="section-head" />

<region className="masthead">…</region>
```

### Type definitions (`src/public/jsx.d.ts`)

```ts
type StylesProps = { children: string };

type RuleProps = {
  match: Match;
  className: string;
};

type RowProps = {
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children?: ReactNode;
};

// Add className?: string to: RegionProps, StackProps, ColumnsProps,
// ColumnProps, LayerProps, FixedProps, HeaderProps, FooterProps,
// FigureProps, ParagraphProps, SectionProps, TableProps, RowProps (content),
// CellProps, FigureProps, CodeProps, EmProps, StrongProps, LinkProps,
// QuoteProps, ListProps, ItemProps, AbstractProps, MathProps,
// CiteProps, BibliographyProps, TocProps, ListOfProps, IndexProps,
// SidenoteAreaProps, FootnoteAreaProps.
```

(Long list; mechanical. A shared `WithClassName = { className?: string }` mixin reduces duplication.)

## 12. IEEE template migration — slice 1 portion

Of the 32 lines of `IEEE_CSS` in `mockups/ieee/template.tsx`, slice 1 migrates the ones expressible in pass-through CSS without our-dialect properties. That's the "targets engine class directly" lines plus a few simple "pure HTML/CSS" lines:

**Migrating to `<styles>`:**
- Title block (1 line)
- Abstract block + paragraph margin (3 lines)
- Body paragraph margin/indent — only the parts not needing `indent: first-line except-after`
- Inline code styling (1 line)
- Bibliography font-size + list reset (3 lines)
- Figure caption font-size, text-align (parts not needing prefix/suffix)

**Staying in `customCss` (slice 2/3):**
- All `numbering`/counter rules (`h2.reactwright-section-title::before`, etc.) — needs slice 2 `numbering` property
- `figure { break-inside: avoid }` — needs slice 2 `break:` property
- `table { table-layout: fixed }` — needs slice 3 `column-fit:` property
- `h2 + p { text-indent: 0 }` — needs slice 3 `indent: except-after`
- `a.reactwright-cite::before/after` — needs slice 2 `prefix`/`suffix`

Net: IEEE template's `customCss` shrinks from 32 to ~18 lines after slice 1. Full elimination at slice 3.

The migration commit is part of slice 1, after the engine work lands.

## 13. Test plan

### Unit tests (new)
- `tests/styles/parser.test.tsx` (~15 cases, see §7)
- `tests/styles/selector.test.tsx` (~12 cases, see §8)
- `tests/styles/apply.test.tsx` (~8 cases, see §9)
- `tests/styles/lower.test.tsx` (~6 cases, see §10)

### Integration tests (new)
- `tests/styles-integration.test.tsx`: parse a `<styles>` block + apply via `<rule>` + render HTML, assert resulting class rules and applied class attributes.

### Existing tests (unchanged)
All 47 tests must continue to pass. The class-application pass is additive; existing role-rule behavior is preserved.

### Mockup byte-diff
Run `npm run mockup:all` before and after; HTML outputs for the four non-IEEE mockups must be byte-identical. IEEE mockup is expected to differ; visually inspect via `snapshot:ieee-strict`.

## 14. Commit breakdown

Suggested ordering for ease of review. Each commit independently testable.

1. **IR foundation.** Add `CaptionNode`, template-side `<row>` to ir.ts files. Add `className?: string` field everywhere. Grammar updates. No new rendering or selectors yet.
2. **JSX intrinsics.** Add `styles`, `rule`, `row`, `caption` to JSX types. Add `className` to all relevant prop types via a `WithClassName` mixin.
3. **Parser.** `src/styles/parser.ts` + unit tests. Standalone module; no integration yet.
4. **Selector evaluator.** `src/styles/selector.ts` + unit tests. Operates on resolved-IR nodes; standalone.
5. **Class application.** `src/styles/apply.ts` + unit tests. Wires parser output to selector evaluator.
6. **Resolver integration.** Resolver collects `<styles>` + `<rule>` from template tree, runs apply, stores result on `ResolvedPageNode`.
7. **Lowering + render.** `src/styles/lower.ts` + `render.ts` injects compiled CSS. Integration test.
8. **Row + caption rendering.** Template-side `<row>` HTML, caption-as-node HTML.
9. **IEEE migration.** Move the eligible 14 lines from `IEEE_CSS` into `<styles>` + `<rule>`.
10. **Docs.** Update README's primitive list with `<styles>`, `<rule>`, `<row>`, `<caption>`; update CLAUDE.md.

Total estimate: ~10 commits, ~1,500 LOC added, ~50 LOC modified.

## 15. Smallest-spike-first

Before committing to all 10 above, run a spike that proves the architecture end-to-end with minimum scope. The spike:

```tsx
<page page={{ size: "a4" }}>
  <styles>{`
    .red { color: red; }
  `}</styles>
  <rule match={{ kind: "paragraph" }} className="red" />
  <slot name="body" />
</page>
```

```tsx
<document title="Spike">
  <p>This paragraph should be red.</p>
</document>
```

End state: PDF shows a red paragraph. Reaches every layer (parser, selector, apply, lower, render) with a single property and a single match key. ~200 LOC across the new modules. If this spike feels clumsy, the architecture needs revisiting before slice 1 proper.

After spike validates: proceed with commits 1–10 above.

## 16. Risks

1. **Caption-as-node migration breaks existing tests.** Several existing mockups use `caption?: string` on figure/table. The IR change must be backwards-compatible: if `caption` prop is a string, the resolver internally constructs a `CaptionNode`. New JSX form (`<figure><caption>...</caption></figure>`) is additive.
2. **Class-application performance.** O(rules × nodes × selector-depth) is fine for typical documents (~50 × ~1000 × ~3 ≈ 150k operations). For very large books with many rules, may need indexed selectors. Slice 1 doesn't optimize; revisit only if measurements show it matters.
3. **JSX `<styles>` child as string.** React's JSX child semantics — `<styles>{` ... `}</styles>` passes a string fine, but the host-config must extract it correctly. Reconciler test will need to confirm.
4. **`<rule>` ordering.** Rules can appear inside `<rules>` (legacy) or as direct siblings of `<rules>`. Need to confirm the template tree walk picks both up. (Resolver's `collectRulesFromChildren` already recurses; extending it to also collect `RuleNode`s is one switch case.)

## 17. Definition of done

- All four new modules implemented and unit-tested.
- IEEE template migrates eligible lines; `customCss` shrinks to ~18 lines.
- All 47 existing tests pass.
- New integration test passes.
- Four non-IEEE mockup HTML outputs byte-identical before/after.
- IEEE mockup visually verified via PNG snapshot.
- `npm run example:paper` produces unchanged-or-improved output.
- README + CLAUDE.md updated.

When all of the above is true, slice 1 is mergeable.
