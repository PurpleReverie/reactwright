import type {
  AbstractNode,
  DocumentNode,
  ParagraphNode,
  SectionNode,
  SemanticChild,
  TextNode
} from "../content/ir.js";
import type { SlotName, TemplateChild, TemplateNode } from "../template/ir.js";

import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedChild,
  ResolvedContentChild,
  ResolvedContentNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedSectionNode,
  ResolvedStackNode,
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

function resolveParagraphNode(node: ParagraphNode): ResolvedParagraphNode {
  return {
    kind: "paragraph",
    children: node.children.map(resolveTextNode)
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

function resolveContentChild(node: SemanticChild): ResolvedContentChild {
  switch (node.kind) {
    case "section":
      return resolveSectionNode(node);
    case "paragraph":
      return resolveParagraphNode(node);
    case "text":
      return resolveTextNode(node);
    case "abstract":
      throw new Error("`abstract` is not allowed as a nested body child in v0.");
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
    .filter((child): child is Exclude<SemanticChild, AbstractNode> => child.kind !== "abstract")
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
