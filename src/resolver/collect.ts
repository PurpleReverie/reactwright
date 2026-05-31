import type { SlotName } from "../template/ir.js";
import type {
  ResolvedContentNode,
  ResolvedInlineNode,
  ResolvedListOfEntry,
  ResolvedRefEntryNode,
  ResolvedTocEntry
} from "./ir.js";

// Resolver state-mutating walkers. Each function pair (`*FromNode` +
// `*FromSlotMap`) is "walk a tree of resolved content, possibly
// assigning auto-ids onto nodes, and accumulate something into a
// caller-owned collection." The `assign*` prefix replaces the older
// `stamp*` naming — `stamp` was jargon for "mint an id and store it
// on the node," which a new reader had to read the body to discover.

type SlotMap = Record<SlotName, ResolvedContentNode[]>;

function termToSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Cite keys -------------------------------------------------------

export function collectCiteKeysFromNode(
  node: ResolvedContentNode | ResolvedInlineNode,
  keys: Set<string>
): void {
  if ("kind" in node && node.kind === "cite") keys.add(node.cite);
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectCiteKeysFromNode(child as ResolvedContentNode, keys);
    }
  }
}

export function collectCiteKeysFromSlotMap(slots: SlotMap, keys: Set<string>): void {
  for (const list of [slots.title, slots.author, slots.abstract, slots.body]) {
    for (const node of list) collectCiteKeysFromNode(node, keys);
  }
}

// --- Index anchors ---------------------------------------------------

export function assignIndexAnchorsAndCollect(
  node: ResolvedContentNode | ResolvedInlineNode,
  counts: Map<string, number>,
  indexEntries: Map<string, string[]>
): void {
  if ("kind" in node && node.kind === "index") {
    const slug = termToSlug(node.term);
    const n = (counts.get(slug) ?? 0) + 1;
    counts.set(slug, n);
    const anchorId = `reactwright-idx-${slug}-${n}`;
    node.anchorId = anchorId;
    const list = indexEntries.get(node.term) ?? [];
    list.push(anchorId);
    indexEntries.set(node.term, list);
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      assignIndexAnchorsAndCollect(child as ResolvedContentNode, counts, indexEntries);
    }
  }
}

export function assignIndexAnchorsInSlotMap(
  slots: SlotMap,
  indexEntries: Map<string, string[]>
): void {
  const counts = new Map<string, number>();
  for (const list of [slots.title, slots.author, slots.abstract, slots.body]) {
    for (const node of list) assignIndexAnchorsAndCollect(node, counts, indexEntries);
  }
}

// --- Section IDs + TOC -----------------------------------------------

export function assignSectionIdsAndCollectToc(
  node: ResolvedContentNode,
  depth: number,
  used: Set<string>,
  entries: ResolvedTocEntry[]
): void {
  if (node.kind === "section") {
    let id = node.id;
    if (id == null || id.length === 0) {
      const base = titleToSlug(node.title) || "section";
      let candidate = `reactwright-sec-${base}`;
      let n = 1;
      while (used.has(candidate)) {
        n += 1;
        candidate = `reactwright-sec-${base}-${n}`;
      }
      id = candidate;
      node.id = id;
    }
    used.add(id);
    entries.push({ id, title: node.title, depth });
    for (const child of node.children) {
      assignSectionIdsAndCollectToc(child as ResolvedContentNode, depth + 1, used, entries);
    }
    return;
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      assignSectionIdsAndCollectToc(child as ResolvedContentNode, depth, used, entries);
    }
  }
}

export function assignSectionIdsInSlotMap(slots: SlotMap, entries: ResolvedTocEntry[]): void {
  const used = new Set<string>();
  for (const list of [slots.abstract, slots.body]) {
    for (const node of list) assignSectionIdsAndCollectToc(node, 1, used, entries);
  }
}

// --- list-of (figures, tables, equations) ----------------------------

export function assignAutoIdsAndCollectListOf(
  node: ResolvedContentNode,
  counts: { figure: number; table: number; equation: number },
  used: Set<string>,
  buckets: {
    figure: ResolvedListOfEntry[];
    table: ResolvedListOfEntry[];
    equation: ResolvedListOfEntry[];
  }
): void {
  const mintId = (prefix: string, count: number): string => {
    let candidate = `${prefix}-${count}`;
    while (used.has(candidate)) candidate += "-x";
    return candidate;
  };
  if (node.kind === "figure") {
    counts.figure += 1;
    let id = node.id;
    if (id == null || id.length === 0) {
      id = mintId("reactwright-fig", counts.figure);
      node.id = id;
    }
    used.add(id);
    buckets.figure.push({ id, caption: node.caption ?? `Figure ${counts.figure}` });
  } else if (node.kind === "table") {
    counts.table += 1;
    let id = node.id;
    if (id == null || id.length === 0) {
      id = mintId("reactwright-tbl", counts.table);
      node.id = id;
    }
    used.add(id);
    buckets.table.push({ id, caption: node.caption ?? `Table ${counts.table}` });
  } else if (node.kind === "math") {
    counts.equation += 1;
    let id = node.id;
    if (id == null || id.length === 0) {
      id = mintId("reactwright-eq", counts.equation);
      node.id = id;
    }
    used.add(id);
    buckets.equation.push({ id, caption: `Equation ${counts.equation}` });
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      assignAutoIdsAndCollectListOf(child as ResolvedContentNode, counts, used, buckets);
    }
  }
}

export function assignAutoIdsAndCollectListOfInSlotMap(
  slots: SlotMap,
  buckets: {
    figure: ResolvedListOfEntry[];
    table: ResolvedListOfEntry[];
    equation: ResolvedListOfEntry[];
  }
): void {
  const counts = { figure: 0, table: 0, equation: 0 };
  const used = new Set<string>();
  for (const list of [slots.abstract, slots.body]) {
    for (const node of list) assignAutoIdsAndCollectListOf(node, counts, used, buckets);
  }
}

// --- Bibliography ref entries ----------------------------------------

export function collectRefEntriesFromNode(
  node: ResolvedContentNode | ResolvedInlineNode,
  out: Map<string, ResolvedRefEntryNode>
): void {
  if ("kind" in node && (node as { kind: string }).kind === "ref-entry") {
    const entry = node as ResolvedRefEntryNode;
    if (!out.has(entry.refKey)) out.set(entry.refKey, entry);
  }
  if ("children" in node && Array.isArray((node as { children: unknown[] }).children)) {
    for (const c of (node as { children: ResolvedContentNode[] }).children) {
      collectRefEntriesFromNode(c, out);
    }
  }
}

export function collectRefEntriesFromSlotMap(
  slots: SlotMap,
  out: Map<string, ResolvedRefEntryNode>
): void {
  for (const list of [slots.title, slots.author, slots.abstract, slots.body]) {
    for (const node of list) collectRefEntriesFromNode(node, out);
  }
}
