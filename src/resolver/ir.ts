import type { TemplateStyle } from "../template/ir.js";

export type ResolvedTextNode = {
  kind: "text";
  value: string;
};

export type ResolvedParagraphNode = {
  kind: "paragraph";
  children: ResolvedTextNode[];
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
  | ResolvedParagraphNode
  | ResolvedTextNode;

export type ResolvedContentChild =
  | ResolvedSectionNode
  | ResolvedParagraphNode
  | ResolvedTextNode;

export type ResolvedTemplateNode = ResolvedPageNode | ResolvedBoxNode | ResolvedStackNode;

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
