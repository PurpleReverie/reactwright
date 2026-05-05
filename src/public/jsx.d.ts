import type { ReactNode } from "react";

type ContentMetadataProps = {
  role?: string;
  page?: string;
};

type ContentIntrinsicMap = {
  document: {
    title: string;
    author?: string;
    children?: ReactNode;
  };
  section: ContentMetadataProps & {
    title: string;
    children?: ReactNode;
  };
  paragraph: ContentMetadataProps & {
    children?: ReactNode;
  };
  p: ContentMetadataProps & {
    children?: ReactNode;
  };
  figure: {
    src: string;
    alt?: string;
    caption?: string;
    width?: string;
  };
  abstract: {
    page?: string;
    children?: ReactNode;
  };
  em: {
    children?: ReactNode;
  };
  strong: {
    children?: ReactNode;
  };
  a: {
    href: string;
    titleText?: string;
    children?: ReactNode;
  };
  link: {
    href: string;
    titleText?: string;
    children?: ReactNode;
  };
  code: {
    children?: ReactNode;
  };
  blockquote: ContentMetadataProps & {
    speaker?: string;
    children?: ReactNode;
  };
  quote: ContentMetadataProps & {
    speaker?: string;
    children?: ReactNode;
  };
  pre: {
    language?: string;
    children?: ReactNode;
  };
  "code-block": {
    language?: string;
    children?: ReactNode;
  };
  hr: Record<string, never>;
  "thematic-break": Record<string, never>;
  list: {
    ordered?: boolean;
    children?: ReactNode;
  };
  item: {
    children?: ReactNode;
  };
  font: {
    family: string;
    children?: ReactNode;
  };
  "page-break": Record<string, never>;
};

type TemplatePageProps = {
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

type TemplateHeadingProps = {
  numbering?: boolean;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  marginTop?: string;
  marginBottom?: string;
};

type TemplateStyleProps = {
  style?: Record<string, unknown>;
  page?: TemplatePageProps;
  typography?: TemplateTypographyProps;
  paragraph?: TemplateParagraphProps;
  box?: TemplateBoxProps;
  layout?: TemplateLayoutProps;
  breaks?: TemplateBreaksProps;
  heading?: TemplateHeadingProps;
  children?: ReactNode;
};

type TemplateIntrinsicMap = {
  page: TemplateStyleProps;
  template: TemplateStyleProps;
  box: TemplateStyleProps;
  region: TemplateStyleProps;
  stack: TemplateStyleProps & {
    gap?: string;
  };
  flow: TemplateStyleProps & {
    gap?: string;
  };
  row: TemplateStyleProps & {
    gap?: string;
  };
  columns: TemplateStyleProps & {
    count: number;
    gap?: string;
  };
  rule: TemplateStyleProps & {
    axis?: "horizontal" | "vertical";
    weight?: string;
    color?: string;
    length?: string;
  };
  slot: {
    name: "title" | "author" | "abstract" | "body";
  };
  "page-set": {
    name: string;
    children?: ReactNode;
  };
  rules: {
    children?: ReactNode;
  };
  "section-role": {
    role: string;
    variant: string;
  };
  "quote-role": {
    role: string;
    variant: string;
  };
  "page-role": {
    page: string;
    use: string;
  };
};

type ReactDocIntrinsicElements = ContentIntrinsicMap & TemplateIntrinsicMap;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ReactDocIntrinsicElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactDocIntrinsicElements {}
  }
}

export {};
