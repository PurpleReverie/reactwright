import test from "node:test";
import assert from "node:assert/strict";

import { applyRulesToTree } from "../../src/styles/apply.js";
import type { RuleBinding } from "../../src/styles/ir.js";
import type { SelectableNode } from "../../src/styles/selector.js";

function bind(match: RuleBinding["match"], className: string): RuleBinding {
  return { match, className, source: { line: 1, column: 1 } };
}

function asNode(spec: Partial<SelectableNode> & { kind: string }): SelectableNode {
  return spec as SelectableNode;
}

test("single binding applies to all matching nodes", () => {
  const root = asNode({
    kind: "section",
    children: [
      asNode({ kind: "paragraph" }),
      asNode({ kind: "paragraph" })
    ] as SelectableNode[]
  } as SelectableNode);

  const bindings = [bind({ kind: "paragraph" }, "body")];
  const result = applyRulesToTree(root, bindings);

  const paragraphs = (root as unknown as { children: SelectableNode[] }).children;
  assert.deepEqual(result.get(paragraphs[0]!), ["body"]);
  assert.deepEqual(result.get(paragraphs[1]!), ["body"]);
});

test("multiple bindings, multiple classes per node", () => {
  const p: SelectableNode = { kind: "paragraph", role: "callout" };
  const root: SelectableNode = { kind: "section", children: [p] } as SelectableNode;

  const result = applyRulesToTree(root, [
    bind({ kind: "paragraph" }, "body"),
    bind({ role: "callout" }, "callout")
  ]);
  assert.deepEqual(result.get(p), ["body", "callout"]);
});

test("non-matching binding produces no class", () => {
  const p: SelectableNode = { kind: "paragraph" };
  const root: SelectableNode = { kind: "section", children: [p] } as SelectableNode;

  const result = applyRulesToTree(root, [bind({ kind: "figure" }, "fig")]);
  assert.equal(result.has(p), false);
});

test("depth tracking on nested sections", () => {
  const inner: SelectableNode = { kind: "section", children: [] } as SelectableNode;
  const outer: SelectableNode = { kind: "section", children: [inner] } as SelectableNode;
  const root: SelectableNode = { kind: "document", children: [outer] } as SelectableNode;

  const result = applyRulesToTree(root, [
    bind({ kind: "section", depth: 1 }, "h2"),
    bind({ kind: "section", depth: 2 }, "h3")
  ]);
  assert.deepEqual(result.get(outer), ["h2"]);
  assert.deepEqual(result.get(inner), ["h3"]);
});

test("first paragraph after section combinator", () => {
  const heading: SelectableNode = { kind: "section" };
  const p1: SelectableNode = { kind: "paragraph" };
  const p2: SelectableNode = { kind: "paragraph" };
  const root: SelectableNode = {
    kind: "section",
    children: [heading, p1, p2]
  } as SelectableNode;

  // Only p1 follows a section sibling
  const result = applyRulesToTree(root, [
    bind({ kind: "paragraph", follows: { kind: "section" } }, "lede")
  ]);
  assert.deepEqual(result.get(p1), ["lede"]);
  assert.equal(result.has(p2), false);
});

test("class binding does not duplicate when rule matches twice", () => {
  const p: SelectableNode = { kind: "paragraph" };
  const root: SelectableNode = { kind: "section", children: [p] } as SelectableNode;
  const result = applyRulesToTree(root, [
    bind({ kind: "paragraph" }, "body"),
    bind({ kind: "paragraph" }, "body")
  ]);
  assert.deepEqual(result.get(p), ["body"]);
});

test("caption-as-virtual-child is reached by walker", () => {
  const caption: SelectableNode = { kind: "caption" };
  const fig: SelectableNode = { kind: "figure", captionNode: caption } as SelectableNode;
  const root: SelectableNode = { kind: "section", children: [fig] } as SelectableNode;

  const result = applyRulesToTree(root, [bind({ kind: "caption" }, "cap")]);
  assert.deepEqual(result.get(caption), ["cap"]);
});

test("within combinator across nested layers", () => {
  const cite: SelectableNode = { kind: "cite" };
  const p: SelectableNode = { kind: "paragraph", children: [cite] } as SelectableNode;
  const sec: SelectableNode = { kind: "section", children: [p] } as SelectableNode;
  const root: SelectableNode = { kind: "document", children: [sec] } as SelectableNode;

  const result = applyRulesToTree(root, [
    bind({ kind: "cite", within: { kind: "section" } }, "in-section")
  ]);
  assert.deepEqual(result.get(cite), ["in-section"]);
});
