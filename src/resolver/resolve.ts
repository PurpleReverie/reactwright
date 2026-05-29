import { resolveFixedAnchor } from "./anchors.js";
import {
  resolveAbstractNode,
  resolveContentChild
} from "./block.js";
import type {
  AbstractNode,
  BlockQuoteNode,
  BreakNode,
  CellNode,
  CiteNode,
  CodeBlockNode,
  CodeNode,
  DefNode,
  DefsNode,
  DocumentChild,
  DocumentNode,
  EmNode,
  FigureNode,
  HeadingNode,
  IndexNode,
  InlineImgNode,
  InlineMathNode,
  MathNode,
  LinkNode,
  ListItemNode,
  ListNode,
  PageBreakNode,
  ParagraphNode,
  PreNode,
  RefEntryNode,
  RefNode,
  RefsNode,
  FootnoteNode,
  RowNode,
  SidenoteNode,
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
  TemplateNode,
  TemplateStyle
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
  ResolvedBibliographyEntry,
  ResolvedBibliographyNode,
  ResolvedCiteNode,
  ResolvedColumnNode,
  ResolvedColumnsNode,
  ResolvedIndexEntry,
  ResolvedIndexEntryNode,
  ResolvedIndexTemplateNode,
  ResolvedRefEntryNode,
  ResolvedRefsNode,
  ResolvedSidenoteAreaNode,
  ResolvedSidenoteNode,
  ResolvedTocEntry,
  ResolvedTocNode,
  ResolvedListOfEntry,
  ResolvedListOfNode,
  ResolvedFontNode,
  ResolvedPageRegime,
  ResolvedFixedNode,
  ResolvedFooterNode,
  ResolvedFootnoteAreaNode,
  ResolvedHeaderNode,
  ResolvedImageNode,
  ResolvedInlineImgNode,
  ResolvedInlineMathNode,
  ResolvedInlineNode,
  ResolvedMathNode,
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
  breakBefore?: string;
  breakAfter?: string;
  breakInside?: string;
  numbering?: { counter: string; scope?: string; format?: string };
  dropCap?: { lines?: number; font?: string; position?: string };
  style?: Record<string, unknown>;
};

type RuleMaps = {
  roles: RoleRule[];
  pages: Map<string, string>;
};

type ResolveContext = {
  currentPageSet?: string;
  // When true, body-slot expansion yields a placeholder marker instead of
  // the actual body content. Set while resolving children inside a
  // <page-set>, so the resolved subtree becomes a regime template that
  // the renderer instantiates per-section.
  inPageSetBody?: boolean;
  currentAnchors?: Record<string, { top?: string; right?: string; bottom?: string; left?: string; inside?: string; outside?: string }>;
  rules: RuleMaps;
  citeKeys: Set<string>;
  indexEntries: Map<string, string[]>;
  tocEntries: ResolvedTocEntry[];
  listOf: {
    figure: ResolvedListOfEntry[];
    table: ResolvedListOfEntry[];
    equation: ResolvedListOfEntry[];
  };
  pageRegimes: ResolvedPageRegime[];
  regimeFlows: Map<string, ResolvedChild[]>;
  // Shared mutable flag — flipped to true when a top-level <slot name="body">
  // expands inline. If still false at the end of page resolution but
  // page-sets supplied regime flows, the resolver auto-emits a body-stream
  // marker so authors can wire content by placing the body slot inside the
  // page-set alone.
  bodyState: { consumed: boolean };
  refEntries: Map<string, ResolvedInlineNode[]>;
};

function collectCiteKeysFromNode(node: ResolvedContentNode | ResolvedInlineNode, keys: Set<string>): void {
  if ("kind" in node && node.kind === "cite") {
    keys.add(node.cite);
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectCiteKeysFromNode(child as ResolvedContentNode, keys);
    }
  }
}

function collectCiteKeysFromSlotMap(slots: SlotMap, keys: Set<string>): void {
  for (const list of [slots.title, slots.author, slots.abstract, slots.body]) {
    for (const node of list) {
      collectCiteKeysFromNode(node, keys);
    }
  }
}

function termToSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stampIndexAnchorsAndCollect(
  node: ResolvedContentNode | ResolvedInlineNode,
  counts: Map<string, number>,
  indexEntries: Map<string, string[]>
): void {
  if ("kind" in node && node.kind === "index") {
    const slug = termToSlug(node.term);
    const n = (counts.get(slug) ?? 0) + 1;
    counts.set(slug, n);
    const anchorId = `reactdoc-idx-${slug}-${n}`;
    node.anchorId = anchorId;
    const list = indexEntries.get(node.term) ?? [];
    list.push(anchorId);
    indexEntries.set(node.term, list);
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      stampIndexAnchorsAndCollect(child as ResolvedContentNode, counts, indexEntries);
    }
  }
}

function stampIndexAnchorsInSlotMap(slots: SlotMap, indexEntries: Map<string, string[]>): void {
  const counts = new Map<string, number>();
  for (const list of [slots.title, slots.author, slots.abstract, slots.body]) {
    for (const node of list) {
      stampIndexAnchorsAndCollect(node, counts, indexEntries);
    }
  }
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stampSectionIdsAndCollectToc(
  node: ResolvedContentNode,
  depth: number,
  used: Set<string>,
  entries: ResolvedTocEntry[]
): void {
  if (node.kind === "section") {
    let id = node.id;
    if (id == null || id.length === 0) {
      const base = titleToSlug(node.title) || "section";
      let candidate = `reactdoc-sec-${base}`;
      let n = 1;
      while (used.has(candidate)) {
        n += 1;
        candidate = `reactdoc-sec-${base}-${n}`;
      }
      id = candidate;
      node.id = id;
    }
    used.add(id);
    entries.push({ id, title: node.title, depth });
    for (const child of node.children) {
      stampSectionIdsAndCollectToc(child as ResolvedContentNode, depth + 1, used, entries);
    }
    return;
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      stampSectionIdsAndCollectToc(child as ResolvedContentNode, depth, used, entries);
    }
  }
}

function stampSectionIdsInSlotMap(slots: SlotMap, entries: ResolvedTocEntry[]): void {
  const used = new Set<string>();
  for (const list of [slots.abstract, slots.body]) {
    for (const node of list) {
      stampSectionIdsAndCollectToc(node, 1, used, entries);
    }
  }
}

function stampListOfAndCollect(
  node: ResolvedContentNode,
  counts: { figure: number; table: number; equation: number },
  used: Set<string>,
  buckets: { figure: ResolvedListOfEntry[]; table: ResolvedListOfEntry[]; equation: ResolvedListOfEntry[] }
): void {
  if (node.kind === "figure") {
    counts.figure += 1;
    let id = node.id;
    if (id == null || id.length === 0) {
      let candidate = `reactdoc-fig-${counts.figure}`;
      while (used.has(candidate)) candidate += "-x";
      id = candidate;
      node.id = id;
    }
    used.add(id);
    buckets.figure.push({ id, caption: node.caption ?? `Figure ${counts.figure}` });
  } else if (node.kind === "table") {
    counts.table += 1;
    let id = node.id;
    if (id == null || id.length === 0) {
      let candidate = `reactdoc-tbl-${counts.table}`;
      while (used.has(candidate)) candidate += "-x";
      id = candidate;
      node.id = id;
    }
    used.add(id);
    buckets.table.push({ id, caption: node.caption ?? `Table ${counts.table}` });
  } else if (node.kind === "math") {
    counts.equation += 1;
    let id = node.id;
    if (id == null || id.length === 0) {
      let candidate = `reactdoc-eq-${counts.equation}`;
      while (used.has(candidate)) candidate += "-x";
      id = candidate;
      node.id = id;
    }
    used.add(id);
    buckets.equation.push({ id, caption: `Equation ${counts.equation}` });
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      stampListOfAndCollect(child as ResolvedContentNode, counts, used, buckets);
    }
  }
}

function collectRefEntriesFromNode(
  node: ResolvedContentNode | ResolvedInlineNode,
  out: Map<string, ResolvedInlineNode[]>
): void {
  if ("kind" in node && (node as { kind: string }).kind === "ref-entry") {
    const entry = node as unknown as { refKey: string; children: ResolvedInlineNode[] };
    if (!out.has(entry.refKey)) out.set(entry.refKey, entry.children);
  }
  if ("children" in node && Array.isArray((node as { children: unknown[] }).children)) {
    for (const c of (node as { children: ResolvedContentNode[] }).children) {
      collectRefEntriesFromNode(c, out);
    }
  }
}

function collectRefEntriesFromSlotMap(
  slots: SlotMap,
  out: Map<string, ResolvedInlineNode[]>
): void {
  for (const list of [slots.title, slots.author, slots.abstract, slots.body]) {
    for (const node of list) {
      collectRefEntriesFromNode(node, out);
    }
  }
}

function stampListOfInSlotMap(
  slots: SlotMap,
  buckets: { figure: ResolvedListOfEntry[]; table: ResolvedListOfEntry[]; equation: ResolvedListOfEntry[] }
): void {
  const counts = { figure: 0, table: 0, equation: 0 };
  const used = new Set<string>();
  for (const list of [slots.abstract, slots.body]) {
    for (const node of list) {
      stampListOfAndCollect(node, counts, used, buckets);
    }
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
      child.kind === "columns" ||
      child.kind === "column" ||
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
          ...(rule.on != null ? { on: rule.on } : {}),
          ...(rule.breakBefore != null ? { breakBefore: rule.breakBefore } : {}),
          ...(rule.breakAfter != null ? { breakAfter: rule.breakAfter } : {}),
          ...(rule.breakInside != null ? { breakInside: rule.breakInside } : {}),
          ...(rule.numbering != null ? { numbering: rule.numbering } : {}),
          ...(rule.dropCap != null ? { dropCap: rule.dropCap } : {}),
          ...(rule.style != null ? { style: rule.style } : {})
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
    template.kind === "columns" ||
    template.kind === "column" ||
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
  math: "math",
  figure: "figure"
};

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
    case "math":
      return {
        ...node,
        variant:
          node.role != null ? findMatchingRole(node.role, "math", rules) ?? node.variant : node.variant
      } as T;
    case "row":
    case "cell":
    case "code-block":
    case "pre":
    case "def":
    case "refs":
    case "ref-entry":
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
    case "m":
    case "cite":
    case "index":
    case "sidenote":
    case "refs":
    case "ref-entry":
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

function resolveTemplateChild(child: TemplateChild, slots: SlotMap, ctx: ResolveContext): ResolvedChild[] {
  switch (child.kind) {
    case "slot":
      if (child.name !== "body") {
        return slots[child.name];
      }
      // Inside a page-set, the body slot is a marker — the renderer fills
      // it per-section as each section routes to its regime. At the page
      // level, the body slot expands to all body content in document order.
      if (ctx.inPageSetBody === true) {
        return [{ kind: "body-slot" }];
      }
      ctx.bodyState.consumed = true;
      return slots[child.name];
    case "page":
    case "region":
    case "stack":
    case "columns":
    case "column":
    case "layer":
    case "fixed":
    case "header":
    case "footer":
    case "custom":
      return [resolveTemplateNode(child, slots, ctx)];
    case "page-set": {
      // Record the page-set as a regime so the HTML emitter can produce an
      // @page <name> rule with the page-set's geometry/style.
      if (!ctx.pageRegimes.some((r) => r.name === child.name)) {
        ctx.pageRegimes.push({
          name: child.name,
          ...(child.style != null ? { style: child.style } : {})
        });
      }
      // A page-set is a purely declarative regime template:
      //   - chrome (header/footer/layer) is hoisted to the page's flow as
      //     direct siblings, tagged with `regime: <name>` so the renderer
      //     emits per-regime margin-box + background-layer CSS.
      //   - the remaining flow tree (region/stack/columns/slot/...) is the
      //     regime's body template. The renderer wraps each section with
      //     page="<name>" in this template (replacing body-slot markers
      //     with the section's content). Sections still stream in document
      //     order — the regime only controls per-section layout, never
      //     content grouping.
      const setChildren = child.children.flatMap((grandchild) =>
        resolveTemplateChild(grandchild, slots, {
          ...ctx,
          currentPageSet: child.name,
          inPageSetBody: true,
          ...(child.anchors != null ? { currentAnchors: child.anchors } : {})
        })
      );
      const chrome: ResolvedChild[] = [];
      const bodyFlow: ResolvedChild[] = [];
      for (const c of setChildren) {
        if (c.kind === "header" || c.kind === "footer" || c.kind === "layer") {
          chrome.push(c);
        } else {
          bodyFlow.push(c);
        }
      }
      if (bodyFlow.length > 0 || !ctx.regimeFlows.has(child.name)) {
        ctx.regimeFlows.set(child.name, bodyFlow);
      }
      return chrome;
    }
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
    case "sidenote-area":
      return [
        {
          kind: "sidenote-area",
          ...(child.side != null ? { side: child.side } : {}),
          ...(child.width != null ? { width: child.width } : {}),
          ...(child.gap != null ? { gap: child.gap } : {}),
          style: child.style
        } satisfies ResolvedSidenoteAreaNode
      ];
    case "font":
      return [
        {
          kind: "font",
          family: child.family,
          src: child.src,
          ...(child.weight != null ? { weight: child.weight } : {}),
          ...(child.fontStyle != null ? { fontStyle: child.fontStyle } : {}),
          ...(child.format != null ? { format: child.format } : {})
        } satisfies ResolvedFontNode
      ];
    case "list-of": {
      const entries = ctx.listOf[child.of];
      return [
        {
          kind: "list-of",
          of: child.of,
          ...(child.title != null ? { title: child.title } : {}),
          entries,
          style: child.style
        } satisfies ResolvedListOfNode
      ];
    }
    case "toc": {
      const maxDepth = child.depth ?? Number.POSITIVE_INFINITY;
      const entries = ctx.tocEntries.filter((e) => e.depth <= maxDepth);
      return [
        {
          kind: "toc",
          ...(child.title != null ? { title: child.title } : {}),
          ...(child.depth != null ? { depth: child.depth } : {}),
          ...(child.numbered === true ? { numbered: true } : {}),
          entries,
          style: child.style
        } satisfies ResolvedTocNode
      ];
    }
    case "index-template": {
      const entries: ResolvedIndexEntry[] = [...ctx.indexEntries.entries()]
        .map(([term, anchorIds]) => ({ term, anchorIds }))
        .sort((a, b) => a.term.localeCompare(b.term));
      return [
        {
          kind: "index-template",
          ...(child.title != null ? { title: child.title } : {}),
          entries,
          style: child.style
        } satisfies ResolvedIndexTemplateNode
      ];
    }
    case "bibliography": {
      // Bibliography entries come from two places:
      //  1. Content-side <refs><ref-entry key=... >...</ref-entry></refs>
      //     blocks. Authors write entries as content with full inline
      //     formatting (em, strong, link, etc).
      //  2. Optional template-prop `entries` for when the bibliography is
      //     known at template time (legacy / for boilerplate templates).
      // Content-side entries take precedence when a key appears in both.
      const provided = child.entries ?? [];
      const seen = new Set<string>();
      const entries: ResolvedBibliographyEntry[] = [];
      // Content-side entries first.
      for (const [key, inline] of ctx.refEntries) {
        seen.add(key);
        entries.push({
          key,
          inline,
          used: ctx.citeKeys.has(key)
        } as ResolvedBibliographyEntry);
      }
      // Template-prop entries that don't conflict.
      for (const e of provided) {
        if (seen.has(e.key)) continue;
        seen.add(e.key);
        entries.push({ key: e.key, text: e.text, used: ctx.citeKeys.has(e.key) });
      }
      // Cited keys with no entry at all get placeholder text.
      for (const key of ctx.citeKeys) {
        if (!seen.has(key)) {
          entries.push({ key, text: key, used: true });
        }
      }
      return [
        {
          kind: "bibliography",
          ...(child.title != null ? { title: child.title } : {}),
          entries,
          style: child.style
        } satisfies ResolvedBibliographyNode
      ];
    }
  }
}

function resolveTemplateNode(node: TemplateNode, slots: SlotMap, ctx: ResolveContext): ResolvedTemplateNode {
  switch (node.kind) {
    case "page": {
      const variantRules = ctx.rules.roles
        .filter(
          (r) =>
            r.breakBefore != null ||
            r.breakAfter != null ||
            r.breakInside != null ||
            r.numbering != null ||
            r.dropCap != null ||
            r.style != null
        )
        .map((r) => ({
          apply: r.apply,
          ...(r.breakBefore != null ? { breakBefore: r.breakBefore } : {}),
          ...(r.breakAfter != null ? { breakAfter: r.breakAfter } : {}),
          ...(r.breakInside != null ? { breakInside: r.breakInside } : {}),
          ...(r.numbering != null ? { numbering: r.numbering } : {}),
          ...(r.dropCap != null ? { dropCap: r.dropCap } : {}),
          ...(r.style != null ? { style: r.style as TemplateStyle } : {})
        }));
      const children = node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx));
      const regimeFlows: Record<string, ResolvedChild[]> = {};
      for (const [name, flow] of ctx.regimeFlows) {
        regimeFlows[name] = flow;
      }
      // If no top-level body slot expanded the body stream but page-sets
      // declared regime flows, append an auto-stream marker so authors can
      // wire body content by placing <slot name="body"> inside the page-set.
      if (!ctx.bodyState.consumed && ctx.regimeFlows.size > 0 && slots.body.length > 0) {
        children.push({ kind: "body-stream", children: slots.body });
      }
      return {
        kind: "page",
        style: node.style,
        ...(variantRules.length > 0 ? { variantRules } : {}),
        ...(ctx.pageRegimes.length > 0 ? { regimes: ctx.pageRegimes.slice() } : {}),
        ...(ctx.regimeFlows.size > 0 ? { regimeFlows } : {}),
        children
      };
    }
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
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
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
    case "columns":
      return {
        kind: "columns",
        ...(node.gap != null ? { gap: node.gap } : {}),
        ...(node.widths != null ? { widths: node.widths } : {}),
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedColumnsNode;
    case "column":
      return {
        kind: "column",
        ...(node.width != null ? { width: node.width } : {}),
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedColumnNode;
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
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        children: node.children.flatMap((child) => resolveTemplateChild(child, slots, ctx))
      } satisfies ResolvedHeaderNode;
    case "footer":
      return {
        kind: "footer",
        anchor: node.anchor,
        when: node.when,
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
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
      // Page-sets are flattened by resolveTemplateChild (chrome hoisted,
      // body flow stored in regimeFlows); never reached here.
    case "rules":
    case "page-number":
    case "page-count":
    case "running":
    case "image":
    case "footnote-area":
    case "sidenote-area":
    case "bibliography":
    case "index-template":
    case "toc":
    case "list-of":
    case "font":
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
  const citeKeys = new Set<string>();
  collectCiteKeysFromSlotMap(slots, citeKeys);
  const indexEntries = new Map<string, string[]>();
  stampIndexAnchorsInSlotMap(slots, indexEntries);
  const tocEntries: ResolvedTocEntry[] = [];
  stampSectionIdsInSlotMap(slots, tocEntries);
  const listOf = { figure: [] as ResolvedListOfEntry[], table: [] as ResolvedListOfEntry[], equation: [] as ResolvedListOfEntry[] };
  stampListOfInSlotMap(slots, listOf);
  const pageRegimes: ResolvedPageRegime[] = [];
  const regimeFlows = new Map<string, ResolvedChild[]>();
  const refEntries = new Map<string, ResolvedInlineNode[]>();
  collectRefEntriesFromSlotMap(slots, refEntries);
  const resolved = resolveTemplateNode(template, slots, {
    rules,
    currentPageSet: undefined,
    currentAnchors: undefined,
    citeKeys,
    indexEntries,
    tocEntries,
    listOf,
    pageRegimes,
    regimeFlows,
    bodyState: { consumed: false },
    refEntries
  });

  if (resolved.kind !== "page") {
    throw new Error("Resolver expected a `page` result.");
  }

  return resolved;
}
