import type { ReactNode } from "react";

type ContentMetadataProps = {
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
};

type DocumentProps = {
  title: string;
  author?: string;
  children?: ReactNode;
};

type SectionProps = ContentMetadataProps & {
  title: string;
  children?: ReactNode;
};

type HeadingProps = ContentMetadataProps & {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
};

type ParagraphProps = ContentMetadataProps & {
  children?: ReactNode;
};

type FigureProps = ContentMetadataProps & {
  src: string;
  alt?: string;
  caption?: string;
  width?: string;
};

type TableProps = {
  id?: string;
  caption?: string;
  children?: ReactNode;
};

type RowProps = {
  children?: ReactNode;
};

type CellProps = {
  header?: boolean;
  children?: ReactNode;
};

type AbstractProps = {
  page?: string;
  variant?: string;
  children?: ReactNode;
};

type EmProps = {
  children?: ReactNode;
};

type StrongProps = {
  children?: ReactNode;
};

type LinkProps = {
  href: string;
  titleText?: string;
  children?: ReactNode;
};

type CodeProps = {
  children?: ReactNode;
};

type BreakElementProps = Record<string, never>;

type SubProps = {
  children?: ReactNode;
};

type SupProps = {
  children?: ReactNode;
};

type InlineImgProps = {
  src: string;
  alt?: string;
  width?: string;
  height?: string;
};

type RefProps = {
  to: string;
  show?: "number" | "page" | "title" | "number-and-page";
};

type FootnoteProps = {
  marker?: string;
  children?: ReactNode;
};

type FootnoteAreaProps = Omit<TemplateStyleBag, "children"> & {
  separator?: boolean;
};

type MathProps = ContentMetadataProps & {
  src: string;
};

type InlineMathProps = {
  src: string;
};

type CiteProps = {
  cite: string;
};

type IndexProps = Omit<TemplateStyleBag, "children"> & {
  // Content-side: marks a term to include in the index (required there).
  // Template-side: declares the back-matter index; accepts optional title.
  term?: string;
  title?: string;
};

type BibliographyEntryProp = {
  key: string;
  text: string;
};

type BibliographyProps = Omit<TemplateStyleBag, "children"> & {
  title?: string;
  entries?: BibliographyEntryProp[];
};

type QuoteProps = ContentMetadataProps & {
  speaker?: string;
  children?: ReactNode;
};

type CodeBlockProps = {
  id?: string;
  language?: string;
  children?: ReactNode;
};

type PreProps = {
  id?: string;
  children?: ReactNode;
};

type ListProps = ContentMetadataProps & {
  ordered?: boolean;
  children?: ReactNode;
};

type ItemProps = {
  children?: ReactNode;
};

type DefsProps = ContentMetadataProps & {
  children?: ReactNode;
};

type DefProps = {
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

type HeaderProps = TemplateStyleBag & {
  anchor: MarginAnchorName;
  when?: "all" | "first-page" | "not-first-page";
};

type FooterProps = TemplateStyleBag & {
  anchor: MarginAnchorName;
  when?: "all" | "first-page" | "not-first-page";
};

type PageNumberProps = Omit<TemplateStyleBag, "children">;
type PageCountProps = Omit<TemplateStyleBag, "children">;

type SlotProps = {
  name: "title" | "author" | "abstract" | "body";
};

type RulesProps = {
  children?: ReactNode;
};

type RoleRuleProps = {
  match: string;
  apply: string;
  on?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      abstract: AbstractProps;
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
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      bibliography: BibliographyProps;
      index: IndexProps;
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
      region: RegionProps;
      stack: StackProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      abstract: AbstractProps;
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
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      bibliography: BibliographyProps;
      index: IndexProps;
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
      region: RegionProps;
      stack: StackProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
    }
  }
}

declare module "react/jsx-dev-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      abstract: AbstractProps;
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
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      bibliography: BibliographyProps;
      index: IndexProps;
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
      region: RegionProps;
      stack: StackProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      document: DocumentProps;
      section: SectionProps;
      heading: HeadingProps;
      p: ParagraphProps;
      figure: FigureProps;
      table: TableProps;
      row: RowProps;
      cell: CellProps;
      abstract: AbstractProps;
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
      math: MathProps;
      m: InlineMathProps;
      cite: CiteProps;
      bibliography: BibliographyProps;
      index: IndexProps;
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
      region: RegionProps;
      stack: StackProps;
      layer: LayerProps;
      fixed: FixedProps;
      header: HeaderProps;
      footer: FooterProps;
      "page-number": PageNumberProps;
      "page-count": PageCountProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
    }
  }
}

export {};
