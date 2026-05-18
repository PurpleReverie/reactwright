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
  children: TemplateChild[];
};

export type RegionNode = {
  kind: "region";
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type StackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type FixedAnchor =
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
  | FixedNode
  | PageNumberNode
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
  | FixedNode
  | CustomTemplateNode
  | RulesNode;

export type TemplateChild =
  | TemplateContainerNode
  | PageNumberNode
  | SlotNode
  | TemplateTextNode;
