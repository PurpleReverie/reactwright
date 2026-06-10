import {
  assignRoleVariants,
  buildRuleMaps
} from "./rules.js";
import {
  assignAutoIdsAndCollectListOfInSlotMap,
  assignIndexAnchorsInSlotMap,
  assignSectionIdsInSlotMap,
  collectCiteKeysFromSlotMap,
  collectRefEntriesFromSlotMap
} from "./collect.js";
import { collectStylesAndRules } from "./collect-styles.js";
import { applyRulesToTree } from "../styles/apply.js";
import type { SelectableNode } from "../styles/selector.js";
import type { DocumentNode } from "../content/ir.js";
import type { TemplateNode } from "../template/ir.js";

import type { SlotMap } from "./context.js";
import { resolveTemplateContainer } from "./expand-template.js";
import { buildSlotMap } from "./slot-map.js";
import type {
  ResolvedChild,
  ResolvedListOfEntry,
  ResolvedPageNode,
  ResolvedPageRegime,
  ResolvedRefEntryNode,
  ResolvedTocEntry
} from "./ir.js";

export function resolveDocument(document: DocumentNode, template: TemplateNode): ResolvedPageNode {
  if (template.kind !== "page") {
    throw new Error("Resolver expected a `page` template root.");
  }

  const rules = buildRuleMaps(template);
  const rawSlots = buildSlotMap(document);
  // Apply role-variant assignment to every slot bucket. Canonical
  // buckets (title, author, abstract, body) and meta-driven buckets
  // share the same uniform ResolvedContentNode[] shape, so one loop
  // covers them all.
  const slots: SlotMap = {};
  for (const [name, bucket] of Object.entries(rawSlots)) {
    slots[name] = bucket.map((node) => assignRoleVariants(node, rules));
  }
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
