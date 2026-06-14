---
"reactwright": minor
"@reactwright/template-essay": patch
"@reactwright/template-ieee-report": patch
---

Bug-batch from `wit_writer_test` integration testing.

Engine (`reactwright`):

- `<list type="ol"|"ul">` now renders correctly in the HTML backend
  (previously every `<list>` rendered as `<ul>`). The `ordered`
  boolean prop still works; `type` is a sugar.
- `<row header>` propagates a `header` flag to every child `<cell>`,
  which the HTML backend renders as `<th>`. Closes the parity gap
  with `@reactwright/markdown` table headers.
- `<heading>` accepts inline-marked children additively:
  `<heading level={2}><em>Italic</em> heading</heading>` now works
  alongside the existing `title="…"` string form. `title` is now
  optional; the resolver derives a plain-text projection from
  children when only marks are supplied.
- Reference-data intrinsics (`<bib-data>`, `<toc-data>`,
  `<list-of-data>`, `<index-data>`) accept a `render={fn}` prop
  for the entry callback. Eliminates the React "Functions are not
  valid as a React child" warning that fired on every build. The
  children-as-function form still works for back-compat; userland
  helpers (`Bibliography`, `Toc`, `ListOf`, `Index`) switched to
  the prop form.
- Userland `Bibliography` / `Toc` / `ListOf` / `Index` now return
  `null` when their entry list is empty, instead of producing an
  orphan section header on a trailing blank page.
- Factory errors (e.g. `<heading>` with no `title` or children)
  surface to the user as `[reactwright] <intrinsic>: <message>`
  with the original error in `.cause`, instead of the opaque
  `"Content renderer produced no root node."`.
- Grammar violations (e.g. `<list>` with a non-`<item>` child,
  `<item>` with raw inline text) surface as
  `[reactwright] <parent> > <child>: <rule message>`, using the
  per-rule message strings already declared in `content/grammar.ts`.

Template (`@reactwright/template-essay`):

- Blockquote (`<quote>`) now has MLA-appropriate offset (left
  margin, single-line spacing, breathing room above and below)
  instead of being visually indistinguishable from body text.

Template (`@reactwright/template-ieee-report`):

- Tables now have visible header-row chrome (thin top/bottom rules)
  and a bottom rule on the last row, ported from the `template-ieee`
  conference template.
