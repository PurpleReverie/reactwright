# API reference: JSX intrinsics

Reactwright exposes two intrinsic vocabularies — *content* intrinsics
(the document body) and *template* intrinsics (the page layout +
chrome). This page is the prop reference for both. For full semantics
see [`spec.md`](./spec.md); for the styling dialect see
[`styling-spec.md`](./styling-spec.md).

All intrinsics are lower-case JSX tags. They become available the
moment a file `import "reactwright/jsx";` runs at the top.

A note on conventions:

- *Required* in the tables below means the engine throws if the prop
  is missing or empty.
- Props in the *Metadata* group (`id`, `role`, `page`, `variant`,
  `className`) apply to most content intrinsics; they are listed in
  full only on `<section>` to keep the per-tag tables short.
- Children rules are governed by the content grammar
  (`src/content/grammar.ts`). The most common error — "Content
  renderer produced no root node" — means a child violated its
  parent's allowed-children list.

## Content intrinsics

### `<document>`

The root content node. Exactly one per file.

| Prop     | Type     | Required | Default | Description                          |
|----------|----------|----------|---------|--------------------------------------|
| `title`  | `string` | yes      | —       | Document title; emitted as `<h1>`.   |
| `author` | `string` | no       | —       | Author byline.                       |

### `<section>`

Sectioning element. Emits a `<section>` wrapper with a heading at the
depth of nesting. The heading text comes from `title`. Sections may
nest to depth 6.

| Prop        | Type     | Required | Default | Description                                    |
|-------------|----------|----------|---------|------------------------------------------------|
| `title`     | `string` | yes      | —       | Heading text. Use `""` to suppress the heading.|
| `id`        | `string` | no       | auto    | Anchor id for cross-references.                |
| `role`      | `string` | no       | —       | Semantic role (e.g. `"chapter"`, `"abstract"`).|
| `page`      | `string` | no       | —       | Route to a named `<page-set>` regime.          |
| `variant`   | `string` | no       | —       | Pre-assigned presentation variant.             |
| `counter`   | `string` | no       | —       | Custom counter name for numbering.             |
| `className` | `string` | no       | —       | Author-assigned class (rarely needed).         |

### `<heading>`

Free-standing heading not tied to a section.

| Prop    | Type             | Required | Default | Description                |
|---------|------------------|----------|---------|----------------------------|
| `level` | `1\|2\|3\|4\|5\|6`| no       | `1`    | Heading depth.             |
| `title` | `string`         | yes      | —       | Heading text.              |

### `<p>`

Paragraph. Children are inline content.

| Prop        | Type     | Required | Default | Description                |
|-------------|----------|----------|---------|----------------------------|
| `id`        | `string` | no       | —       | Anchor id.                 |
| `className` | `string` | no       | —       | Author-assigned class.     |

### `<figure>`

Block-level figure. May carry a `caption` prop *or* a
`<caption>` child (the child form is preferred).

| Prop      | Type     | Required | Default | Description                       |
|-----------|----------|----------|---------|-----------------------------------|
| `src`     | `string` | yes      | `""`    | Image source.                     |
| `alt`     | `string` | no       | —       | Alt text.                         |
| `caption` | `string` | no       | —       | Legacy caption (prefer `<caption>`).|
| `width`   | `string` | no       | —       | Display width (CSS length).       |

### `<caption>`

Caption child for a parent `<figure>` or `<table>`. Children are
block-level content (typically `<p>`).

| Prop        | Type     | Required | Default | Description            |
|-------------|----------|----------|---------|------------------------|
| `id`        | `string` | no       | —       | Anchor id.             |
| `role`      | `string` | no       | —       | Semantic role.         |
| `className` | `string` | no       | —       | Author-assigned class. |

### `<table>`, `<row>`, `<cell>`

A semantic table. `<table>` children must be `<row>` (and optionally
one `<caption>`); `<row>` children must be `<cell>`; `<cell>`
children must be block content (typically `<p>` — raw text is not
allowed).

`<table>`:

| Prop        | Type     | Required | Default | Description                            |
|-------------|----------|----------|---------|----------------------------------------|
| `id`        | `string` | no       | —       | Anchor id.                             |
| `caption`   | `string` | no       | —       | Legacy caption (prefer `<caption>`).   |
| `className` | `string` | no       | —       | Author-assigned class.                 |

`<row>`:

| Prop        | Type     | Required | Default | Description            |
|-------------|----------|----------|---------|------------------------|
| `className` | `string` | no       | —       | Author-assigned class. |

`<cell>`:

| Prop        | Type      | Required | Default | Description                          |
|-------------|-----------|----------|---------|--------------------------------------|
| `header`    | `boolean` | no       | `false` | Emit as `<th>` instead of `<td>`.    |
| `className` | `string`  | no       | —       | Author-assigned class.               |

### `<quote>`

Block quotation. Children are block content.

| Prop      | Type     | Required | Default | Description                          |
|-----------|----------|----------|---------|--------------------------------------|
| `speaker` | `string` | no       | —       | Speaker / attribution metadata.      |
| `id`      | `string` | no       | —       | Anchor id.                           |

### `<code-block>`, `<pre>`

`<code-block>` is a syntax-aware code block; `<pre>` is plain
pre-formatted text.

`<code-block>`:

| Prop       | Type     | Required | Default | Description                          |
|------------|----------|----------|---------|--------------------------------------|
| `id`       | `string` | no       | —       | Anchor id.                           |
| `language` | `string` | no       | —       | Language hint for highlighters.      |

`<pre>` accepts only `id`.

### `<list>`, `<item>`

Ordered or unordered list. `<item>` children must be block content.

`<list>`:

| Prop      | Type      | Required | Default | Description                  |
|-----------|-----------|----------|---------|------------------------------|
| `ordered` | `boolean` | no       | `false` | Emit `<ol>` instead of `<ul>`.|
| `id`      | `string`  | no       | —       | Anchor id.                   |

`<item>` accepts only `id`.

### `<defs>`, `<def>`

Definition list. `<def>` carries a term; its children are the
definition body.

`<defs>` accepts metadata only. `<def>`:

| Prop   | Type     | Required | Default | Description    |
|--------|----------|----------|---------|----------------|
| `term` | `string` | yes      | —       | The term.      |

### Inline content — `<em>`, `<strong>`, `<code>`, `<br>`, `<sub>`, `<sup>`

Style and structure inline runs. Each accepts an optional
`className`. `<br>` accepts no props.

### `<link>`

Inline hyperlink.

| Prop        | Type     | Required | Default | Description                  |
|-------------|----------|----------|---------|------------------------------|
| `href`      | `string` | yes      | —       | URL.                         |
| `titleText` | `string` | no       | —       | Link tooltip text.           |
| `className` | `string` | no       | —       | Author-assigned class.       |

### `<img>`

Inline image. Block-level images use `<figure>`.

| Prop     | Type     | Required | Default | Description    |
|----------|----------|----------|---------|----------------|
| `src`    | `string` | yes      | —       | Image source.  |
| `alt`    | `string` | no       | —       | Alt text.      |
| `width`  | `string` | no       | —       | CSS length.    |
| `height` | `string` | no       | —       | CSS length.    |

### `<cite>`

Citation reference. The cite key must match a `<ref-entry refKey>`
in the document.

| Prop        | Type     | Required | Default | Description            |
|-------------|----------|----------|---------|------------------------|
| `cite`      | `string` | yes      | —       | Reference key.         |
| `className` | `string` | no       | —       | Author-assigned class. |

### `<refs>`, `<ref-entry>`

The bibliography source. Place a single `<refs>` block anywhere in
the document; each child `<ref-entry>` declares one reference. The
engine collects them and routes them to whichever template element
renders the bibliography.

`<ref-entry>`:

| Prop        | Type     | Required | Default | Description                              |
|-------------|----------|----------|---------|------------------------------------------|
| `refKey`    | `string` | yes\*    | —       | Reference key; `key` also accepted.      |
| `className` | `string` | no       | —       | Author-assigned class.                   |

\* `refKey` is canonical; `key` is accepted as a shorthand.

### `<ref>`

Cross-reference to any element with an `id`.

| Prop        | Type                                              | Required | Default    | Description                       |
|-------------|---------------------------------------------------|----------|------------|-----------------------------------|
| `to`        | `string`                                          | yes      | —          | Target id.                        |
| `show`      | `"number" \| "page" \| "title" \| "number-and-page"` | no       | `"number"` | Rendered form.                    |
| `className` | `string`                                          | no       | —          | Author-assigned class.            |

### `<footnote>`, `<sidenote>`

Floating notes. `<footnote>` appears at the page foot (requires a
`<footnote-area>` in the template); `<sidenote>` floats into the
sidenote area.

| Prop     | Type     | Required | Default | Description                      |
|----------|----------|----------|---------|----------------------------------|
| `marker` | `string` | no       | auto    | Override the numeric marker (footnote only).|
| `className`| `string` | no     | —       | Author-assigned class.           |

### `<math>`, `<m>`

Math primitives. `<math>` is block-level; `<m>` is inline. Both
accept a `src` TeX string and route through KaTeX.

| Prop  | Type     | Required | Default | Description    |
|-------|----------|----------|---------|----------------|
| `src` | `string` | yes      | —       | TeX source.    |

`<math>` additionally accepts metadata (`id`, `role`, `variant`).

### `<index>`

Inline index-term marker. Index pages are produced by `<index-data>`
in the template.

| Prop   | Type     | Required | Default | Description    |
|--------|----------|----------|---------|----------------|
| `term` | `string` | yes      | —       | Index term.    |

### `<page-break>`

Force a page break at this point in the flow. No props.

### `<set>`

Set a running-string value. The template's `<running name="…">` reads
the most recent value declared with the same `running` name.

| Prop      | Type     | Required | Default | Description                  |
|-----------|----------|----------|---------|------------------------------|
| `running` | `string` | yes      | —       | Running-string name.         |
| `value`   | `string` | no       | `""`    | Value to record.             |

### `<bib-entry-content>`

Placeholder used by userland bibliography helpers — substituted by
the resolver with the inline children of the matching `<ref-entry>`.

| Prop  | Type     | Required | Default | Description                |
|-------|----------|----------|---------|----------------------------|
| `for` | `string` | yes      | —       | Reference key to expand.   |

## Template intrinsics

Template intrinsics live in the document's `Template` component, not
in the content tree.

### `<page>`

The page (or page-rule) container.

As a container:

| Prop         | Type      | Required | Default | Description                                  |
|--------------|-----------|----------|---------|----------------------------------------------|
| `page`       | `object`  | no       | —       | Page-geometry style group (`size`, margins). |
| `typography` | `object`  | no       | —       | Body typography style group.                 |
| `style`      | `object`  | no       | —       | Inline style overrides.                      |

As a page-rule (used inside `<rules>`):

| Prop    | Type     | Required | Default | Description                          |
|---------|----------|----------|---------|--------------------------------------|
| `match` | `string` | yes      | —       | Section role to route.               |
| `use`   | `string` | yes      | —       | Target `<page-set>` name.            |

### `<page-set>`

Declare a named page regime.

| Prop      | Type     | Required | Default | Description                                  |
|-----------|----------|----------|---------|----------------------------------------------|
| `name`    | `string` | yes      | —       | Regime name; sections route to it via `page`.|
| `anchors` | `object` | no       | —       | Custom anchor map.                           |
| `style`   | `object` | no       | —       | Geometry / typography overrides for the regime.|

### `<region>`

A flow container inside a page or page-set. Children are flowed body
content or further layout primitives.

| Prop          | Type     | Required | Default | Description                          |
|---------------|----------|----------|---------|--------------------------------------|
| `style`       | `object` | no       | —       | Style overrides.                     |
| `positioning` | `object` | no       | —       | Absolute positioning (see spec).     |
| `className`   | `string` | no       | —       | Author-assigned class.               |

### `<stack>`, `<row>`, `<columns>`, `<column>`

Layout primitives. `<stack>` is vertical, `<row>` (template-side) is
horizontal, `<columns>` is multi-column flow.

`<stack>`, `<row>`:

| Prop  | Type     | Required | Default | Description                  |
|-------|----------|----------|---------|------------------------------|
| `gap` | `string` | no       | `"0"`   | CSS length between children. |

`<columns>`:

| Prop     | Type       | Required | Default | Description                        |
|----------|------------|----------|---------|------------------------------------|
| `gap`    | `string`   | no       | —       | Gap between columns.               |
| `widths` | `string[]` | no       | equal   | Per-column widths (CSS fractions). |

`<column>`:

| Prop    | Type     | Required | Default | Description    |
|---------|----------|----------|---------|----------------|
| `width` | `string` | no       | —       | CSS length.    |

### `<fixed>`

Position content at a fixed anchor on the page, outside the body
flow (used for masthead overlays, watermarks, etc.).

| Prop     | Type      | Required | Default | Description                                  |
|----------|-----------|----------|---------|----------------------------------------------|
| `anchor` | `string`  | yes      | —       | Anchor name (built-in or page-set custom).   |
| `when`   | `string`  | no       | —       | Visibility policy.                           |
| `style`  | `object`  | no       | —       | Inline style.                                |

### `<layer>`

Z-axis layer for stacking content on a page.

| Prop    | Type     | Required | Default | Description                  |
|---------|----------|----------|---------|------------------------------|
| `name`  | `string` | no       | —       | Layer name.                  |
| `when`  | `string` | no       | —       | Visibility policy.           |
| `style` | `object` | no       | —       | Inline style.                |

### `<slot>`

Marker for where content gets substituted into the template.

| Prop   | Type                                          | Required | Default | Description                |
|--------|-----------------------------------------------|----------|---------|----------------------------|
| `name` | `"title" \| "author" \| "abstract" \| "body"`  | yes      | —       | Slot name.                 |

### `<header>`, `<footer>`

Page margin matter. Anchor controls placement; `when` controls which
pages get it.

| Prop         | Type     | Required | Default | Description                                  |
|--------------|----------|----------|---------|----------------------------------------------|
| `anchor`     | `string` | no       | varies  | Anchor (e.g. `top-left`, `bottom-center`).   |
| `when`       | `string` | no       | —       | `"first-page"`, `"not-first-page"`, …        |
| `typography` | `object` | no       | —       | Typography style group.                      |

### `<running>`

Emit a running-string value (typically inside `<header>` /
`<footer>`).

| Prop     | Type                                                  | Required | Default | Description                          |
|----------|-------------------------------------------------------|----------|---------|--------------------------------------|
| `name`   | `string`                                              | yes      | —       | Running-string name.                 |
| `policy` | `"start" \| "first" \| "last" \| "first-except"`      | no       | `start` | When to sample the running value.    |

### `<page-number>`, `<page-count>`

Counter sinks for the current page number and total page count.
Both accept a `typography` / `style` group.

### `<bibliography>` (deprecated)

Engine compound for an automatic bibliography. **Deprecated;** will
be removed at v1.0. Prefer the userland `<Bibliography>` helper from
`reactwright/userland` or compose your own from `<bib-data>`.

### `<toc>` (deprecated)

Engine compound for a table of contents. **Deprecated;** will be
removed at v1.0. Compose from `<toc-data>` for new work.

| Prop       | Type      | Required | Default | Description                |
|------------|-----------|----------|---------|----------------------------|
| `title`    | `string`  | no       | —       | TOC heading.               |
| `depth`    | `number`  | no       | —       | Max section depth to list. |
| `numbered` | `boolean` | no       | `false` | Show section numbers.      |

### `<list-of>` (deprecated)

Engine compound for a list of figures / tables / equations.
**Deprecated;** compose from `<list-of-data>`.

| Prop    | Type                                  | Required | Default | Description                |
|---------|---------------------------------------|----------|---------|----------------------------|
| `of`    | `"figure" \| "table" \| "equation"`    | yes      | —       | Kind to list.              |
| `title` | `string`                              | no       | —       | List heading.              |

### `<index>` (template form, deprecated)

Engine compound that emits a back-of-book index. **Deprecated;**
compose from `<index-data>`.

| Prop    | Type     | Required | Default | Description    |
|---------|----------|----------|---------|----------------|
| `title` | `string` | no       | —       | Index heading. |

### Data-source primitives — `<bib-data>`, `<toc-data>`, `<list-of-data>`, `<index-data>`

Render-prop primitives that surface the engine's collected data.
Each takes a function-as-child that receives an array of entries and
returns JSX.

`<list-of-data>` additionally requires `of` as above.

### `<font>`

Declare a `@font-face` at the document level.

| Prop        | Type              | Required | Default | Description                  |
|-------------|-------------------|----------|---------|------------------------------|
| `family`    | `string`          | yes      | —       | Font family name.            |
| `src`       | `string`          | yes      | —       | URL or file path.            |
| `weight`    | `string\|number`  | no       | —       | Font weight.                 |
| `fontStyle` | `string`          | no       | —       | `normal`, `italic`, etc.     |
| `format`    | `string`          | no       | —       | Font format hint.            |

### `<image>` (template form)

Background or layered image inside the template tree. Distinct from
the content-side `<img>`.

| Prop      | Type      | Required | Default | Description                          |
|-----------|-----------|----------|---------|--------------------------------------|
| `src`     | `string`  | yes      | —       | Image source.                        |
| `alt`     | `string`  | no       | —       | Alt text.                            |
| `width`   | `string`  | no       | —       | CSS length.                          |
| `fill`    | `boolean` | no       | —       | Fill the container.                  |
| `cover`   | `boolean` | no       | —       | `object-fit: cover` semantics.       |
| `contain` | `boolean` | no       | —       | `object-fit: contain` semantics.     |

### `<footnote-area>`, `<sidenote-area>`

Placement zones for floating notes. `<footnote-area>` is page-foot;
`<sidenote-area>` is in the margin.

`<footnote-area>`:

| Prop        | Type      | Required | Default | Description                          |
|-------------|-----------|----------|---------|--------------------------------------|
| `separator` | `boolean` | no       | `true`  | Draw the rule above footnotes.       |

`<sidenote-area>`:

| Prop    | Type                                                | Required | Default | Description                  |
|---------|-----------------------------------------------------|----------|---------|------------------------------|
| `side`  | `"outside" \| "inside" \| "left" \| "right"`         | no       | —       | Which margin.                |
| `width` | `string`                                            | no       | —       | Width of the area.           |
| `gap`   | `string`                                            | no       | —       | Gap from body.               |

### `<rules>` and `<role>` (role-rule routing)

`<rules>` is a passthrough container; valid children are `<role>`
and `<page match use>` (the page-routing form).

`<role>`:

| Prop          | Type             | Required | Default | Description                              |
|---------------|------------------|----------|---------|------------------------------------------|
| `on`          | `string`         | no       | —       | IR kind to scope the rule to.            |
| `match`       | `string`         | yes      | —       | Content-side role to match.              |
| `apply`       | `string`         | yes      | —       | Presentation variant to apply.           |
| `breakBefore` | `BreakValue`     | no       | —       | CSS page-break-before override.          |
| `breakAfter`  | `BreakValue`     | no       | —       | CSS page-break-after override.           |
| `breakInside` | `"auto"\|"avoid"`| no       | —       | CSS break-inside override.               |
| `numbering`   | `object`         | no       | —       | Counter + format string (see spec §5).   |
| `dropCap`     | `object`         | no       | —       | Drop-cap config (lines, font, position). |
| `style`       | `object`         | no       | —       | Inline style for the variant.            |

`BreakValue` is one of `"auto"`, `"always"`, `"avoid"`, `"page"`,
`"left"`, `"right"`, `"recto"`, `"verso"`.

### `<styles>` and `<rule>` (styling dialect)

`<styles>{`…`}</styles>` declares a block of named classes in the
CSS-superset dialect; `<rule>` binds a `match` selector to one of
those class names. See [`styling-spec.md`](./styling-spec.md) and the
recipe-driven [`styling-guide.md`](./styling-guide.md).

`<rule>`:

| Prop        | Type     | Required | Default | Description                          |
|-------------|----------|----------|---------|--------------------------------------|
| `match`     | `Match`  | yes      | —       | IR-shape selector (see styling-spec).|
| `className` | `string` | yes      | —       | Class name defined in `<styles>`.    |

`<styles>` takes its source as its CSS-text child.

## Where to learn more

- [`spec.md`](./spec.md) — canonical semantics, including the
  resolver model, anchor system, layer system, and rule pipeline.
- [`styling-spec.md`](./styling-spec.md) — the styling dialect:
  selector grammar (§4), declaration grammar (§5), and the binding
  decisions in §10.
- [`styling-guide.md`](./styling-guide.md) — worked recipes for the
  dialect.
- [`template-authoring.md`](./template-authoring.md) — how to write
  your own template from scratch.
