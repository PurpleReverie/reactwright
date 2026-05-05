# LaTeX to Intrinsic Mapping

This document turns the LaTeX feature catalog in [docs/latex-style-reference.md](/Users/taurajgreig/Projects/Personal/react_doc/docs/latex-style-reference.md) into a proposed intrinsic surface for ReactDoc.

The goal is not to expose one React prop for every LaTeX trick. The goal is to make every LaTeX-facing feature land in one of a small number of author-facing buckets:

- content intrinsics
- template intrinsics
- template rule intrinsics
- typed style groups on those intrinsics
- renderer-only implementation details

That keeps the template layer backend-neutral while still giving the LaTeX renderer enough structure to target serious document layout.

## Design Principles

1. Content stays semantic and concise.
2. Template owns layout, presentation, and interpretation rules.
3. Rules never live in content.
4. Repeated, anchored, decorative, and regime-specific page behavior must be first-class in template syntax.
5. Not every LaTeX feature deserves a standalone primitive. Many features are better expressed as typed props on a smaller primitive set.

## Proposed Primitive Families

### Content intrinsics

These are the built-in nodes authors use for document meaning:

- `document`
- `section`
- `p`
- `quote`
- `list`
- `item`
- `figure`
- `table`
- `code`
- `pre`
- `a`
- `em`
- `strong`
- `hr`
- `page-break`

Optional later content intrinsics:

- `note`
- `table-row`
- `table-cell`
- `caption`
- `footnote`
- `image`

### Template intrinsics

These are the built-in nodes authors use for page/layout structure:

- `template`
- `flow`
- `stack`
- `row`
- `region`
- `columns`
- `slot`
- `page-set`
- `repeat`
- `fixed`
- `decoration`
- `rule`
- `title-block`
- `front-matter`
- `back-matter`
- `toc`

Optional later template intrinsics:

- `sidebar`
- `margin-notes`
- `float-area`
- `table-of-figures`
- `table-of-tables`

### Template rule intrinsics

These map content semantics into presentation behavior:

- `rules`
- `section-role`
- `quote-role`
- `paragraph-role`
- `list-role`
- `figure-role`
- `page-role`
- `section-page`
- `variant-rule`

Optional later rule intrinsics:

- `heading-rule`
- `page-number-rule`
- `toc-rule`
- `float-rule`

## Proposed Typed Style Groups

Rather than a giant untyped `style` bag, template intrinsics should converge on a few reusable groups:

- `page`
  - page geometry and document-level settings
- `typography`
  - font family, size, weight, style, line height, color, language
- `paragraph`
  - indent, paragraph spacing, hyphenation, widow/orphan control
- `box`
  - padding, border, border radius, background, width, max width
- `layout`
  - gap, columns, column gap, row alignment, align self
- `breaks`
  - page break before/after, keep together, keep with next, break inside
- `heading`
  - numbering, heading spacing, heading typography
- `running`
  - header/footer/page number behavior
- `pdf`
  - metadata and link color mode
- `theme`
  - named palette and token references

## Feature Mapping

The table below maps every feature from the LaTeX reference into a proposed author-facing home.

| LaTeX feature | Proposed ReactDoc home | Why |
|---|---|---|
| `size` | `template page={...}` | Document root page geometry |
| `orientation` | `template page={...}` | Document root page geometry |
| `margin` | `template page={...}` | Document root page geometry |
| `marginTop` | `template page={...}` | Document root page geometry |
| `marginRight` | `template page={...}` | Document root page geometry |
| `marginBottom` | `template page={...}` | Document root page geometry |
| `marginLeft` | `template page={...}` | Document root page geometry |
| `headerHeight` | `repeat` or `template running={...}` | Running matter config, not content |
| `headerSpacing` | `repeat` or `template running={...}` | Running matter config |
| `footerSpacing` | `repeat` or `template running={...}` | Running matter config |
| `textWidth` | `template page={...}` | Page text block geometry |
| `textHeight` | `template page={...}` | Page text block geometry |
| `marginNoteWidth` | `margin-notes` or `template page={...}` | Margin note regime, not ordinary flow |
| `bindingOffset` | `template page={...}` | Geometry concern |
| `twoSided` | `template page={...}` | Document regime concern |
| `columns` | `columns` or `page-set columns={...}` | Layout primitive |
| `columnGap` | `columns gap={...}` or layout group | Layout primitive |
| `fontFamily` | `template typography={...}` or `region typography={...}` | Typography group |
| `fontSize` | `template typography={...}` or `region typography={...}` | Typography group |
| `fontWeight` | `typography` group | Typography group |
| `fontStyle` | `typography` group | Typography group |
| `fontVariant` | `typography` group | Typography group |
| `textDecoration` | `typography` group for inline or region text | Typography group |
| `color` | `typography` group or `theme` token | Typography or theme |
| `backgroundColor` | `box` group or `decoration` | Region decoration, not content semantics |
| `lineHeight` | `typography` group | Typography group |
| `letterSpacing` | `typography` group | Typography group |
| `wordSpacing` | `typography` group | Typography group |
| `hyphenation` | `paragraph` group | Paragraph behavior |
| `language` | `typography` group or `template locale={...}` | Global or scoped language |
| `microtype` | `template typography={...}` | Document-level engine hint |
| `textAlign` | `typography` group or `region align={...}` | Common block/heading setting |
| `textIndent` | `paragraph` group | Paragraph behavior |
| `paragraphSpacing` | `paragraph` group | Paragraph behavior |
| `textWrap` | `paragraph` group | Paragraph behavior |
| `firstLineIndent` | `paragraph` group | Paragraph behavior |
| `keepTogether` | `breaks` group | Flow control |
| `widowControl` | `paragraph` group | Paragraph behavior |
| `orphanControl` | `paragraph` group | Paragraph behavior |
| `padding` | `region box={...}` | Box model |
| `paddingTop` | `region box={...}` | Box model |
| `paddingRight` | `region box={...}` | Box model |
| `paddingBottom` | `region box={...}` | Box model |
| `paddingLeft` | `region box={...}` | Box model |
| block `marginTop` | `region box={...}` or `stack gap` | Box or flow spacing |
| block `marginBottom` | `region box={...}` or `stack gap` | Box or flow spacing |
| block `marginLeft` | `region box={...}` or `row` placement | Block offset/layout |
| block `marginRight` | `region box={...}` or `row` placement | Block offset/layout |
| `gap` | `stack gap={...}` or `flow gap={...}` | Core flow primitive |
| `inlineGap` | inline layout group, likely later | Inline layout concern |
| `pageBreakBefore` | `region breaks={...}` or content `page-break` | Flow control |
| `pageBreakAfter` | `region breaks={...}` | Flow control |
| `breakInside` | `breaks` group | Flow control |
| `border` | `region box={...}` | Box model |
| `borderTop` | `region box={...}` or `rule` | Box or decoration |
| `borderRight` | `region box={...}` | Box model |
| `borderBottom` | `region box={...}` or `rule` | Box or decoration |
| `borderLeft` | `region box={...}` | Box model |
| `borderColor` | `region box={...}` or theme token | Box model |
| `borderRadius` | `region box={...}` | Box model |
| `rule` | `rule` intrinsic | Decorative primitive |
| `ruleThickness` | `rule` intrinsic | Decorative primitive |
| `listStyleType` | content `list` props or `list-role` rule | Content with template override |
| `listIndent` | content `list` props or `list-role` rule | Content/layout crossover |
| `itemSpacing` | content `list` props or `list-role` rule | Content/layout crossover |
| `compact` | content `list` props or `list-role` rule | Content/layout crossover |
| `numbering` | `heading` group or `section-role` rule | Section interpretation |
| `section.fontSize` | `heading` group or `section-role` rule | Heading presentation |
| `section.fontWeight` | `heading` group or `section-role` rule | Heading presentation |
| `section.textAlign` | `heading` group or `section-role` rule | Heading presentation |
| `section.marginTop` | `heading` group or `section-role` rule | Heading spacing |
| `section.marginBottom` | `heading` group or `section-role` rule | Heading spacing |
| `chapterStyle` | `section-role` rule or dedicated `chapter` mode later | Heading regime |
| `tocDepth` | `toc` intrinsic or `front-matter tocDepth={...}` | Front matter concern |
| `title.textAlign` | `title-block typography={...}` | Title layout belongs to template |
| `title.fontSize` | `title-block typography={...}` | Title layout belongs to template |
| `author.textAlign` | `title-block typography={...}` | Title layout belongs to template |
| `abstract.headingStyle` | `slot name="abstract"` wrapped by `region` or `title-block` config | Template-owned abstract treatment |
| `titlePage` | `title-block` or `front-matter separate` | Page regime concern |
| `frontMatter.numbering` | `front-matter numbering={...}` | Page regime concern |
| `header.content` | `repeat` intrinsic | Running matter |
| `footer.content` | `repeat` intrinsic | Running matter |
| `pageNumber.position` | `repeat` intrinsic or `running` group | Running matter |
| `header.rule` | `repeat` plus `rule` | Running matter decoration |
| `footer.rule` | `repeat` plus `rule` | Running matter decoration |
| `header.firstPage` | `repeat when={...}` or `page-set` scoping | Page regime concern |
| `columnSpan` | `region columnSpan={...}` | Multi-column layout concern |
| `width` | `region box={...}` | Region sizing |
| `maxWidth` | `region box={...}` | Region sizing |
| `alignSelf` | `region layout={...}` | Region placement |
| `layout="row"` | `row` intrinsic | Separate from vertical `stack` |
| `figure.textAlign` | content `figure` props or `figure-role` rule | Figure treatment |
| `caption.position` | content `figure` / `table` props or `figure-role` rule | Figure treatment |
| `caption.fontSize` | `figure-role` or `table` rule | Figure treatment |
| `table.rules` | `table` content intrinsic plus template `figure-role` / `table-rule` later | Table semantics |
| `floatPlacement` | `figure` / `table` content prop plus template rule | Figure/table flow behavior |
| `variant="callout"` | `region variant={...}` or `variant-rule` | Themed region treatment |
| `title` on box | `region title={...}` or later `callout` intrinsic | Box structure |
| `elevation` | `region box={...}` | Decorative box hint |
| named `themeColor` | `theme` tokens referenced from typography/box/rule groups | Theme system |
| hex `color` | `theme` or direct `typography.color` | Theme or direct style |
| RGB `color` | `theme` or direct `typography.color` | Theme or direct style |
| `opacity` | `box` / `decoration` group | Decorative concern |
| force page break | content `page-break` or `breaks` group | Flow control |
| avoid page break | `breaks` group | Flow control |
| `keepWithNext` | `breaks` group, often via `section-role` | Flow control |
| `clearFloats` | `breaks` group or `page-set` transition behavior | Flow control |
| `pdf.title` | `template pdf={...}` | Output metadata |
| `pdf.author` | `template pdf={...}` | Output metadata |
| `pdf.subject` | `template pdf={...}` | Output metadata |
| `pdf.keywords` | `template pdf={...}` | Output metadata |
| `links.color` | `template pdf={...}` or `theme` | Output metadata/theme |

## Primitive Sketches

These are not final APIs. They are shape sketches that show where the mapped features want to live.

### Template root

```tsx
<template
  page={{
    size: "a4",
    orientation: "portrait",
    margin: "25mm",
    bindingOffset: "8mm",
    twoSided: true,
  }}
  typography={{
    fontFamily: "serif",
    fontSize: "11pt",
    lineHeight: 1.35,
    language: "english",
    microtype: true,
  }}
  paragraph={{
    paragraphSpacing: "0.8em",
    textIndent: 0,
    widowControl: 2,
    orphanControl: 2,
  }}
  pdf={{
    title: "The Isle of Mulgaard",
    author: "Tauraj Greig",
    keywords: ["story", "bible"],
    links: { color: "theme:accent" },
  }}
>
  <flow>
    <slot name="body" />
  </flow>
</template>
```

### Page regimes and running matter

```tsx
<template>
  <repeat when="page-set:body" anchor="top">
    <region align="right">
      <slot name="title" />
    </region>
  </repeat>

  <repeat when="page-set:body" anchor="bottom-center">
    <region>
      <page-number />
    </region>
  </repeat>

  <flow>
    <page-set name="cover">
      <title-block separate>
        <slot name="title" />
        <slot name="author" />
      </title-block>
    </page-set>

    <page-set name="body">
      <slot name="body" />
    </page-set>
  </flow>
</template>
```

### Regions, boxes, and rows

```tsx
<flow gap="8mm">
  <region
    box={{
      padding: "6mm",
      border: "1pt solid theme:border",
      backgroundColor: "theme:panel",
      maxWidth: "120mm",
    }}
    layout={{ alignSelf: "center" }}
  >
    <slot name="abstract" />
  </region>

  <row gap="6mm">
    <region box={{ width: "60%" }}>
      <slot name="body" />
    </region>
    <region box={{ width: "40%" }}>
      <slot name="sidebar" />
    </region>
  </row>
</flow>
```

### Rules and interpretation

```tsx
<rules>
  <section-role
    role="scene-heading"
    variant="sceneHeading"
    heading={{
      fontWeight: "bold",
      marginTop: "1.5em",
      keepWithNext: true,
    }}
  />

  <quote-role
    role="dialogue"
    variant="dialogueBlock"
    paragraph={{ textIndent: 0 }}
  />

  <page-role page="script" use="script-pages" />
</rules>
```

## What This Implies For The Intrinsic Surface

The current surface is missing several primitive families that the LaTeX feature map keeps pointing toward.

### Strong candidates for new template intrinsics

- `row`
- `repeat`
- `fixed`
- `decoration`
- `rule`
- `title-block`
- `front-matter`
- `toc`

### Strong candidates for new rule intrinsics

- `paragraph-role`
- `list-role`
- `figure-role`
- `variant-rule`

### Strong candidates for new content intrinsics

- `table`
- `hr` as canonical, not just compatibility syntax

## What Should Stay Out Of The Content Layer

These do not belong in content:

- header/footer definitions
- decorative rules and borders
- page furniture
- heading styling rules
- list spacing and numbering policy
- float placement policy
- running matter conditions
- page number placement

Content may request:

- semantic role
- semantic page regime
- explicit `page-break`
- figure/table meaning

But template decides how those requests are realized.

## Recommended Build Order

1. Replace `style: Record<string, unknown>` with typed style groups on template intrinsics.
2. Add `row`, `repeat`, `fixed`, and `rule` to the template IR.
3. Add `paragraph-role`, `list-role`, and `figure-role` to template rules.
4. Add `table` to the content IR.
5. Add `title-block`, `front-matter`, and running matter support after the core page-regime work is stable.
6. Only then revisit whether any remaining LaTeX feature truly needs a new intrinsic rather than a prop group.

## Bottom Line

If we want ReactDoc to be LaTeX-complete enough to guide other backends later, the right move is not to mirror LaTeX packages directly. The right move is to define a compact intrinsic vocabulary for:

- flow layout
- box layout
- horizontal layout
- repeated page regions
- anchored page regions
- decorative regions
- page regimes
- semantic interpretation rules
- concise semantic content

That vocabulary is broad enough to target LaTeX well, and abstract enough to survive a future paginated HTML renderer.
