import type { Match } from "../styles/ir.js";

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

export type BreakValue = "auto" | "always" | "avoid" | "page" | "left" | "right" | "recto" | "verso";

export type RoleNumbering = {
  counter: string;
  scope?: string;
  format?: string;
};

export type RoleDropCap = {
  lines?: number;
  font?: string;
  position?: string;
};

export type RoleRuleNode = {
  kind: "role-rule";
  match: string;
  apply: string;
  on?: string;
  breakBefore?: BreakValue;
  breakAfter?: BreakValue;
  breakInside?: "auto" | "avoid";
  numbering?: RoleNumbering;
  dropCap?: RoleDropCap;
  style?: TemplateStyle;
};

export type PageRuleNode = {
  kind: "page-rule";
  match: string;
  use: string;
};

// New-style rule binding: a Match selector and a className. Lives
// alongside legacy <role>-rules under <rules> (and as a direct sibling).
// Declarations live in a <styles> block keyed by className.
export type RuleNode = {
  kind: "rule";
  match: Match;
  className: string;
};

// A block of styles-dialect text. Compiled at HTML emit time.
export type StylesNode = {
  kind: "styles";
  source: string;
};

export type RulesChild = RoleRuleNode | PageRuleNode | RuleNode;

export type RulesNode = {
  kind: "rules";
  children: RulesChild[];
};

export type PageNode = {
  kind: "page";
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type PageSetNode = {
  kind: "page-set";
  name: string;
  style?: TemplateStyle;
  anchors?: Record<string, CoordinateAnchor>;
  className?: string;
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
  className?: string;
  children: TemplateChild[];
};

export type LayerWhen = "all" | "first-page" | "not-first-page";

export type LayerNode = {
  kind: "layer";
  name?: string;
  when?: LayerWhen;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type StackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

// Horizontal-flex layout primitive, symmetric to <stack>. Renderer
// emits `display:flex; flex-direction:row` plus `gap`. Used for
// side-by-side layout that isn't multi-column text flow.
export type TemplateRowNode = {
  kind: "row";
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type ColumnsNode = {
  kind: "columns";
  gap?: string;
  widths?: string[];
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type ColumnNode = {
  kind: "column";
  width?: string;
  style?: TemplateStyle;
  className?: string;
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
  className?: string;
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

export type ListOfKind = "figure" | "table" | "equation";

export type ListOfNode = {
  kind: "list-of";
  of: ListOfKind;
  title?: string;
  style?: TemplateStyle;
};

export type FontNode = {
  kind: "font";
  family: string;
  src: string;
  weight?: string;
  fontStyle?: string;
  format?: string;
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
  className?: string;
  children: TemplateChild[];
};

export type FooterNode = {
  kind: "footer";
  anchor: MarginAnchor;
  when?: MarginMatterWhen;
  style?: TemplateStyle;
  className?: string;
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
  | TemplateRowNode
  | ColumnsNode
  | ColumnNode
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
  | ListOfNode
  | FontNode
  | SlotNode
  | CustomTemplateNode
  | RulesNode
  | RulesChild
  | StylesNode
  | TemplateTextNode;

export type TemplateContainerNode =
  | PageNode
  | PageSetNode
  | RegionNode
  | StackNode
  | TemplateRowNode
  | ColumnsNode
  | ColumnNode
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
  | ListOfNode
  | FontNode
  | SlotNode
  | StylesNode
  | RuleNode
  | TemplateTextNode;
