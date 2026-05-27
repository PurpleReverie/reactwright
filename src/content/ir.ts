export type TextNode = {
  kind: "text";
  value: string;
};

export type LinkNode = {
  kind: "link";
  href: string;
  title?: string;
  children: InlineNode[];
};

export type EmNode = {
  kind: "em";
  children: InlineNode[];
};

export type StrongNode = {
  kind: "strong";
  children: InlineNode[];
};

export type CodeNode = {
  kind: "code";
  children: TextNode[];
};

export type BreakNode = {
  kind: "br";
};

export type SubNode = {
  kind: "sub";
  children: InlineNode[];
};

export type SupNode = {
  kind: "sup";
  children: InlineNode[];
};

export type InlineImgNode = {
  kind: "img";
  src: string;
  alt?: string;
  width?: string;
  height?: string;
};

export type RefShow = "number" | "page" | "title" | "number-and-page";

export type RefNode = {
  kind: "ref";
  to: string;
  show?: RefShow;
};

export type ParagraphNode = {
  kind: "paragraph";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  children: InlineNode[];
};

export type CodeBlockNode = {
  kind: "code-block";
  id?: string;
  language?: string;
  children: TextNode[];
};

export type PreNode = {
  kind: "pre";
  id?: string;
  children: TextNode[];
};

export type FigureNode = {
  kind: "figure";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  src: string;
  alt?: string;
  caption?: string;
  width?: string;
};

export type CellNode = {
  kind: "cell";
  header?: boolean;
  children: SemanticBlockChild[];
};

export type RowNode = {
  kind: "row";
  children: CellNode[];
};

export type TableNode = {
  kind: "table";
  id?: string;
  caption?: string;
  children: RowNode[];
};

export type BlockQuoteNode = {
  kind: "blockquote";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  speaker?: string;
  children: SemanticBlockChild[];
};

export type ListItemNode = {
  kind: "item";
  children: SemanticBlockChild[];
};

export type ListNode = {
  kind: "list";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  ordered: boolean;
  children: ListItemNode[];
};

export type DefNode = {
  kind: "def";
  term: string;
  children: SemanticBlockChild[];
};

export type DefsNode = {
  kind: "defs";
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  children: DefNode[];
};

export type SectionNode = {
  kind: "section";
  id?: string;
  title: string;
  role?: string;
  page?: string;
  variant?: string;
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
};

export type PageBreakNode = {
  kind: "page-break";
};

export type SetRunningNode = {
  kind: "set-running";
  name: string;
  value: string;
};

export type AbstractNode = {
  kind: "abstract";
  page?: string;
  variant?: string;
  children: SemanticBlockChild[];
};

export type DocumentNode = {
  kind: "document";
  title: string;
  author?: string;
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
  | RefNode;

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
  | PageBreakNode
  | SetRunningNode;

export type DocumentChild = AbstractNode | SemanticBlockChild;

export type SemanticNode =
  | DocumentNode
  | AbstractNode
  | SectionNode
  | ParagraphNode
  | FigureNode
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
  | TextNode;

export type SemanticContainerNode =
  | DocumentNode
  | AbstractNode
  | SectionNode
  | ParagraphNode
  | FigureNode
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
  | SupNode;
