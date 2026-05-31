# Reactwright Specification

Reactwright is a React-authored document engine for paginated documents. The system targets HTML rendered through Paged.js, with PDF as a derived artifact via headless Chromium. LaTeX is not a render target.

> **Status.** This specification describes the target vocabulary and architecture. The current source code still reflects an earlier LaTeX-shaped design and is being migrated toward this spec. Where the spec and code disagree, the spec is canonical.

## Pivot context

Earlier iterations of Reactwright targeted LaTeX as the primary typesetting backend, with HTML serving as a preview path. That direction has been abandoned:

- LaTeX targeting was actively bloating the codebase and template vocabulary
- Browser-based tooling (devtools, live inspection) gives template authors a faster design loop
- The Paged.js polyfill of CSS Paged Media provides a real pagination engine in the browser, which then drives headless-Chromium PDF output

The template primitive vocabulary in this specification is shaped by the constraints of CSS Paged Media + Paged.js, not by LaTeX.

## Design principles

1. **Paged.js is the correctness gate.** A primitive earns its place only if it maps cleanly to CSS Paged Media + GCPM (Generated Content for Paged Media).
2. **Template authors do not write CSS.** Layout, page geometry, and decoration are expressed through typed primitives and style groups. Raw `style={...}` exists as an escape hatch but is not part of the canonical surface.
3. **Content is prose-first.** A writer authoring a long document touches a small set of intrinsics and otherwise focuses on prose.
4. **React composition is the primary extension mechanism.** PascalCase wrapper components are first-class. `defineTemplateIntrinsic` exists for backend-aware extensions but is advanced.
5. **One canonical name per concept.** No aliases.
6. **Semantic routing survives.** `role`, `page`, and `variant` props on content nodes route content to template-defined treatments without coupling content to presentation.

## Architecture

Two independent React reconcilers execute the content tree and the template tree in isolation. Each produces an intermediate representation (IR). A resolver joins the two IRs by substituting `<slot>` nodes in the template with the matching regions from the content. The resolved tree is compiled to a paginated HTML document, which Paged.js paginates in the browser and headless Chromium prints to PDF.

```
content React tree  ─┐
                     ├──► resolver ──► HTML ──► Paged.js ──► paginated DOM ──► PDF
template React tree ─┘
```

## Content vocabulary

### Block primitives

| Primitive | Notes |
|---|---|
| `document` | Root node. Props: `title`, `author`. |
| `section` | Titled, nestable. Accepts routing props. |
| `abstract` | Resolves to its own slot. |
| `p` | Paragraph. Inline children. |
| `quote` | Block quotation. Optional `speaker`. |
| `list` | Ordered or unordered. Children are `item`. |
| `item` | Single list item. |
| `figure` | Image with caption. Props: `src`, `alt`, `caption`, `width`. |
| `table` | Tabular data. Optional `caption`. Children are `row`. |
| `row` | Table row. Children are `cell`. |
| `cell` | Table cell. Boolean `header` prop. |
| `code-block` | Verbatim block. Optional `language`. |
| `page-break` | Explicit page break. |

### Inline primitives

| Primitive | Notes |
|---|---|
| `em` | Emphasis. |
| `strong` | Strong emphasis. |
| `code` | Inline code. |
| `link` | Hyperlink. Prop: `href`. |

### Content metadata directives

| Primitive | Notes |
|---|---|
| `set` | Zero-rendered. Sets a named running string at this position in document flow. Props: `running`, `value`. |

### Routing props

The following props are accepted by all block primitives except `document` and `abstract`:

- **`role`** — semantic tag. Resolved against template rules to select a presentation variant. Has no presentation meaning on its own.
- **`page`** — names a page regime. Resolved to a `<page-set>` via a `<page>` rule.
- **`variant`** — direct presentation variant name. Used when the content wants to make a visual claim without going through the role system. Escape hatch; non-canonical.

### Removed from earlier vocabulary

- `paragraph` (alias for `p`), `blockquote` (alias for `quote`), `pre` (alias for `code-block`), `a` (alias for `link`), `thematic-break` (alias for `hr`) — alias drops, one canonical name each.
- `font` inline node — presentation leaking into content. Use a template rule or PascalCase wrapper.
- `hr` / `thematic-break` — niche; can return as a wrapper component if needed.
- `table-row`, `table-cell` — renamed to `row`, `cell`.

## Template vocabulary

### Structural primitives

| Primitive | Purpose |
|---|---|
| `page` | The default page regime. Carries the `page` style group. |
| `page-set` | A named page regime. Content tagged with matching `page` prop routes here. Carries the `page` style group. Supports `anchors` prop for custom positions. |
| `slot` | Insertion point for resolved content. Names: `title`, `author`, `abstract`, `body`. |
| `layer` | Z-ordered visual layer inside a `page` or `page-set`. Layers stack in JSX order: first child renders backmost. Optional `when` prop. |

### Layout primitives

| Primitive | Purpose |
|---|---|
| `region` | General-purpose flow container. Accepts `text`, `flow`, `frame` style groups, plus positioning props (`fill`, `cover`, `contain`, `center`, `anchor`). |
| `stack` | Vertical flex flow. Prop: `gap`. |
| `columns` | N tracks side by side. Children are `<column>`. |
| `column` | Single column track. Optional `width`. |

### Margin matter and overlays

| Primitive | Purpose |
|---|---|
| `header` | Content for the page's top/side margin box. Props: `anchor`, `when`. |
| `footer` | Content for the page's bottom/side margin box. Same prop shape as `header`. |
| `fixed` | Absolutely-positioned overlay inside a layer. Props: `anchor` (name or coordinates), `when`. |
| `page-number` | Current page number. |
| `page-count` | Total pages. |
| `running` | Pulls a named running string into a margin box. Props: `name`, optional `policy`. |

### Decoration

| Primitive | Purpose |
|---|---|
| `image` | Decorative image (not document-semantic). Props: `src`, `fill`, `cover`, `contain`, `width`. |

### Rules

| Primitive | Purpose |
|---|---|
| `rules` | Container for routing rules. |
| `role` | Maps content `role` to template `variant`. Props: `match`, `apply`, optional `on=<element-kind>`. |
| `page` | Maps content `page` to a `<page-set>` name. Props: `match`, `use`. |

### Removed from earlier vocabulary

- `box`, `flow`, `template` — consolidated into `region` + the root `page`.
- `row` (template horizontal layout) — use `columns`/`column`.
- `repeat`, `fixed` (the old repeat-running-matter semantics) — replaced by `header`/`footer` for repeating margin content; `fixed` survives but is reframed as overlay-only.
- `rule` (line-drawing primitive) — express via `region` with frame styling, or wrap as a PascalCase component.
- `page-set` rule kind — implicit name match: `<page-set name="X">` matches content `page="Y"` via an explicit `<page match="Y" use="X">` rule.
- Six typed role rules (`section-role`, `quote-role`, etc.) — collapsed into one `role` primitive with optional `on=` scoping.

## Style groups

Style on template nodes is expressed via typed prop groups. Raw `style={...}` is permitted as an escape hatch but is not canonical and may not survive future render targets.

### `page` group (only on `<page>` and `<page-set>`)

| Prop | Notes |
|---|---|
| `size` | Page size (e.g. `"a4"`, `"letter"`, `"5in 8in"`). |
| `margin` | Shorthand. |
| `marginTop` / `marginRight` / `marginBottom` / `marginLeft` | Per-side. |
| `orientation` | `"portrait"` or `"landscape"`. |
| `twoSided` | Enables mirror-aware anchors. |
| `columns` | Multi-column text flow count. |
| `columnGap` | Gap between flow columns. |

### `text` group

| Prop | Notes |
|---|---|
| `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `color` | Standard text. |
| `lineHeight`, `letterSpacing`, `wordSpacing`, `textAlign` | Layout. |

### `flow` group

| Prop | Notes |
|---|---|
| `gap` | Between-child spacing. |
| `indent`, `firstLineIndent` | Paragraph indents. |
| `paragraphSpacing` | Space between paragraphs. |
| `keepTogether` | Prevent break inside. |
| `keepWithNext` | Stay with following content. |
| `widowControl`, `orphanControl`, `hyphenation` | Line breaking. |
| `pageBreakBefore`, `pageBreakAfter`, `breakInside` | Page breaks. |

### `frame` group

| Prop | Notes |
|---|---|
| `padding`, `paddingTop` / etc. | Inner spacing. |
| `border`, `borderTop` / etc., `borderColor`, `borderRadius` | Borders. |
| `backgroundColor` | Background. |
| `opacity` | Transparency. |
| `rotate` | Rotation (e.g. for watermarks). |
| `width`, `maxWidth` | Sizing. |

## Anchors

### Built-in anchors

For `<header>` and `<footer>` (constrained to CSS Paged Media margin boxes):

```
top-left | top-center | top-right
bottom-left | bottom-center | bottom-right
top-inside | top-outside | bottom-inside | bottom-outside    (mirror-aware on two-sided)
left-top | left-middle | left-bottom
right-top | right-middle | right-bottom
```

For `<fixed>` (absolutely positioned inside a layer):

- All `<header>` / `<footer>` anchor names
- `page-top-left`, `page-top-right`, `page-bottom-left`, `page-bottom-right` (page corners)

### Custom anchors

Direct coordinates on `<fixed>`:

```tsx
<fixed anchor={{ top: "30mm", left: "15mm" }} />
```

Named anchor registration on a `<page-set>`:

```tsx
<page-set
  name="lore-pages"
  page={{ size: "a5", margin: "20mm", twoSided: true }}
  anchors={{
    "side-rule":   { top: "30mm", outside: "5mm" },
    "folio-stamp": { bottom: "8mm", outside: "8mm" },
  }}
>
  <fixed anchor="side-rule"><Rule axis="vertical" /></fixed>
</page-set>
```

Coordinates support `inside` / `outside` for mirror-aware layouts. `<header>` and `<footer>` cannot use custom anchors — CSS margin-box positions are a fixed taxonomy. Use `<fixed>` instead.

## Layer system

Layers are Z-ordered by JSX position inside a `<page>` or `<page-set>`:

```tsx
<page-set name="body-pages" page={{ size: "a5", margin: "20mm" }}>
  <layer name="paper">
    <region fill frame={{ backgroundColor: "#fbf7ee" }} />
  </layer>
  <layer name="content">
    <slot name="body" />
  </layer>
  <layer name="watermark" when="not-first-page">
    <region center frame={{ rotate: "-20deg", opacity: 0.06 }}
            text={{ fontSize: "120pt" }}>
      DRAFT
    </region>
  </layer>
</page-set>
```

Rules:

- First child renders backmost; last renders frontmost.
- `<slot>` lives inside whichever layer the template places it in. That layer becomes the flowing layer that drives pagination.
- If no `<layer>` is declared, the page implicitly has one content layer.
- `<header>` and `<footer>` are not part of the layer stack; they live in the page's margin boxes (a separate coordinate system).
- `<fixed>` composes inside a `<layer>` — the layer decides depth, `<fixed>` decides position.

## Dynamic metadata

Some margin-box content varies per page (chapter title, section title, page number, etc.). The mechanism is CSS GCPM `string-set` / `string()` plus standard counters.

### Auto-set strings

The engine sets these strings automatically from content:

| String name | Source |
|---|---|
| `document-title` | `<document title>` |
| `chapter-title` | depth-1 `<section title>` |
| `section-title` | every `<section title>` |

Templates read them via `<running name="...">`:

```tsx
<header anchor="top-center">
  <running name="section-title" />
</header>
```

### Custom strings

Content can set a custom running string with `<set>`:

```tsx
<section title="Scene 12">
  <set running="scene-location" value="Aboard the ferry — dusk" />
  <p>...</p>
</section>
```

The string holds its value until the next `<set running="scene-location">` overrides it.

### String policies

`<running>` accepts a `policy` prop selecting which value to surface on a given page:

- `start` (default) — value at the start of the page
- `first` — first value declared on the page
- `last` — last value declared on the page
- `first-except` — first, but suppressed on the page that declares it

Useful for dictionary-style running heads ("Abalone … Azure").

## Rule system

```tsx
<rules>
  <role match="scene-heading"           apply="screenplay" />     {/* any element */}
  <role on="paragraph" match="dialogue" apply="indented" />       {/* paragraph-only */}
  <role on="quote"     match="prophecy" apply="ornate" />
  <page match="world"  use="world-pages" />
  <page match="scenes" use="scene-pages" />
</rules>
```

- `<role>` maps a content `role` value to a variant name. Optional `on` filters by element kind.
- `<page>` maps a content `page` value to a `<page-set>` name.
- Rules apply globally across the resolved document.
- The hybrid scoping replaces the previous six typed role-rule kinds with one primitive and an optional filter.

## Render pipeline

1. **Content render.** Content React tree → semantic IR via the content reconciler.
2. **Template render.** Template React tree → template IR via the template reconciler.
3. **Resolution.** Resolver collects rules, walks content, routes via `page` rules, applies `role` variants, substitutes `<slot>` nodes with resolved content regions, and registers running strings.
4. **HTML emission.** Resolved tree is serialized as HTML with CSS Paged Media rules in a `<style>` block. Margin boxes become `@page` margin-box rules; layers become absolutely-positioned containers with z-index; running strings become `string-set` declarations; page numbers become `counter(page)`.
5. **Pagination.** Paged.js (in browser or headless Chromium) reads the HTML and paginates it.
6. **PDF emission.** Headless Chromium prints the paginated DOM to PDF.

## Starter kit

The package ships a starter kit demonstrating the patterns.

### Templates

| Template | Notes |
|---|---|
| `article` | Single-column, classic typography. |
| `article-two-column` | IEEE-style with running header. |
| `novel` | Body + chapter-opener regimes; layered design. |
| `handbook` | Multi-regime with sidebars and callouts. |

### Content components

| Component | Pattern |
|---|---|
| `Callout` | Decorated box with icon and body. |
| `Sidebar` | Marginalia / pull-quote wrapper. |
| `DropCap` | First-letter drop cap. |
| `Ornament` | SVG decorative element. |
| `Epigraph` | Attributed epigraph. |
| `SceneHeading` | Shorthand for `<section role="scene-heading">`. |
| `Dialogue` | Shorthand for `<p role="dialogue">`. |

PascalCase wrappers are the primary extension mechanism. Custom template intrinsics via `defineTemplateIntrinsic` are reserved for backend-aware extensions.

## Worked example: novel template

```tsx
import type { TemplateComponent } from "reactwright";

export const Template: TemplateComponent = () => (
  <>
    <rules>
      <role on="section" match="chapter-opener" apply="chapter-display" />
      <page match="chapter-open" use="chapter-opener-pages" />
    </rules>

    <page-set
      name="body-pages"
      page={{ size: "a5", margin: "22mm", twoSided: true }}
      text={{ fontFamily: "serif", fontSize: "10.5pt", lineHeight: 1.35 }}
    >
      <layer name="paper">
        <region fill frame={{ backgroundColor: "#fbf7ee" }} />
      </layer>
      <layer name="content">
        <slot name="body" />
      </layer>

      <header anchor="top-outside" when="not-first-page">
        <running name="chapter-title" />
      </header>
      <footer anchor="bottom-center">
        <page-number />
      </footer>
    </page-set>

    <page-set
      name="chapter-opener-pages"
      page={{ size: "a5", margin: "0" }}
    >
      <layer name="art">
        <image src="/art/chapter-bg.jpg" fill cover />
      </layer>
      <layer name="scrim">
        <region fill frame={{ backgroundColor: "rgba(0,0,0,0.45)" }} />
      </layer>
      <layer name="title-display">
        <region
          center
          frame={{ padding: "20mm" }}
          text={{ color: "white", fontFamily: "serif", fontSize: "32pt", textAlign: "center" }}
        >
          <slot name="body" />
        </region>
      </layer>
    </page-set>
  </>
);
```

Writer side stays focused on prose:

```tsx
<section role="chapter-opener" page="chapter-open" title="Part Two: Across the Water">
  <p>An epigraph or subtitle.</p>
</section>

<section title="The River">
  <p>The river ran south through old kingdoms.</p>
  <p>The ferryman had crossed it ten thousand times.</p>
</section>
```

## Surface size

| | Previous vocabulary | This spec |
|---|---|---|
| Content block intrinsics | 14 (+ aliases) | 12, no aliases |
| Content inline intrinsics | 5 + `font` | 4 |
| Template intrinsics | ~14 | ~16 (gained `layer`, `column`, `running`, `page-count`, `image`; lost `box`, `flow`, `template`, `rule`, `repeat`, `page-role`, five typed role kinds) |
| Style groups | 7 | 4 (`page`, `text`, `flow`, `frame`) |
| Rule kinds | 6 | 2 (`role`, `page`) |
| Raw `style={...}` on canonical surface | yes | escape hatch only |

## Deferred

Math is the only deferred subsystem that must constrain the architecture; the rest can ship as npm packages later.

- **Math** — inline-flow integration; deferred design but the inline-node family must remain open to extension.
- **Footnotes** — deferred. Future package.
- **Citations / bibliography** — deferred. Future package.
- **Cross-references** — deferred. Future package.
- **Index generation** — deferred. Future package.
- **Live editing / hydration** — out of scope.
- **Browser DOM as runtime engine** — out of scope.

## Out of scope

- **LaTeX rendering.** The previous LaTeX backend is being removed.
- **`pdflatex` compilation.** PDF is produced via headless Chromium.
- **Direct CSS authoring in templates.** Templates use typed primitives and style groups. Raw `style={...}` exists as an escape hatch but is non-canonical.
