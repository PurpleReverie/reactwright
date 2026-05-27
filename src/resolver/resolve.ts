import type {
  AbstractNode,
  BlockQuoteNode,
  BreakNode,
  CellNode,
  CodeBlockNode,
  CodeNode,
  DefNode,
  DefsNode,
  DocumentChild,
  DocumentNode,
  EmNode,
  FigureNode,
  HeadingNode,
  InlineImgNode,
  LinkNode,
  ListItemNode,
  ListNode,
  PageBreakNode,
  ParagraphNode,
  PreNode,
  RefNode,
  FootnoteNode,
  RowNode,
  SectionNode,
  SemanticBlockChild,
  SetRunningNode,
  StrongNode,
  SubNode,
  SupNode,
  TableNode,
  TextNode
} from "../content/ir.js";
import type {
  RulesChild,
  SlotName,
  TemplateChild,
  TemplateNode
} from "../template/ir.js";

import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedBreakNode,
  ResolvedCellNode,
  ResolvedChild,
  ResolvedCodeBlockNode,
  ResolvedCodeNode,
  ResolvedContentChild,
  ResolvedContentNode,
  ResolvedDefNode,
  ResolvedDefsNode,
  ResolvedHeadingNode,
  ResolvedEmNode,
  ResolvedFigureNode,
  ResolvedFixedNode,
  ResolvedFooterNode,
  ResolvedFootnoteAreaNode,
  ResolvedHeaderNode,
  ResolvedImageNode,
  ResolvedInlineImgNode,
  ResolvedInlineNode,
  ResolvedLayerNode,
  ResolvedLinkNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedPageCountNode,
  ResolvedPageNode,
  ResolvedPageNumberNode,
  ResolvedParagraphNode,
  ResolvedPreNode,
  ResolvedRefNode,
  ResolvedFootnoteNode,
  ResolvedRegionNode,
  ResolvedRowNode,
  ResolvedRunningNode,
  ResolvedSectionNode,
  ResolvedSetRunningNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedSubNode,
  ResolvedSupNode,
  ResolvedTableNode,
  ResolvedTemplateNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "./ir.js";

type SlotMap = Record<SlotName, ResolvedContentNode[]>;

type RoleRule = {
  match: string;
  apply: string;
  on?: string;
};

type RuleMaps = {
  roles: RoleRule[];
  pages: Map<string, string>;
};

type ResolveContext = {
  currentPageSet?: string;
  currentAnchors?: Record<string, { top?: string; right?: string; bottom?: string; left?: string; inside?: string; outside?: string }>;
  rules: RuleMaps;
};

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

function resolveLinkNode(node: LinkNode): ResolvedLinkNode {
  return {
    kind: "link",
    href: node.href,
    ...(node.title != null ? { title: node.title } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

function resolveBreakNode(_node: BreakNode): ResolvedBreakNode {
  return { kind: "br" };
}

function resolveSubNode(node: SubNode): ResolvedSubNode {
  return {
    kind: "sub",
    children: node.children.map(resolveInlineNode)
  };
}

function resolveSupNode(node: SupNode): ResolvedSupNode {
  return {
    kind: "sup",
    children: node.children.map(resolveInlineNode)
  };
}

function resolveInlineImgNode(node: InlineImgNode): ResolvedInlineImgNode {
  return {
    kind: "img",
    src: node.src,
    ...(node.alt != null ? { alt: node.alt } : {}),
    ...(node.width != null ? { width: node.width } : {}),
    ...(node.height != null ? { height: node.height } : {})
  };
}

function resolveRefNode(node: RefNode): ResolvedRefNode {
  return {
    kind: "ref",
    to: node.to,
    show: node.show ?? "number"
  };
}

function resolveFootnoteNode(node: FootnoteNode): ResolvedFootnoteNode {
  return {
    kind: "footnote",
    ...(node.marker != null ? { marker: node.marker } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

function resolveInlineNode(
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
): ResolvedInlineNode {
  switch (node.kind) {
    case "text":
      return resolveTextNode(node);
    case "em":
      return resolveEmNode(node);
    case "strong":
      return resolveStrongNode(node);
    case "code":
      return resolveCodeNode(node);
    case "link":
      return resolveLinkNode(node);
    case "br":
      return resolveBreakNode(node);
    case "sub":
      return resolveSubNode(node);
    case "sup":
      return resolveSupNode(node);
    case "img":
      return resolveInlineImgNode(node);
    case "ref":
      return resolveRefNode(node);
    case "footnote":
      return resolveFootnoteNode(node);
  }
}

function resolveParagraphNode(node: ParagraphNode): ResolvedParagraphNode {
  return {
    kind: "paragraph",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    children: node.children.map(resolveInlineNode)
  };
}

function resolveFigureNode(node: FigureNode): ResolvedFigureNode {
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

function resolveCellNode(node: CellNode): ResolvedCellNode {
  return {
    kind: "cell",
    ...(node.header === true ? { header: true } : {}),
    children: node.children.map(resolveContentChild)
  };
}

function resolveRowNode(node: RowNode): ResolvedRowNode {
  return {
    kind: "row",
    children: node.children.map(resolveCellNode)
  };
}

function resolveTableNode(node: TableNode): ResolvedTableNode {
  return {
    kind: "table",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.caption != null ? { caption: node.caption } : {}),
    children: node.children.map(resolveRowNode)
  };
}

function resolveCodeBlockNode(node: CodeBlockNode): ResolvedCodeBlockNode {
  return {
    kind: "code-block",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.language != null ? { language: node.language } : {}),
    children: node.children.map(resolveTextNode)
  };
}

function resolvePreNode(node: PreNode): ResolvedPreNode {
  return {
    kind: "pre",
    ...(node.id != null ? { id: node.id } : {}),
    children: node.children.map(resolveTextNode)
  };
}

function resolveDefNode(node: DefNode): ResolvedDefNode {
  return {
    kind: "def",
    term: node.term,
    children: node.children.map(resolveContentChild)
  };
}

function resolveHeadingNode(node: HeadingNode): ResolvedHeadingNode {
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

function resolveDefsNode(node: DefsNode): ResolvedDefsNode {
  return {
    kind: "defs",
    ...(node.id != null ? { id: node.id } : {}),
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
    children: node.children.map(resolveDefNode)
  };
}

function resolveBlockQuoteNode(node: BlockQuoteNode): ResolvedBlockQuoteNode {
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

function resolveListItemNode(node: ListItemNode): ResolvedListItemNode {
  return {
    kind: "item",
    children: node.children.map(resolveContentChild)
  };
}

function resolveListNode(node: ListNode): ResolvedListNode {
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

function resolveSectionNode(node: SectionNode): ResolvedSectionNode {
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

function resolvePageBreakNode(_node: PageBreakNode): ResolvedPageBreakNode {
  return {
    kind: "page-break"
  };
}

function resolveSetRunningNode(node: SetRunningNode): ResolvedSetRunningNode {
  return {
    kind: "set-running",
    name: node.name,
    value: node.value
  };
}

function resolveAbstractNode(node: AbstractNode): ResolvedAbstractNode {
  return {
    kind: "abstract",
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
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
    case "table":
      return resolveTableNode(node);
    case "blockquote":
      return resolveBlockQuoteNode(node);
    case "list":
      return resolveListNode(node);
    case "code-block":
      return resolveCodeBlockNode(node);
    case "pre":
      return resolvePreNode(node);
    case "defs":
      return resolveDefsNode(node);
    case "heading":
      return resolveHeadingNode(node);
    case "page-break":
      return resolvePageBreakNode(node);
    case "set-running":
      return resolveSetRunningNode(node);
  }
}

function collectRulesFromChildren(children: TemplateChild[], rules: RuleMaps): void {
  for (const child of children) {
    if (child.kind === "rules") {
      for (const rule of child.children) {
        applyRule(rule, rules);
      }
      continue;
    }

    if (
      child.kind === "page" ||
      child.kind === "page-set" ||
      child.kind === "region" ||
      child.kind === "stack" ||
      child.kind === "layer" ||
      child.kind === "fixed" ||
      child.kind === "header" ||
      child.kind === "footer" ||
      child.kind === "custom"
    ) {
      collectRulesFromChildren(child.children, rules);
    }
  }
}

function applyRule(rule: RulesChild, rules: RuleMaps): void {
  switch (rule.kind) {
    case "role-rule":
      if (rule.match.length > 0 && rule.apply.length > 0) {
        rules.roles.push({
          match: rule.match,
          apply: rule.apply,
          ...(rule.on != null ? { on: rule.on } : {})
        });
      }
      return;
    case "page-rule":
      if (rule.match.length > 0 && rule.use.length > 0) {
        rules.pages.set(rule.match, rule.use);
      }
      return;
  }
}

function buildRuleMaps(template: TemplateNode): RuleMaps {
  const rules: RuleMaps = {
    roles: [],
    pages: new Map<string, string>()
  };

  if (
    template.kind === "page" ||
    template.kind === "page-set" ||
    template.kind === "region" ||
    template.kind === "stack" ||
    template.kind === "layer" ||
    template.kind === "fixed" ||
    template.kind === "header" ||
    template.kind === "footer" ||
    template.kind === "custom"
  ) {
    collectRulesFromChildren(template.children, rules);
  }

  return rules;
}

const ROLE_ON_ELEMENT_KIND: Record<string, string> = {
  section: "section",
  paragraph: "paragraph",
  p: "paragraph",
  quote: "blockquote",
  blockquote: "blockquote",
  list: "list",
  defs: "defs",
  heading: "heading",
  figure: "figure"
};

function resolveFixedAnchor(
  anchor: unknown,
  ctx: ResolveContext
): string | { top?: string; right?: string; bottom?: string; left?: string } {
  if (typeof anchor === "string") {
    // Named anchor lookup in the current page-set's anchors map.
    const named = ctx.currentAnchors?.[anchor];
    if (named != null) {
      return normalizeCoordinate(named);
    }
    // Otherwise pass through; HTML backend treats unknown strings as built-in anchor names.
    return anchor;
  }
  if (anchor != null && typeof anchor === "object" && !Array.isArray(anchor)) {
    return normalizeCoordinate(anchor as Record<string, string>);
  }
  return "top-left";
}

function normalizeCoordinate(
  coord: Record<string, string | undefined>
): { top?: string; right?: string; bottom?: string; left?: string } {
  // Collapse inside/outside into left/right for now (two-sided handling lives in M9-followup).
  const result: { top?: string; right?: string; bottom?: string; left?: string } = {};
  if (coord.top != null) result.top = coord.top;
  if (coord.bottom != null) result.bottom = coord.bottom;
  if (coord.left != null) result.left = coord.left;
  if (coord.right != null) result.right = coord.right;
  if (coord.inside != null && result.left == null) result.left = coord.inside;
  if (coord.outside != null && result.right == null) result.right = coord.outside;
  return result;
}

function findMatchingRole(roleValue: string, elementKind: string, rules: RuleMaps): string | undefined {
  for (const rule of rules.roles) {
    if (rule.match !== roleValue) continue;
    if (rule.on == null) {
      return rule.apply;
    }
    const wantedKind = ROLE_ON_ELEMENT_KIND[rule.on] ?? rule.on;
    if (wantedKind === elementKind) {
      return rule.apply;
    }
  }
  return undefined;
}

function applyResolvedRules<T extends ResolvedContentNode>(node: T, rules: RuleMaps): T {
  switch (node.kind) {
    case "section":
      return {
        ...node,
        variant: node.role != null ? findMatchingRole(node.role, "section", rules) ?? node.variant : node.variant,
        children: node.children.map((child) => applyResolvedRules(child, rules))
      } as T;
    case "blockquote":
      return {
        ...node,
        variant:
          node.role != null ? findMatchingRole(node.role, "blockquote", rules) ?? node.variant : node.variant,
        children: node.children.map((child) => applyResolvedRules(child, rules))
      } as T;
    case "abstract":
      return {
        ...node,
        children: node.children.map((child) => applyResolvedRules(child, rules))
      } as T;
    case "list":
      return {
        ...node,
        variant: node.role != null ? findMatchingRole(node.role, "list", rules) ?? node.variant : node.variant,
        children: node.children.map((child) => ({
          ...child,
          children: child.children.map((grandchild) => applyResolvedRules(grandchild, rules))
        }))
      } as T;
    case "defs":
      return {
        ...node,
        variant:
          node.role != null ? findMatchingRole(node.role, "defs", rules) ?? node.variant : node.variant,
        children: node.children.map((child) => ({
          ...child,
          children: child.children.map((grandchild) => applyResolvedRules(grandchild, rules))
        }))
      } as T;
    case "table":
      return {
        ...node,
        children: node.children.map((row) => ({
          ...row,
          children: row.children.map((cell) => ({
            ...cell,
            children: cell.children.map((child) => applyResolvedRules(child, rules))
          }))
        }))
      } as T;
    case "paragraph":
      return {
        ...node,
        variant:
          node.role != null ? findMatchingRole(node.role, "paragraph", rules) ?? node.variant : node.variant
      } as T;
    case "figure":
      return {
        ...node,
        variant: node.role != null ? findMatchingRole(node.role, "figure", rules) ?? node.variant : node.variant
      } as T;
    case "heading":
      return {
        ...node,
        variant:
          node.role != null ? findMatchingRole(node.role, "heading", rules) ?? node.variant : node.variant
      } as T;
    case "row":
    case "cell":
    case "code-block":
    case "pre":
    case "def":
    case "item":
    case "title":
    case "author":
    case "em":
    case "strong":
    case "code":
    case "link":
    case "br":
    case "sub":
    case "sup":
    case "img":
    case "ref":
    case "footnote":
    case "text":
    case "page-break":
    case "set-running":
      return node;
  }
  return node;
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

function matchesPageSet(node: ResolvedContentNode, ctx: ResolveContext): boolean {
  if (ctx.currentPageSet == null) {
    return true;
  }

  const mappedPage =
    "page" in node && typeof node.page === "string" ? ctx.rules.pages.get(node.page) ?? node.page : undefined;

  return mappedPage === ctx.currentPageSet;
}

function resolveTemplateChild(child: TemplateChild, slots: SlotMap, ctx: ResolveContext): ResolvedChild[] {
  switch (child.kind) {
    case "slot":
      if (child.name !== "body") {
        return slots[child.name];
      }
      return slots[child.name].filter((node) => matchesPageSet(node, ctx));
    case "page":
    case "region":
    case "stack":
    case "layer":
    case "fixed":
    case "header":
    case "footer":
    case "custom":
      return [resolveTemplateNode(child, slots, ctx)];
    case "page-set":
      return child.children.flatMap((grandchild) =>
        resolveTemplateChild(grandchild, slots, {
          ...ctx,
          currentPageSet: child.name,
          ...(child.anchors != null ? { currentAnchors: child.anchors } : {})
        })
      );
    case "rules":
      return [];
    case "text":
      return [{ kind: "text", value: child.value }];
    case "page-number":
      return [
        {
          kind: "page-number",
          style: child.style
        } satisfies ResolvedPageNumberNode
      ];
    case "page-count":
      return [
        {
          kind: "page-count",
          style: child.style
        } satisfies ResolvedPageCountNode
      ];
    case "running":
      return [
        {
          kind: "running",
          name: child.name,
          ...(child.policy != null ? { policy: child.policy } : {}),
          style: child.style
        } satisfies ResolvedRunningNode
      ];
    case "image":
      return [
        {
          kind: "image",
          src: child.src,
          ...(child.alt != null ? { alt: child.alt } : {}),
          ...(child.fill === true ? { fill: true } : {}),
          ...(child.cover === true ? { cover: true } : {}),
          ...(child.contain === true ? { contain: true } : {}),
          ...(child.width != null ? { width: child.width } : {}),
          style: child.style
        } satisfies ResolvedImageNode
      ];
    case "footnote-area":
      return [
        {
          kind: "footnote-area",
          ...(child.separator === true ? { separator: true } : {}),
          style: child.style
        } satisfies ResolvedFootnoteAreaNode
      ];
  }
}

function resolveTemplateNode(node: TemplateNode, slots: SlotMap, ctx: ResolveContext): ResolvedTemplateNode {
  switch (node.kind) {
    case "page":
      return {
        kind: "page",
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      };
    case "region":
      return {
        kind: "region",
        style: node.style,
        ...(node.positioning != null ? { positioning: node.positioning } : {}),
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedRegionNode;
    case "layer":
      return {
        kind: "layer",
        ...(node.name != null ? { name: node.name } : {}),
        ...(node.when != null ? { when: node.when } : {}),
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedLayerNode;
    case "stack":
      return {
        kind: "stack",
        gap: node.gap,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedStackNode;
    case "fixed":
      return {
        kind: "fixed",
        anchor: resolveFixedAnchor(node.anchor, ctx),
        when: node.when,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedFixedNode;
    case "header":
      return {
        kind: "header",
        anchor: node.anchor,
        when: node.when,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedHeaderNode;
    case "footer":
      return {
        kind: "footer",
        anchor: node.anchor,
        when: node.when,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedFooterNode;
    case "custom":
      return {
        kind: "custom",
        name: node.name,
        props: node.props,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      };
    case "page-set":
    case "rules":
    case "page-number":
    case "page-count":
    case "running":
    case "image":
    case "footnote-area":
    case "role-rule":
    case "page-rule":
      throw new Error("Template control nodes should be resolved before returning a template node.");
    case "slot":
      throw new Error("Template slots should be resolved before returning a template node.");
    case "text":
      throw new Error("Top-level template text nodes are not supported.");
  }
}

export function resolveDocument(document: DocumentNode, template: TemplateNode): ResolvedPageNode {
  if (template.kind !== "page") {
    throw new Error("Resolver expected a `page` template root.");
  }

  const rules = buildRuleMaps(template);
  const rawSlots = buildSlotMap(document);
  const slots = {
    title: rawSlots.title.map((node) => applyResolvedRules(node, rules)) as ResolvedTitleNode[],
    author: rawSlots.author.map((node) => applyResolvedRules(node, rules)) as ResolvedAuthorNode[],
    abstract: rawSlots.abstract.map((node) => applyResolvedRules(node, rules)) as ResolvedAbstractNode[],
    body: rawSlots.body.map((node) => applyResolvedRules(node, rules))
  } satisfies SlotMap;
  const resolved = resolveTemplateNode(template, slots, {
    rules,
    currentPageSet: undefined,
    currentAnchors: undefined
  });

  if (resolved.kind !== "page") {
    throw new Error("Resolver expected a `page` result.");
  }

  return resolved;
}
