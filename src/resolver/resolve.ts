import type {
  AbstractNode,
  BlockQuoteNode,
  CodeNode,
  DocumentNode,
  DocumentChild,
  EmNode,
  FigureNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  SectionNode,
  SemanticBlockChild,
  StrongNode,
  TextNode
} from "../content/ir.js";
import type { SlotName, TemplateChild, TemplateNode } from "../template/ir.js";

import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedChild,
  ResolvedCodeNode,
  ResolvedContentChild,
  ResolvedContentNode,
  ResolvedEmNode,
  ResolvedFigureNode,
  ResolvedInlineNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedTemplateNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "./ir.js";

type SlotMap = Record<SlotName, ResolvedContentNode[]>;

function resolveTextNode(node: TextNode): ResolvedTextNode {
  return {
    kind: "text",
    value: node.value
  };
}

function resolveEmNode(node: EmNode): ResolvedEmNode {
  return {
    kind: "em",
    children: node.children.map(resolveInlineNode)
  };
}

function resolveStrongNode(node: StrongNode): ResolvedStrongNode {
  return {
    kind: "strong",
    children: node.children.map(resolveInlineNode)
  };
}

function resolveCodeNode(node: CodeNode): ResolvedCodeNode {
  return {
    kind: "code",
    children: node.children.map(resolveTextNode)
  };
}

function resolveInlineNode(node: TextNode | EmNode | StrongNode | CodeNode): ResolvedInlineNode {
  switch (node.kind) {
    case "text":
      return resolveTextNode(node);
    case "em":
      return resolveEmNode(node);
    case "strong":
      return resolveStrongNode(node);
    case "code":
      return resolveCodeNode(node);
  }
}

function resolveParagraphNode(node: ParagraphNode): ResolvedParagraphNode {
  return {
    kind: "paragraph",
    children: node.children.map(resolveInlineNode)
  };
}

function resolveFigureNode(node: FigureNode): ResolvedFigureNode {
  return {
    kind: "figure",
    src: node.src,
    alt: node.alt,
    caption: node.caption,
    width: node.width
  };
}

function resolveBlockQuoteNode(node: BlockQuoteNode): ResolvedBlockQuoteNode {
  return {
    kind: "blockquote",
    children: node.children.map(resolveContentChild)
  };
}

function resolveListItemNode(node: ListItemNode): ResolvedListItemNode {
  return {
    kind: "item",
    children: node.children.map(resolveContentChild)
  };
}

function resolveListNode(node: ListNode): ResolvedListNode {
  return {
    kind: "list",
    ordered: node.ordered,
    children: node.children.map(resolveListItemNode)
  };
}

function resolveSectionNode(node: SectionNode): ResolvedSectionNode {
  return {
    kind: "section",
    title: node.title,
    children: node.children.map(resolveContentChild)
  };
}

function resolveAbstractNode(node: AbstractNode): ResolvedAbstractNode {
  return {
    kind: "abstract",
    children: node.children.map(resolveContentChild)
  };
}

function resolveContentChild(node: SemanticBlockChild): ResolvedContentChild {
  switch (node.kind) {
    case "section":
      return resolveSectionNode(node);
    case "paragraph":
      return resolveParagraphNode(node);
    case "figure":
      return resolveFigureNode(node);
    case "blockquote":
      return resolveBlockQuoteNode(node);
    case "list":
      return resolveListNode(node);
  }
}

function buildSlotMap(document: DocumentNode): SlotMap {
  const title: ResolvedTitleNode[] = [
    {
      kind: "title",
      value: document.title
    }
  ];

  const author: ResolvedAuthorNode[] =
    typeof document.author === "string"
      ? [
          {
            kind: "author",
            value: document.author
          }
        ]
      : [];

  const abstract = document.children
    .filter((child): child is AbstractNode => child.kind === "abstract")
    .map(resolveAbstractNode);

  const body = document.children
    .filter((child): child is Exclude<DocumentChild, AbstractNode> => child.kind !== "abstract")
    .map(resolveContentChild);

  return {
    title,
    author,
    abstract,
    body
  };
}

function resolveTemplateChild(child: TemplateChild, slots: SlotMap): ResolvedChild[] {
  switch (child.kind) {
    case "slot":
      return slots[child.name];
    case "page":
    case "box":
    case "stack":
    case "custom":
      return [resolveTemplateNode(child, slots)];
    case "text":
      return [{ kind: "text", value: child.value }];
  }
}

function resolveTemplateNode(node: TemplateNode, slots: SlotMap): ResolvedTemplateNode {
  switch (node.kind) {
    case "page":
      return {
        kind: "page",
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots))
      };
    case "box":
      return {
        kind: "box",
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots))
      };
    case "stack":
      return {
        kind: "stack",
        gap: node.gap,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots))
      };
    case "custom":
      return {
        kind: "custom",
        name: node.name,
        props: node.props,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots))
      };
    case "slot":
      throw new Error("Template slots should be resolved before returning a template node.");
    case "text":
      throw new Error("Top-level template text nodes are not supported in v0.");
  }
}

export function resolveDocument(document: DocumentNode, template: TemplateNode): ResolvedPageNode {
  if (template.kind !== "page") {
    throw new Error("Resolver expected a `page` template root.");
  }

  const slots = buildSlotMap(document);
  const resolved = resolveTemplateNode(template, slots);

  if (resolved.kind !== "page") {
    throw new Error("Resolver expected a `page` result.");
  }

  return resolved;
}
