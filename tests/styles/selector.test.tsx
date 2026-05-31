import test from "node:test";
import assert from "node:assert/strict";

import { matchNode, type MatchContext, type SelectableNode } from "../../src/styles/selector.js";

function emptyCtx(overrides: Partial<MatchContext> = {}): MatchContext {
  return {
    ancestors: [],
    ancestorSiblingInfo: [],
    prevSiblings: [],
    siblingIndex: 0,
    siblingCount: 1,
    depth: 0,
    children: [],
    ...overrides
  };
}

const paragraph: SelectableNode = { kind: "paragraph" };
const section: SelectableNode = { kind: "section" };

test("kind match", () => {
  assert.equal(matchNode(paragraph, { kind: "paragraph" }, emptyCtx()), true);
  assert.equal(matchNode(paragraph, { kind: "section" }, emptyCtx()), false);
});

test("role match", () => {
  const p: SelectableNode = { kind: "paragraph", role: "callout" };
  assert.equal(matchNode(p, { kind: "paragraph", role: "callout" }, emptyCtx()), true);
  assert.equal(matchNode(p, { role: "other" }, emptyCtx()), false);
});

test("depth literal", () => {
  const ctx = emptyCtx({ depth: 2 });
  assert.equal(matchNode(section, { kind: "section", depth: 2 }, ctx), true);
  assert.equal(matchNode(section, { kind: "section", depth: 1 }, ctx), false);
});

test("depth gte/lte range", () => {
  assert.equal(matchNode(section, { depth: { gte: 2 } }, emptyCtx({ depth: 3 })), true);
  assert.equal(matchNode(section, { depth: { gte: 2 } }, emptyCtx({ depth: 1 })), false);
  assert.equal(matchNode(section, { depth: { gte: 1, lte: 3 } }, emptyCtx({ depth: 2 })), true);
  assert.equal(matchNode(section, { depth: { gte: 1, lte: 3 } }, emptyCtx({ depth: 4 })), false);
});

test("attr (boolean)", () => {
  const cell: SelectableNode = { kind: "cell", header: true };
  assert.equal(matchNode(cell, { kind: "cell", attr: { header: true } }, emptyCtx()), true);
  const cell2: SelectableNode = { kind: "cell" };
  assert.equal(matchNode(cell2, { kind: "cell", attr: { header: true } }, emptyCtx()), false);
});

test("attr (string equality)", () => {
  const cite: SelectableNode = { kind: "cite", role: "numbered" };
  assert.equal(matchNode(cite, { kind: "cite", attr: { role: "numbered" } }, emptyCtx()), true);
});

test("index first/last/nth", () => {
  const ctx = emptyCtx({ siblingIndex: 0, siblingCount: 3 });
  assert.equal(matchNode(paragraph, { index: "first" }, ctx), true);
  assert.equal(matchNode(paragraph, { index: "last" }, ctx), false);
  const ctxLast = emptyCtx({ siblingIndex: 2, siblingCount: 3 });
  assert.equal(matchNode(paragraph, { index: "last" }, ctxLast), true);
  assert.equal(matchNode(paragraph, { index: 1 }, emptyCtx({ siblingIndex: 1, siblingCount: 3 })), true);
});

test("class atom", () => {
  const n: SelectableNode = { kind: "paragraph", className: "lede important" };
  assert.equal(matchNode(n, { class: "lede" }, emptyCtx()), true);
  assert.equal(matchNode(n, { class: "important" }, emptyCtx()), true);
  assert.equal(matchNode(n, { class: "missing" }, emptyCtx()), false);
});

test("within (descendant)", () => {
  const ctx = emptyCtx({ ancestors: [section] });
  assert.equal(matchNode(paragraph, { kind: "paragraph", within: { kind: "section" } }, ctx), true);
  assert.equal(matchNode(paragraph, { within: { kind: "table" } }, ctx), false);
});

test("parent (direct child)", () => {
  const ctx = emptyCtx({ parent: section, ancestors: [section] });
  assert.equal(matchNode(paragraph, { parent: { kind: "section" } }, ctx), true);
});

// Slice 5.4 — parent matcher reads parent's own sibling index/count from
// ancestorSiblingInfo, so `parent: { index: "last" }` works for
// patterns like "cell in the last row".
test("parent + index:last (sibling-aware)", () => {
  const cell: SelectableNode = { kind: "cell" };
  const row: SelectableNode = { kind: "row", children: [cell] };
  // Last row of 3 rows: index 2, count 3.
  const ctx = emptyCtx({
    parent: row,
    ancestors: [row],
    ancestorSiblingInfo: [{ index: 2, count: 3 }]
  });
  assert.equal(
    matchNode(cell, { kind: "cell", parent: { kind: "row", index: "last" } }, ctx),
    true
  );
  // Not the last row: index 1, count 3.
  const ctxNotLast = emptyCtx({
    parent: row,
    ancestors: [row],
    ancestorSiblingInfo: [{ index: 1, count: 3 }]
  });
  assert.equal(
    matchNode(cell, { kind: "cell", parent: { kind: "row", index: "last" } }, ctxNotLast),
    false
  );
});

test("follows (adjacent sibling)", () => {
  const heading: SelectableNode = { kind: "heading" };
  const ctx = emptyCtx({ prevSiblings: [heading], siblingIndex: 1 });
  assert.equal(matchNode(paragraph, { follows: { kind: "heading" } }, ctx), true);
  assert.equal(matchNode(paragraph, { follows: { kind: "section" } }, ctx), false);
});

test("has (descendant matches)", () => {
  const cap: SelectableNode = { kind: "caption" };
  const fig: SelectableNode = { kind: "figure", children: [cap] };
  const ctx = emptyCtx({ children: [cap] });
  assert.equal(matchNode(fig, { kind: "figure", has: { kind: "caption" } }, ctx), true);
  const ctxNo = emptyCtx({ children: [] });
  assert.equal(matchNode(fig, { has: { kind: "caption" } }, ctxNo), false);
});

test("not", () => {
  assert.equal(matchNode(paragraph, { not: { kind: "section" } }, emptyCtx()), true);
  assert.equal(matchNode(paragraph, { not: { kind: "paragraph" } }, emptyCtx()), false);
});

test("and", () => {
  const p: SelectableNode = { kind: "paragraph", role: "callout" };
  assert.equal(
    matchNode(p, { and: [{ kind: "paragraph" }, { role: "callout" }] }, emptyCtx()),
    true
  );
  assert.equal(
    matchNode(p, { and: [{ kind: "paragraph" }, { role: "lede" }] }, emptyCtx()),
    false
  );
});

test("or", () => {
  assert.equal(
    matchNode(paragraph, { or: [{ kind: "section" }, { kind: "paragraph" }] }, emptyCtx()),
    true
  );
  assert.equal(
    matchNode(paragraph, { or: [{ kind: "section" }, { kind: "figure" }] }, emptyCtx()),
    false
  );
});

test("slot match", () => {
  const ctx = emptyCtx({ slot: "abstract" });
  assert.equal(matchNode(paragraph, { slot: "abstract" }, ctx), true);
  assert.equal(matchNode(paragraph, { slot: "body" }, ctx), false);
});

test("composed: section depth 1 with follows", () => {
  const heading: SelectableNode = { kind: "section" };
  const ctx = emptyCtx({
    prevSiblings: [heading],
    siblingIndex: 1,
    depth: 0
  });
  // Selector: paragraph that immediately follows a depth-1 section
  const match = { kind: "paragraph", follows: { kind: "section" } };
  assert.equal(matchNode(paragraph, match, ctx), true);
});
