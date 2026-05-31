import type { TemplateStyle } from "../../template/ir.js";
import type { ResolvedContentNode } from "./block.js";
import type {
  ResolvedPageRegime,
  ResolvedRoleVariantRule,
  ResolvedStylesheet,
  ResolvedTemplateNode,
} from "./template.js";

export type ResolvedTitleNode = {
  kind: "title";
  className?: string;
  value: string;
};

export type ResolvedAuthorNode = {
  kind: "author";
  className?: string;
  value: string;
};

export type ResolvedPageNode = {
  kind: "page";
  style?: TemplateStyle;
  variantRules?: ResolvedRoleVariantRule[];
  regimes?: ResolvedPageRegime[];
  // Per-regime flow template. When a section has `page="X"`, the renderer
  // wraps the section in `regimeFlows[X]` (replacing the body-slot marker
  // with the section's content). Lets a page-set declare per-regime layout
  // without filtering the document-order body stream.
  regimeFlows?: Record<string, ResolvedChild[]>;
  // Parsed <styles> blocks (all sources concatenated). Lowered to CSS
  // at HTML emit time. See src/styles/.
  stylesheet?: ResolvedStylesheet;
  // Per-node class assignments computed by applyRulesToTree. Lookup
  // by node identity; values are the list of classes the apply pass
  // attached. Stored as an array of [node, classes] tuples because
  // ResolvedPageNode must be JSON-serialisable for snapshot tests.
  classBindings?: ReadonlyArray<readonly [unknown, readonly string[]]>;
  children: ResolvedChild[];
};

export type ResolvedChild = ResolvedTemplateNode | ResolvedContentNode;
