import type { TemplateStyle } from "../template/ir.js";

export type ResolvedTextNode = {
  kind: "text";
  value: string;
};

export type ResolvedLinkNode = {
  kind: "link";
  href: string;
  title?: string;
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedEmNode = {
  kind: "em";
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedStrongNode = {
  kind: "strong";
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedCodeNode = {
  kind: "code";
  className?: string;
  children: ResolvedTextNode[];
};

export type ResolvedBreakNode = {
  kind: "br";
};

export type ResolvedSubNode = {
  kind: "sub";
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedSupNode = {
  kind: "sup";
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedInlineImgNode = {
  kind: "img";
  src: string;
  alt?: string;
  width?: string;
  height?: string;
  className?: string;
};

export type ResolvedRefNode = {
  kind: "ref";
  to: string;
  show: "number" | "page" | "title" | "number-and-page";
  className?: string;
};

export type ResolvedFootnoteNode = {
  kind: "footnote";
  marker?: string;
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedMathNode = {
  kind: "math";
  id?: string;
  src: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
};

export type ResolvedInlineMathNode = {
  kind: "m";
  src: string;
  className?: string;
};

export type ResolvedParagraphNode = {
  kind: "paragraph";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedCodeBlockNode = {
  kind: "code-block";
  id?: string;
  language?: string;
  className?: string;
  children: ResolvedTextNode[];
};

export type ResolvedPreNode = {
  kind: "pre";
  id?: string;
  className?: string;
  children: ResolvedTextNode[];
};

export type ResolvedDefNode = {
  kind: "def";
  term: string;
  className?: string;
  children: ResolvedContentChild[];
};

export type ResolvedDefsNode = {
  kind: "defs";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  children: ResolvedDefNode[];
};

export type ResolvedCaptionNode = {
  kind: "caption";
  id?: string;
  role?: string;
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedFigureNode = {
  kind: "figure";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  src: string;
  alt?: string;
  caption?: string;            // legacy string form
  captionNode?: ResolvedCaptionNode;
  width?: string;
  // Slice 5.2: synthesized children sub-tree. When `src` is set, the
  // resolver prepends a `ResolvedFigureImageNode`; the renderer prefers
  // this children-walk over the legacy inline emit. `src`/`alt`/`width`
  // stay populated on the figure for back-compat.
  children?: Array<ResolvedFigureImageNode | ResolvedCaptionNode>;
};

// Synthesized figure-image node (slice 5.2). Prepended to
// ResolvedFigureNode.children by the resolver when `src` is non-empty,
// giving the inner `<img>` a first-class IR identity. Rules of the form
// `<rule match={{kind:"figure-image"}}>` land their className on this
// node; `classAttr(node)` in `renderFigureImageNode` splices it onto
// the emitted `<img>` tag.
export type ResolvedFigureImageNode = {
  kind: "figure-image";
  src: string;
  alt?: string;
  width?: string;
  height?: string;
  className?: string;
};

export type ResolvedCellNode = {
  kind: "cell";
  header?: boolean;
  className?: string;
  children: ResolvedContentChild[];
};

export type ResolvedRowNode = {
  kind: "row";
  className?: string;
  children: ResolvedCellNode[];
};

export type ResolvedTableNode = {
  kind: "table";
  id?: string;
  className?: string;
  caption?: string;
  captionNode?: ResolvedCaptionNode;
  children: ResolvedRowNode[];
};

export type ResolvedBlockQuoteNode = {
  kind: "blockquote";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  speaker?: string;
  className?: string;
  children: ResolvedContentChild[];
};

export type ResolvedListItemNode = {
  kind: "item";
  id?: string;
  className?: string;
  children: ResolvedContentChild[];
};

export type ResolvedListNode = {
  kind: "list";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  ordered: boolean;
  className?: string;
  children: ResolvedListItemNode[];
};

export type ResolvedSectionNode = {
  kind: "section";
  id?: string;
  title: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  counter?: string;
  children: ResolvedContentChild[];
};

// Synthesized heading-node (slice 5.1). Prepended to
// ResolvedSectionNode.children by the resolver when `title` is non-empty,
// giving section headings a first-class IR identity that rules can
// target via `<rule match={{kind:"section-heading"}}>`. The
// classAttrWithBase(headingNode, "reactwright-section-title") call in
// renderSectionHeadingNode is where rule-applied classes land on the
// emitted <h2>/<h3>/...; the parent <section> wrapper no longer carries
// those classes.
export type ResolvedSectionHeadingNode = {
  kind: "section-heading";
  text: string;
  depth: number;       // 1 = h2, 2 = h3, 3 = h4, capped at h6
  className?: string;
};

export type ResolvedHeadingNode = {
  kind: "heading";
  id?: string;
  className?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  role?: string;
  page?: string;
  variant?: string;
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

export type ResolvedFootnoteAreaNode = {
  kind: "footnote-area";
  separator?: boolean;
  style?: TemplateStyle;
};

export type ResolvedSidenoteNode = {
  kind: "sidenote";
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedRefEntryNode = {
  kind: "ref-entry";
  refKey: string;
  className?: string;
  children: ResolvedInlineNode[];
};

export type ResolvedRefsNode = {
  kind: "refs";
  className?: string;
  children: ResolvedRefEntryNode[];
};

export type ResolvedSidenoteAreaNode = {
  kind: "sidenote-area";
  side?: "outside" | "inside" | "left" | "right";
  width?: string;
  gap?: string;
  style?: TemplateStyle;
};

export type ResolvedCiteNode = {
  kind: "cite";
  cite: string;
  className?: string;
};

export type ResolvedIndexEntryNode = {
  kind: "index";
  term: string;
  anchorId: string;
  className?: string;
};

export type ResolvedIndexEntry = {
  term: string;
  anchorIds: string[];
};

export type ResolvedIndexTemplateNode = {
  kind: "index-template";
  title?: string;
  entries: ResolvedIndexEntry[];
  style?: TemplateStyle;
};

export type ResolvedTocEntry = {
  id: string;
  title: string;
  depth: number;
};

export type ResolvedTocNode = {
  kind: "toc";
  title?: string;
  depth?: number;
  numbered?: boolean;
  entries: ResolvedTocEntry[];
  style?: TemplateStyle;
};

export type ResolvedListOfEntry = {
  id: string;
  caption: string;
};

export type ResolvedListOfNode = {
  kind: "list-of";
  of: "figure" | "table" | "equation";
  title?: string;
  entries: ResolvedListOfEntry[];
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

export type ResolvedBibliographyEntry = {
  key: string;
  text?: string;
  inline?: ResolvedInlineNode[];
  used: boolean;
  // Identity of the source `ResolvedRefEntryNode` that produced this
  // entry (for content-side entries). The renderer passes it to
  // `classAttr` so authors can target bibliography <li>s via
  // `<rule match={{ kind: "ref-entry" }} />`. Absent when the entry
  // came from the template-prop `entries={...}` path or was synthesised
  // for a citation with no entry.
  sourceNode?: unknown;
};

export type ResolvedBibliographyHeadingNode = {
  kind: "bibliography-heading";
  text: string;
  className?: string;
};

export type ResolvedBibliographyListNode = {
  kind: "bibliography-list";
  className?: string;
};

export type ResolvedBibliographyNode = {
  kind: "bibliography";
  title?: string;
  entries: ResolvedBibliographyEntry[];
  style?: TemplateStyle;
  // Synthesized child IR nodes for the rendered <h2> + <ol> wrappers,
  // so authors can target them via `<rule match={{kind:"bibliography-heading"}}>`
  // / `<rule match={{kind:"bibliography-list"}}>`. Slice 5.3 (the
  // back-compat path while engine <bibliography> stays deprecated;
  // slice 6.3 will replace this with userland composition).
  headingNode?: ResolvedBibliographyHeadingNode;
  listNode?: ResolvedBibliographyListNode;
};

export type ResolvedRunningNode = {
  kind: "running";
  name: string;
  policy?: string;
  style?: TemplateStyle;
};

export type ResolvedTitleNode = {
  kind: "title";
  className?: string;
  value: string;
};

export type ResolvedAuthorNode = {
  kind: "author";
  className?: string;
  value: string;
};

export type ResolvedCustomTemplateNode = {
  kind: "custom";
  name: string;
  props: Record<string, unknown>;
  style?: TemplateStyle;
  children: ResolvedChild[];
};

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

export type ResolvedPageNode = {
  kind: "page";
  style?: TemplateStyle;
  variantRules?: ResolvedRoleVariantRule[];
  regimes?: ResolvedPageRegime[];
  // Per-regime flow template. When a section has `page="X"`, the renderer
  // wraps the section in `regimeFlows[X]` (replacing the body-slot marker
  // with the section's content). Lets a page-set declare per-regime layout
  // without filtering the document-order body stream.
  regimeFlows?: Record<string, ResolvedChild[]>;
  // Parsed <styles> blocks (all sources concatenated). Lowered to CSS
  // at HTML emit time. See src/styles/.
  stylesheet?: ResolvedStylesheet;
  // Per-node class assignments computed by applyRulesToTree. Lookup
  // by node identity; values are the list of classes the apply pass
  // attached. Stored as an array of [node, classes] tuples because
  // ResolvedPageNode must be JSON-serialisable for snapshot tests.
  classBindings?: ReadonlyArray<readonly [unknown, readonly string[]]>;
  children: ResolvedChild[];
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

export type ResolvedContentNode =
  | ResolvedTitleNode
  | ResolvedAuthorNode
  | ResolvedSectionNode
  | ResolvedSectionHeadingNode
  | ResolvedFigureNode
  | ResolvedFigureImageNode
  | ResolvedCaptionNode
  | ResolvedTableNode
  | ResolvedRowNode
  | ResolvedCellNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedListItemNode
  | ResolvedCodeBlockNode
  | ResolvedPreNode
  | ResolvedDefsNode
  | ResolvedDefNode
  | ResolvedHeadingNode
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
  | ResolvedRefNode
  | ResolvedFootnoteNode
  | ResolvedInlineMathNode
  | ResolvedMathNode
  | ResolvedRefsNode
  | ResolvedRefEntryNode
  | ResolvedCiteNode
  | ResolvedIndexEntryNode
  | ResolvedSidenoteNode
  | ResolvedTextNode;

export type ResolvedContentChild =
  | ResolvedSectionNode
  | ResolvedSectionHeadingNode
  | ResolvedFigureNode
  | ResolvedTableNode
  | ResolvedBlockQuoteNode
  | ResolvedListNode
  | ResolvedCodeBlockNode
  | ResolvedPreNode
  | ResolvedDefsNode
  | ResolvedHeadingNode
  | ResolvedMathNode
  | ResolvedRefsNode
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
  | ResolvedInlineImgNode
  | ResolvedRefNode
  | ResolvedFootnoteNode
  | ResolvedInlineMathNode
  | ResolvedCiteNode
  | ResolvedIndexEntryNode
  | ResolvedSidenoteNode;

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
  | ResolvedBibliographyNode
  | ResolvedIndexTemplateNode
  | ResolvedSidenoteAreaNode
  | ResolvedTocNode
  | ResolvedListOfNode
  | ResolvedFontNode
  | ResolvedCustomTemplateNode;

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
