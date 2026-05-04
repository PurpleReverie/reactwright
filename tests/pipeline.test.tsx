import test from "node:test";
import assert from "node:assert/strict";
import React from "react";

import { renderResolvedToHTML } from "../src/backends/html/render.js";
import { renderResolvedToLatex } from "../src/backends/latex/render.js";
import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";
import { registerTemplateIntrinsic } from "../src/template/registry.js";

function createPaper() {
  return (
    <document title="Pipeline Test" author="Tauraj Greig">
      <abstract>
        <paragraph>Testing end-to-end resolution.</paragraph>
      </abstract>

      <section title="Intro">
        <paragraph>Hello world.</paragraph>
      </section>
    </document>
  );
}

function createTemplate() {
  return (
    <page style={{ size: "a4", margin: "25mm", fontSize: "11pt" }}>
      <stack gap="8mm">
        <box style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </box>
        <box>
          <slot name="abstract" />
        </box>
        <box>
          <slot name="body" />
        </box>
      </stack>
    </page>
  );
}

test("resolver fills title author abstract and body slots", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));

  assert.equal(resolved.kind, "page");
  assert.equal(resolved.children[0]?.kind, "stack");
  const stack = resolved.children[0];
  assert.equal(stack.kind, "stack");
  assert.equal(stack.children[0]?.kind, "box");
  assert.equal(stack.children[1]?.kind, "box");
  assert.equal(stack.children[2]?.kind, "box");
});

test("HTML backend emits expected content", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));
  const html = renderResolvedToHTML(resolved);

  assert.match(html, /<h1>Pipeline Test<\/h1>/);
  assert.match(html, /Testing end-to-end resolution\./);
  assert.match(html, /<h2>Intro<\/h2>/);
});

test("LaTeX backend emits expected content", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));
  const latex = renderResolvedToLatex(resolved);

  assert.match(latex, /\\documentclass\[11pt\]\{article\}/);
  assert.match(latex, /\\begin\{abstract\}/);
  assert.match(latex, /\\section\{Intro\}/);
});

test("custom template intrinsic renders through HTML and LaTeX backends", () => {
  registerTemplateIntrinsic({
    name: "callout-test",
    html: ({ children, renderChildren }) =>
      `<aside data-node="callout-test">${renderChildren(children)}</aside>`,
    latex: ({ children, renderChildren }) =>
      ["\\fbox{%", renderChildren(children), "}"].join("\n")
  });

  const template = (
    <page>
      {React.createElement("callout-test", null, <slot name="abstract" />)}
      <box>
        <slot name="body" />
      </box>
    </page>
  );

  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(template));
  const html = renderResolvedToHTML(resolved);
  const latex = renderResolvedToLatex(resolved);

  assert.match(html, /data-node="callout-test"/);
  assert.match(latex, /\\fbox\{%/);
});
