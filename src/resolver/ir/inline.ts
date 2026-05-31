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

export type ResolvedInlineMathNode = {
  kind: "m";
  src: string;
  className?: string;
};

export type ResolvedSidenoteNode = {
  kind: "sidenote";
  className?: string;
  children: ResolvedInlineNode[];
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

// Slice 6.3 (D1): content-side `<bib-entry-content for="key" />` resolves
// to this placeholder, which the data-source `expandRenderProp` then
// splice-replaces with the resolved inline children of the matching
// `<ref-entry>` (looked up via `ctx.refEntries`). The placeholder
// should never reach a renderer; if it does, that means a userland
// helper used `<bib-entry-content>` outside a `<bib-data>` render-prop.
export type ResolvedBibEntryContentNode = {
  kind: "bib-entry-content";
  refKey: string;
};

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
  | ResolvedSidenoteNode
  | ResolvedBibEntryContentNode;
