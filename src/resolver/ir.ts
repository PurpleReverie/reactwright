import type { TemplateStyle } from "../template/ir.js";

export type ResolvedTextNode = {
  kind: "text";
  value: string;
};

export type ResolvedEmNode = {
  kind: "em";
  children: ResolvedInlineNode[];
};

export type ResolvedStrongNode = {
  kind: "strong";
  children: ResolvedInlineNode[];
};

export type ResolvedCodeNode = {
  kind: "code";
  children: ResolvedTextNode[];
};

export type ResolvedParagraphNode = {
  kind: "paragraph";
  children: ResolvedInlineNode[];
};

export type ResolvedBlockQuoteNode = {
  kind: "blockquote";
  children: ResolvedContentChild[];
};

export type ResolvedListItemNode = {
  kind: "item";
  children: ResolvedContentChild[];
};

export type ResolvedListNode = {
  kind: "list";
  ordered: boolean;
  children: ResolvedListItemNode[];
};

export type ResolvedSectionNode = {
  kind: "section";
  title: string;
  children: ResolvedContentChild[];
};

export type ResolvedAbstractNode = {
  kind: "abstract";
  children: ResolvedContentChild[];
};

export type ResolvedTitleNode = {
  kind: "title";
  value: string;
};

export type ResolvedAuthorNode = {
  kind: "author";
  value: string;
};

export type ResolvedCustomTemplateNode = {
  kind: "custom";
  name: string;
  props: Record<string, unknown>;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedPageNode = {
  kind: "page";
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedBoxNode = {
  kind: "box";
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedStackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedContentNode =
  | ResolvedTitleNode
  | ResolvedAuthorNode
  | ResolvedAbstractNode
  | ResolvedSectionNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedListItemNode
  | ResolvedParagraphNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedTextNode;

export type ResolvedContentChild =
  | ResolvedSectionNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedParagraphNode
  | ResolvedTextNode;

export type ResolvedInlineNode =
  | ResolvedTextNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode;

export type ResolvedTemplateNode =
  | ResolvedPageNode
  | ResolvedBoxNode
  | ResolvedStackNode
  | ResolvedCustomTemplateNode;

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
