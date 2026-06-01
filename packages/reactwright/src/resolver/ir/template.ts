import type { TemplateStyle } from "../../template/ir.js";
import type { ResolvedContentNode } from "./block.js";
import type {
  ResolvedFontNode,
  ResolvedFootnoteAreaNode,
  ResolvedImageNode,
  ResolvedPageCountNode,
  ResolvedPageNumberNode,
  ResolvedRunningNode,
  ResolvedSidenoteAreaNode,
} from "./decorations.js";
import type { ResolvedChild, ResolvedPageNode } from "./page.js";

export type ResolvedRoleVariantRule = {
  apply: string;
  breakBefore?: string;
  breakAfter?: string;
  breakInside?: string;
  numbering?: ResolvedRoleNumbering;
  dropCap?: ResolvedRoleDropCap;
  style?: TemplateStyle;
};

export type ResolvedRoleNumbering = {
  counter: string;
  scope?: string;
  format?: string;
};

export type ResolvedRoleDropCap = {
  lines?: number;
  font?: string;
  position?: string;
};

export type ResolvedPageRegime = {
  name: string;
  style?: TemplateStyle;
};

// Marker for the body slot inside a regime flow template. The HTML backend
// replaces this with the section's rendered children at section-emit time.
export type ResolvedBodySlotNode = {
  kind: "body-slot";
};

// Auto-streamed body sections. Emitted by the resolver when no top-level
// <slot name="body"> exists but page-sets declare regime flows — so that
// putting `<slot name="body">` inside a page-set is enough to wire up body
// content. The renderer expands this by rendering each section in document
// order (wrapping depth-1 sections in their regime's flow template).
export type ResolvedBodyStreamNode = {
  kind: "body-stream";
  children: ResolvedContentNode[];
};

// Opaque parsed-stylesheet handle. The shape lives in src/styles/ir.ts;
// re-typed here as `unknown`-equivalent to avoid pulling the styles
// types into every resolver consumer. The lowerer reaches into the
// real shape.
export type ResolvedStylesheet = unknown;

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
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedLayerNode = {
  kind: "layer";
  name?: string;
  when?: string;
  regime?: string;
  style?: TemplateStyle;
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedStackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children: ResolvedChild[];
};

// Template-side horizontal flex container, symmetric to ResolvedStackNode.
// Distinct kind from the content-side table-row (ResolvedRowNode) so that
// the discriminated union over ResolvedChild remains unambiguous.
export type ResolvedTemplateRowNode = {
  kind: "template-row";
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedColumnsNode = {
  kind: "columns";
  gap?: string;
  widths?: string[];
  style?: TemplateStyle;
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedColumnNode = {
  kind: "column";
  width?: string;
  style?: TemplateStyle;
  className?: string;
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
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedHeaderNode = {
  kind: "header";
  anchor: string;
  when?: string;
  regime?: string;
  style?: TemplateStyle;
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedFooterNode = {
  kind: "footer";
  anchor: string;
  when?: string;
  regime?: string;
  style?: TemplateStyle;
  className?: string;
  children: ResolvedChild[];
};

export type ResolvedCustomTemplateNode = {
  kind: "custom";
  name: string;
  props: Record<string, unknown>;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

export type ResolvedTemplateNode =
  | ResolvedPageNode
  | ResolvedBodySlotNode
  | ResolvedBodyStreamNode
  | ResolvedRegionNode
  | ResolvedStackNode
  | ResolvedTemplateRowNode
  | ResolvedColumnsNode
  | ResolvedColumnNode
  | ResolvedLayerNode
  | ResolvedFixedNode
  | ResolvedHeaderNode
  | ResolvedFooterNode
  | ResolvedPageNumberNode
  | ResolvedPageCountNode
  | ResolvedRunningNode
  | ResolvedImageNode
  | ResolvedFootnoteAreaNode
  | ResolvedSidenoteAreaNode
  | ResolvedFontNode
  | ResolvedCustomTemplateNode;

