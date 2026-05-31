# Styling — Slice 2 Implementation Plan

Companion to `docs/styling-spec.md` and `docs/styling-slice-1-plan.md`.
Adds the first round of "promoted concept" dialect properties so
templates can express numbering, generated content, and pagination
breaks without writing raw CSS counter/`::before`/`break-*` rules.

After slice 2 the IEEE template's `customCss` shrinks from ~32 lines
(slice-0 starting point) → ~7 lines (only properties that need slice 3:
indent, text-flow, column-fit, hanging-indent).

## Status

| Sub-slice | Status | Commit |
|---|---|---|
| 2.1 — lowering for `numbering` / `numbering-reset` / `prefix` / `suffix` / `break` | **complete** | `6079464` |
| 2.2 — inline renderers honour `classAttr(node)` | **complete** | `85fa0f7` |
| 2.3 — migrate IEEE template's counter / break / cite rules | **pending** | — |

Sub-agents picking up 2.3 should start from §3 of this doc.

## 1. Goals

1. Add five promoted concepts to the dialect: `numbering`, `numbering-reset`,
   `prefix`, `suffix`, `break`. Each compiles down to the appropriate
   CSS soup at HTML-emit time.
2. Every inline IR node propagates `className` and its renderer
   honours `classAttr(node)` so authors can target cite / ref /
   footnote / sidenote / em / strong / code / link / sub / sup / m /
   img with rules.
3. IEEE template migrates its counter, prefix/suffix, and
   break-inside rules from `customCss` to `<styles>` + `<rule>`.
4. Zero regression: existing tests pass; mockup HTML byte-diff
   stable for non-IEEE; IEEE PDF shrinks again (counter rules are
   short when expressed via dialect).

## 2. Non-goals

- `wrap: anchor` and other IR-mutating properties (deferred to slice
  2.4 or slice 3 — needs the rule-driven IR-transform pass, which
  introduces a new pipeline phase).
- `indent: first-line(...) except-after(...)` (slice 3).
- `text-flow: align(...) last-line(...)` (slice 3).
- `column-fit: shrink-to-column` (slice 3).
- `caption-position: above | below` (slice 3).
- `hanging-indent: <length>` (slice 3).
- Renaming engine-internal classes to underscore-prefixed (slice 4).
- Removing `customCss` (slice 4).

## 3. Slice 2.3 — IEEE migration plan

Each row maps one `IEEE_CSS` rule to its dialect replacement. The
"customCss after" column lists what stays in `customCss` until slice 3.

### 3.1 Section heads (h2)

**Current customCss:**
```css
.reactwright-flow{counter-reset:ieee-section;}
h2.reactwright-section-title{
  font-size:10pt;
  font-weight:normal;
  font-style:normal;
  font-family:'Times New Roman',Times,serif;
  text-align:center;
  text-align-last:center;
  text-transform:uppercase;
  letter-spacing:0.04em;
  margin:12pt 0 4pt 0;
  break-after:avoid;
  counter-increment:ieee-section;
  counter-reset:ieee-subsection;
}
h2.reactwright-section-title::before{
  content:counter(ieee-section,upper-roman) '. ';
}
```

**Migrate to:**
```tsx
<rule match={{ kind: "section", depth: 1 }} className="ieee-section-head" />
```
```css
.ieee-section-head {
  font-size: 10pt;
  font-weight: normal;
  font-style: normal;
  font-family: 'Times New Roman', Times, serif;
  text-align: center;
  text-align-last: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 12pt 0 4pt 0;
  numbering: counter(ieee-section, upper-roman) "$ieee-section. ";
  numbering-reset: ieee-subsection;
  break: after(avoid);
}
```

**Gotcha:** the `<rule match={{kind:"section", depth:1}}>` tags the
`<section>` element, but the counter and `::before` need to fire on
the `<h2>` heading INSIDE the section. Two options:

- **A.** Have the rule match the resolved-IR `heading` node that the
  section renders inside, not the section itself. The current section
  renderer emits `<section><h2 class="reactwright-section-title">…</h2>…</section>`
  — the h2 isn't a separate IR node, it's part of `renderSectionNode`'s
  output. Need to either pull the section title out into a
  ResolvedHeadingNode at resolve time, or attach the className to the
  section and let the section renderer apply it to the h2 via a base-
  class lift.
- **B.** Lift the rule-applied class through the section renderer:
  when a `section` node has classBindings, pass them to the inner
  `<h2>` tag instead of the section wrapper. This keeps the IR
  one-section-one-node but means the renderer needs to know about
  classBindings.

**Recommendation:** option B. The section renderer already chooses
the heading tag (`h2`/`h3`/`h4`) by depth — extending it to splice
the rule-applied classes onto the heading rather than the wrapper is
a 3-line change.

### 3.2 Subsection heads (h3)

**Current customCss:**
```css
h3.reactwright-section-title{
  font-size:10pt;
  font-weight:normal;
  font-style:italic;
  font-family:'Times New Roman',Times,serif;
  text-align:left;
  text-align-last:left;
  text-transform:none;
  letter-spacing:0;
  margin:6pt 0 2pt 0;
  break-after:avoid;
  counter-increment:ieee-subsection;
}
h3.reactwright-section-title::before{
  content:counter(ieee-subsection,upper-alpha) '. ';
}
```

**Migrate to:**
```tsx
<rule match={{ kind: "section", depth: 2 }} className="ieee-subsection-head" />
```
```css
.ieee-subsection-head {
  font-size: 10pt;
  font-style: italic;
  text-align: left;
  text-align-last: left;
  margin: 6pt 0 2pt 0;
  numbering: counter(ieee-subsection, upper-alpha) "$ieee-subsection. ";
  break: after(avoid);
}
```

Same renderer-lift caveat as §3.1.

### 3.3 Figure caption "Fig. N."

**Current customCss:**
```css
figure{
  margin:8pt 0;
  text-align:center;
  page-break-inside:avoid;
  break-inside:avoid;
}
figure img{
  max-width:100%;
  height:auto;
  display:block;
  margin:0 auto 4pt auto;
}
figure figcaption{
  font-size:8pt;
  font-family:'Times New Roman',Times,serif;
  text-align:center;
  line-height:1.2;
  text-indent:0;
}
```

Plus the role-numbering on the figure:
```tsx
<role
  on="figure"
  match="numbered"
  apply="ieeeFigure"
  numbering={{ counter: "ieee-figure", format: "Fig. $ieee-figure. " }}
  style={{ fontSize: "8pt", textAlign: "center" }}
/>
```

**Migrate to:**
```tsx
<rule match={{ kind: "figure" }} className="ieee-figure" />
<rule match={{ kind: "caption", parent: { kind: "figure" } }} className="ieee-fig-caption" />
```
```css
.ieee-figure {
  margin: 8pt 0;
  text-align: center;
  break: inside(avoid);
}
.ieee-fig-caption {
  font-size: 8pt;
  font-family: 'Times New Roman', Times, serif;
  text-align: center;
  line-height: 1.2;
  text-indent: 0;
  numbering: counter(ieee-figure) "Fig. $ieee-figure. ";
}
```

**Remaining in customCss:** `figure img { max-width:100%; height:auto;
display:block; margin:0 auto 4pt auto; }` — descendant selector, needs
slice 3's nested-rule support, or a separate `<rule match={{kind:"img",
within:{kind:"figure"}}}>`. Since `<rule>` already supports `within`,
this could migrate now if it fits in 2.3 scope.

The legacy `<role on="figure" match="numbered" apply="ieeeFigure">` rule
becomes redundant once the dialect rule covers numbering. Keep both
during 2.3 to preserve the existing variant-based path; remove the
legacy role-rule in slice 4.

### 3.4 Table caption "TABLE I."

**Current customCss:**
```css
.reactwright-flow{counter-reset:ieee-section ieee-table;}
table{
  width:100%;
  table-layout:fixed;
  margin:8pt 0;
  border-collapse:collapse;
  font-size:8pt;
  page-break-inside:avoid;
  break-inside:avoid;
  counter-increment:ieee-table;
}
table caption{
  font-size:8pt;
  font-family:'Times New Roman',Times,serif;
  text-align:center;
  text-align-last:center;
  line-height:1.2;
  text-indent:0;
  text-transform:uppercase;
  letter-spacing:0.04em;
  margin-bottom:4pt;
  caption-side:top;
}
table caption::before{
  content:'Table ' counter(ieee-table, upper-roman) '. ';
}
table th, table td{
  padding:1pt 2pt;
  text-align:left;
  text-indent:0;
  word-wrap:break-word;
  overflow-wrap:break-word;
}
table th{
  font-weight:normal;
  font-style:italic;
  border-top:0.5pt solid #000;
  border-bottom:0.5pt solid #000;
}
table tr:last-child td{
  border-bottom:0.5pt solid #000;
}
table p{
  margin:0;
  text-indent:0;
  font-size:inherit;
}
```

**Migrate (the parts dialect can express now):**
```tsx
<rule match={{ kind: "table" }} className="ieee-table" />
<rule match={{ kind: "caption", parent: { kind: "table" } }} className="ieee-table-caption" />
<rule match={{ kind: "cell", attr: { header: true } }} className="ieee-table-header-cell" />
```
```css
.ieee-table {
  margin: 8pt 0;
  border-collapse: collapse;
  font-size: 8pt;
  break: inside(avoid);
  numbering-reset: ieee-table;  /* on the document root, slice 3 may move this */
}
.ieee-table-caption {
  font-size: 8pt;
  font-family: 'Times New Roman', Times, serif;
  text-align: center;
  text-align-last: center;
  line-height: 1.2;
  text-indent: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4pt;
  caption-side: top;
  numbering: counter(ieee-table, upper-roman) "Table $ieee-table. ";
}
.ieee-table-header-cell {
  font-weight: normal;
  font-style: italic;
  border-top: 0.5pt solid #000;
  border-bottom: 0.5pt solid #000;
}
```

**Remaining in customCss (needs slice 3):**
- `table { width:100%; table-layout:fixed; }` — slice 3's `column-fit:
  shrink-to-column` packages this.
- `table th, table td { padding:1pt 2pt; text-align:left; text-indent:0;
  word-wrap:break-word; overflow-wrap:break-word; }` — generic cell
  styling. Could migrate with a `<rule match={{kind:"cell"}}>` now if
  it fits 2.3.
- `table tr:last-child td { border-bottom:0.5pt solid #000; }` — `:last-child`
  position is selectable today via `<rule match={{kind:"row", index:"last"}}>`
  + descendant cell rule. Tricky; defer to 3.
- `table p { margin:0; text-indent:0; font-size:inherit; }` — descendant
  selector; can use `<rule match={{kind:"paragraph", parent:{kind:"cell"}}}>`.

### 3.5 Citations `[N]`

**Current customCss:**
```css
a.reactwright-cite{color:inherit;text-decoration:none;}
a.reactwright-cite::before{content:'[';}
a.reactwright-cite::after{content:target-counter(attr(href url), reactwright-bib) ']';}
```

**Migrate to:**
```tsx
<rule match={{ kind: "cite" }} className="ieee-cite" />
```
```css
.ieee-cite {
  color: inherit;
  text-decoration: none;
  prefix: "[";
  suffix: target-counter(attr(href url), reactwright-bib) "]";
}
```

**`target-counter` gotcha (worth a fresh look during 2.3):**
The current lowering treats `prefix`/`suffix` value as opaque CSS
`content:` expression — it passes through unchanged. That means
`target-counter(attr(href url), reactwright-bib)` works *as long as
the suffix value is parsed correctly by the dialect parser*.

The parser reads value text up to the next `;` or `}` (parens are
balanced via depth counter). So `target-counter(attr(href url),
reactwright-bib) "]"` parses as a single value with parens balanced.
Verify in 2.3 by adding a unit test in `tests/styles/lower.test.tsx`:

```ts
test("lower: target-counter in suffix value passes through", () => {
  const css = lower(`.x { suffix: target-counter(attr(href url), bib) "]"; }`);
  assert.match(css, /::after\{content:target-counter\(attr\(href url\), bib\) "\]";\}/);
});
```

### 3.6 Bibliography entry `[N]` prefix

**Current customCss:**
```css
.reactwright-bibliography ol{list-style:none;padding-left:0;margin:0;}
.reactwright-bibliography li{
  text-indent:-1.4em;
  padding-left:1.4em;
  margin-bottom:2pt;
  text-align:justify;
}
.reactwright-bibliography li::before{content:'[' counter(reactwright-bib) '] ';}
```

**Migrate (the parts dialect can express now):**
```tsx
<rule match={{ kind: "ref-entry" }} className="ieee-bib-entry" />
```
```css
.ieee-bib-entry {
  margin-bottom: 2pt;
  text-align: justify;
  prefix: "[" counter(reactwright-bib) "] ";
}
```

**Remaining in customCss until slice 3:**
- `text-indent:-1.4em; padding-left:1.4em;` — slice 3's
  `hanging-indent: 1.4em` packages this.
- `.reactwright-bibliography ol { list-style:none; padding-left:0;
  margin:0; }` — list reset on a descendant `ol`. Today's dialect
  doesn't target the `<ol>` rendered inside the bibliography because
  it's a renderer-generated element, not an IR node. Slice 4 work.

### 3.7 Heading 2/3 vs section node — implementation note

§3.1 and §3.2 require the section renderer to splice rule-applied
classes onto the inner `<h2>`/`<h3>` heading rather than the
`<section>` wrapper. Concretely:

In `src/backends/html/content.ts:renderSectionNode`, the current
emit is approximately:

```ts
const sectionHtml = [
  `<section${idAttr(node.id)}${regimeStyle}${classAttr(node)}>`,
  titleHeading,       // <h2 class="reactwright-section-title">...</h2>
  ...
];
```

Change to:

```ts
// Lift rule-applied classes onto the heading tag instead of the
// section wrapper, so authors can target section heads with
// <rule match={{kind:"section", depth:1}} className="..."/>.
const liftedHeadingClasses = classAttrWithBase(
  node,
  ...baseClasses
);
const titleHeading =
  node.title.length > 0
    ? `<${headingTag}${liftedHeadingClasses}${variantAttr}>${escapeHtml(node.title)}</${headingTag}>`
    : "";
const sectionHtml = [
  `<section${idAttr(node.id)}${regimeStyle}>`,  // no classAttr here
  titleHeading,
  ...
];
```

This means `<rule match={{kind:"section"}}>` styles the *heading*,
not the section block. If we ever want to style the section block
itself, that's a separate IR concept (or a separate rule key like
`<rule match={{kind:"section-block"}}>` — not in 2.3 scope).

## 4. Test plan

Existing tests must keep passing (110 from slice 1 + slice 2.1).

New tests for 2.3:

- `tests/styles/lower.test.tsx`: add the `target-counter`
  pass-through case from §3.5.
- `tests/styles-integration.test.tsx`: add three cases:
  - Section heading depth-1 with numbering tags the `<h2>` with the
    class (verifies the heading-lift from §3.7).
  - Cite with prefix/suffix produces `<a class="ieee-cite">` plus
    `::before {"["} ::after {target-counter... "]"}` CSS.
  - Figure with a `<caption>` child where the caption is selected via
    `parent:{kind:"figure"}` combinator and gets `numbering`.

## 5. Acceptance criteria

- IEEE_CSS shrinks from ~24 lines (current post-1.9) to ~7 lines
  (only properties needing slice 3).
- All tests pass.
- `mockup:ieee-strict` produces visually unchanged output (PNG
  snapshot diff acceptable for the 2.3 commit).
- Non-IEEE mockups: HTML byte-diff stable.

## 6. After 2.3 — open follow-ups

- **Refactor #68** — split `src/resolver/ir.ts` (now ~700 lines).
  Slice 2 added more fields; the file is at the size where the per-
  domain split (resolved-inline, resolved-block, resolved-template,
  resolved-page, resolved-aggregates) becomes worthwhile.
- **Refactor #69** — split `src/resolver/resolve.ts`. Slice 2.3 will
  touch this file again; a split before 2.3 lands would mean smaller
  diffs.
- **Slice 2.4** — `wrap: anchor` and the rule-driven IR-transform
  pass. Needed before cite handling can fully migrate (currently the
  `<a class="reactwright-cite">` wrapping is hardcoded in
  `renderCiteNode`; with `wrap: anchor` it becomes declarative).

## 7. What the next sub-agent should do first

1. Read this doc (§3 specifically).
2. Read `docs/styling-spec.md §10` for the 12 binding decisions.
3. Read `CLAUDE.md` "className propagation checklist" before adding
   any new node fields.
4. Pick a sub-section (3.1 through 3.6) — they're mostly independent,
   except 3.1 + 3.2 share the heading-lift change (§3.7).
5. Make the change, run `npm test`, run `npm run mockup:ieee-strict`,
   snapshot-diff the PNG.
6. Commit per sub-section; final commit migrates IEEE_STYLES.
