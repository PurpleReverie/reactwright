export type TextNode = {
  kind: "text";
  value: string;
};

export type ParagraphNode = {
  kind: "paragraph";
  children: TextNode[];
};

export type SectionNode = {
  kind: "section";
  title: string;
  children: SemanticChild[];
};

export type AbstractNode = {
  kind: "abstract";
  children: SemanticChild[];
};

export type DocumentNode = {
  kind: "document";
  title: string;
  author?: string;
  children: SemanticChild[];
};

export type SemanticNode = DocumentNode | AbstractNode | SectionNode | ParagraphNode | TextNode;

export type SemanticContainerNode = DocumentNode | AbstractNode | SectionNode | ParagraphNode;

export type SemanticChild = AbstractNode | SectionNode | ParagraphNode | TextNode;
