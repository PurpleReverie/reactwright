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

export type ResolvedBreakNode = {
  kind: "br";
};

export type ResolvedSubNode = {
  kind: "sub";
  children: ResolvedInlineNode[];
};

export type ResolvedSupNode = {
  kind: "sup";
  children: ResolvedInlineNode[];
};

export type ResolvedInlineImgNode = {
  kind: "img";
  src: string;
  alt?: string;
  width?: string;
  height?: string;
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

export type ResolvedPreNode = {
  kind: "pre";
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

export type ResolvedSetRunningNode = {
  kind: "set-running";
  name: string;
  value: string;
};

export type ResolvedImageNode = {
  kind: "image";
  src: string;
  alt?: string;
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  width?: string;
  style?: TemplateStyle;
};

export type ResolvedRunningNode = {
  kind: "running";
  name: string;
  policy?: string;
  style?: TemplateStyle;
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

export type ResolvedRegionPositioning = {
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  center?: boolean;
};

export type ResolvedRegionNode = {
  kind: "region";
  style?: TemplateStyle;
  positioning?: ResolvedRegionPositioning;
  children: ResolvedChild[];
};

export type ResolvedLayerNode = {
  kind: "layer";
  name?: string;
  when?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedStackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedAnchorCoordinate = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

export type ResolvedFixedNode = {
  kind: "fixed";
  anchor: string | ResolvedAnchorCoordinate;
  when?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedPageNumberNode = {
  kind: "page-number";
  style?: TemplateStyle;
};

export type ResolvedPageCountNode = {
  kind: "page-count";
  style?: TemplateStyle;
};

export type ResolvedHeaderNode = {
  kind: "header";
  anchor: string;
  when?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedFooterNode = {
  kind: "footer";
  anchor: string;
  when?: string;
  style?: TemplateStyle;
  children: ResolvedChild[];
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
  | ResolvedPreNode
  | ResolvedPageBreakNode
  | ResolvedSetRunningNode
  | ResolvedParagraphNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedLinkNode
  | ResolvedBreakNode
  | ResolvedSubNode
  | ResolvedSupNode
  | ResolvedInlineImgNode
  | ResolvedTextNode;

export type ResolvedContentChild =
  | ResolvedSectionNode
  | ResolvedFigureNode
  | ResolvedTableNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedCodeBlockNode
  | ResolvedPreNode
  | ResolvedPageBreakNode
  | ResolvedSetRunningNode
  | ResolvedParagraphNode
  | ResolvedTextNode;

export type ResolvedInlineNode =
  | ResolvedTextNode
  | ResolvedEmNode
  | ResolvedStrongNode
  | ResolvedCodeNode
  | ResolvedLinkNode
  | ResolvedBreakNode
  | ResolvedSubNode
  | ResolvedSupNode
  | ResolvedInlineImgNode;

export type ResolvedTemplateNode =
  | ResolvedPageNode
  | ResolvedRegionNode
  | ResolvedStackNode
  | ResolvedLayerNode
  | ResolvedFixedNode
  | ResolvedHeaderNode
  | ResolvedFooterNode
  | ResolvedPageNumberNode
  | ResolvedPageCountNode
  | ResolvedRunningNode
  | ResolvedImageNode
  | ResolvedCustomTemplateNode;

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
