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

export type ResolvedFigureNode = {
  kind: "figure";
  role?: string;
  page?: string;
  variant?: string;
  src: string;
  alt?: string;
  caption?: string;
  width?: string;
};

export type ResolvedCellNode = {
  kind: "cell";
  header?: boolean;
  children: ResolvedContentChild[];
};

export type ResolvedRowNode = {
  kind: "row";
  children: ResolvedCellNode[];
};

export type ResolvedTableNode = {
  kind: "table";
  caption?: string;
  children: ResolvedRowNode[];
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
  role?: string;
  page?: string;
  variant?: string;
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

export type ResolvedRegionNode = {
  kind: "region";
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedStackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedFixedNode = {
  kind: "fixed";
  anchor: string;
  when?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedPageNumberNode = {
  kind: "page-number";
  style?: TemplateStyle;
};

export type ResolvedContentNode =
  | ResolvedTitleNode
  | ResolvedAuthorNode
  | ResolvedAbstractNode
  | ResolvedSectionNode
  | ResolvedFigureNode
  | ResolvedTableNode
  | ResolvedRowNode
  | ResolvedCellNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedListItemNode
  | ResolvedCodeBlockNode
  | ResolvedPageBreakNode
  | ResolvedParagraphNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedLinkNode
  | ResolvedTextNode;

export type ResolvedContentChild =
  | ResolvedSectionNode
  | ResolvedFigureNode
  | ResolvedTableNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedCodeBlockNode
  | ResolvedPageBreakNode
  | ResolvedParagraphNode
  | ResolvedTextNode;

export type ResolvedInlineNode =
  | ResolvedTextNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedLinkNode;

export type ResolvedTemplateNode =
  | ResolvedPageNode
  | ResolvedRegionNode
  | ResolvedStackNode
  | ResolvedFixedNode
  | ResolvedPageNumberNode
  | ResolvedCustomTemplateNode;

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
