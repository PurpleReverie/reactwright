import type { Key, ReactNode } from "react";

// Shared mixin — every selectable IR node accepts `className` so authors
// can reference a class defined in a <styles> block.
type WithClassName = {
  className?: string;
};

type ContentMetadataProps = {
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
};

type DocumentProps = {
  title: string;
  author?: string;
  className?: string;
  children?: ReactNode;
};

// `<meta name="X">` — document-wide metadata routed into the named
// slot bucket. Use `value` for a plain-string shorthand or pass inline
// children for richer markup.
type MetaProps = {
  name: string;
  value?: string;
  className?: string;
  children?: ReactNode;
};

type SectionProps = ContentMetadataProps & {
  title: string;
  counter?: string;
  // Opts the section into a `<page-variant name="X">` declared on its
  // page-set. Requires `page` (inherited from ContentMetadataProps) to
  // be set.
  pageVariant?: string;
  children?: ReactNode;
};

type HeadingProps = ContentMetadataProps & {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Plain-string heading text. Either this or `children` must be
   * supplied. Use `children` when the heading needs inline marks
   * (`<em>`, `<cite>`, `<m>`); use `title` for the string-only
   * common case (running strings still pull from the plain-text
   * projection, which the engine derives from `children` when
   * `title` is omitted).
   */
  title?: string;
  children?: ReactNode;
};

type ParagraphProps = ContentMetadataProps & {
  children?: ReactNode;
};

type FigureProps = ContentMetadataProps & {
  src: string;
  alt?: string;
  caption?: string;
  width?: string;
  children?: ReactNode;
};

type TableProps = {
  id?: string;
  caption?: string;
  className?: string;
  children?: ReactNode;
};

// New caption JSX intrinsic — first-class IR node for figure/table captions.
type CaptionProps = WithClassName & {
  id?: string;
  role?: string;
  children?: ReactNode;
};

// `<row>` is overloaded: content-side (inside <table>) is a table row;
// template-side (inside a layout container) is a horizontal-flex
// container symmetric to <stack>. The intrinsic type merges both
// shapes — fields not relevant in one context are ignored by the
// other.
type RowProps = {
  // Permitted so authors mapping over data can pass keys; React strips
  // it at the JSX boundary so it never reaches the underlying IR.
  key?: Key | null;
  className?: string;
  gap?: string;
  /**
   * Content-side only: when true, every child `<cell>` is treated as a
   * header cell (rendered as `<th>` by the HTML backend). Sugar for the
   * common "first row is header" pattern.
   */
  header?: boolean;
  // Template-side style groups (no-op on content-side):
  style?: Record<string, unknown>;
  typography?: TemplateTypographyProps;
  paragraph?: TemplateParagraphProps;
  box?: TemplateBoxProps;
  layout?: TemplateLayoutProps;
  breaks?: TemplateBreaksProps;
  children?: ReactNode;
};

type CellProps = {
  key?: Key | null;
  header?: boolean;
  className?: string;
  children?: ReactNode;
};

type EmProps = WithClassName & {
  children?: ReactNode;
};

type StrongProps = WithClassName & {
  children?: ReactNode;
};

type LinkProps = WithClassName & {
  // Permitted so authors mapping over data can pass keys; React strips
  // it at the JSX boundary so it never reaches the underlying IR.
  key?: Key | null;
  href: string;
  titleText?: string;
  children?: ReactNode;
};

type CodeProps = WithClassName & {
  children?: ReactNode;
};

type BreakElementProps = Record<string, never>;

type SubProps = WithClassName & {
  children?: ReactNode;
};

type SupProps = WithClassName & {
  children?: ReactNode;
};

type InlineImgProps = WithClassName & {
  src: string;
  alt?: string;
  width?: string;
  height?: string;
};

type RefProps = WithClassName & {
  to: string;
  show?: "number" | "page" | "title" | "number-and-page";
};

type FootnoteProps = WithClassName & {
  marker?: string;
  children?: ReactNode;
};

type FootnoteAreaProps = Omit<TemplateStyleBag, "children"> & WithClassName & {
  separator?: boolean;
};

type SidenoteProps = WithClassName & {
  children?: ReactNode;
};

type SidenoteAreaProps = Omit<TemplateStyleBag, "children"> & WithClassName & {
  side?: "outside" | "inside" | "left" | "right";
  width?: string;
  gap?: string;
};

type MathProps = ContentMetadataProps & {
  src: string;
};

type InlineMathProps = WithClassName & {
  src: string;
};

type CiteProps = WithClassName & {
  cite: string;
};

type IndexProps = Omit<TemplateStyleBag, "children"> & WithClassName & {
  // Content-side primitive: marks a term to include in the index.
  // Use the `<Index>` userland helper from `reactwright/userland` to
  // render the back-matter index page (composes the `<index-data>`
  // data-source primitive).
  term?: string;
};

type FontProps = {
  family: string;
  src: string;
  weight?: string | number;
  fontStyle?: string;
  format?: string;
};

// --- Data-source primitives -----------------------------------------
// Each accepts a function child (render-prop). Per-entry shapes mirror
// the resolver-side aggregation types in src/template/ir.ts.

type BibDataEntryProp = {
  key: string;
  used: boolean;
  text?: string;
};

type BibDataProps = {
  children: (entries: BibDataEntryProp[]) => ReactNode;
};

type TocDataEntryProp = {
  id: string;
  title: string;
  depth: number;
};

type TocDataProps = {
  children: (entries: TocDataEntryProp[]) => ReactNode;
};

type ListOfDataEntryProp = {
  id: string;
  caption: string;
};

type ListOfDataProps = {
  of: "figure" | "table" | "equation";
  children: (entries: ListOfDataEntryProp[]) => ReactNode;
};

type IndexDataEntryProp = {
  term: string;
  anchorIds: string[];
};

type IndexDataProps = {
  children: (entries: IndexDataEntryProp[]) => ReactNode;
};

type BibEntryContentProps = {
  for: string;
};

type RefsProps = WithClassName & {
  children?: ReactNode;
};

type RefEntryProps = WithClassName & {
  refKey?: string;
  key?: string;
  children?: ReactNode;
};

type QuoteProps = ContentMetadataProps & {
  speaker?: string;
  children?: ReactNode;
};

type CodeBlockProps = WithClassName & {
  id?: string;
  language?: string;
  children?: ReactNode;
};

type PreProps = WithClassName & {
  id?: string;
  children?: ReactNode;
};

type ListProps = ContentMetadataProps & {
  ordered?: boolean;
  /** Sugar for `ordered`: `"ol"` ⇒ ordered, `"ul"` ⇒ unordered. */
  type?: "ol" | "ul";
  children?: ReactNode;
};

type ItemProps = WithClassName & {
  // `<list>` is iterated with `.map(...)` in userland; React strips the
  // `key` prop before it reaches the reconciler, but TypeScript needs it
  // on the prop type to typecheck the JSX (see CLAUDE.md gotcha).
  key?: Key | null;
  id?: string;
  children?: ReactNode;
};

type DefsProps = ContentMetadataProps & {
  children?: ReactNode;
};

type DefProps = WithClassName & {
  term: string;
  children?: ReactNode;
};

type PageBreakProps = Record<string, never>;

type SetProps = {
  running: string;
  value: string;
};

type RunningProps = Omit<TemplateStyleBag, "children"> & {
  name: string;
  policy?: "start" | "first" | "last" | "first-except";
};

type ImageElementProps = Omit<TemplateStyleBag, "children"> & {
  src: string;
  alt?: string;
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  width?: string;
};

type TemplatePageStyleProps = {
  size?: string;
  orientation?: "portrait" | "landscape";
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  textWidth?: string;
  textHeight?: string;
  bindingOffset?: string;
  twoSided?: boolean;
  columns?: number;
  columnGap?: string;
};

type TemplateTypographyProps = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontVariant?: string;
  textDecoration?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: string;
  wordSpacing?: string;
  language?: string;
  textAlign?: "left" | "center" | "right" | "justify";
};

type TemplateParagraphProps = {
  textIndent?: string | number;
  paragraphSpacing?: string;
  textWrap?: string;
  firstLineIndent?: string;
  keepTogether?: boolean;
  widowControl?: number;
  orphanControl?: number;
  hyphenation?: string;
};

type TemplateBoxProps = {
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  width?: string;
  maxWidth?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderColor?: string;
  borderRadius?: string;
  backgroundColor?: string;
  breakable?: boolean;
};

type TemplateLayoutProps = {
  gap?: string;
  inlineGap?: string;
  columns?: number;
  columnGap?: string;
  alignSelf?: "left" | "center" | "right" | "stretch";
  width?: string;
  maxWidth?: string;
};

type TemplateBreaksProps = {
  pageBreakBefore?: string;
  pageBreakAfter?: string;
  breakInside?: string;
  keepTogether?: boolean;
  keepWithNext?: boolean;
  clearFloats?: boolean;
};

type TemplateStyleBag = {
  style?: Record<string, unknown>;
  page?: TemplatePageStyleProps;
  typography?: TemplateTypographyProps;
  paragraph?: TemplateParagraphProps;
  box?: TemplateBoxProps;
  layout?: TemplateLayoutProps;
  breaks?: TemplateBreaksProps;
  className?: string;
  children?: ReactNode;
};

type PageElementProps = TemplateStyleBag & {
  match?: string;
  use?: string;
};

type PageSetProps = TemplateStyleBag & {
  name: string;
  anchors?: Record<string, CoordinateAnchorProp>;
};

// `<page-variant name="V">` inside `<page-set name="P">`. Declares a
// derived regime `P__V` that overlays the parent's style and inherits
// its chrome / body flow per-anchor.
type PageVariantProps = TemplateStyleBag & {
  name: string;
};

type RegionProps = TemplateStyleBag & {
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  center?: boolean;
};

type LayerProps = TemplateStyleBag & {
  name?: string;
  when?: "all" | "first-page" | "not-first-page";
};

type StackProps = TemplateStyleBag & {
  gap?: string;
};

type ColumnsProps = TemplateStyleBag & {
  gap?: string;
  widths?: string[];
};

type ColumnProps = TemplateStyleBag & {
  width?: string;
};

type CoordinateAnchorProp = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  inside?: string;
  outside?: string;
};

type FixedProps = TemplateStyleBag & {
  anchor:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "page-top-left"
    | "page-top-right"
    | "page-bottom-left"
    | "page-bottom-right"
    | string
    | CoordinateAnchorProp;
  when?: "all" | "first-page" | "not-first-page";
};

type MarginAnchorName =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-inside"
  | "top-outside"
  | "bottom-inside"
  | "bottom-outside"
  | "left-top"
  | "left-middle"
  | "left-bottom"
  | "right-top"
  | "right-middle"
  | "right-bottom";

// Per-page-instance policy. Scope is whatever the chrome lives in:
// chrome inside `<page-set>` is regime-scoped (so `first-page` means
// first page of THAT regime); chrome at page root is document-scoped.
type MarginMatterWhenName =
  | "all"
  | "first-page"
  | "not-first-page"
  | "left"
  | "right"
  | "blank"
  | "not-blank";

type HeaderProps = TemplateStyleBag & {
  anchor: MarginAnchorName;
  when?: MarginMatterWhenName;
};

type FooterProps = TemplateStyleBag & {
  anchor: MarginAnchorName;
  when?: MarginMatterWhenName;
};

type PageNumberProps = Omit<TemplateStyleBag, "children">;
type PageCountProps = Omit<TemplateStyleBag, "children">;

type SlotProps = {
  // Slot names are open: the canonical names (title, author, abstract,
  // body) always exist, and any name a `<meta name="X">` provides
  // becomes a valid slot too. Authoring against an unknown name is
  // harmless — the slot expands to nothing.
  name: string;
};

type RulesProps = {
  children?: ReactNode;
};

type RoleNumberingProp = {
  counter: string;
  scope?: string;
  format?: string;
};

type RoleDropCapProp = {
  lines?: number;
  font?: string;
  position?: string;
};

type RoleRuleProps = {
  match: string;
  apply: string;
  on?: string;
  breakBefore?: "auto" | "always" | "avoid" | "page" | "left" | "right" | "recto" | "verso";
  breakAfter?: "auto" | "always" | "avoid" | "page" | "left" | "right" | "recto" | "verso";
  breakInside?: "auto" | "avoid";
  numbering?: RoleNumberingProp;
  dropCap?: RoleDropCapProp;
  style?: Record<string, unknown>;
};

// Styles-dialect block. Children are a single string of CSS-superset
// text; the engine parses at HTML emit time.
type StylesProps = {
  children: string;
};

// Pattern→class binding. The `match` shape is intentionally typed
// loosely for v1 (a recursive selector object — see Match in
// src/styles/ir.ts). Slice 2+ may narrow it via discriminated unions.
type StylesMatchProp = {
  kind?: string;
  role?: string;
  variant?: string;
  depth?: number | { gte?: number; lte?: number };
  index?: "first" | "last" | number;
  id?: string;
  attr?: Record<string, unknown>;
  class?: string;
  follows?: StylesMatchProp;
  precedes?: StylesMatchProp;
  parent?: StylesMatchProp;
  within?: StylesMatchProp;
  has?: StylesMatchProp;
  slot?: "title" | "author" | "abstract" | "body";
  not?: StylesMatchProp;
  and?: StylesMatchProp[];
  or?: StylesMatchProp[];
};

// <rule> binds a Match selector to a className (defined in a
// sibling <styles> block) and/or an inline `style` whose declarations
// the resolver lifts into a synthetic class. At least one of the
// two must be provided.
type RuleProps = TemplateStyleBag & {
  match: StylesMatchProp;
  className?: string;
};

// Template-side <row> — horizontal-flex container, symmetric to
// <stack>. Distinct from content-side table <row>; JSX shares the
// intrinsic name (the active reconciler picks which factory to use
// based on parent grammar). The intrinsic type below merges both
// shapes; unused fields are ignored by the wrong-context factory.
type TemplateRowProps = TemplateStyleBag & {
  gap?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      meta: MetaProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      em: EmProps;
      strong: StrongProps;
      link: LinkProps;
      code: CodeProps;
      br: BreakElementProps;
      sub: SubProps;
      sup: SupProps;
      img: InlineImgProps;
      ref: RefProps;
      footnote: FootnoteProps;
      "footnote-area": FootnoteAreaProps;
      sidenote: SidenoteProps;
      "sidenote-area": SidenoteAreaProps;
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      "bib-data": BibDataProps;
      "toc-data": TocDataProps;
      "list-of-data": ListOfDataProps;
      "index-data": IndexDataProps;
      "bib-entry-content": BibEntryContentProps;
      refs: RefsProps;
      "ref-entry": RefEntryProps;
      index: IndexProps;
      font: FontProps;
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      pre: PreProps;
      list: ListProps;
      item: ItemProps;
      defs: DefsProps;
      def: DefProps;
      "page-break": PageBreakProps;
      set: SetProps;
      running: RunningProps;
      image: ImageElementProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      "page-variant": PageVariantProps;
      region: RegionProps;
      stack: StackProps;
      columns: ColumnsProps;
      column: ColumnProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
      rule: RuleProps;
      styles: StylesProps;
      caption: CaptionProps;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      meta: MetaProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      em: EmProps;
      strong: StrongProps;
      link: LinkProps;
      code: CodeProps;
      br: BreakElementProps;
      sub: SubProps;
      sup: SupProps;
      img: InlineImgProps;
      ref: RefProps;
      footnote: FootnoteProps;
      "footnote-area": FootnoteAreaProps;
      sidenote: SidenoteProps;
      "sidenote-area": SidenoteAreaProps;
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      "bib-data": BibDataProps;
      "toc-data": TocDataProps;
      "list-of-data": ListOfDataProps;
      "index-data": IndexDataProps;
      "bib-entry-content": BibEntryContentProps;
      refs: RefsProps;
      "ref-entry": RefEntryProps;
      index: IndexProps;
      font: FontProps;
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      pre: PreProps;
      list: ListProps;
      item: ItemProps;
      defs: DefsProps;
      def: DefProps;
      "page-break": PageBreakProps;
      set: SetProps;
      running: RunningProps;
      image: ImageElementProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      "page-variant": PageVariantProps;
      region: RegionProps;
      stack: StackProps;
      columns: ColumnsProps;
      column: ColumnProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
      rule: RuleProps;
      styles: StylesProps;
      caption: CaptionProps;
    }
  }
}

declare module "react/jsx-dev-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      meta: MetaProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      em: EmProps;
      strong: StrongProps;
      link: LinkProps;
      code: CodeProps;
      br: BreakElementProps;
      sub: SubProps;
      sup: SupProps;
      img: InlineImgProps;
      ref: RefProps;
      footnote: FootnoteProps;
      "footnote-area": FootnoteAreaProps;
      sidenote: SidenoteProps;
      "sidenote-area": SidenoteAreaProps;
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      "bib-data": BibDataProps;
      "toc-data": TocDataProps;
      "list-of-data": ListOfDataProps;
      "index-data": IndexDataProps;
      "bib-entry-content": BibEntryContentProps;
      refs: RefsProps;
      "ref-entry": RefEntryProps;
      index: IndexProps;
      font: FontProps;
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      pre: PreProps;
      list: ListProps;
      item: ItemProps;
      defs: DefsProps;
      def: DefProps;
      "page-break": PageBreakProps;
      set: SetProps;
      running: RunningProps;
      image: ImageElementProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      "page-variant": PageVariantProps;
      region: RegionProps;
      stack: StackProps;
      columns: ColumnsProps;
      column: ColumnProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
      rule: RuleProps;
      styles: StylesProps;
      caption: CaptionProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      meta: MetaProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      em: EmProps;
      strong: StrongProps;
      link: LinkProps;
      code: CodeProps;
      br: BreakElementProps;
      sub: SubProps;
      sup: SupProps;
      img: InlineImgProps;
      ref: RefProps;
      footnote: FootnoteProps;
      "footnote-area": FootnoteAreaProps;
      sidenote: SidenoteProps;
      "sidenote-area": SidenoteAreaProps;
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      "bib-data": BibDataProps;
      "toc-data": TocDataProps;
      "list-of-data": ListOfDataProps;
      "index-data": IndexDataProps;
      "bib-entry-content": BibEntryContentProps;
      refs: RefsProps;
      "ref-entry": RefEntryProps;
      index: IndexProps;
      font: FontProps;
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      pre: PreProps;
      list: ListProps;
      item: ItemProps;
      defs: DefsProps;
      def: DefProps;
      "page-break": PageBreakProps;
      set: SetProps;
      running: RunningProps;
      image: ImageElementProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      "page-variant": PageVariantProps;
      region: RegionProps;
      stack: StackProps;
      columns: ColumnsProps;
      column: ColumnProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
      rule: RuleProps;
      styles: StylesProps;
      caption: CaptionProps;
    }
  }
}

export {};
