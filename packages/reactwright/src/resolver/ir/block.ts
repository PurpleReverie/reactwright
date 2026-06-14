import type {
  ResolvedBibEntryContentNode,
  ResolvedBreakNode,
  ResolvedCiteNode,
  ResolvedCodeNode,
  ResolvedEmNode,
  ResolvedFootnoteNode,
  ResolvedIndexEntryNode,
  ResolvedInlineImgNode,
  ResolvedInlineMathNode,
  ResolvedInlineNode,
  ResolvedLinkNode,
  ResolvedRefNode,
  ResolvedSidenoteNode,
  ResolvedStrongNode,
  ResolvedSubNode,
  ResolvedSupNode,
  ResolvedTextNode,
} from "./inline.js";
import type { ResolvedAuthorNode, ResolvedTitleNode } from "./page.js";

export type ResolvedMathNode = {
  kind: "math";
  id?: string;
  src: string;
  role?: string;
  page?: string;
  variant?: string;
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
  pageVariant?: string;
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
  /** Plain-text projection. Always populated; used for running strings, TOC, etc. */
  title: string;
  /**
   * Inline marks form. When non-empty, the renderer uses this instead
   * of `title`. Lets headings carry `<em>`, `<cite>`, `<m>` and friends
   * (RW-6).
   */
  children?: ResolvedInlineNode[];
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

// Resolved <meta name="X">…inline…</meta>. The slot map drops these
// into `slots[name]` so `<slot name="X" />` picks them up. The renderer
// emits `<div data-meta="X">…</div>` and is fully styleable via the
// dialect — e.g. `<rule match={{ kind: "meta" }}>` (all metas) or
// `<rule match={{ kind: "meta", attr: { name: "doi" } }}>` (one name).
export type ResolvedMetaNode = {
  kind: "meta";
  name: string;
  className?: string;
  children: ResolvedInlineNode[];
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
  | ResolvedMetaNode
  | ResolvedCiteNode
  | ResolvedIndexEntryNode
  | ResolvedSidenoteNode
  | ResolvedBibEntryContentNode
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
