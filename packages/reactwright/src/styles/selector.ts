import type { Match } from "./ir.js";

// Selector evaluator. matchNode(node, match, ctx) returns true if the
// resolved-IR node satisfies the Match. The IR is walked once by
// applyRulesToTree (apply.ts); this module is the per-node predicate.

// A loose shape of resolved-IR nodes the evaluator inspects. The
// evaluator only reads `kind`, `role`, `variant`, `id`, `className`,
// and well-known optional fields — never relies on exact resolver
// types so that future kinds plug in without changing this module.
export type SelectableNode = {
  kind: string;
  role?: string;
  variant?: string;
  id?: string;
  className?: string;
  // attribute-test bag — populated by the apply pass for the keys we
  // explicitly support (header, ordered, …).
  [k: string]: unknown;
};

// Context passed into matchNode by the walker. The walker is
// responsible for keeping these in sync as it descends/ascends the
// tree.
export type MatchContext = {
  parent?: SelectableNode;
  ancestors: SelectableNode[];     // root-first order
  // Parallel to `ancestors`: each ancestor's own siblingIndex/siblingCount
  // captured at the time the walker visited it. Lets `parent: {index:"last"}`
  // resolve against the parent's real sibling position instead of zeroes.
  ancestorSiblingInfo: { index: number; count: number }[];
  prevSiblings: SelectableNode[];  // earlier siblings of the current node
  siblingIndex: number;            // 0-based position among siblings of the same kind
  siblingCount: number;            // total siblings of the same kind under the parent
  depth: number;                   // hierarchical depth (sections only; 0 otherwise)
  slot?: string;
  children: SelectableNode[];      // direct children of the node
};

// True iff every atomic key and combinator in `match` is satisfied
// by `node` in the given context.
export function matchNode(node: SelectableNode, match: Match, ctx: MatchContext): boolean {
  // Atomic keys
  if (match.kind != null && node.kind !== match.kind) return false;
  if (match.role != null && node.role !== match.role) return false;
  if (match.variant != null && node.variant !== match.variant) return false;
  if (match.id != null && node.id !== match.id) return false;
  if (match.class != null && !nodeHasClass(node, match.class)) return false;

  if (match.depth != null) {
    if (typeof match.depth === "number") {
      if (ctx.depth !== match.depth) return false;
    } else {
      if (match.depth.gte != null && ctx.depth < match.depth.gte) return false;
      if (match.depth.lte != null && ctx.depth > match.depth.lte) return false;
    }
  }

  if (match.index != null) {
    if (match.index === "first") {
      if (ctx.siblingIndex !== 0) return false;
    } else if (match.index === "last") {
      if (ctx.siblingIndex !== ctx.siblingCount - 1) return false;
    } else {
      if (ctx.siblingIndex !== match.index) return false;
    }
  }

  if (match.attr != null) {
    for (const [key, expected] of Object.entries(match.attr)) {
      const actual = node[key];
      if (expected === true) {
        if (actual !== true) return false;
      } else if (actual !== expected) {
        return false;
      }
    }
  }

  if (match.slot != null) {
    if (ctx.slot !== match.slot) return false;
  }

  // Combinators
  if (match.parent != null) {
    if (ctx.parent == null) return false;
    if (!matchNode(ctx.parent, match.parent, parentContext(ctx))) return false;
  }

  if (match.within != null) {
    let found = false;
    for (let i = ctx.ancestors.length - 1; i >= 0; i -= 1) {
      const a = ctx.ancestors[i]!;
      if (matchNode(a, match.within, ancestorContext(ctx, i))) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  if (match.follows != null) {
    if (ctx.prevSiblings.length === 0) return false;
    const prev = ctx.prevSiblings[ctx.prevSiblings.length - 1]!;
    if (!matchNode(prev, match.follows, siblingContext(ctx, ctx.siblingIndex - 1))) return false;
  }

  if (match.precedes != null) {
    // precedes inverts follows; the apply walker doesn't currently
    // surface forward siblings, so the evaluator looks for a child of
    // the parent positioned at our index+1. Slice 2 may broaden.
    const parent = ctx.parent;
    if (parent == null) return false;
    const allSiblings = parent.children as SelectableNode[] | undefined;
    if (allSiblings == null) return false;
    const sameKind = allSiblings.filter((c) => c.kind === node.kind);
    const next = sameKind[ctx.siblingIndex + 1];
    if (next == null) return false;
    if (!matchNode(next, match.precedes, siblingContext(ctx, ctx.siblingIndex + 1))) return false;
  }

  if (match.has != null) {
    let found = false;
    for (const child of ctx.children) {
      if (matchNode(child, match.has, childContext(node, ctx, child))) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  if (match.not != null) {
    if (matchNode(node, match.not, ctx)) return false;
  }

  if (match.and != null) {
    for (const sub of match.and) {
      if (!matchNode(node, sub, ctx)) return false;
    }
  }

  if (match.or != null) {
    let any = false;
    for (const sub of match.or) {
      if (matchNode(node, sub, ctx)) {
        any = true;
        break;
      }
    }
    if (!any) return false;
  }

  return true;
}

// className-prop test: the resolved node may carry a className string
// either set explicitly via JSX or applied by a prior rule. Match
// accepts the class if it appears anywhere in the (space-separated)
// list.
function nodeHasClass(node: SelectableNode, name: string): boolean {
  const cls = node.className;
  if (typeof cls !== "string") return false;
  if (cls === name) return true;
  return cls.split(/\s+/).includes(name);
}

// Build the context for evaluating the parent in a parent-combinator.
// The parent's own siblingIndex/siblingCount come from the last entry
// in ctx.ancestorSiblingInfo (captured when the walker visited it).
function parentContext(ctx: MatchContext): MatchContext {
  const parent = ctx.parent;
  if (parent == null) {
    return {
      ancestors: [],
      ancestorSiblingInfo: [],
      prevSiblings: [],
      siblingIndex: 0,
      siblingCount: 0,
      depth: 0,
      children: []
    };
  }
  const grandAncestors = ctx.ancestors.slice(0, -1);
  const grandSiblingInfo = ctx.ancestorSiblingInfo.slice(0, -1);
  const parentSiblingInfo = ctx.ancestorSiblingInfo[ctx.ancestorSiblingInfo.length - 1] ?? { index: 0, count: 1 };
  return {
    parent: grandAncestors[grandAncestors.length - 1],
    ancestors: grandAncestors,
    ancestorSiblingInfo: grandSiblingInfo,
    prevSiblings: [],
    siblingIndex: parentSiblingInfo.index,
    siblingCount: parentSiblingInfo.count,
    depth: 0,
    children: parent.children as SelectableNode[] ?? []
  };
}

// Build the context for an ancestor at position `i` in ctx.ancestors.
// Like parentContext, reads the ancestor's own sibling info from
// ctx.ancestorSiblingInfo[i] so `within: { index: "first" }` etc work.
function ancestorContext(ctx: MatchContext, i: number): MatchContext {
  const ancestor = ctx.ancestors[i]!;
  const ancestorSiblingInfo = ctx.ancestorSiblingInfo[i] ?? { index: 0, count: 1 };
  return {
    parent: ctx.ancestors[i - 1],
    ancestors: ctx.ancestors.slice(0, i),
    ancestorSiblingInfo: ctx.ancestorSiblingInfo.slice(0, i),
    prevSiblings: [],
    siblingIndex: ancestorSiblingInfo.index,
    siblingCount: ancestorSiblingInfo.count,
    depth: 0,
    children: ancestor.children as SelectableNode[] ?? []
  };
}

// Build the context for evaluating a sibling at a specific index.
function siblingContext(ctx: MatchContext, idx: number): MatchContext {
  return {
    parent: ctx.parent,
    ancestors: ctx.ancestors,
    ancestorSiblingInfo: ctx.ancestorSiblingInfo,
    prevSiblings: [],
    siblingIndex: idx,
    siblingCount: ctx.siblingCount,
    depth: ctx.depth,
    children: []
  };
}

// Build the context for evaluating a child node from the parent's POV.
function childContext(parent: SelectableNode, parentCtx: MatchContext, _child: SelectableNode): MatchContext {
  return {
    parent,
    ancestors: [...parentCtx.ancestors, parent],
    ancestorSiblingInfo: [
      ...parentCtx.ancestorSiblingInfo,
      { index: parentCtx.siblingIndex, count: parentCtx.siblingCount }
    ],
    prevSiblings: [],
    siblingIndex: 0,
    siblingCount: 1,
    depth: parentCtx.depth,
    children: []
  };
}
