import type { RuleBinding } from "./ir.js";
import { matchNode, type MatchContext, type SelectableNode } from "./selector.js";

// Result of applyRulesToTree. Maps a stable IR node identity to the
// list of class names it has been tagged with (in declaration order).
// The HTML emitter reads this map plus the node's own `className`
// prop to assemble the final `class="..."` attribute.
export type ClassBindings = Map<SelectableNode, string[]>;

// Walks `root` depth-first, evaluating every binding against every
// reachable node, and accumulating per-node class lists.
//
// `root` is a resolved-content or resolved-template node — anything
// the renderer might emit. The walker treats `children` arrays
// uniformly: if a node has a `children` property that is an array,
// it recurses; otherwise it stops at the node. This lets the same
// pass cover paragraphs (inline children), sections (block
// children), regions (template children), and so on.
export function applyRulesToTree(
  root: SelectableNode,
  bindings: RuleBinding[]
): ClassBindings {
  const out: ClassBindings = new Map();
  walk(
    root,
    {
      ancestors: [],
      ancestorSiblingInfo: [],
      prevSiblings: [],
      siblingIndex: 0,
      siblingCount: 1,
      depth: 0,
      children: childrenOf(root)
    },
    bindings,
    out
  );
  return out;
}

function walk(
  node: SelectableNode,
  ctx: MatchContext,
  bindings: RuleBinding[],
  out: ClassBindings
): void {
  // Tag the node first.
  for (const b of bindings) {
    if (matchNode(node, b.match, ctx)) {
      const existing = out.get(node);
      if (existing == null) {
        out.set(node, [b.className]);
      } else if (!existing.includes(b.className)) {
        existing.push(b.className);
      }
    }
  }

  // Recurse into children.
  //   - `prevSibling` (for `follows` combinator) tracks the immediately
  //     previous element in document order, regardless of kind. Matches
  //     CSS adjacent-sibling semantics.
  //   - `index`/`count` (for :first/:last/:nth) track position per kind.
  //     Selectors generally want "first paragraph", not "first child".
  const children = childrenOf(node);
  if (children.length === 0) return;

  const kindCounts = new Map<string, number>();
  for (const c of children) {
    kindCounts.set(c.kind, (kindCounts.get(c.kind) ?? 0) + 1);
  }
  const kindIdx = new Map<string, number>();
  let prevSibling: SelectableNode | undefined;

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i]!;
    const idx = kindIdx.get(child.kind) ?? 0;
    const total = kindCounts.get(child.kind) ?? 0;
    const childDepth = isHierarchical(child.kind) ? ctx.depth + 1 : ctx.depth;
    const childCtx: MatchContext = {
      parent: node,
      ancestors: [...ctx.ancestors, node],
      // Capture this node's own sibling position so descendant
      // `parent: {index:"last"}` etc. resolve correctly.
      ancestorSiblingInfo: [
        ...ctx.ancestorSiblingInfo,
        { index: ctx.siblingIndex, count: ctx.siblingCount }
      ],
      prevSiblings: prevSibling != null ? [prevSibling] : [],
      siblingIndex: idx,
      siblingCount: total,
      depth: childDepth,
      // slot is propagated from parent context; set by the resolver
      // before this pass runs (slots are gone from the tree, but the
      // resolver tags the head node of each slot-substituted content
      // with a `slot` field on the SelectableNode).
      ...(ctx.slot != null ? { slot: ctx.slot } : {}),
      ...((child as { slot?: MatchContext["slot"] }).slot != null
        ? { slot: (child as { slot?: MatchContext["slot"] }).slot }
        : {}),
      children: childrenOf(child)
    };
    walk(child, childCtx, bindings, out);
    kindIdx.set(child.kind, idx + 1);
    prevSibling = child;
  }
}

// Resolve a node's children when present. Reads optional fields the
// resolved-IR shape doesn't currently expose uniformly (captionNode
// is technically a sibling, not a child, but we treat it as a
// virtual child so caption rules apply).
function childrenOf(node: SelectableNode): SelectableNode[] {
  const ch = (node as { children?: unknown }).children;
  const out: SelectableNode[] = [];
  if (Array.isArray(ch)) {
    for (const c of ch) {
      if (c != null && typeof c === "object" && typeof (c as SelectableNode).kind === "string") {
        out.push(c as SelectableNode);
      }
    }
  }
  // Caption-as-child for figure/table.
  const capNode = (node as { captionNode?: SelectableNode }).captionNode;
  if (capNode != null && typeof capNode.kind === "string") {
    out.push(capNode);
  }
  // Bibliography synthesized wrapper nodes — heading and list — are
  // virtual children for rule application so authors can target the
  // rendered <h2> and <ol>. Slice 5.3.
  const headingNode = (node as { headingNode?: SelectableNode }).headingNode;
  if (headingNode != null && typeof headingNode.kind === "string") {
    out.push(headingNode);
  }
  const listNode = (node as { listNode?: SelectableNode }).listNode;
  if (listNode != null && typeof listNode.kind === "string") {
    out.push(listNode);
  }
  return out;
}

// Hierarchical kinds — those whose depth counter increments per nest.
// Sections are the canonical example; lists/defs/blockquotes use
// flat counters for now.
function isHierarchical(kind: string): boolean {
  return kind === "section";
}
