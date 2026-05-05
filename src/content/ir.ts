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

export type FontNode = {
  kind: "font";
  family: string;
  children: InlineNode[];
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

export type ThematicBreakNode = {
  kind: "thematic-break";
};

export type FigureNode = {
  kind: "figure";
  src: string;
  alt?: string;
  caption?: string;
  width?: string;
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

export type InlineNode = TextNode | EmNode | StrongNode | CodeNode | FontNode | LinkNode;

export type SemanticBlockChild =
  | SectionNode
  | ParagraphNode
  | FigureNode
  | BlockQuoteNode
  | ListNode
  | CodeBlockNode
  | ThematicBreakNode
  | PageBreakNode;

export type DocumentChild = AbstractNode | SemanticBlockChild;

export type SemanticNode =
  | DocumentNode
  | AbstractNode
  | SectionNode
  | ParagraphNode
  | FigureNode
  | BlockQuoteNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | ThematicBreakNode
  | PageBreakNode
  | EmNode
  | StrongNode
  | CodeNode
  | FontNode
  | LinkNode
  | TextNode;

export type SemanticContainerNode =
  | DocumentNode
  | AbstractNode
  | SectionNode
  | ParagraphNode
  | FigureNode
  | BlockQuoteNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | ThematicBreakNode
  | EmNode
  | StrongNode
  | CodeNode
  | LinkNode
  | FontNode;
