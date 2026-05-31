import type { ReactNode } from "react";

import { resolveFixedAnchor } from "./anchors.js";
import {
  resolveContentChild,
  resolveSectionNode
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
  collectCiteKeysFromNode,
  collectCiteKeysFromSlotMap,
  collectRefEntriesFromSlotMap
} from "./collect.js";
import { renderContentFragmentToIR } from "../content/render.js";
import { collectStylesAndRules } from "./collect-styles.js";
import { applyRulesToTree } from "../styles/apply.js";
import type { SelectableNode } from "../styles/selector.js";
import type {
  BlockQuoteNode,
  BreakNode,
  CellNode,
  CiteNode,
  CodeBlockNode,
  CodeNode,
  DefNode,
  DefsNode,
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
  ResolvedBibliographyHeadingNode,
  ResolvedBibliographyListNode,
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
  refEntries: Map<string, ResolvedRefEntryNode>;
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

  // Slice 6.5: the abstract slot is now routed by role, not by a
  // dedicated engine intrinsic. `<section role="abstract">` populates
  // `slots.abstract`; all other document children flow into `slots.body`.
  const abstract = document.children
    .filter((child): child is SectionNode => child.kind === "section" && child.role === "abstract")
    .map((child) => resolveSectionNode(child));

  const body = document.children
    .filter((child) => !(child.kind === "section" && child.role === "abstract"))
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
      // Content-side entries first. Carry the source `ResolvedRefEntryNode`
      // forward as `sourceNode` so `renderBibliographyNode` can look up
      // rule-applied class bindings keyed on that node identity.
      for (const [key, refEntryNode] of ctx.refEntries) {
        seen.add(key);
        entries.push({
          key,
          inline: refEntryNode.children,
          used: ctx.citeKeys.has(key),
          sourceNode: refEntryNode
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
          style: child.style,
          // Synthesized addressability for the rendered <h2> + <ol>
          // wrappers (slice 5.3). Heading only exists when there's a
          // title to render.
          ...(child.title != null
            ? { headingNode: { kind: "bibliography-heading", text: child.title } as ResolvedBibliographyHeadingNode }
            : {}),
          listNode: { kind: "bibliography-list" } as ResolvedBibliographyListNode
        } satisfies ResolvedBibliographyNode
      ];
    }
    // --- Slice 6.3 (D1): data-source primitives ------------------
    // Each builds the per-domain entries array from ctx, invokes the
    // render-prop with it, re-enters the **content** reconciler on
    // the returned JSX, resolves the content subtree, and splice-
    // substitutes any `<bib-entry-content>` placeholders. Aggregation
    // data is final by the time this runs (see resolveDocument:
    // collect-* passes execute before resolveTemplateContainer).
    case "bib-data": {
      assertRenderFn(child.render, "bib-data");
      const bibEntries = buildBibDataEntries(ctx);
      return expandRenderProp(child.render(bibEntries) as ReactNode, ctx);
    }
    case "toc-data": {
      assertRenderFn(child.render, "toc-data");
      const tocEntries = ctx.tocEntries.map((e) => ({
        id: e.id,
        title: e.title,
        depth: e.depth
      }));
      return expandRenderProp(child.render(tocEntries) as ReactNode, ctx);
    }
    case "list-of-data": {
      assertRenderFn(child.render, "list-of-data");
      const listOfEntries = ctx.listOf[child.of].map((e) => ({
        id: e.id,
        caption: e.caption
      }));
      return expandRenderProp(child.render(listOfEntries) as ReactNode, ctx);
    }
    case "index-data": {
      assertRenderFn(child.render, "index-data");
      const indexEntries = [...ctx.indexEntries.entries()]
        .map(([term, anchorIds]) => ({ term, anchorIds: anchorIds.slice() }))
        .sort((a, b) => a.term.localeCompare(b.term));
      return expandRenderProp(child.render(indexEntries) as ReactNode, ctx);
    }
  }
}

// Helper for the data-source resolvers (slice 6.3, D1): re-enter the
// **content** reconciler on the React node returned from a render-prop,
// resolve each top-level content node, then post-process the resolved
// subtree to splice-replace `<bib-entry-content>` placeholders with
// the resolved inline children of the matching `<ref-entry>` (looked
// up via `ctx.refEntries`). The result fits `ResolvedChild[]` because
// `ResolvedContentNode` is a member of the `ResolvedChild` union.
function expandRenderProp(
  reactNode: ReactNode,
  ctx: ResolveContext
): ResolvedChild[] {
  const subtree = renderContentFragmentToIR(reactNode);
  const resolved: ResolvedContentNode[] = subtree.map((node) =>
    resolveContentChild(node as SemanticBlockChild) as ResolvedContentNode
  );
  for (const node of resolved) substituteBibEntryContent(node, ctx);
  return resolved as unknown as ResolvedChild[];
}

// Walk a resolved content subtree and splice-replace every
// `<bib-entry-content>` placeholder (inline) with the resolved inline
// children of the matching `<ref-entry>`. Operates in-place on the
// arrays in each container node. Throws if the referenced refKey
// has no `<ref-entry>` in the document — mirrors the slice-6.2
// behaviour at observation time.
function substituteBibEntryContent(node: unknown, ctx: ResolveContext): void {
  if (node == null || typeof node !== "object") return;
  const obj = node as { children?: unknown[]; captionNode?: unknown };
  const kids = obj.children;
  if (Array.isArray(kids)) {
    // Reverse-iterate so splice-replace doesn't desync the loop.
    for (let i = kids.length - 1; i >= 0; i--) {
      const c = kids[i] as { kind?: string; refKey?: string } | null;
      if (c != null && c.kind === "bib-entry-content" && typeof c.refKey === "string") {
        const entry = ctx.refEntries.get(c.refKey);
        if (entry == null) {
          throw new Error(
            `<bib-entry-content for="${c.refKey}" /> has no matching <ref-entry refKey="${c.refKey}" />.`
          );
        }
        // Forbid `<cite>` inside a substituted body — the cite-key
        // collection ran before this resolver, so any nested cite
        // would not register downstream. Mirrors slice-6.2 behaviour.
        const found = new Set<string>();
        for (const ic of entry.children) collectCiteKeysFromNode(ic, found);
        if (found.size > 0) {
          throw new Error(
            `<bib-entry-content for="${c.refKey}" /> body contains a <cite> — cites inside a ref-entry would not register against the bibliography. Move the cite to body content.`
          );
        }
        // Splice in the resolved inline children. The placeholder
        // node sits in an inline context (paragraph/em/…), so the
        // resolved-inline kinds are valid replacements.
        kids.splice(i, 1, ...entry.children);
      } else {
        substituteBibEntryContent(c, ctx);
      }
    }
  }
  if (obj.captionNode != null) substituteBibEntryContent(obj.captionNode, ctx);
}

// Render-prop is captured by the factory without a type check (see
// reference.ts:readChildAsRender). The resolver enforces the contract
// here, at expand time, so the error surfaces cleanly instead of being
// swallowed by React's commit-phase error handling.
function assertRenderFn(value: unknown, kind: string): void {
  if (typeof value !== "function") {
    throw new Error(
      `<${kind}> requires a function child of the form (entries) => JSX.`
    );
  }
}

function buildBibDataEntries(ctx: ResolveContext): {
  key: string;
  used: boolean;
  text?: string;
}[] {
  // Same merge order as the engine `<bibliography>` case: content-side
  // <ref-entry> first (no `text`, body lives in ctx.refEntries), then
  // cite-only placeholders. The template-prop `entries={...}` path
  // doesn't apply here — userland helpers compose data via JSX.
  const seen = new Set<string>();
  const result: { key: string; used: boolean; text?: string }[] = [];
  for (const [key] of ctx.refEntries) {
    seen.add(key);
    result.push({ key, used: ctx.citeKeys.has(key) });
  }
  for (const key of ctx.citeKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ key, used: true, text: key });
  }
  return result;
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
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedRegionNode;
    case "layer":
      return {
        kind: "layer",
        ...(node.name != null ? { name: node.name } : {}),
        ...(node.when != null ? { when: node.when } : {}),
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedLayerNode;
    case "stack":
      return {
        kind: "stack",
        gap: node.gap,
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedStackNode;
    case "row":
      return {
        kind: "template-row",
        gap: node.gap,
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedTemplateRowNode;
    case "columns":
      return {
        kind: "columns",
        ...(node.gap != null ? { gap: node.gap } : {}),
        ...(node.widths != null ? { widths: node.widths } : {}),
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedColumnsNode;
    case "column":
      return {
        kind: "column",
        ...(node.width != null ? { width: node.width } : {}),
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedColumnNode;
    case "fixed":
      return {
        kind: "fixed",
        anchor: resolveFixedAnchor(node.anchor, ctx),
        when: node.when,
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedFixedNode;
    case "header":
      return {
        kind: "header",
        anchor: node.anchor,
        when: node.when,
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
        children: node.children.flatMap((child) => expandTemplateChild(child, slots, ctx))
      } satisfies ResolvedHeaderNode;
    case "footer":
      return {
        kind: "footer",
        anchor: node.anchor,
        when: node.when,
        ...(ctx.currentPageSet != null ? { regime: ctx.currentPageSet } : {}),
        style: node.style,
        ...(node.className != null ? { className: node.className } : {}),
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
    case "bib-data":
    case "toc-data":
    case "list-of-data":
    case "index-data":
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
    abstract: rawSlots.abstract.map((node) => assignRoleVariants(node, rules)) as ResolvedSectionNode[],
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
  const refEntries = new Map<string, ResolvedRefEntryNode>();
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

  // Styles dialect: collect <styles> source blocks + <rule> bindings
  // from the template tree, parse the stylesheet, and tag every node
  // in the resolved tree with the classes its bindings select. The
  // HTML emitter consumes both fields.
  const { stylesheet, bindings } = collectStylesAndRules(template);
  if (stylesheet.rules.length > 0 || bindings.length > 0) {
    const classBindings = applyRulesToTree(resolved as unknown as SelectableNode, bindings);
    (resolved as { stylesheet?: unknown }).stylesheet = stylesheet;
    (resolved as { classBindings?: ReadonlyArray<readonly [unknown, readonly string[]]> }).classBindings =
      [...classBindings.entries()].map(([n, c]) => [n, c] as const);
  }

  if (resolved.kind !== "page") {
    throw new Error("Resolver expected a `page` result.");
  }

  return resolved;
}
