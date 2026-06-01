# Reactwright Styling Spec

Status: design partly shipped, partly in-flight. Slice 1 complete (commits `b5ea69c..0e18292`); slice 2.1 (`6079464`), 2.2 (`85fa0f7`), and 2.3 (`0225491..48b6c36`) complete; slices 2.4 / 3 / 4 deferred. Architectural decisions in §10 are binding for all future slices.

## 1. Objective

Reactwright templates should describe styling for any paginated document — IEEE conference papers, scholarly books, magazines, newsletters, screenplays, recipe cards, legal briefs, technical reports — without authors ever writing target-specific CSS. The author's surface is "our CSS": a stylesheet dialect that operates on our typed semantic IR using our concept vocabulary. The engine compiles that dialect into whatever the rendering target needs (today: CSS Paged Media + Paged.js).

The current state achieves this only partially. Most templates eventually reach for the `customCss: "..."` escape hatch and start writing raw CSS that targets engine-generated class names like `.reactwright-section-title`, `figure figcaption`, `a.reactwright-cite::after`. That couples templates to engine internals and exposes authors to CSS quirks (text-align-last, break-inside, vendor prefixes, Paged.js fallbacks) that should never have been their problem.

This spec defines a single layered system to replace customCss.

## 2. Current state — audit

### 2.1 Styling surfaces that exist today

| Surface | Type | Emitted as | Used for |
|---|---|---|---|
| `style={...}` on layout nodes | `Record<string, unknown>` (untyped, with optional typed sub-groups merged via `mergeTemplateStyleGroups`) | inline `style="..."` on the element | one-off instance styling on `page`, `region`, `stack`, `columns`, `fixed`, `header`, `footer`, etc. |
| `page={...}` on `<page>` | `TemplatePageProps` | `@page { ... }` rule | page geometry (size, margins, orientation) |
| `typography={...}` on `<page>` | `TemplateTypographyProps` | `.reactwright-flow { ... }` rule | document-wide body text |
| `<role on=X match=Y apply=Z>` inside `<rules>` | `RoleRuleNode` | `[data-variant="Z"] { ... }` CSS class | semantic → presentation routing for a fixed set of IR kinds |
| `style.customCss: "..."` | string | appended verbatim to document `<style>` | escape hatch — raw CSS the engine doesn't know about |
| Engine-emitted structural classes | engine-internal | inline `class="reactwright-..."` on rendered HTML | indirectly target-able via customCss |

### 2.2 Engine-emitted structural classes

These classes are currently the de facto interface between custom CSS and engine-rendered content. They are documented nowhere and may rename at any time.

| Class | Applied to | Documented? |
|---|---|---|
| `reactwright-flow` | root content wrapper | no |
| `reactwright-document-title` | `<h1>` rendered from `<document title>` | no |
| `reactwright-section-title` | `<h2>` / `<h3>` from `<section title>` | no |
| `reactwright-chapter-title` | `<h2>` from `<section role="chapter">` | no |
| `reactwright-abstract` | div from `<abstract>` | no |
| `reactwright-cite` | `<a>` from `<cite>` | no |
| `reactwright-toc-entry`, `-toc-link`, `-toc-page` | TOC machinery (consumed by the `<Toc>` userland helper) | no |
| `reactwright-list-of-entry`, `-list-of-link`, `-list-of-page` | list-of-figures machinery (consumed by `<ListOf>`) | no |
| `reactwright-ref-number`, `-ref-page`, `-ref-title`, `-ref-number-and-page` | `<ref>` rendered forms | no |
| `reactwright-running-{name}-source`, `reactwright-running-{name}` | running-string source / sink | no |
| `reactwright-footnote`, `reactwright-sidenote` | floating note markers | no |
| `reactwright-math-block` | block math wrapper | no |
| `reactwright-page-number`, `reactwright-page-count` | counter sinks | no |
| `reactwright-index-pageref`, `reactwright-index-pagerefs` | index page-ref machinery | no |
| `data-variant="Z"` (attribute) | nodes whose role matched a `<role>` rule | partially |

### 2.3 What templates are forced to write today

Audit of `mockups/ieee/template.tsx` IEEE_CSS (32 lines of customCss). Categorised:

| Category | Lines | Examples |
|---|---|---|
| Targets engine class directly | ~14 | `h1.reactwright-document-title`, `.reactwright-abstract`, `.reactwright-cite::before/after`, `.reactwright-bibliography li::before` |
| Pure HTML/CSS selectors | ~12 | `figure figcaption`, `table caption::before`, `table th, td { word-wrap }`, `h2 + p` |
| Counter / generated-content plumbing | ~6 | `counter-increment`, `counter-reset`, `content: counter(..., upper-roman)` |

None of the customCss in any template uses concepts that are unique to that template. Every rule there could be expressed in a sufficiently rich declarative vocabulary.

### 2.4 Gaps the new spec must close

1. **No named-class abstraction.** Authors cannot define `class section-head { ... }` once and reference it from multiple places.
2. **Selector vocabulary is fixed.** `<role>` only matches `(role, kind)` pairs. Cannot express depth, sibling, descendant, positional, or boolean combinators.
3. **Declaration vocabulary is leaky.** Anything beyond the typed style record and the four enumerated role-rule fields (breakBefore, breakAfter, breakInside, numbering, dropCap) falls back to customCss.
4. **No promoted concepts.** Generated content (prefix/suffix), wrap (anchor/figure/quote), indent-except-after-heading, text-flow-with-last-line — all CSS soup the author shouldn't have to assemble.
5. **Engine class names are public.** Every template depends on `.reactwright-cite::after { content: target-counter(...) }` etc. Renaming the engine's internals would break templates.

## 3. The model

Three coordinated surfaces. The author picks the one that fits the binding.

### 3.1 One-off inline — `style={...}`

```tsx
<region style={{ padding: "8mm 12mm", backgroundColor: "#0f172a" }}>
  …
</region>
```

Used when an instance has a unique presentation. Existing API. Preserved as-is.

### 3.2 Named class — `<styles>` + `className`

```tsx
<styles>{`
  .masthead {
    padding: 8mm 12mm;
    background-color: #0f172a;
    color: white;
  }
`}</styles>

<region className="masthead">…</region>
<fixed className="masthead" anchor="top-left">…</fixed>
```

Used when a presentation is reused. Plain CSS-like blocks of named class definitions. Author references by name.

### 3.3 Pattern → class — `<rule match={...} className="X" />`

```tsx
<rule match={{ kind: "section", depth: 1 }} className="section-head" />
<rule match={{ kind: "section", depth: 2 }} className="subsection-head" />
<rule match={{ kind: "cite" }} className="cite" />
```

Used when a class should apply automatically to every IR node matching a pattern. No content tagging required.

The three surfaces share the same underlying type system and the same dialect. `style={...}` accepts any property the dialect defines. `<styles>` definitions use the same property names in CSS-block syntax. `<rule>` applies a class to a set of IR nodes.

## 4. The selector language

Selectors operate on the **resolved IR**, not on rendered HTML. The vocabulary is what the IR exposes; there are no element-name selectors, no class selectors (except for the engine's own `[className]` system below), no pseudo-classes that don't have an IR analogue.

### 4.0 Which IR kinds are selectable

Anything that survives into the resolved tree is a valid selector target. Concretely:

**Content kinds** — every content-IR node:
`document`, `section`, `paragraph`, `heading`, `figure`, `table`, `row`, `cell`, `blockquote`, `list`, `item`, `defs`, `def`, `code-block`, `pre`, `math`, `m`, `cite`, `footnote`, `sidenote`, `index`, `ref`, `abstract`, `title`, `author`, `em`, `strong`, `code`, `link`, `br`, `sub`, `sup`, `img`, `refs`, `ref-entry`.

**Template containers (resolved)** — every layout container the template emits into the rendered tree:
`region`, `stack`, `row` *(new, see below)*, `columns`, `column`, `layer`, `fixed`, `header`, `footer`, `regime-flow` (resolver-generated).

**Back-matter generators** — composed in userland from the
data-source primitives (`bib-data`, `toc-data`, `list-of-data`,
`index-data`) and rendered as ordinary content sections. Target the
emitted nodes via their content kinds (`section`, `list`, `item`,
`paragraph`, …); engine-internal classes
(`reactwright-toc-entry`, `reactwright-list-of-link`, etc.) supply
the leader / target-counter machinery.

**Not selectable** — these are control / structural artefacts that don't survive to render:
- `slot` — replaced by its substituted content during resolution. Use the `slot` *combinator* (4.2) to select content that landed in a named slot.
- `rules`, `role-rule`, `page-rule` — control structures.
- `font` — head-tag-only.
- `page`, `page-set` — geometry containers, not in-flow content. Use `<page page={...}>` props for page-level styling, not selectors.

### 4.0.1 Prerequisite IR changes

A few kinds are nominally part of the IR but don't currently carry the fields the selector language needs. Slice 1 must extend them:

| Kind | Currently | Needs |
|---|---|---|
| `row` (template-side, **new**) | does not exist | add a `RowNode { kind:"row", gap?, style?, children }` to template-IR — horizontal-flex container symmetric to `StackNode`. Renderer: `display:flex; flex-direction:row; gap:<gap>`. JSX grammar disambiguates from content-side table `row` by parent context (one only appears inside `<table>`; the other never does) |
| `row` (content-side, table) | `{ kind, children }` | `role`, `variant`, `id` optional fields; included in `assignRoleVariants` walk |
| `cell` | `{ kind, header?, children }` | `role`, `variant` optional fields; `header` becomes selectable via `attr: { header: true }` |
| `item` (list) | already walked partially | confirm role/variant present |
| `def` (defs) | already walked partially | confirm role/variant present |
| `caption` | currently a `string` prop on `figure`/`table` | promoted to a proper child node so it's selectable via `parent: { kind: "figure" }` (Slice 2; see §10 q.6) |

These are small content-IR changes (a few fields each, one expansion in `assignRoleVariants`), but they belong on the slice-1 critical path because the selector language is only as expressive as the IR it can reach.

### 4.1 Atomic match keys

| Key | Type | Matches |
|---|---|---|
| `kind` | IR kind string | content or template IR node kind (`section`, `paragraph`, `figure`, `cite`, `table`, `region`, etc.) |
| `role` | string | the `role` attribute the content author wrote |
| `variant` | string | the role-rule variant the resolver assigned |
| `depth` | number \| `{ gte: N }` \| `{ lte: N }` | nesting depth for `section` |
| `index` | `"first" \| "last" \| number` | positional within siblings of the same kind |
| `id` | string | exact id match (rarely useful; mostly for one-offs) |
| `attr` | `Record<string, unknown>` | other IR attributes (e.g. `attr={{ page: "cover" }}` for page-set routing) |

### 4.2 Combinators

| Combinator | Shape | CSS analogue |
|---|---|---|
| `follows` | `{ follows: Match }` | adjacent-sibling `A + B` |
| `precedes` | `{ precedes: Match }` | (no CSS direct analogue; engine-resolved) |
| `parent` | `{ parent: Match }` | direct child `A > B` |
| `within` | `{ within: Match }` | descendant `A B` |
| `has` | `{ has: Match }` | `:has()` |
| `slot` | `{ slot: SlotName }` | (no CSS analogue; matches content that resolved into the named slot — `"title"`, `"author"`, `"abstract"`, `"body"`, or a regime body) |
| `not` | `{ not: Match }` | `:not()` |
| `and` | `{ and: [Match, Match, ...] }` | implicit conjunction |
| `or` | `{ or: [Match, Match, ...] }` | selector list `A, B` |

All combinators are composable. `Match` is the recursive type.

The `slot` combinator is the answer to "I want to style paragraphs *in the abstract*, but not in the body" — slots themselves aren't styleable (they're gone post-resolution), but where content ended up *is* a useful selector axis. The resolver tags each resolved-content node with the slot name it filled; the selector reads that tag.

### 4.3 Example selectors

```tsx
// Every figure inside a multi-column region
<rule match={{ kind: "figure", within: { kind: "columns" } }} className="…" />

// First paragraph following a top-level section heading
<rule match={{ kind: "paragraph", index: "first", follows: { kind: "section", depth: 1 } }} className="lede" />

// Tables that contain numeric data (carry a marker role)
<rule match={{ kind: "table", role: "data" }} className="data-table" />

// Anything except the title block
<rule match={{ not: { kind: "title" } }} className="…" />
```

### 4.4 CSS-syntax form in `<styles>` blocks

For terseness when selectors are static and conditions stay simple:

```css
section[depth="1"]                    { … }    /* depth:1 sections */
section[depth="2"]                    { … }
paragraph[follows="section"]          { … }    /* first paragraph after section */
figure[role="numbered"] > caption     { … }    /* numbered-figure captions */
cite                                  { … }
```

Both syntaxes compile to the same internal representation. JSX `<rule>` form is required when the match is conditional on runtime values.

## 5. The declaration language

A declaration is a property: value pair. The dialect defines a typed property vocabulary. Three categories:

### 5.1 Pass-through CSS properties

Standard CSS properties that map 1:1 to the target. The author writes the CSS name, the engine emits it unchanged.

```
font-family   font-size      font-weight     font-style       font-variant
line-height   letter-spacing word-spacing    color            background-color
margin*       padding*       width           max-width        min-width
height        max-height     min-height
border*       border-radius
display       align-items    justify-content flex-direction   gap
opacity       transform      object-fit
```

All currently accepted in the typed style records. Stay as-is.

### 5.2 Our-dialect properties

Concepts the engine knows about that don't have a clean CSS counterpart. Compile to whatever CSS soup makes them work on the current target.

| Our property | Replaces / compiles to |
|---|---|
| `numbering: counter(NAME, STYLE) FORMAT` | `counter-increment` + `::before { content: counter(...) }` plus reset plumbing. `STYLE` is one of `decimal`, `upper-roman`, `lower-roman`, `upper-alpha`, `lower-alpha`. `FORMAT` is a literal string with `$NAME` substitutions. |
| `numbering-reset: counter1 counter2 …` | child counters to reset when this counter increments |
| `numbering-scope: parent-counter-name` | nest this counter inside a parent's count (Figure 3.2 = chapter 3, figure 2) |
| `prefix: "..." \| content(...)` | `::before { content: ... }` |
| `suffix: "..." \| content(...)` | `::after { content: ... }` |
| `wrap: anchor` | wraps element in an `<a href>` linking to its referent (citations, refs, toc entries) |
| `wrap: figure \| quote \| caption` | wraps element in a semantic container |
| `break: before(VALUE) after(VALUE) inside(VALUE)` | `break-before` + `break-after` + `break-inside`, plus the legacy `page-break-*` fallbacks Paged.js sometimes needs |
| `indent: first-line(LENGTH) except-after(MATCH...)` | `text-indent` + sibling-combinator overrides for headings |
| `text-flow: align(VALUE) last-line(VALUE) hyphens(VALUE)` | `text-align` + `text-align-last` + `hyphens` |
| `keep-with-next: true` | break-after: avoid (heading sticks to first paragraph) |
| `hanging-indent: LENGTH` | text-indent: -L; padding-left: L (bibliography entries) |
| `column-fit: shrink-to-column` | table-layout: fixed + width: 100% + word-wrap (tables in columns) |
| `caption-position: above \| below` | caption-side + sibling order |
| `drop-cap: lines(N) font(F)` | already exists on `<role>`, promoted to general property |

### 5.3 Counter-style values for `numbering`

```
decimal             1, 2, 3, …
decimal-leading-zero 01, 02, 03, …
upper-roman         I, II, III, …
lower-roman         i, ii, iii, …
upper-alpha         A, B, C, …
lower-alpha         a, b, c, …
upper-latin         A, B, C, … AA, AB (after Z)
```

Maps to CSS `<counter-style>`. Author writes the conceptual name.

### 5.4 Format token grammar

```
FORMAT := (LITERAL | "$" NAME)*
NAME   := identifier matching /[a-zA-Z_][a-zA-Z0-9_-]*/
```

`"Figure $chapter.$figure"` → renders as `"Figure 3.2"` when `chapter=3, figure=2`.

Already implemented as `numberingFormatToCssContent` for `<role>` numbering. Generalises.

## 6. The `<styles>` block

The author writes blocks of CSS-like text inside `<styles>` tags. Multiple blocks can appear anywhere in the template; the engine concatenates them in document order.

```tsx
<styles>{`
  .section-head {
    font-size: 10pt;
    font-style: normal;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    numbering: counter(sec, upper-roman) "$sec. ";
    numbering-reset: sub;
    break: after(avoid);
    keep-with-next: true;
  }

  .subsection-head {
    font-size: 10pt;
    font-style: italic;
    text-align: left;
    numbering: counter(sub, upper-alpha) "$sub. ";
    keep-with-next: true;
  }

  .cite {
    color: inherit;
    text-decoration: none;
    wrap: anchor;
    prefix: "[";
    suffix: counter(bib) "]";
  }

  .body-paragraph {
    indent: first-line(1em) except-after(section, heading);
    text-flow: align(justify) last-line(start);
  }

  .figure-caption {
    font-size: 8pt;
    text-align: center;
    numbering: counter(fig, decimal) "Fig. $fig. ";
  }

  .table {
    column-fit: shrink-to-column;
    font-size: 8pt;
    numbering: counter(tab, upper-roman) "Table $tab. ";
    caption-position: above;
  }
`}</styles>
```

Properties not in the dialect are accepted as-is but flagged with a build-time warning (until a typed property promotes them). This is the gradual escape valve — start with 80% CSS, promote concepts as they earn their keep.

### 6.1 Parser scope (v1)

- Whitespace, comments (`/* */`), and `;`-terminated declarations.
- Selector syntax is a strict subset (see 4.4) — selectors that don't fit the IR match grammar are rejected at parse time with a clear error pointing back at the offending selector.
- `@-rules` are not part of the dialect. Page geometry stays on `<page page={...}>`. There is no `@media`, no `@import`, no nesting in v1.
- Vendor prefixes (`-webkit-*`, `-moz-*`) are rejected. The engine emits them when needed.

### 6.2 Reference semantics

The engine compiles `<styles>` blocks into:
1. Named-class definitions stored in a per-document table.
2. Pattern→class bindings collected from `<rule>` JSX nodes.
3. The compiled-output CSS injected into the document `<style>` block, replacing the role-applied class names with stable engine-generated tokens.

An author who writes `className="masthead"` references the same table. Unknown class names produce a build error with the list of declared classes.

## 7. The complete IEEE template, rewritten

For reference, here is what the IEEE template looks like after the spec lands. Compare to current `mockups/ieee/template.tsx`.

```tsx
import "reactwright/jsx";

export function Template() {
  return (
    <page
      page={{ size: "letter", marginTop: "19.05mm", marginBottom: "25.4mm", marginLeft: "15.875mm", marginRight: "15.875mm" }}
      typography={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: 1.15 }}
    >
      <styles>{`
        .title {
          font-size: 24pt;
          font-weight: normal;
          text-align: center;
          line-height: 1.1;
          margin: 0 0 12pt 0;
        }

        .abstract {
          font-size: 9pt;
          font-weight: bold;
          font-style: italic;
          text-flow: align(justify);
        }

        .section-head {
          font-size: 10pt;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          numbering: counter(sec, upper-roman) "$sec. ";
          numbering-reset: sub;
          break: after(avoid);
        }

        .subsection-head {
          font-size: 10pt;
          font-style: italic;
          numbering: counter(sub, upper-alpha) "$sub. ";
          break: after(avoid);
        }

        .body-paragraph {
          indent: first-line(1em) except-after(section);
        }

        .figure {
          break: inside(avoid);
        }
        .figure-caption {
          font-size: 8pt;
          text-align: center;
          numbering: counter(fig, decimal) "Fig. $fig. ";
        }

        .table {
          column-fit: shrink-to-column;
          font-size: 8pt;
          break: inside(avoid);
          numbering: counter(tab, upper-roman) "Table $tab. ";
          caption-position: above;
        }
        .table-caption {
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: center;
        }
        .table-header-cell {
          font-style: italic;
          border-top: 0.5pt solid #000;
          border-bottom: 0.5pt solid #000;
        }

        .code-inline {
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 0.92em;
        }

        .cite {
          color: inherit;
          text-decoration: none;
          wrap: anchor;
          prefix: "[";
          suffix: counter(bib) "]";
        }

        .bibliography {
          font-size: 8pt;
        }
        .bibliography-heading {
          font-size: 10pt;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: center;
          break: after(avoid);
        }
        .bibliography-entry {
          hanging-indent: 1.4em;
          prefix: "[" counter(bib) "] ";
          text-flow: align(justify);
        }
      `}</styles>

      <rule match={{ kind: "title" }}                                  className="title" />
      <rule match={{ kind: "abstract" }}                               className="abstract" />
      <rule match={{ kind: "section", depth: 1 }}                      className="section-head" />
      <rule match={{ kind: "section", depth: 2 }}                      className="subsection-head" />
      <rule match={{ kind: "paragraph" }}                              className="body-paragraph" />
      <rule match={{ kind: "figure" }}                                 className="figure" />
      <rule match={{ kind: "figure", has: { kind: "caption" } }}/cap   className="figure-caption" />
      <rule match={{ kind: "table" }}                                  className="table" />
      <rule match={{ kind: "table", has: { kind: "caption" } }}/cap    className="table-caption" />
      <rule match={{ kind: "cell", attr: { header: true } }}           className="table-header-cell" />
      <rule match={{ kind: "code", attr: { inline: true } }}           className="code-inline" />
      <rule match={{ kind: "cite" }}                                   className="cite" />
      <rule match={{ kind: "section", role: "bibliography" }}          className="bibliography" />
      <rule match={{ kind: "section", role: "bibliography", has: { kind: "heading" } }} className="bibliography-heading" />
      <rule match={{ kind: "ref-entry" }}                              className="bibliography-entry" />

      <header anchor="top-center" when="not-first-page" style={{ fontSize: "8pt", fontStyle: "italic" }}>
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center" style={{ fontSize: "8pt" }}>
        <page-number />
      </footer>

      <stack gap="0">
        <region style={{ textAlign: "center", paddingBottom: "4mm" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region style={{ columns: 2, columnGap: "4.24mm", textAlign: "justify" }}>
          <slot name="abstract" />
          <slot name="body" />
          <Bibliography title="References" />
        </region>
      </stack>
    </page>
  );
}
```

Net change from current IEEE_CSS:
- 32 lines of customCss string → 0
- Hand-written counter plumbing → declarative numbering
- Targeted engine class names (`.reactwright-cite`, `figcaption`) → never appears
- Two CSS bugs that bit us (`text-align-last`, `table-layout: fixed`) → captured as our-dialect properties (`text-flow last-line`, `column-fit shrink-to-column`)

## 8. Compilation

The compile pipeline at HTML-emit time:

1. **Parse `<styles>` blocks** into an IR of named class definitions.
2. **Resolve `<rule>` JSX** into pattern → class-name bindings.
3. **Walk the resolved content IR**, applying class-name bindings to every matching node. Output: per-node list of class names.
4. **Lower the class definitions** from the dialect to target CSS:
   - Pass-through properties: emit unchanged.
   - Our-dialect properties: lower to the appropriate CSS subset for the current target. The `numbering` property expands to counter-increment + ::before content + counter-reset plumbing. The `wrap` property mutates the renderer to wrap the element. The `column-fit` property expands to `width:100% table-layout:fixed word-wrap:break-word`.
5. **Emit** the compiled CSS into the document `<style>` block, alongside the existing engine machinery defaults.

Compile output is deterministic and ordering-stable for byte-diff testing.

### 8.1 Specificity model

Application order, from lowest to highest CSS specificity in the emitted output:

1. Engine `STATIC_DEFAULTS_CSS` (machinery).
2. Rule-applied classes (from `<rule match className>`).
3. Element-applied classes (from `className="..."` on a JSX node).
4. Inline `style={...}` on a JSX node.

Familiar to anyone who has worked with CSS. The same mental model carries over.

### 8.2 Engine-internal class names

After the spec lands, engine-emitted internal class names (`reactwright-section-title`, `reactwright-cite`, …) are **not part of the public API**. Templates should never target them directly. The dialect's `kind`, `role`, `variant`, `depth` selectors are the contract.

The internal names become free to rename, namespace, or hash. A future engine version could prefix them with a build hash for cache busting; templates won't care.

## 9. Migration path

The spec is large; ship it in slices.

### Slice 1 — Foundation (no breaking changes)
- Implement `<styles>` block parsing.
- Implement `<rule match className />` (no implicit role/apply field).
- Implement `className="..."` prop on layout and content nodes.
- Define dialect grammar for selectors (4.1–4.3).
- Pass-through CSS properties only — no our-dialect properties yet.
- All existing `<role>`, `style={...}`, `customCss` continue to work.

After slice 1: authors can replace customCss with `<styles>` for any rule that's expressible in pass-through CSS. The IEEE template's "targets engine class directly" lines (~14 of 32) start migrating.

### Slice 2 — Promoted concepts
- Add `numbering`, `numbering-reset`, `numbering-scope`.
- Add `prefix`, `suffix` (replaces ::before/::after).
- Add `wrap: anchor`.
- Add `break: before/after/inside(VALUE)`.

After slice 2: the IEEE template's "counter / generated-content plumbing" lines (~6 of 32) migrate.

### Slice 3 — Layout concepts
- Add `indent: first-line/except-after`.
- Add `text-flow: align/last-line/hyphens`.
- Add `column-fit: shrink-to-column`.
- Add `caption-position`, `hanging-indent`, `keep-with-next`.

After slice 3: the IEEE template's "pure HTML/CSS selectors" lines (~12 of 32) migrate.

### Slice 4 — Cleanup
- Engine-emitted class names become internal-only (prefix with `_` or hash).
- `customCss` deprecated with a build-time warning.
- All mockups + examples migrated to the new system.
- `<role on=X match=Y apply=Z style={...}>` desugared to `<rule match={...} className="...">` for backwards compatibility.

After slice 4: zero customCss in any shipped template. `customCss` removed or kept as a documented last-resort escape.

## 10. Decisions

Twelve decisions, locked in. Each replaces what would otherwise be an open question. Reverse-able pre-v1.0 if implementation reveals a flaw, but the implementation work proceeds against these defaults.

1. **Parser implementation — hand-rolled.** ~300 lines, zero dependencies. Library tolerance would accept input the engine can't lower; the dialect's value is precisely its narrowness.

2. **Dialect form — string CSS for v1.** Typed JSX form deferred to v2 if value emerges. Familiar surface, lowest bar to entry.

3. **Parse timing — build-time.** Parsing happens during `renderResolvedToHTML`. Runtime JSX reconciliation stays free of styling work. A separate `validateStyles()` helper can be added later for editor tooling.

4. **Class-name collisions — error.** Two `<styles>` blocks declaring `.foo` produce a build error listing both source locations. Explicit `replace="foo"` attribute on the redefinition will be added if and when need arises.

5. **Cross-file stylesheet sharing — string composition for v1.** Authors export a string from a `.styles.ts` module and compose via `<styles>{base + extension}</styles>`. Typed import handle (`<styles use={base}>`) deferred.

6. **Match disambiguation — both apply, CSS cascade decides.** Multiple `<rule>`s matching one node attach all their class names; the cascade resolves. Author can use `style={...}` inline to win against any class. `<rule priority={N}>` deferred until cascade produces surprises in practice.

7. **`Match` TypeScript shape — flat type for v1.** Optional fields, `attr: Record<string, unknown>`, `depth: number | { gte?: number; lte?: number }`. Discriminated-union narrowing per kind deferred.

8. **Caption-as-node — slice 1.** Captions promoted from `caption?: string` props on `figure`/`table` to first-class IR nodes. Unblocks the IEEE template's caption-styling lines immediately.

9. **`wrap: anchor` semantics — IR-transform pass before render.** Slice 2 adds a phase between resolver and renderer that walks the rule map and mutates IR for wrap/prefix/suffix/anchor concerns. The renderer stays declarative.

10. **Engine class names — public through slice 3, prefixed-internal at slice 4.** Existing `customCss` keeps working until slice 4; then engine classes get a `_` prefix or hash to signal don't-target.

11. **`customCss` lifecycle — deprecated at slice 4 with build warning, removed at v1.0.** Slow migration, real escape valve preserved through 0.x.

12. **Engine defaults in cascade — keep as raw CSS for slice 1, migrate to `<styles>` form at slice 4.** Today's `STATIC_DEFAULTS_CSS` rules don't move during slice 1. Slice 4 dogfoods the dialect by re-expressing engine defaults in the same form templates use.

## 11. What this spec is not

- **Not a CSS replacement.** Authors who want to write raw target CSS can — `style.customCss` remains for now.
- **Not a runtime style engine.** All compilation happens at engine build time. The reader of the PDF or HTML never sees any of this dialect; they see compiled target CSS only.
- **Not a styling-only refactor.** Slices 2 and 3 require IR work (captions as nodes, depth-aware section matching, position-aware "first paragraph after heading"). The styling spec drives those IR changes, but the IR changes are the substantive engineering.
- **Not portable across rendering targets without effort.** We lower to CSS Paged Media + Paged.js today. A future LaTeX, ConTeXt, or InDesign target would need a lowering implementation for each dialect property. The dialect's value is precisely that templates *don't* need to be rewritten when the target changes — only the engine's lowering does.

## 12. The decision the spec asks for

The user (template author) writes once. The engine (us) maintains the translation forever. Every property promoted from "pass-through CSS" to "our dialect" is a permanent maintenance commitment in exchange for one less CSS quirk leaking into authors' templates.

The trade is worth it where the concept is genuinely cross-target (numbering, breaks, indent, generated content) or where the CSS surface is a known footgun (text-align-last, table-layout, column-fit). It's not worth it for properties that are clean CSS-as-is (color, font-size, padding).

Slice 1 ships ~no new maintenance commitments. Slices 2 and 3 commit us to ~15 promoted properties. The IEEE template, currently 32 lines of customCss, ends up with 0.
