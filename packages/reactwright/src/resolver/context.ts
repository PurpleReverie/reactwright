import type { SlotName } from "../template/ir.js";

import type { RuleMaps } from "./rules.js";
import type {
  ResolvedChild,
  ResolvedContentNode,
  ResolvedListOfEntry,
  ResolvedPageRegime,
  ResolvedRefEntryNode,
  ResolvedTocEntry
} from "./ir.js";

export type SlotMap = Record<SlotName, ResolvedContentNode[]>;

export type ResolveContext = {
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
