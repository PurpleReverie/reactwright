import type {
  AbstractNode,
  BlockQuoteNode,
  CodeNode,
  CodeBlockNode,
  DocumentNode,
  DocumentChild,
  EmNode,
  FigureNode,
  FontNode,
  LinkNode,
  ListItemNode,
  ListNode,
  PageBreakNode,
  ParagraphNode,
  SectionNode,
  SemanticBlockChild,
  StrongNode,
  ThematicBreakNode,
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
  ResolvedChild,
  ResolvedCodeNode,
  ResolvedCodeBlockNode,
  ResolvedContentChild,
  ResolvedContentNode,
  ResolvedEmNode,
  ResolvedFigureNode,
  ResolvedFontNode,
  ResolvedInlineNode,
  ResolvedLinkNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedFixedNode,
  ResolvedPageNumberNode,
  ResolvedRowNode,
  ResolvedRepeatNode,
  ResolvedRuleNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedTemplateNode,
  ResolvedThematicBreakNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "./ir.js";

type SlotMap = Record<SlotName, ResolvedContentNode[]>;
type RuleMaps = {
  sectionRoles: Map<string, string>;
  quoteRoles: Map<string, string>;
  pageRoles: Map<string, string>;
};
type ResolveContext = {
  currentPageSet?: string;
  defaultPageSet?: string;
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

function resolveFontNode(node: FontNode): ResolvedFontNode {
  return {
    kind: "font",
    family: node.family,
    children: node.children.map(resolveInlineNode)
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

function resolveInlineNode(
  node: TextNode | EmNode | StrongNode | CodeNode | FontNode | LinkNode
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
    case "font":
      return resolveFontNode(node);
    case "link":
      return resolveLinkNode(node);
  }
}

function resolveParagraphNode(node: ParagraphNode): ResolvedParagraphNode {
  return {
    kind: "paragraph",
    ...(node.role != null ? { role: node.role } : {}),
    ...(node.page != null ? { page: node.page } : {}),
    ...(node.variant != null ? { variant: node.variant } : {}),
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

function resolveCodeBlockNode(node: CodeBlockNode): ResolvedCodeBlockNode {
  return {
    kind: "code-block",
    ...(node.language != null ? { language: node.language } : {}),
    children: node.children.map(resolveTextNode)
  };
}

function resolveThematicBreakNode(_node: ThematicBreakNode): ResolvedThematicBreakNode {
  return {
    kind: "thematic-break"
  };
}

function resolveBlockQuoteNode(node: BlockQuoteNode): ResolvedBlockQuoteNode {
  return {
    kind: "blockquote",
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
    ordered: node.ordered,
    children: node.children.map(resolveListItemNode)
  };
}

function resolveSectionNode(node: SectionNode): ResolvedSectionNode {
  return {
    kind: "section",
    title: node.title,
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
    case "blockquote":
      return resolveBlockQuoteNode(node);
    case "list":
      return resolveListNode(node);
    case "code-block":
      return resolveCodeBlockNode(node);
    case "thematic-break":
      return resolveThematicBreakNode(node);
    case "page-break":
      return resolvePageBreakNode(node);
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
      child.kind === "box" ||
      child.kind === "stack" ||
      child.kind === "row" ||
      child.kind === "repeat" ||
      child.kind === "fixed" ||
      child.kind === "custom" ||
      child.kind === "page-set"
    ) {
      collectRulesFromChildren(child.children, rules);
    }
  }
}

function applyRule(rule: RulesChild, rules: RuleMaps): void {
  switch (rule.kind) {
    case "section-role":
      if (rule.role.length > 0 && rule.variant.length > 0) {
        rules.sectionRoles.set(rule.role, rule.variant);
      }
      return;
    case "quote-role":
      if (rule.role.length > 0 && rule.variant.length > 0) {
        rules.quoteRoles.set(rule.role, rule.variant);
      }
      return;
    case "page-role":
      if (rule.page.length > 0 && rule.use.length > 0) {
        rules.pageRoles.set(rule.page, rule.use);
      }
      return;
  }
}

function buildRuleMaps(template: TemplateNode): RuleMaps {
  const rules: RuleMaps = {
    sectionRoles: new Map<string, string>(),
    quoteRoles: new Map<string, string>(),
    pageRoles: new Map<string, string>()
  };

  if (
    template.kind === "page" ||
    template.kind === "box" ||
    template.kind === "stack" ||
    template.kind === "row" ||
    template.kind === "repeat" ||
    template.kind === "fixed" ||
    template.kind === "custom" ||
    template.kind === "page-set"
  ) {
    collectRulesFromChildren(template.children, rules);
  }

  return rules;
}

function applyResolvedRules(node: ResolvedContentNode, rules: RuleMaps): ResolvedContentNode {
  switch (node.kind) {
    case "section":
      return {
        ...node,
        variant: node.role != null ? rules.sectionRoles.get(node.role) ?? node.variant : node.variant,
        children: node.children.map((child) => applyResolvedRules(child, rules))
      };
    case "blockquote":
      return {
        ...node,
        variant: node.role != null ? rules.quoteRoles.get(node.role) ?? node.variant : node.variant,
        children: node.children.map((child) => applyResolvedRules(child, rules))
      };
    case "abstract":
      return {
        ...node,
        children: node.children.map((child) => applyResolvedRules(child, rules))
      };
    case "list":
      return {
        ...node,
        children: node.children.map((child) => ({
          ...child,
          children: child.children.map((grandchild) => applyResolvedRules(grandchild, rules))
        }))
      };
    case "paragraph":
    case "figure":
    case "code-block":
    case "thematic-break":
    case "item":
    case "title":
    case "author":
    case "em":
    case "strong":
    case "code":
    case "font":
    case "link":
    case "text":
    case "page-break":
      return node;
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

function matchesPageSet(node: ResolvedContentNode, ctx: ResolveContext): boolean {
  if (ctx.currentPageSet == null) {
    return true;
  }

  const mappedPage =
    "page" in node && typeof node.page === "string" ? ctx.rules.pageRoles.get(node.page) ?? node.page : undefined;

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
    case "box":
    case "stack":
    case "row":
    case "repeat":
    case "fixed":
    case "custom":
      return [resolveTemplateNode(child, slots, ctx)];
    case "page-set":
      return child.children.flatMap((grandchild) =>
        resolveTemplateChild(grandchild, slots, {
          ...ctx,
          currentPageSet: child.name
        })
      );
    case "rules":
      return [];
    case "text":
      return [{ kind: "text", value: child.value }];
    case "rule":
      return [
        {
          kind: "rule",
          axis: child.axis,
          weight: child.weight,
          color: child.color,
          length: child.length,
          style: child.style
        } satisfies ResolvedRuleNode
      ];
    case "page-number":
      return [
        {
          kind: "page-number",
          style: child.style
        } satisfies ResolvedPageNumberNode
      ];
    case "section-role":
    case "quote-role":
    case "page-role":
      return [];
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
    case "box":
      return {
        kind: "box",
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      };
    case "stack":
      return {
        kind: "stack",
        gap: node.gap,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      };
    case "row":
      return {
        kind: "row",
        gap: node.gap,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedRowNode;
    case "repeat":
      return {
        kind: "repeat",
        anchor: node.anchor,
        when: node.when,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedRepeatNode;
    case "fixed":
      return {
        kind: "fixed",
        anchor: node.anchor,
        when: node.when,
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedFixedNode;
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
    case "rule":
    case "page-number":
    case "section-role":
    case "quote-role":
    case "page-role":
      throw new Error("Template control nodes should be resolved before returning a template node.");
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
    defaultPageSet: undefined
  });

  if (resolved.kind !== "page") {
    throw new Error("Resolver expected a `page` result.");
  }

  return resolved;
}
