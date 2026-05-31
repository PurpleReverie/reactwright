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
  variant?: string;
  className?: string;
  counter?: string;
  children: SemanticBlockChild[];
};

export type HeadingNode = {
  kind: "heading";
  id?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
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
  | SidenoteNode;

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

export type DocumentChild = SemanticBlockChild;

export type SemanticNode =
  | DocumentNode
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
  | TextNode;

export type SemanticContainerNode =
  | DocumentNode
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
