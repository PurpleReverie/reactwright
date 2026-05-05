import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
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
        <paragraph>
          Testing <em>end-to-end</em> resolution.
        </paragraph>
      </abstract>

      <section title="Intro">
        <paragraph>
          Hello <strong>world</strong>.
        </paragraph>
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
          alt="Tiny test swatch"
          caption="A tiny figure used to validate image support."
          width="35mm"
        />
        <blockquote>
          <paragraph>A quoted observation for the HTML and LaTeX backends.</paragraph>
        </blockquote>
        <list>
          <item>
            <paragraph>First bullet.</paragraph>
          </item>
          <item>
            <paragraph>Second bullet.</paragraph>
          </item>
        </list>
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
  assert.match(html, /<em>end-to-end<\/em>/);
  assert.match(html, /<h2>Intro<\/h2>/);
  assert.match(html, /<figure>/);
  assert.match(html, /reactdoc-swatch\.png/);
  assert.match(html, /<blockquote>/);
  assert.match(html, /<ul>/);
});

test("LaTeX backend emits expected content", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));
  const latex = renderResolvedToLatex(resolved);

  assert.match(latex, /\\documentclass\[11pt\]\{article\}/);
  assert.match(latex, /\\begin\{abstract\}/);
  assert.match(latex, /\\section\{Intro\}/);
  assert.match(latex, /\\usepackage\{graphicx\}/);
  assert.match(latex, /\\includegraphics\[width=35mm\]/);
  assert.match(latex, /\\emph\{end-to-end\}/);
  assert.match(latex, /\\begin\{quote\}/);
  assert.match(latex, /\\begin\{itemize\}/);
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

test("resolver applies template rules and page-set filtering", () => {
  const documentTree = renderContentToIR(
    <document title="Story Pilot">
      <section title="World" page="world">
        <paragraph>World copy.</paragraph>
      </section>
      <section title="Scene One" role="scene-heading" page="script">
        <blockquote role="dialogue">
          <paragraph>Dialogue line.</paragraph>
        </blockquote>
      </section>
    </document>
  );

  const templateTree = renderTemplateToIR(
    <template>
      <rules>
        <section-role role="scene-heading" variant="sceneHeading" />
        <quote-role role="dialogue" variant="dialogueBlock" />
        <page-role page="world" use="world" />
        <page-role page="script" use="script" />
      </rules>
      <flow>
        <page-set name="world">
          <region>
            <slot name="body" />
          </region>
        </page-set>
        <page-set name="script">
          <region>
            <slot name="body" />
          </region>
        </page-set>
      </flow>
    </template>
  );

  const resolved = resolveDocument(documentTree, templateTree);
  const stack = resolved.children[0];
  assert.equal(stack?.kind, "stack");
  assert.equal(stack.children.length, 2);

  const worldRegion = stack.children[0];
  assert.equal(worldRegion?.kind, "box");
  assert.equal(worldRegion.children[0]?.kind, "section");
  assert.equal(worldRegion.children[0]?.title, "World");

  const scriptRegion = stack.children[1];
  assert.equal(scriptRegion?.kind, "box");
  assert.equal(scriptRegion.children[0]?.kind, "section");
  assert.equal(scriptRegion.children[0]?.variant, "sceneHeading");
  assert.equal(scriptRegion.children[0]?.children[0]?.kind, "blockquote");
  assert.equal(scriptRegion.children[0]?.children[0]?.variant, "dialogueBlock");
});
