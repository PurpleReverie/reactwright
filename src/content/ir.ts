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

export type ParagraphNode = {
  kind: "paragraph";
  role?: string;
  page?: string;
  variant?: string;
  children: InlineNode[];
};

export type CodeBlockNode = {
  kind: "code-block";
  language?: string;
  children: TextNode[];
};

export type FigureNode = {
  kind: "figure";
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
  caption?: string;
  children: RowNode[];
};

export type BlockQuoteNode = {
  kind: "blockquote";
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
  role?: string;
  page?: string;
  variant?: string;
  ordered: boolean;
  children: ListItemNode[];
};

export type SectionNode = {
  kind: "section";
  title: string;
  role?: string;
  page?: string;
  variant?: string;
  children: SemanticBlockChild[];
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

export type InlineNode = TextNode | EmNode | StrongNode | CodeNode | LinkNode;

export type SemanticBlockChild =
  | SectionNode
  | ParagraphNode
  | FigureNode
  | TableNode
  | BlockQuoteNode
  | ListNode
  | CodeBlockNode
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
  | PageBreakNode
  | SetRunningNode
  | EmNode
  | StrongNode
  | CodeNode
  | LinkNode
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
  | EmNode
  | StrongNode
  | CodeNode
  | LinkNode;
