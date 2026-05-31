import type {
  AbstractNode,
  BlockQuoteNode,
  CaptionNode,
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
  ResolvedCaptionNode,
  ResolvedCellNode,
  ResolvedCodeBlockNode,
  ResolvedContentChild,
  ResolvedDefNode,
  ResolvedDefsNode,
  ResolvedFigureImageNode,
  ResolvedFigureNode,
  ResolvedHeadingNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedParagraphNode,
  ResolvedPreNode,
  ResolvedRowNode,
  ResolvedSectionHeadingNode,
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
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveFigureNode(node: FigureNode): ResolvedFigureNode {
  // Slice 5.2: synthesize a `figure-image` child when `src` is set so
  // `<rule match={{kind:"figure-image"}}>` has something to bind to.
  // The legacy `src`/`alt`/`width` fields stay populated for back-compat;
  // the renderer prefers the synthesized child when present, falling
  // back to the inline emit otherwise.
  const resolvedCaption =
    node.captionNode != null ? resolveCaptionNode(node.captionNode) : undefined;
  const children: Array<ResolvedFigureImageNode | ResolvedCaptionNode> = [];
  if (node.src != null && node.src.length > 0) {
    const image: ResolvedFigureImageNode = {
      kind: "figure-image",
      src: node.src,
      ...(node.alt != null ? { alt: node.alt } : {}),
      ...(node.width != null ? { width: node.width } : {})
    };
    children.push(image);
  }
  if (resolvedCaption != null) {
    children.push(resolvedCaption);
  }
  return {
    kind: "figure",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    src: node.src,
    alt: node.alt,
    caption: node.caption,
    ...(resolvedCaption != null ? { captionNode: resolvedCaption } : {}),
    width: node.width,
    children
  };
}

export function resolveCaptionNode(node: CaptionNode): ResolvedCaptionNode {
  return {
    kind: "caption",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveCellNode(node: CellNode): ResolvedCellNode {
  return {
    kind: "cell",
    ...(node.header === true ? { header: true } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveContentChild)
  };
}

export function resolveRowNode(node: RowNode): ResolvedRowNode {
  return {
    kind: "row",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveCellNode)
  };
}

export function resolveTableNode(node: TableNode): ResolvedTableNode {
  return {
    kind: "table",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    ...(node.caption != null ? { caption: node.caption } : {}),
    ...(node.captionNode != null ? { captionNode: resolveCaptionNode(node.captionNode) } : {}),
    children: node.children.map(resolveRowNode)
  };
}

export function resolveCodeBlockNode(node: CodeBlockNode): ResolvedCodeBlockNode {
  return {
    kind: "code-block",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.language != null ? { language: node.language } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveTextNode)
  };
}

export function resolvePreNode(node: PreNode): ResolvedPreNode {
  return {
    kind: "pre",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveTextNode)
  };
}

export function resolveDefNode(node: DefNode): ResolvedDefNode {
  return {
    kind: "def",
    term: node.term,
    ...(node.className != null ? { className: node.className } : {}),
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
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.className != null ? { className: node.className } : {})
  };
}

export function resolveDefsNode(node: DefsNode): ResolvedDefsNode {
  return {
    kind: "defs",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.className != null ? { className: node.className } : {}),
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
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveContentChild)
  };
}

export function resolveListItemNode(node: ListItemNode): ResolvedListItemNode {
  return {
    kind: "item",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveContentChild)
  };
}

export function resolveListNode(node: ListNode): ResolvedListNode {
  return {
    kind: "list",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    ordered: node.ordered,
    children: node.children.map(resolveListItemNode)
  };
}

export function resolveSectionNode(node: SectionNode, depth = 1): ResolvedSectionNode {
  // Synthesize a section-heading child (slice 5.1) so `<rule
  // match={{kind:"section-heading"}}>` has something to bind to. The
  // legacy `title` field stays populated for back-compat — the renderer
  // prefers the synthesized child when present, and falls back to the
  // inline title emit otherwise.
  const resolvedChildren: ResolvedContentChild[] = [];
  if (node.title.length > 0) {
    const heading: ResolvedSectionHeadingNode = {
      kind: "section-heading",
      text: node.title,
      depth
    };
    resolvedChildren.push(heading);
  }
  for (const child of node.children) {
    if (child.kind === "section") {
      resolvedChildren.push(resolveSectionNode(child, depth + 1));
    } else {
      resolvedChildren.push(resolveContentChild(child));
    }
  }
  return {
    kind: "section",
    title: node.title,
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    ...(node.counter != null ? { counter: node.counter } : {}),
    children: resolvedChildren
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
    ...(node.className != null ? { className: node.className } : {}),
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
