# Reactwright — bug fix plan

Bugs surfaced while bridging a Wit AST to Reactwright's content
intrinsics, then running the same content (an IEEE conference paper)
through both `@reactwright/markdown` and our custom Wit bridge. The
provoking harnesses are in
`/Users/taurajgreig/Projects/Personal/wit_writer_test`:

- `smoke/` — exhaustive Wit-feature smoke through `template-essay`.
- `report-wit/` — an IEEE paper through `template-ieee`.
- `report-md/` — the same paper through `@reactwright/markdown`
  (baseline for parity comparison).

The AUDIT.md at the repo root catalogs the HTML-level diff.

---

## Content engine (`packages/reactwright/src/content`)

### RW-1 — `<heading>` factory error is swallowed; user sees only "Content renderer produced no root node"

**Severity: critical (debuggability).** Cost multiple iterations to
isolate; the actual exception message is informative but never reaches
the user.

**Repro**
```tsx
<document>
  <heading level={1}>Hi</heading>     {/* no `title` prop */}
</document>
```

`headingNode` in `content/factories.ts` throws synchronously:
```ts
const title = getString(props, "title");
if (title == null || title.length === 0) {
  throw new Error("`heading` requires a non-empty `title`.");
}
```

User-visible output:
```
Content renderer produced no root node.
```

**Suggested fix.** In `content/host-config.ts` (or wherever the
reconciler catches factory exceptions), preserve the original error
message and the failing intrinsic's React element. Surface to stderr
with at least `[reactwright] <intrinsic-name>: <error.message>` and
ideally a JSX source pointer via React's `_source` / `_owner` fields.

**Test case** — `tests/content/factory-error-surface.test.ts` —
render `<heading level={1}/>` (no title) and assert the thrown error
contains "heading" and "title".

---

### RW-2 — grammar violations produce the same opaque "no root node" error

**Severity: critical (debuggability).** The grammar table in
`content/grammar.ts` already carries informative per-rule `message`
strings — they just don't reach the user.

**Repro**
```tsx
<list type="ul">
  <p>not allowed</p>
</list>
```

`GRAMMAR.list.message = "`list` may only contain `item` children."` —
but the user sees:
```
Content renderer produced no root node.
```

**Suggested fix.** Whatever code is catching grammar violations in
the reconciler should pass the rule's `message`, the parent kind, the
offending child kind, and (ideally) JSX source position into the
thrown error. Same plumbing as RW-1.

**Test case** —
`tests/content/grammar-violation-surface.test.ts`.

---

### RW-3 — `<list type="ol">` renders as `<ul>` in the HTML backend

**Severity: high.** Ordered lists are unusable.

**Repro**
```tsx
<list type="ol">
  <item><p>first</p></item>
  <item><p>second</p></item>
</list>
```
→ rendered HTML:
```html
<ul><li><p>first</p></li><li><p>second</p></li></ul>
```

Confirmed in `report-wit/paper/paper.html` (every `@ol` in
`report-wit/source/sections/*.wit` came through as `<ul>`).

**Suggested fix.** In `packages/reactwright/src/backends/html/render.ts`,
the `ListNode` case ignores `type`. Emit `<ol>` when
`node.type === "ol"`, `<ul>` otherwise.

**Test case** — golden HTML test for `<list type="ol">` → `<ol>`.

---

### RW-6 — `<heading>` accepts no inline marks (only a plain string `title`)

**Severity: medium (API ergonomics).** Other inline-bearing block
primitives (`<p>`, `<figure>`'s caption, `<quote>`, `<item>`) accept
React children with inline marks. `<heading>`'s `title` is a string,
so no `<em>`, `<cite>`, `<m>` inside a heading.

**Authoring impact.** "An *empirical* study of …" cannot appear in a
heading. Workaround: strip emphasis from heading text or accept the
loss.

**Suggested fix.** Pick one:
- **A.** Move `heading` to children-style for symmetry. Mark `title`
  string-prop as deprecated for one minor; remove in next major.
- **B.** Keep string-only and document the constraint next to the
  factory error.

The bridge in `wit_writer_test/smoke/wit-bridge.tsx` currently flattens
Wit's heading body to a string via `flattenBodyToString`, losing any
inline marks. Option A would let us thread them through.

**Test case** — depends on chosen direction.

---

### "No `<th>` for first-row table cells" — not in original list, surfaced by AUDIT

**Severity: medium.** Reactwright accepts `<cell>` inside `<row>`
inside `<table>`, but the HTML backend renders every cell as `<td>`.
Markdown-pipeline output uses `<th>` for the first row (markdown's
`| --- |` header-separator syntax). There's no way to express
"this row is the header row" in the content intrinsics.

**Suggested fix.** Either:
- accept a `role="header"` prop on `<row>` and emit `<th>` for cells
  inside it; or
- accept a `<header-row>` intrinsic alongside `<row>`.

Combined with RW-8 below — header cells need both the `<th>` tag AND
the `ieee-table-header-cell` class.

---

## Template — `@reactwright/template-essay`

### RW-4 — `<quote>` (blockquote) has no visible styling vs body text

**Severity: low (cosmetic).** Semantic HTML is correct
(`<blockquote class="essay-blockquote"><p class="essay-blockquote-p">…</p></blockquote>`)
but visually identical to adjacent body paragraphs.

**Repro.** `smoke/doc.wit` exercises `@blockquote ... blockquote@`.
The output PDF page 1 shows the quoted text at the same margin /
typography as surrounding paragraphs.

**Suggested fix.** Add MLA-appropriate offset to `.essay-blockquote`
in `packages/template-essay/src/styles.ts` (or wherever the template's
CSS lives). Typical pattern: left margin 0.5", single-spaced inside,
no first-line indent.

**Test case** — visual / snapshot.

---

### RW-5 — empty `<refs>` still renders an orphan "Works Cited" header

**Severity: low.** When the document doesn't supply a `<refs>` block,
the essay template still emits
```html
<section class="essay-bibliography">
  <h2>Works Cited</h2>
  <ol class="essay-bib-list"></ol>
</section>
```
producing a section heading on a blank trailing page.

**Suggested fix.** Make the bibliography section conditional on the
document containing `<refs>` children. The template can introspect via
the resolved document's `refs` slot.

**Test case** — render an essay with no `<refs>`; assert the HTML
does **not** contain "Works Cited".

---

## Template — `@reactwright/template-ieee-report`

### RW-7 — same shape as RW-5, different template

**Severity: low.** The IEEE-report template emits its bibliography
section with the "REFERENCES" heading even when no `<ref-entry>` is
present. Same fix as RW-5.

**Repro.** Initial `report-wit` build used `template-ieee-report` and
exhibited the orphan REFERENCES section.

---

### RW-8 — IEEE-report `<table>` styling is too weak by default

**Severity: medium.** Tables in `report-wit/paper/paper.pdf` (when
built against `template-ieee-report`) render with no visible row
separation, no column borders, no header-row chrome. The original
markdown report only looked right because `report-md/paper/build.tsx`
ran post-render HTML rewrites to inject a `<colgroup>` and custom
column widths.

**Suggested fix.** Add to the IEEE-report template's table CSS:
- thin top + bottom border on the header row (matches IEEE
  conference template's `ieee-table-header-cell`)
- inter-row padding
- optional zebra (off by default for IEEE)

The conference template (`template-ieee`) already has all of this in
`ieee-table-cell` / `ieee-table-header-cell` / `ieee-table` — port
those rules across.

**Test case** — visual / snapshot.

---

## Suggested priority order

1. **RW-3** (ordered lists impossible) — high, single-line fix in
   the HTML backend.
2. **RW-1** (`<heading>` factory error swallowed) — critical for
   debuggability.
3. **RW-2** (grammar violations swallowed) — critical for
   debuggability.
4. **"`<th>` for first-row cells"** — medium, needed for parity with
   the markdown pipeline.
5. **RW-6** (heading children vs title string) — medium, API
   ergonomics.
6. **RW-4 / RW-5 / RW-7 / RW-8** — template-side cosmetics.

---

## Cross-package observations

The `bib-data` runtime warning seen in both pipelines —
```
Functions are not valid as a React child. This may happen if you
return Component instead of <Component /> from render.
  <bib-data>{Component}</bib-data>
```
— fires regardless of which document we render. Worth tracking down
since it touches every build and may indicate a template-side
`<Component />` vs `Component` slip.
