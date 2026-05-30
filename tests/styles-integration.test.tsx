import "reactwright/jsx";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";

import { renderContentToIR } from "../src/content/render.js";
import { renderTemplateToIR } from "../src/template/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderResolvedToHTML } from "../src/backends/html/render.js";

function renderToHtml(document: React.ReactElement, template: React.ReactElement): string {
  const docIR = renderContentToIR(document);
  const tmplIR = renderTemplateToIR(template);
  const resolved = resolveDocument(docIR, tmplIR);
  return renderResolvedToHTML(resolved);
}

test("styles + rule end-to-end: class applies to matching paragraphs", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <styles>{`
        .body-text { color: red; font-size: 10pt; }
      `}</styles>
      <rule match={{ kind: "paragraph" }} className="body-text" />
      <region>
        <slot name="body" />
      </region>
    </page>
  );
  const document = (
    <document title="T">
      <section title="S">
        <p>One.</p>
        <p>Two.</p>
      </section>
    </document>
  );
  const html = renderToHtml(document, template);

  // Compiled CSS rule is in the <style> block
  assert.match(html, /\.body-text\{color:red;font-size:10pt;\}/);
  // Both paragraphs got the class
  const matches = html.match(/<p class="body-text">/g);
  assert.equal(matches?.length, 2);
});

test("className= prop merges with rule-applied classes", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <styles>{`
        .a { color: red; }
        .b { font-weight: bold; }
      `}</styles>
      <rule match={{ kind: "paragraph" }} className="a" />
      <region>
        <slot name="body" />
      </region>
    </page>
  );
  const document = (
    <document title="T">
      <p className="b">Hello.</p>
    </document>
  );
  const html = renderToHtml(document, template);
  // className prop "b" comes first, then rule-applied "a"
  assert.match(html, /<p class="b a">/);
});

test("section depth selectors", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <styles>{`
        .top { color: red; }
        .nested { color: blue; }
      `}</styles>
      <rule match={{ kind: "section", depth: 1 }} className="top" />
      <rule match={{ kind: "section", depth: 2 }} className="nested" />
      <region>
        <slot name="body" />
      </region>
    </page>
  );
  const document = (
    <document title="T">
      <section title="Outer">
        <section title="Inner">
          <p>x</p>
        </section>
      </section>
    </document>
  );
  const html = renderToHtml(document, template);
  // Outer section has class "top"
  assert.match(html, /<section[^>]* class="top">/);
  // Inner section has class "nested"
  assert.match(html, /<section[^>]* class="nested">/);
});

test("caption-as-node renders and is selectable", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <styles>{`
        .cap { font-size: 8pt; text-align: center; }
      `}</styles>
      <rule match={{ kind: "caption" }} className="cap" />
      <region>
        <slot name="body" />
      </region>
    </page>
  );
  const document = (
    <document title="T">
      <figure src="/x.png" alt="x">
        <caption>The caption text</caption>
      </figure>
    </document>
  );
  const html = renderToHtml(document, template);
  assert.match(html, /<figcaption class="cap">The caption text<\/figcaption>/);
});
