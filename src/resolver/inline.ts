import type {
  BibEntryContentNode,
  BreakNode,
  CiteNode,
  CodeNode,
  EmNode,
  FootnoteNode,
  IndexNode,
  InlineImgNode,
  InlineMathNode,
  LinkNode,
  MathNode,
  RefEntryNode,
  RefNode,
  RefsNode,
  SidenoteNode,
  StrongNode,
  SubNode,
  SupNode,
  TextNode
} from "../content/ir.js";
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
  ResolvedMathNode,
  ResolvedRefEntryNode,
  ResolvedRefNode,
  ResolvedRefsNode,
  ResolvedSidenoteNode,
  ResolvedStrongNode,
  ResolvedSubNode,
  ResolvedSupNode,
  ResolvedTextNode
} from "./ir.js";

export function resolveTextNode(node: TextNode): ResolvedTextNode {
  return { kind: "text", value: node.value };
}

export function resolveEmNode(node: EmNode): ResolvedEmNode {
  return {
    kind: "em",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveStrongNode(node: StrongNode): ResolvedStrongNode {
  return {
    kind: "strong",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveCodeNode(node: CodeNode): ResolvedCodeNode {
  return {
    kind: "code",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveTextNode)
  };
}

export function resolveLinkNode(node: LinkNode): ResolvedLinkNode {
  return {
    kind: "link",
    href: node.href,
    ...(node.title != null ? { title: node.title } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveBreakNode(_node: BreakNode): ResolvedBreakNode {
  return { kind: "br" };
}

export function resolveSubNode(node: SubNode): ResolvedSubNode {
  return {
    kind: "sub",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveSupNode(node: SupNode): ResolvedSupNode {
  return {
    kind: "sup",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveInlineImgNode(node: InlineImgNode): ResolvedInlineImgNode {
  return {
    kind: "img",
    src: node.src,
    ...(node.alt != null ? { alt: node.alt } : {}),
    ...(node.width != null ? { width: node.width } : {}),
    ...(node.height != null ? { height: node.height } : {}),
    ...(node.className != null ? { className: node.className } : {})
  };
}

export function resolveRefNode(node: RefNode): ResolvedRefNode {
  return {
    kind: "ref",
    to: node.to,
    show: node.show ?? "number",
    ...(node.className != null ? { className: node.className } : {})
  };
}

export function resolveFootnoteNode(node: FootnoteNode): ResolvedFootnoteNode {
  return {
    kind: "footnote",
    ...(node.marker != null ? { marker: node.marker } : {}),
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveMathNode(node: MathNode): ResolvedMathNode {
  return {
    kind: "math",
    src: node.src,
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    ...(node.className != null ? { className: node.className } : {})
  };
}

export function resolveInlineMathNode(node: InlineMathNode): ResolvedInlineMathNode {
  return {
    kind: "m",
    src: node.src,
    ...(node.className != null ? { className: node.className } : {})
  };
}

export function resolveCiteNode(node: CiteNode): ResolvedCiteNode {
  return {
    kind: "cite",
    cite: node.cite,
    ...(node.className != null ? { className: node.className } : {})
  };
}

export function resolveIndexNode(_node: IndexNode): ResolvedIndexEntryNode {
  return {
    kind: "index",
    term: _node.term,
    anchorId: "",
    ...(_node.className != null ? { className: _node.className } : {})
  };
}

export function resolveSidenoteNode(node: SidenoteNode): ResolvedSidenoteNode {
  return {
    kind: "sidenote",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

// Slice 6.3 (D1): pass-through resolver for the content-side
// `<bib-entry-content for="key" />` placeholder. The data-source
// `expandRenderProp` walks the resolved tree afterwards and
// splice-replaces this node with the resolved inline children of the
// matching `<ref-entry>`. If a renderer ever sees this node, the
// userland code put `<bib-entry-content>` outside a `<bib-data>`.
export function resolveBibEntryContentNode(
  node: BibEntryContentNode
): ResolvedBibEntryContentNode {
  return { kind: "bib-entry-content", refKey: node.refKey };
}

export function resolveRefEntryNode(node: RefEntryNode): ResolvedRefEntryNode {
  return {
    kind: "ref-entry",
    refKey: node.refKey,
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

export function resolveRefsNode(node: RefsNode): ResolvedRefsNode {
  return {
    kind: "refs",
    ...(node.className != null ? { className: node.className } : {}),
    children: node.children.map(resolveRefEntryNode)
  };
}

// Inline-node dispatcher. Used by every block resolver that has
// inline children.
export function resolveInlineNode(
  node:
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
    | BibEntryContentNode
): ResolvedInlineNode {
  switch (node.kind) {
    case "text":     return resolveTextNode(node);
    case "em":       return resolveEmNode(node);
    case "strong":   return resolveStrongNode(node);
    case "code":     return resolveCodeNode(node);
    case "link":     return resolveLinkNode(node);
    case "br":       return resolveBreakNode(node);
    case "sub":      return resolveSubNode(node);
    case "sup":      return resolveSupNode(node);
    case "img":      return resolveInlineImgNode(node);
    case "ref":      return resolveRefNode(node);
    case "footnote": return resolveFootnoteNode(node);
    case "m":        return resolveInlineMathNode(node);
    case "cite":     return resolveCiteNode(node);
    case "index":    return resolveIndexNode(node);
    case "sidenote": return resolveSidenoteNode(node);
    case "bib-entry-content": return resolveBibEntryContentNode(node);
  }
}
