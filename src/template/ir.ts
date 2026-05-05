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

export type TemplateHeadingProps = {
  numbering?: boolean;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  marginTop?: string;
  marginBottom?: string;
};

export type SlotName = "title" | "author" | "abstract" | "body";

export type SectionRoleRuleNode = {
  kind: "section-role";
  role: string;
  variant: string;
};

export type QuoteRoleRuleNode = {
  kind: "quote-role";
  role: string;
  variant: string;
};

export type PageRoleRuleNode = {
  kind: "page-role";
  page: string;
  use: string;
};

export type RulesChild = SectionRoleRuleNode | QuoteRoleRuleNode | PageRoleRuleNode;

export type RulesNode = {
  kind: "rules";
  children: RulesChild[];
};

export type PageNode = {
  kind: "page";
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type BoxNode = {
  kind: "box";
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type StackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type RowNode = {
  kind: "row";
  gap?: string;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type RuleNode = {
  kind: "rule";
  axis?: "horizontal" | "vertical";
  weight?: string;
  color?: string;
  length?: string;
  style?: TemplateStyle;
};

export type RepeatNode = {
  kind: "repeat";
  anchor: RepeatAnchor;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type FixedNode = {
  kind: "fixed";
  anchor: FixedAnchor;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type PageNumberNode = {
  kind: "page-number";
  style?: TemplateStyle;
};

export type PageEdgeAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type CornerAnchor =
  | "page-top-left"
  | "page-top-right"
  | "page-bottom-left"
  | "page-bottom-right";

export type RepeatAnchor = PageEdgeAnchor;
export type FixedAnchor = PageEdgeAnchor | CornerAnchor;

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

export type PageSetNode = {
  kind: "page-set";
  name: string;
  children: TemplateChild[];
};

export type TemplateTextNode = {
  kind: "text";
  value: string;
};

export type TemplateNode =
  | PageNode
  | BoxNode
  | StackNode
  | RowNode
  | RuleNode
  | RepeatNode
  | FixedNode
  | PageNumberNode
  | SlotNode
  | CustomTemplateNode
  | PageSetNode
  | RulesNode
  | RulesChild
  | TemplateTextNode;

export type TemplateContainerNode =
  | PageNode
  | BoxNode
  | StackNode
  | RowNode
  | RepeatNode
  | FixedNode
  | CustomTemplateNode
  | PageSetNode
  | RulesNode;

export type TemplateChild = TemplateContainerNode | RuleNode | PageNumberNode | SlotNode | TemplateTextNode;
