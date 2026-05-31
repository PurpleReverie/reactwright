import type { TemplateStyle } from "../../template/ir.js";

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

export type ResolvedFootnoteAreaNode = {
  kind: "footnote-area";
  separator?: boolean;
  style?: TemplateStyle;
};

export type ResolvedSidenoteAreaNode = {
  kind: "sidenote-area";
  side?: "outside" | "inside" | "left" | "right";
  width?: string;
  gap?: string;
  style?: TemplateStyle;
};

export type ResolvedFontNode = {
  kind: "font";
  family: string;
  src: string;
  weight?: string;
  fontStyle?: string;
  format?: string;
};

export type ResolvedRunningNode = {
  kind: "running";
  name: string;
  policy?: string;
  style?: TemplateStyle;
};

export type ResolvedPageNumberNode = {
  kind: "page-number";
  style?: TemplateStyle;
};

export type ResolvedPageCountNode = {
  kind: "page-count";
  style?: TemplateStyle;
};
