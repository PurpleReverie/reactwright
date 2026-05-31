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
  // Heading-lift (slice 2.3 §3.7): rule-applied classes on
  // `<rule match={{kind:"section", depth:N}}>` go on the inner heading
  // tag (<h2>/<h3>), not on the <section> wrapper, so authors can
  // attach numbering / generated content to the actual title element.
  assert.match(html, /<h2 class="reactwright-section-title reactwright-chapter-title top"[^>]*>Outer<\/h2>/);
  assert.match(html, /<h3 class="reactwright-section-title nested"[^>]*>Inner<\/h3>/);
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

test("section heading-lift: numbering tags the <h2>, not the <section>", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <styles>{`
        .sec-head {
          font-size: 10pt;
          numbering: counter(sec, upper-roman) "$sec. ";
        }
      `}</styles>
      <rule match={{ kind: "section", depth: 1 }} className="sec-head" />
      <region>
        <slot name="body" />
      </region>
    </page>
  );
  const document = (
    <document title="T">
      <section title="Intro">
        <p>x</p>
      </section>
    </document>
  );
  const html = renderToHtml(document, template);
  // Class lifted onto the <h2>, alongside the engine base classes.
  assert.match(html, /<h2 class="reactwright-section-title reactwright-chapter-title sec-head"[^>]*>Intro<\/h2>/);
  // The <section> wrapper does NOT carry the rule-applied class.
  assert.doesNotMatch(html, /<section[^>]*class="sec-head"/);
  // Lowered CSS emits counter-increment + ::before on .sec-head.
  assert.match(html, /\.sec-head\{[^}]*counter-increment:sec;/);
  assert.match(html, /\.sec-head::before\{content:counter\(sec,upper-roman\) '\. ';\}/);
});
