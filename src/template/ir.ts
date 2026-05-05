export type TemplateStyle = Record<string, unknown>;

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
  | SlotNode
  | CustomTemplateNode
  | PageSetNode
  | RulesNode
  | RulesChild
  | TemplateTextNode;

export type TemplateContainerNode = PageNode | BoxNode | StackNode | CustomTemplateNode | PageSetNode | RulesNode;

export type TemplateChild = TemplateContainerNode | SlotNode | TemplateTextNode;
