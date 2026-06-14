export type TextNode = {
  kind: "text";
  value: string;
};

export type LinkNode = {
  kind: "link";
  href: string;
  title?: string;
  className?: string;
  children: InlineNode[];
};

export type EmNode = {
  kind: "em";
  className?: string;
  children: InlineNode[];
};

export type StrongNode = {
  kind: "strong";
  className?: string;
  children: InlineNode[];
};

export type CodeNode = {
  kind: "code";
  className?: string;
  children: TextNode[];
};

export type BreakNode = {
  kind: "br";
};

export type SubNode = {
  kind: "sub";
  className?: string;
  children: InlineNode[];
};

export type SupNode = {
  kind: "sup";
  className?: string;
  children: InlineNode[];
};

export type InlineImgNode = {
  kind: "img";
  src: string;
  alt?: string;
  width?: string;
  height?: string;
  className?: string;
};

export type RefShow = "number" | "page" | "title" | "number-and-page";

export type RefNode = {
  kind: "ref";
  to: string;
  show?: RefShow;
  className?: string;
};

export type FootnoteNode = {
  kind: "footnote";
  marker?: string;
  className?: string;
  children: InlineNode[];
};

export type MathNode = {
  kind: "math";
  id?: string;
  src: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
};

export type InlineMathNode = {
  kind: "m";
  src: string;
  className?: string;
};

export type CiteNode = {
  kind: "cite";
  cite: string;
  className?: string;
};

export type IndexNode = {
  kind: "index";
  term: string;
  className?: string;
};

export type SidenoteNode = {
  kind: "sidenote";
  className?: string;
  children: InlineNode[];
};

// Substitution primitive (slice 6.3 / D1). Lives content-side now so
// userland helpers compose it inside content JSX. Its resolver walks
// the SemanticNode tree before content resolution and replaces the
// placeholder in-place with the resolved inline children of the
// matching <ref-entry refKey="...">. The node never reaches
// `resolveInlineNode`.
export type BibEntryContentNode = {
  kind: "bib-entry-content";
  refKey: string;
};

export type RefEntryNode = {
  kind: "ref-entry";
  refKey: string;
  className?: string;
  children: InlineNode[];
};

export type RefsNode = {
  kind: "refs";
  className?: string;
  children: RefEntryNode[];
};

export type ParagraphNode = {
  kind: "paragraph";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  children: InlineNode[];
};

export type CodeBlockNode = {
  kind: "code-block";
  id?: string;
  language?: string;
  className?: string;
  children: TextNode[];
};

export type PreNode = {
  kind: "pre";
  id?: string;
  className?: string;
  children: TextNode[];
};

// `caption` is a first-class IR node. Figures and tables accept exactly
// one optional caption child; renderers position it (above for tables,
// below for figures, by IEEE convention; templates may override).
// Backwards compat: figure/table also accept `caption?: string` props;
// the resolver normalises a string-form caption into a CaptionNode
// child if no child caption is present.
export type CaptionNode = {
  kind: "caption";
  id?: string;
  role?: string;
  className?: string;
  children: InlineNode[];
};

export type FigureNode = {
  kind: "figure";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  src: string;
  alt?: string;
  caption?: string;          // legacy string form
  captionNode?: CaptionNode; // node form set by JSX child or resolver normalisation
  width?: string;
};

export type CellNode = {
  kind: "cell";
  header?: boolean;
  className?: string;
  children: SemanticBlockChild[];
};

export type RowNode = {
  kind: "row";
  /**
   * When true, every `<cell>` rendered inside this row is treated as a
   * header cell (`<th>` in the HTML backend). Equivalent to setting
   * `header` on each child cell individually; useful for the common
   * Markdown-style "first row is header" pattern.
   */
  header?: boolean;
  className?: string;
  children: CellNode[];
};

export type TableNode = {
  kind: "table";
  id?: string;
  className?: string;
  caption?: string;          // legacy string form
  captionNode?: CaptionNode; // node form set by JSX child or resolver normalisation
  children: RowNode[];
};

export type BlockQuoteNode = {
  kind: "blockquote";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  speaker?: string;
  className?: string;
  children: SemanticBlockChild[];
};

export type ListItemNode = {
  kind: "item";
  id?: string;
  className?: string;
  children: SemanticBlockChild[];
};

export type ListNode = {
  kind: "list";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  ordered: boolean;
  className?: string;
  children: ListItemNode[];
};

export type DefNode = {
  kind: "def";
  term: string;
  className?: string;
  children: SemanticBlockChild[];
};

export type DefsNode = {
  kind: "defs";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
  children: DefNode[];
};

export type SectionNode = {
  kind: "section";
  id?: string;
  title: string;
  role?: string;
  page?: string;
  // Opts into a `<page-variant name="X">` declared inside the section's
  // page-set. Requires `page` to be set. Renders as `page:<set>__<X>`
  // so Paged.js routes the section to the derived regime.
  pageVariant?: string;
  variant?: string;
  className?: string;
  counter?: string;
  children: SemanticBlockChild[];
};

export type HeadingNode = {
  kind: "heading";
  id?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Plain-string heading text. Kept for back-compat — callers that
   * want inline marks (`<em>`, `<cite>`, `<m>`) should supply
   * `children` instead. Always populated, so renderers and the
   * resolver can rely on it; when `children` are present, the
   * resolver derives a plain-text version here for running strings
   * and the TOC.
   */
  title: string;
  /**
   * Inline-bearing form. When non-empty, this is the authoritative
   * rendered content; `title` is the plain-text projection.
   */
  children?: InlineNode[];
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
};

export type PageBreakNode = {
  kind: "page-break";
};

export type SetRunningNode = {
  kind: "set-running";
  name: string;
  value: string;
};

// Generic document-wide metadata carrier. Each <meta name="X"> entry
// becomes a named slot bucket the template can consume via
// <slot name="X" />. The engine does not interpret `name` — title,
// author, doi, keywords, affiliation, … are all opaque labels routed
// from content to template. Title and author also have scalar props on
// DocumentNode for back-compat; meta entries with those names are
// concatenated into the same slot bucket.
export type MetaNode = {
  kind: "meta";
  name: string;
  className?: string;
  children: InlineNode[];
};

export type DocumentNode = {
  kind: "document";
  title: string;
  author?: string;
  className?: string;
  children: DocumentChild[];
};

export type InlineNode =
  | TextNode
  | EmNode
  | StrongNode
  | CodeNode
  | LinkNode
  | BreakNode
  | SubNode
  | SupNode
  | InlineImgNode
  | RefNode
  | FootnoteNode
  | InlineMathNode
  | CiteNode
  | IndexNode
  | SidenoteNode
  | BibEntryContentNode;

export type SemanticBlockChild =
  | SectionNode
  | ParagraphNode
  | FigureNode
  | TableNode
  | BlockQuoteNode
  | ListNode
  | CodeBlockNode
  | PreNode
  | DefsNode
  | HeadingNode
  | MathNode
  | RefsNode
  | PageBreakNode
  | SetRunningNode;

export type DocumentChild = SemanticBlockChild | MetaNode;

export type SemanticNode =
  | DocumentNode
  | MetaNode
  | SectionNode
  | ParagraphNode
  | FigureNode
  | CaptionNode
  | TableNode
  | RowNode
  | CellNode
  | BlockQuoteNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | PreNode
  | DefsNode
  | DefNode
  | HeadingNode
  | MathNode
  | RefsNode
  | RefEntryNode
  | PageBreakNode
  | SetRunningNode
  | EmNode
  | StrongNode
  | CodeNode
  | LinkNode
  | BreakNode
  | SubNode
  | SupNode
  | InlineImgNode
  | RefNode
  | FootnoteNode
  | InlineMathNode
  | CiteNode
  | IndexNode
  | SidenoteNode
  | BibEntryContentNode
  | TextNode;

export type SemanticContainerNode =
  | DocumentNode
  | MetaNode
  | SectionNode
  | ParagraphNode
  | FigureNode
  | CaptionNode
  | TableNode
  | RowNode
  | CellNode
  | BlockQuoteNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | PreNode
  | DefsNode
  | DefNode
  | HeadingNode
  | EmNode
  | StrongNode
  | CodeNode
  | LinkNode
  | SubNode
  | SupNode
  | FootnoteNode
  | SidenoteNode
  | RefsNode
  | RefEntryNode;
