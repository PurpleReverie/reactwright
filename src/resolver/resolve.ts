import { resolveFixedAnchor } from "./anchors.js";
import {
  resolveAbstractNode,
  resolveContentChild
} from "./block.js";
import {
  assignRoleVariants,
  buildRuleMaps,
  findMatchingRole,
  type RuleMaps
} from "./rules.js";
import {
  assignAutoIdsAndCollectListOfInSlotMap,
  assignIndexAnchorsInSlotMap,
  assignSectionIdsInSlotMap,
  collectCiteKeysFromSlotMap,
  collectRefEntriesFromSlotMap
} from "./collect.js";
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
  ResolvedTemplateRowNode,
  ResolvedStrongNode,
  ResolvedSubNode,
  ResolvedSupNode,
  ResolvedTableNode,
  ResolvedTemplateNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "./ir.js";

type SlotMap = Record<SlotName, ResolvedContentNode[]>;

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

function expandTemplateChild(child: TemplateChild, slots: SlotMap, ctx: ResolveContext): ResolvedChild[] {
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
    case "row":
    case "columns":
    case "column":
    case "layer":
    case "fixed":
    case "header":
    case "footer":
    case "custom":
      return [resolveTemplateContainer(child, slots, ctx)];
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
        expandTemplateChild(grandchild, slots, {
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
    case "rule":
    case "styles":
      // Rule/style definitions are collected separately by the
      // rule-collection pass; they contribute nothing to the rendered
      // flow.
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

function resolveTemplateContainer(node: TemplateNode, slots: SlotMap, ctx: ResolveContext): ResolvedTemplateNode {
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
      const children = node.children.flatMap((child) => expandTemplateChild(child, slots, ctx));
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
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedRegionNode;
    case "layer":
      return {
        kind: "layer",
        ...(node.name != null ? { name: node.name } : {}),
        ...(node.when != null ? { when: node.when } : {}),
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedLayerNode;
    case "stack":
      return {
        kind: "stack",
        gap: node.gap,
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedStackNode;
    case "row":
      return {
        kind: "template-row",
        gap: node.gap,
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedTemplateRowNode;
    case "columns":
      return {
        kind: "columns",
        ...(node.gap != null ? { gap: node.gap } : {}),
        ...(node.widths != null ? { widths: node.widths } : {}),
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedColumnsNode;
    case "column":
      return {
        kind: "column",
        ...(node.width != null ? { width: node.width } : {}),
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedColumnNode;
    case "fixed":
      return {
        kind: "fixed",
        anchor: resolveFixedAnchor(node.anchor, ctx),
        when: node.when,
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedFixedNode;
    case "header":
      return {
        kind: "header",
        anchor: node.anchor,
        when: node.when,
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedHeaderNode;
    case "footer":
      return {
        kind: "footer",
        anchor: node.anchor,
        when: node.when,
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedFooterNode;
    case "custom":
      return {
        kind: "custom",
        name: node.name,
        props: node.props,
        style: node.style,
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      };
    case "page-set":
      // Page-sets are flattened by expandTemplateChild (chrome hoisted,
      // body flow stored in regimeFlows); never reached here.
    case "rules":
    case "rule":
    case "styles":
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
    title: rawSlots.title.map((node) => assignRoleVariants(node, rules)) as ResolvedTitleNode[],
    author: rawSlots.author.map((node) => assignRoleVariants(node, rules)) as ResolvedAuthorNode[],
    abstract: rawSlots.abstract.map((node) => assignRoleVariants(node, rules)) as ResolvedAbstractNode[],
    body: rawSlots.body.map((node) => assignRoleVariants(node, rules))
  } satisfies SlotMap;
  const citeKeys = new Set<string>();
  collectCiteKeysFromSlotMap(slots, citeKeys);
  const indexEntries = new Map<string, string[]>();
  assignIndexAnchorsInSlotMap(slots, indexEntries);
  const tocEntries: ResolvedTocEntry[] = [];
  assignSectionIdsInSlotMap(slots, tocEntries);
  const listOf = { figure: [] as ResolvedListOfEntry[], table: [] as ResolvedListOfEntry[], equation: [] as ResolvedListOfEntry[] };
  assignAutoIdsAndCollectListOfInSlotMap(slots, listOf);
  const pageRegimes: ResolvedPageRegime[] = [];
  const regimeFlows = new Map<string, ResolvedChild[]>();
  const refEntries = new Map<string, ResolvedInlineNode[]>();
  collectRefEntriesFromSlotMap(slots, refEntries);
  const resolved = resolveTemplateContainer(template, slots, {
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
