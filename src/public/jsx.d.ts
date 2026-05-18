import type { ReactNode } from "react";

type ContentMetadataProps = {
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

type QuoteProps = ContentMetadataProps & {
  speaker?: string;
  children?: ReactNode;
};

type CodeBlockProps = {
  language?: string;
  children?: ReactNode;
};

type ListProps = ContentMetadataProps & {
  ordered?: boolean;
  children?: ReactNode;
};

type ItemProps = {
  children?: ReactNode;
};

type PageBreakProps = Record<string, never>;

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
};

type RegionProps = TemplateStyleBag;

type StackProps = TemplateStyleBag & {
  gap?: string;
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
    | "page-bottom-right";
  when?: "all" | "first-page" | "not-first-page";
};

type PageNumberProps = Omit<TemplateStyleBag, "children">;

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
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      list: ListProps;
      item: ItemProps;
      "page-break": PageBreakProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      region: RegionProps;
      stack: StackProps;
      fixed: FixedProps;
      "page-number": PageNumberProps;
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
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      list: ListProps;
      item: ItemProps;
      "page-break": PageBreakProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      region: RegionProps;
      stack: StackProps;
      fixed: FixedProps;
      "page-number": PageNumberProps;
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
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      list: ListProps;
      item: ItemProps;
      "page-break": PageBreakProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      region: RegionProps;
      stack: StackProps;
      fixed: FixedProps;
      "page-number": PageNumberProps;
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
      quote: QuoteProps;
      "code-block": CodeBlockProps;
      list: ListProps;
      item: ItemProps;
      "page-break": PageBreakProps;
      page: PageElementProps;
      "page-set": PageSetProps;
      region: RegionProps;
      stack: StackProps;
      fixed: FixedProps;
      "page-number": PageNumberProps;
      slot: SlotProps;
      rules: RulesProps;
      role: RoleRuleProps;
    }
  }
}

export {};
