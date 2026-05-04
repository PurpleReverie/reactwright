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

export type TemplateTextNode = {
  kind: "text";
  value: string;
};

export type TemplateNode = PageNode | BoxNode | StackNode | SlotNode | TemplateTextNode;

export type TemplateContainerNode = PageNode | BoxNode | StackNode;

export type TemplateChild = TemplateContainerNode | SlotNode | TemplateTextNode;
