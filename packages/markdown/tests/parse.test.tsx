// Unit tests for the markdown -> Reactwright JSX converter.
// Each row of the mapping table in README.md has at least one test.
//
// We assert on the resolved IR (via renderContentToIR) rather than on
// the React element tree directly because the engine's grammar is the
// real contract — a JSX shape that the engine rejects is a regression.

import test from "node:test";
import assert from "node:assert/strict";

import { renderContentToIR } from "reactwright";
import type { SemanticNode } from "reactwright";

import { markdownToReactwright } from "../src/index.js";

// Lift the document IR for the body of a markdown source and find
// the first descendant of a given kind. Most tests assert "the
// document contains an X with these fields", and walking is simpler
// to write than threading children paths.
function ir(source: string): SemanticNode {
  const { document } = markdownToReactwright(source);
  return renderContentToIR(document);
}

function findFirst(
  root: SemanticNode,
  predicate: (n: SemanticNode) => boolean
): SemanticNode | null {
  if (predicate(root)) return root;
  const children = (root as { children?: SemanticNode[] }).children;
  const captionNode = (root as { captionNode?: SemanticNode }).captionNode;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findFirst(child, predicate);
      if (found != null) return found;
    }
  }
  if (captionNode != null) {
    const found = findFirst(captionNode, predicate);
    if (found != null) return found;
  }
  return null;
}

function findAll(
  root: SemanticNode,
  predicate: (n: SemanticNode) => boolean
): SemanticNode[] {
  const acc: SemanticNode[] = [];
  function walk(node: SemanticNode): void {
    if (predicate(node)) acc.push(node);
    const children = (node as { children?: SemanticNode[] }).children;
    if (Array.isArray(children)) for (const c of children) walk(c);
  }
  walk(root);
  return acc;
}

// ---- mapping-table coverage --------------------------------------------

test("frontmatter title and author populate the document node", () => {
  const tree = ir(`---
title: Test Title
author: Test Author
---

# Section
Body.
`);
  assert.equal(tree.kind, "document");
  assert.equal((tree as { title?: string }).title, "Test Title");
  assert.equal((tree as { author?: string }).author, "Test Author");
});

test("# H1 / ## H2 produce nested sections", () => {
  const tree = ir(`# Outer
P1.

## Inner
P2.
`);
  const sections = findAll(tree, (n) => n.kind === "section");
  assert.equal(sections.length, 2);
  const outer = sections[0] as { title: string; children: SemanticNode[] };
  assert.equal(outer.title, "Outer");
  // The inner section must be nested inside the outer one — flat
  // siblings would mean our depth-stack reducer is broken.
  const innerInsideOuter = outer.children.some((c) => c.kind === "section");
  assert.equal(innerInsideOuter, true);
});

test("# A then # B at the same depth produce sibling sections", () => {
  const tree = ir("# A\n\n# B\n");
  const docChildren = (tree as { children: SemanticNode[] }).children;
  const sections = docChildren.filter((n) => n.kind === "section");
  assert.equal(sections.length, 2);
});

test("paragraph becomes <p>", () => {
  const tree = ir("# H\nHello world.");
  const p = findFirst(tree, (n) => n.kind === "paragraph");
  assert.ok(p != null);
});

test("*em* and _em_ both become <em>", () => {
  for (const src of ["# H\n*hi*", "# H\n_hi_"]) {
    const tree = ir(src);
    const em = findFirst(tree, (n) => n.kind === "em");
    assert.ok(em != null, `expected <em> in ${src}`);
  }
});

test("**strong** and __strong__ both become <strong>", () => {
  for (const src of ["# H\n**hi**", "# H\n__hi__"]) {
    const tree = ir(src);
    const s = findFirst(tree, (n) => n.kind === "strong");
    assert.ok(s != null, `expected <strong> in ${src}`);
  }
});

test("`code` becomes inline <code>", () => {
  const tree = ir("# H\nA `snippet` here.");
  const c = findFirst(tree, (n) => n.kind === "code");
  assert.ok(c != null);
});

test("fenced code block becomes <code-block> with language", () => {
  const tree = ir("# H\n```js\nlet x = 1;\n```\n");
  const cb = findFirst(tree, (n) => n.kind === "code-block") as
    | { kind: "code-block"; language?: string; children: { value: string }[] }
    | null;
  assert.ok(cb != null);
  assert.equal(cb!.language, "js");
  assert.match(cb!.children[0]?.value ?? "", /let x = 1;/);
});

test("[text](url) becomes <link href=url>", () => {
  const tree = ir("# H\n[Reactwright](https://example.com)");
  const link = findFirst(tree, (n) => n.kind === "link") as
    | { kind: "link"; href: string }
    | null;
  assert.ok(link != null);
  assert.equal(link!.href, "https://example.com");
});

test("![alt](src) becomes inline <img>", () => {
  const tree = ir("# H\n![alt text](/a.png)");
  const img = findFirst(tree, (n) => n.kind === "img") as
    | { kind: "img"; src: string; alt?: string }
    | null;
  assert.ok(img != null);
  assert.equal(img!.src, "/a.png");
  assert.equal(img!.alt, "alt text");
});

test("> blockquote becomes <blockquote>", () => {
  const tree = ir("# H\n> Hello.\n");
  const q = findFirst(tree, (n) => n.kind === "blockquote");
  assert.ok(q != null);
});

test("- item becomes <list ordered=false>", () => {
  const tree = ir("# H\n- one\n- two\n");
  const list = findFirst(tree, (n) => n.kind === "list") as
    | { kind: "list"; ordered: boolean; children: SemanticNode[] }
    | null;
  assert.ok(list != null);
  assert.equal(list!.ordered, false);
  assert.equal(list!.children.length, 2);
});

test("1. item becomes <list ordered=true>", () => {
  const tree = ir("# H\n1. one\n2. two\n");
  const list = findFirst(tree, (n) => n.kind === "list") as
    | { kind: "list"; ordered: boolean }
    | null;
  assert.ok(list != null);
  assert.equal(list!.ordered, true);
});

test("pipe table becomes <table> with a header row", () => {
  const tree = ir(`# H

| a | b |
|---|---|
| x | y |
`);
  const table = findFirst(tree, (n) => n.kind === "table") as
    | { kind: "table"; children: SemanticNode[] }
    | null;
  assert.ok(table != null);
  assert.equal(table!.children.length, 2);
  const headerRow = table!.children[0] as { kind: "row"; children: { header?: boolean }[] };
  assert.equal(headerRow.children[0].header, true);
});

test("$inline$ math becomes <m>", () => {
  const tree = ir("# H\nThe value $x^2$ matters.");
  const m = findFirst(tree, (n) => n.kind === "m") as
    | { kind: "m"; src: string }
    | null;
  assert.ok(m != null);
  assert.equal(m!.src, "x^2");
});

test("$$display$$ math at paragraph level becomes block <math>", () => {
  const tree = ir("# H\n$$E = mc^2$$\n");
  const math = findFirst(tree, (n) => n.kind === "math") as
    | { kind: "math"; src: string }
    | null;
  assert.ok(math != null);
  assert.equal(math!.src, "E = mc^2");
});

test("[^id] / [^id]: text become inline <footnote>", () => {
  const tree = ir(`# H

A claim [^a].

[^a]: support.
`);
  const fn = findFirst(tree, (n) => n.kind === "footnote");
  assert.ok(fn != null);
  // body inline text should include "support"
  const text = findFirst(fn as SemanticNode, (n) => n.kind === "text") as
    | { kind: "text"; value: string }
    | null;
  assert.ok(text != null);
  assert.match(text!.value, /support/);
});

test("Pandoc [@key] becomes <cite cite=key>", () => {
  const tree = ir("# H\nSee [@smith2024].");
  const cite = findFirst(tree, (n) => n.kind === "cite") as
    | { kind: "cite"; cite: string }
    | null;
  assert.ok(cite != null);
  assert.equal(cite!.cite, "smith2024");
});

test("references in frontmatter become a trailing <refs> block", () => {
  const tree = ir(`---
title: T
references:
  - key: smith
    text: "A. Smith. *Things*."
  - key: doe
    text: "B. Doe. Other Things."
---

# H
Body.
`);
  const refs = findFirst(tree, (n) => n.kind === "refs") as
    | { kind: "refs"; children: SemanticNode[] }
    | null;
  assert.ok(refs != null);
  assert.equal(refs!.children.length, 2);
  const entries = refs!.children as { kind: "ref-entry"; refKey: string }[];
  assert.equal(entries[0].refKey, "smith");
  assert.equal(entries[1].refKey, "doe");
});

test("`---` horizontal rule becomes <page-break>", () => {
  const tree = ir("# H\n\nFirst.\n\n---\n\nSecond.\n");
  const pb = findFirst(tree, (n) => n.kind === "page-break");
  assert.ok(pb != null);
});

test("table cell contains a <p> wrapping the inline content", () => {
  const tree = ir(`# H

| col |
|-----|
| body |
`);
  const cell = findFirst(tree, (n) => n.kind === "cell") as
    | { kind: "cell"; children: SemanticNode[] }
    | null;
  assert.ok(cell != null);
  assert.equal(cell!.children[0]?.kind, "paragraph");
});

test("list item content is wrapped in <p> when bare", () => {
  const tree = ir("# H\n- bare text\n");
  const item = findFirst(tree, (n) => n.kind === "item") as
    | { kind: "item"; children: SemanticNode[] }
    | null;
  assert.ok(item != null);
  assert.equal(item!.children[0]?.kind, "paragraph");
});

test("untitled documents fall back to a default document title", () => {
  const tree = ir("# H\nBody.");
  assert.equal((tree as { title: string }).title, "Untitled");
});
