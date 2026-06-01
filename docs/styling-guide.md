# Styling guide

Reactwright templates style documents through a typed CSS-superset
dialect that operates on the *intermediate representation* (IR), not
on the rendered HTML. The full grammar lives in
[`styling-spec.md`](./styling-spec.md); this page is the hands-on
companion — the mental model, the authoring loop, and seven recipes
for typographic effects that come up in real documents.

## The mental model

Three sentences, in order:

1. The engine compiles your content into a tree of typed *IR nodes*
   (`paragraph`, `section`, `figure`, `cell`, `cite`, …) — not HTML.
2. You declare classes in a `<styles>{`…`}</styles>` block and bind
   them to IR-node *shapes* with `<rule match={…} className="…" />`.
3. The resolver walks every IR node, evaluates each rule's `match`
   against it, and attaches the rule's class. The HTML backend then
   serialises the IR + classes to Paged.js-flavoured CSS.

The payoff is that selectors describe *what* (a paragraph that
follows a heading; a cell in the last row; a figure inside a
multi-column region) rather than *which HTML tag*. The HTML is an
implementation detail.

The flipside is that selectors are different from CSS:

- `kind` matches the IR node type, not an HTML tag.
- `within`, `follows`, `parent`, `has` are first-class combinators
  on the predicate, not pseudo-class syntax.
- Negation and disjunction are spelled `not:` and `or:` and may
  contain arbitrary sub-predicates.

The styling spec's §10 lists twelve binding decisions that justify
each shape choice; if you ever find yourself wishing a selector
worked differently, read §10 before reaching for a workaround.

## Authoring a `<styles>` block plus a `<rule>`

A complete minimum:

```tsx
import "reactwright/jsx";

const STYLES = `
  .lede { font-size: 1.1em; text-indent: 0; }
`;

export function Template() {
  return (
    <page page={{ size: "letter" }} typography={{ fontSize: "11pt" }}>
      <styles>{STYLES}</styles>

      <rule
        match={{ kind: "paragraph", index: "first",
                 follows: { kind: "section-heading" } }}
        className="lede"
      />

      <region><slot name="body" /></region>
    </page>
  );
}
```

Three things to notice:

- The `.lede` class lives in the `<styles>` block. Class names
  defined there are the *only* names you can refer to from `<rule
  className>`. Engine-internal class names (`reactwright-flow` etc.)
  are not stable and not part of the public surface.
- The `<rule>` element has no children. It's a pure binding.
- `match` is an object literal, not a string selector. You can
  build it programmatically:

  ```tsx
  const heading = (depth: number) =>
    ({ kind: "section-heading", depth }) as const;
  <rule match={heading(1)} className="section-h1" />
  ```

## Selector quick reference

Atomic keys:

```ts
{ kind: "paragraph" }                       // IR kind
{ role: "abstract" }                        // content-side role
{ variant: "ieeeFigure" }                   // post-rule variant
{ depth: 2 }                                // section depth
{ depth: { gte: 2 } }                       // gte / lte forms
{ index: "first" }                          // positional
{ index: "last" }
{ id: "fig-pipeline" }                      // exact id
{ attr: { header: true } }                  // other IR attrs
```

Combinators (all composable):

```ts
{ within: { kind: "section", role: "chapter" } }     // descendant
{ parent: { kind: "table" } }                         // direct child
{ follows: { kind: "section-heading" } }              // adjacent sibling
{ precedes: { kind: "figure" } }
{ has: { kind: "caption" } }                          // :has()
{ slot: "body" }                                      // matches the slot it filled
{ not: { kind: "title" } }                            // negation
{ and: [{ kind: "p" }, { within: { kind: "blockquote" } }] }
{ or: [{ role: "chapter" }, { role: "epilogue" }] }
```

See [`styling-spec.md` §4](./styling-spec.md) for the full grammar
and worked examples of every combinator.

## Recipe 1 — Styling section headings

The default state has no heading typography. Bind a class scoped to
heading depth:

```tsx
const STYLES = `
  .section-h1 {
    font-size: 14pt;
    font-weight: bold;
    margin: 18pt 0 6pt 0;
    break: after(avoid);   /* don't orphan the heading */
  }
  .section-h2 {
    font-size: 12pt;
    font-weight: bold;
    font-style: italic;
    margin: 12pt 0 4pt 0;
    break: after(avoid);
  }
`;

<rule match={{ kind: "section-heading", depth: 1 }} className="section-h1" />
<rule match={{ kind: "section-heading", depth: 2 }} className="section-h2" />
```

Note: `section-heading` is the IR kind for the heading element the
resolver prepends to each section. Use `{ kind: "section", depth }`
when you want to style the section *wrapper* (background, margin
around the whole section); use `section-heading` for the heading
typography itself.

## Recipe 2 — Drop cap on the first paragraph of a chapter

Drop caps are promoted to a typed style via the role-rule system.
For one-off drop caps, the cleanest path is a role-rule that scopes
the effect to a section role.

```tsx
<rules>
  <role
    on="section"
    match="chapter"
    apply="chapterOpener"
    dropCap={{ lines: 3, font: "Georgia, serif" }}
  />
</rules>
```

Content opts in by `<section role="chapter">…</section>`. The first
paragraph in the section gets a three-line drop cap on its first
letter; subsequent paragraphs render normally.

The styling spec promotes `drop-cap` to a general declaration in
slice 2.4; until that ships, role-rules are the supported authoring
surface for drop caps.

## Recipe 3 — Small caps on the first section

Use `index: "first"` to scope a treatment to the opening section:

```tsx
const STYLES = `
  .opening-p {
    font-variant: small-caps;
    letter-spacing: 0.02em;
  }
`;

<rule
  match={{
    kind: "paragraph",
    index: "first",
    within: { kind: "section", depth: 1, index: "first" }
  }}
  className="opening-p"
/>
```

Only the first paragraph of the first top-level section gets
small-caps. Read the match as "a paragraph whose position is *first*,
that lives inside *the first depth-1 section*."

## Recipe 4 — First-line indent on body paragraphs (with the post-heading exception)

The classic problem: indent every body paragraph 1em, *except* the
one that immediately follows a heading.

```tsx
const STYLES = `
  .body-p { margin: 0; text-indent: 1em; }
  .heading-adjacent-p { text-indent: 0; }
`;

<rule match={{ kind: "paragraph" }} className="body-p" />
<rule
  match={{ kind: "paragraph", follows: { kind: "section-heading" } }}
  className="heading-adjacent-p"
/>
```

Both rules can match the same paragraph; the engine applies both
classes, and CSS precedence resolves the override (the second class
appears later in the stylesheet, so its `text-indent: 0` wins).

The styling spec's slice-2.4 plans an `indent` declaration that
collapses this two-rule idiom into one declaration with an
`except-after:` clause.

## Recipe 5 — Hanging indent on bibliography entries

Bibliographies want the entry's first line flush left and subsequent
lines indented — the opposite of a paragraph indent. The dialect
supports this directly:

```tsx
const STYLES = `
  .bib-entry-p {
    margin: 0;
    text-align: left;
    text-indent: -1.6em;
    padding-left: 1.6em;
  }
`;

<rule
  match={{
    kind: "paragraph",
    within: { kind: "section", role: "bibliography" }
  }}
  className="bib-entry-p"
/>
```

When `hanging-indent: 1.6em` lands as a promoted concept (styling
spec slice 2.x), it replaces the negative-indent / padding-left
idiom with a single typed declaration.

## Recipe 6 — Bold the last cell in a table row

Positional selectors compose with `parent`:

```tsx
const STYLES = `
  .last-cell { font-weight: bold; border-top: 0.75pt solid #000; }
`;

<rule
  match={{ kind: "cell", parent: { kind: "row", index: "last" } }}
  className="last-cell"
/>
```

This binds the class to every cell whose parent row is the last row
in the table — useful for totals rows. The
[`@reactwright/template-ieee`](../packages/template-ieee/README.md)
uses the same pattern to add a bottom rule to the last-row cells of
its tables.

## Recipe 7 — A `follows:` recipe — extra space before the second abstract paragraph

`follows:` is the adjacent-sibling combinator. A common use is
adding margin between sibling paragraphs that wouldn't otherwise
collapse:

```tsx
const STYLES = `
  .abstract-p { margin: 0; text-indent: 0; }
  .abstract-p-after { margin-top: 6pt; }
`;

<rule
  match={{ kind: "paragraph",
           within: { kind: "section", role: "abstract" } }}
  className="abstract-p"
/>
<rule
  match={{
    kind: "paragraph",
    within: { kind: "section", role: "abstract" },
    follows: { kind: "paragraph" }
  }}
  className="abstract-p-after"
/>
```

The first abstract paragraph gets `abstract-p` only. The second and
later abstract paragraphs match both rules, picking up the `6pt`
top margin.

## Pass-through versus promoted properties

Inside `<styles>`, most properties are *pass-through* — they are
standard CSS that the dialect forwards to the target unchanged
(`font-size`, `margin`, `color`, `text-align`, etc.). A handful are
*promoted*: dialect-native declarations the engine compiles to
target-specific machinery.

Examples of promoted declarations the dialect already supports:

- `numbering: counter(name, upper-roman) "$name. "` — auto-numbering
  with counters; used for IEEE Roman section numbers and "Fig. N."
  caption prefixes.
- `numbering-reset: child-counter` — reset child counters when this
  one increments (chapter-scoped figure numbering).
- `prefix: "..."` / `suffix: "..."` — `::before` / `::after`
  generated content.
- `break: before(value) after(value) inside(value)` — combined
  page-break controls plus the legacy fallback selectors Paged.js
  occasionally needs.

The full inventory lives in [`styling-spec.md`
§5](./styling-spec.md). When a declaration you want is missing,
check the deferred-slices list in §9; the order of arrival is
documented there.

## Where to learn more

- [`styling-spec.md`](./styling-spec.md) — canonical grammar:
  selectors (§4), declarations (§5), the `<styles>` block (§6), the
  compilation model (§8), and the §10 binding decisions you must
  read before designing template-wide style architecture.
- [`api-reference.md`](./api-reference.md) — `<styles>` and `<rule>`
  prop tables, plus all the intrinsics your rules can match against.
- [`template-authoring.md`](./template-authoring.md) — how the
  styling dialect fits into a complete template module.
