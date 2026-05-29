import type {
  AbstractNode,
  BlockQuoteNode,
  CellNode,
  CodeBlockNode,
  DefNode,
  DefsNode,
  FigureNode,
  HeadingNode,
  ListItemNode,
  ListNode,
  PageBreakNode,
  ParagraphNode,
  PreNode,
  RowNode,
  SectionNode,
  SemanticBlockChild,
  SetRunningNode,
  TableNode
} from "../content/ir.js";
import type {
  ResolvedAbstractNode,
  ResolvedBlockQuoteNode,
  ResolvedCellNode,
  ResolvedCodeBlockNode,
  ResolvedContentChild,
  ResolvedDefNode,
  ResolvedDefsNode,
  ResolvedFigureNode,
  ResolvedHeadingNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedParagraphNode,
  ResolvedPreNode,
  ResolvedRowNode,
  ResolvedSectionNode,
  ResolvedSetRunningNode,
  ResolvedTableNode
} from "./ir.js";
import {
  resolveInlineNode,
  resolveMathNode,
  resolveRefsNode,
  resolveTextNode
} from "./inline.js";

export function resolveParagraphNode(node: ParagraphNode): ResolvedParagraphNode {
  return {
    kind: "paragraph",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveFigureNode(node: FigureNode): ResolvedFigureNode {
  return {
    kind: "figure",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    src: node.src,
    alt: node.alt,
    caption: node.caption,
    width: node.width
  };
}

export function resolveCellNode(node: CellNode): ResolvedCellNode {
  return {
    kind: "cell",
    ...(node.header === true ? { header: true } : {}),
    children: node.children.map(resolveContentChild)
  };
}

export function resolveRowNode(node: RowNode): ResolvedRowNode {
  return { kind: "row", children: node.children.map(resolveCellNode) };
}

export function resolveTableNode(node: TableNode): ResolvedTableNode {
  return {
    kind: "table",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.caption != null ? { caption: node.caption } : {}),
    children: node.children.map(resolveRowNode)
  };
}

export function resolveCodeBlockNode(node: CodeBlockNode): ResolvedCodeBlockNode {
  return {
    kind: "code-block",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.language != null ? { language: node.language } : {}),
    children: node.children.map(resolveTextNode)
  };
}

export function resolvePreNode(node: PreNode): ResolvedPreNode {
  return {
    kind: "pre",
    ...(node.id != null ? { id: node.id } : {}),
    children: node.children.map(resolveTextNode)
  };
}

export function resolveDefNode(node: DefNode): ResolvedDefNode {
  return {
    kind: "def",
    term: node.term,
    children: node.children.map(resolveContentChild)
  };
}

export function resolveHeadingNode(node: HeadingNode): ResolvedHeadingNode {
  return {
    kind: "heading",
    level: node.level,
    title: node.title,
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {})
  };
}

export function resolveDefsNode(node: DefsNode): ResolvedDefsNode {
  return {
    kind: "defs",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    children: node.children.map(resolveDefNode)
  };
}

export function resolveBlockQuoteNode(node: BlockQuoteNode): ResolvedBlockQuoteNode {
  return {
    kind: "blockquote",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.speaker != null ? { speaker: node.speaker } : {}),
    children: node.children.map(resolveContentChild)
  };
}

export function resolveListItemNode(node: ListItemNode): ResolvedListItemNode {
  return { kind: "item", children: node.children.map(resolveContentChild) };
}

export function resolveListNode(node: ListNode): ResolvedListNode {
  return {
    kind: "list",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ordered: node.ordered,
    children: node.children.map(resolveListItemNode)
  };
}

export function resolveSectionNode(node: SectionNode): ResolvedSectionNode {
  return {
    kind: "section",
    title: node.title,
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    children: node.children.map(resolveContentChild)
  };
}

export function resolvePageBreakNode(_node: PageBreakNode): ResolvedPageBreakNode {
  return { kind: "page-break" };
}

export function resolveSetRunningNode(node: SetRunningNode): ResolvedSetRunningNode {
  return { kind: "set-running", name: node.name, value: node.value };
}

export function resolveAbstractNode(node: AbstractNode): ResolvedAbstractNode {
  return {
    kind: "abstract",
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    children: node.children.map(resolveContentChild)
  };
}

// Block-content dispatcher. Each case routes to its per-kind resolver.
export function resolveContentChild(node: SemanticBlockChild): ResolvedContentChild {
  switch (node.kind) {
    case "section":     return resolveSectionNode(node);
    case "paragraph":   return resolveParagraphNode(node);
    case "figure":      return resolveFigureNode(node);
    case "table":       return resolveTableNode(node);
    case "blockquote":  return resolveBlockQuoteNode(node);
    case "list":        return resolveListNode(node);
    case "code-block":  return resolveCodeBlockNode(node);
    case "pre":         return resolvePreNode(node);
    case "defs":        return resolveDefsNode(node);
    case "heading":     return resolveHeadingNode(node);
    case "math":        return resolveMathNode(node);
    case "refs":        return resolveRefsNode(node);
    case "page-break":  return resolvePageBreakNode(node);
    case "set-running": return resolveSetRunningNode(node);
  }
}
