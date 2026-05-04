export type TemplateStyle = Record<string, unknown>;

export type SlotName = "title" | "author" | "abstract" | "body";

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
  | TemplateTextNode;

export type TemplateContainerNode = PageNode | BoxNode | StackNode | CustomTemplateNode;

export type TemplateChild = TemplateContainerNode | SlotNode | TemplateTextNode;
