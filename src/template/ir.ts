export type TemplateStyle = Record<string, unknown>;

export type TemplatePageProps = {
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

export type TemplateTypographyProps = {
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

export type TemplateParagraphProps = {
  textIndent?: string | number;
  paragraphSpacing?: string;
  textWrap?: string;
  firstLineIndent?: string;
  keepTogether?: boolean;
  widowControl?: number;
  orphanControl?: number;
  hyphenation?: string;
};

export type TemplateBoxProps = {
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

export type TemplateLayoutProps = {
  gap?: string;
  inlineGap?: string;
  columns?: number;
  columnGap?: string;
  alignSelf?: "left" | "center" | "right" | "stretch";
  width?: string;
  maxWidth?: string;
};

export type TemplateBreaksProps = {
  pageBreakBefore?: string;
  pageBreakAfter?: string;
  breakInside?: string;
  keepTogether?: boolean;
  keepWithNext?: boolean;
  clearFloats?: boolean;
};

export type SlotName = "title" | "author" | "abstract" | "body";

export type RoleRuleNode = {
  kind: "role-rule";
  match: string;
  apply: string;
  on?: string;
};

export type PageRuleNode = {
  kind: "page-rule";
  match: string;
  use: string;
};

export type RulesChild = RoleRuleNode | PageRuleNode;

export type RulesNode = {
  kind: "rules";
  children: RulesChild[];
};

export type PageNode = {
  kind: "page";
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type PageSetNode = {
  kind: "page-set";
  name: string;
  style?: TemplateStyle;
  anchors?: Record<string, CoordinateAnchor>;
  children: TemplateChild[];
};

export type RegionPositioning = {
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  center?: boolean;
};

export type RegionNode = {
  kind: "region";
  style?: TemplateStyle;
  positioning?: RegionPositioning;
  children: TemplateChild[];
};

export type LayerWhen = "all" | "first-page" | "not-first-page";

export type LayerNode = {
  kind: "layer";
  name?: string;
  when?: LayerWhen;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type StackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type FixedAnchorName =
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

export type CoordinateAnchor = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  inside?: string;
  outside?: string;
};

export type FixedAnchor = FixedAnchorName | string | CoordinateAnchor;

export type FixedWhen = "all" | "first-page" | "not-first-page";

export type FixedNode = {
  kind: "fixed";
  anchor: FixedAnchor;
  when?: FixedWhen;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type PageNumberNode = {
  kind: "page-number";
  style?: TemplateStyle;
};

export type PageCountNode = {
  kind: "page-count";
  style?: TemplateStyle;
};

export type RunningPolicy = "start" | "first" | "last" | "first-except";

export type RunningNode = {
  kind: "running";
  name: string;
  policy?: RunningPolicy;
  style?: TemplateStyle;
};

export type ImageNode = {
  kind: "image";
  src: string;
  alt?: string;
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  width?: string;
  style?: TemplateStyle;
};

export type FootnoteAreaNode = {
  kind: "footnote-area";
  separator?: boolean;
  style?: TemplateStyle;
};

export type SidenoteAreaSide = "outside" | "inside" | "left" | "right";

export type SidenoteAreaNode = {
  kind: "sidenote-area";
  side?: SidenoteAreaSide;
  width?: string;
  gap?: string;
  style?: TemplateStyle;
};

export type BibliographyEntry = {
  key: string;
  text: string;
};

export type BibliographyNode = {
  kind: "bibliography";
  title?: string;
  entries?: BibliographyEntry[];
  style?: TemplateStyle;
};

export type IndexTemplateNode = {
  kind: "index-template";
  title?: string;
  style?: TemplateStyle;
};

export type TocNode = {
  kind: "toc";
  title?: string;
  depth?: number;
  numbered?: boolean;
  style?: TemplateStyle;
};

export type MarginAnchor =
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

export type MarginMatterWhen = "all" | "first-page" | "not-first-page";

export type HeaderNode = {
  kind: "header";
  anchor: MarginAnchor;
  when?: MarginMatterWhen;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type FooterNode = {
  kind: "footer";
  anchor: MarginAnchor;
  when?: MarginMatterWhen;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type SlotNode = {
  kind: "slot";
  name: SlotName;
};

export type CustomTemplateNode = {
  kind: "custom";
  name: string;
  props: Record<string, unknown>;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type TemplateTextNode = {
  kind: "text";
  value: string;
};

export type TemplateNode =
  | PageNode
  | PageSetNode
  | RegionNode
  | StackNode
  | LayerNode
  | FixedNode
  | HeaderNode
  | FooterNode
  | PageNumberNode
  | PageCountNode
  | RunningNode
  | ImageNode
  | FootnoteAreaNode
  | BibliographyNode
  | IndexTemplateNode
  | SidenoteAreaNode
  | TocNode
  | SlotNode
  | CustomTemplateNode
  | RulesNode
  | RulesChild
  | TemplateTextNode;

export type TemplateContainerNode =
  | PageNode
  | PageSetNode
  | RegionNode
  | StackNode
  | LayerNode
  | FixedNode
  | HeaderNode
  | FooterNode
  | CustomTemplateNode
  | RulesNode;

export type TemplateChild =
  | TemplateContainerNode
  | PageNumberNode
  | PageCountNode
  | RunningNode
  | ImageNode
  | FootnoteAreaNode
  | BibliographyNode
  | IndexTemplateNode
  | SidenoteAreaNode
  | TocNode
  | SlotNode
  | TemplateTextNode;
