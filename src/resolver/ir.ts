import type { TemplateStyle } from "../template/ir.js";

export type ResolvedTextNode = {
  kind: "text";
  value: string;
};

export type ResolvedLinkNode = {
  kind: "link";
  href: string;
  title?: string;
  children: ResolvedInlineNode[];
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

export type ResolvedFontNode = {
  kind: "font";
  family: string;
  children: ResolvedInlineNode[];
};

export type ResolvedParagraphNode = {
  kind: "paragraph";
  role?: string;
  page?: string;
  variant?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedCodeBlockNode = {
  kind: "code-block";
  language?: string;
  children: ResolvedTextNode[];
};

export type ResolvedThematicBreakNode = {
  kind: "thematic-break";
};

export type ResolvedFigureNode = {
  kind: "figure";
  src: string;
  alt?: string;
  caption?: string;
  width?: string;
};

export type ResolvedBlockQuoteNode = {
  kind: "blockquote";
  role?: string;
  page?: string;
  variant?: string;
  speaker?: string;
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
  role?: string;
  page?: string;
  variant?: string;
  children: ResolvedContentChild[];
};

export type ResolvedPageBreakNode = {
  kind: "page-break";
};

export type ResolvedAbstractNode = {
  kind: "abstract";
  page?: string;
  variant?: string;
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

export type ResolvedRowNode = {
  kind: "row";
  gap?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedRuleNode = {
  kind: "rule";
  axis?: "horizontal" | "vertical";
  weight?: string;
  color?: string;
  length?: string;
  style?: TemplateStyle;
};

export type ResolvedRepeatNode = {
  kind: "repeat";
  anchor: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedFixedNode = {
  kind: "fixed";
  anchor: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedContentNode =
  | ResolvedTitleNode
  | ResolvedAuthorNode
  | ResolvedAbstractNode
  | ResolvedSectionNode
  | ResolvedFigureNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedListItemNode
  | ResolvedCodeBlockNode
  | ResolvedThematicBreakNode
  | ResolvedPageBreakNode
  | ResolvedParagraphNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedFontNode
  | ResolvedLinkNode
  | ResolvedTextNode;

export type ResolvedContentChild =
  | ResolvedSectionNode
  | ResolvedFigureNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedCodeBlockNode
  | ResolvedThematicBreakNode
  | ResolvedPageBreakNode
  | ResolvedParagraphNode
  | ResolvedTextNode;

export type ResolvedInlineNode =
  | ResolvedTextNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedFontNode
  | ResolvedLinkNode;

export type ResolvedTemplateNode =
  | ResolvedPageNode
  | ResolvedBoxNode
  | ResolvedStackNode
  | ResolvedRowNode
  | ResolvedRuleNode
  | ResolvedRepeatNode
  | ResolvedFixedNode
  | ResolvedCustomTemplateNode;

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
