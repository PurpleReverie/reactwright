import test from "node:test";
import assert from "node:assert/strict";

import { parseStylesheet, StylesParseError } from "../../src/styles/parser.js";

test("parser handles simple class declaration", () => {
  const ss = parseStylesheet(".foo { color: red; }");
  assert.equal(ss.rules.length, 1);
  const rule = ss.rules[0]!;
  assert.equal(rule.className, "foo");
  assert.equal(rule.declarations.length, 1);
  assert.equal(rule.declarations[0]!.property, "color");
  assert.equal(rule.declarations[0]!.value, "red");
  assert.equal(ss.classes.get("foo"), rule);
});

test("parser handles element-kind selector", () => {
  const ss = parseStylesheet("paragraph { font-size: 10pt; }");
  assert.equal(ss.rules.length, 1);
  assert.deepEqual(ss.rules[0]!.selectors[0], { kind: "paragraph" });
});

test("parser handles depth pseudo (literal)", () => {
  const ss = parseStylesheet("section:depth(1) { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], { kind: "section", depth: 1 });
});

test("parser handles depth pseudo (gte)", () => {
  const ss = parseStylesheet("section:depth(gte:2) { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], { kind: "section", depth: { gte: 2 } });
});

test("parser handles depth pseudo (range)", () => {
  const ss = parseStylesheet("section:depth(1-3) { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], { kind: "section", depth: { gte: 1, lte: 3 } });
});

test("parser handles attribute test (boolean)", () => {
  const ss = parseStylesheet("cell[header] { font-weight: bold; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], { kind: "cell", attr: { header: true } });
});

test("parser handles attribute test (string value)", () => {
  const ss = parseStylesheet('cite[role="numbered"] { color: red; }');
  assert.deepEqual(ss.rules[0]!.selectors[0], { kind: "cite", attr: { role: "numbered" } });
});

test("parser handles descendant combinator", () => {
  const ss = parseStylesheet("section paragraph { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], {
    kind: "paragraph",
    within: { kind: "section" }
  });
});

test("parser handles direct-child combinator", () => {
  const ss = parseStylesheet("section > paragraph { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], {
    kind: "paragraph",
    parent: { kind: "section" }
  });
});

test("parser handles adjacent-sibling combinator", () => {
  const ss = parseStylesheet("section + paragraph { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], {
    kind: "paragraph",
    follows: { kind: "section" }
  });
});

test("parser handles selector list", () => {
  const ss = parseStylesheet(".a, .b { color: red; }");
  assert.equal(ss.rules.length, 1);
  assert.equal(ss.rules[0]!.selectors.length, 2);
  assert.deepEqual(ss.rules[0]!.selectors, [{ class: "a" }, { class: "b" }]);
});

test("parser handles :has pseudo", () => {
  const ss = parseStylesheet("figure:has(caption) { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], {
    kind: "figure",
    has: { kind: "caption" }
  });
});

test("parser handles :not pseudo", () => {
  const ss = parseStylesheet("section:not(:depth(1)) { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], {
    kind: "section",
    not: { depth: 1 }
  });
});

test("parser handles :slot pseudo as standalone atom", () => {
  const ss = parseStylesheet(":slot(abstract) paragraph { color: red; }");
  assert.deepEqual(ss.rules[0]!.selectors[0], {
    kind: "paragraph",
    within: { slot: "abstract" }
  });
});

test("parser strips comments", () => {
  const ss = parseStylesheet("/* note */ .foo /* x */ { /* y */ color: red; /* z */ }");
  assert.equal(ss.rules[0]!.className, "foo");
  assert.equal(ss.rules[0]!.declarations[0]!.value, "red");
});

test("parser handles multiline declarations", () => {
  const ss = parseStylesheet(`
    .foo {
      color: red;
      font-size: 10pt;
      padding: 2pt 4pt;
    }
  `);
  assert.equal(ss.rules[0]!.declarations.length, 3);
});

test("parser rejects duplicate class declaration", () => {
  assert.throws(
    () => parseStylesheet(".foo { color: red; } .foo { color: blue; }"),
    StylesParseError,
    "duplicate"
  );
});

test("parser rejects invalid selector", () => {
  assert.throws(
    () => parseStylesheet(".foo > { color: red; }"),
    StylesParseError
  );
});

test("parser rejects empty value", () => {
  assert.throws(
    () => parseStylesheet(".foo { color: ; }"),
    StylesParseError
  );
});

test("parser tracks line:column for errors", () => {
  try {
    parseStylesheet("\n\n.foo > { color: red; }");
    assert.fail("should have thrown");
  } catch (e) {
    assert.ok(e instanceof StylesParseError);
    assert.equal(e.source.line, 3);
  }
});
