import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import React from "react";

import { renderResolvedToHTML } from "../src/backends/html/render.js";
import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";
import { registerTemplateIntrinsic } from "../src/template/registry.js";
import { Bibliography } from "../src/userland/Bibliography.js";
import { Index as UserlandIndex } from "../src/userland/Index.js";
import { ListOf } from "../src/userland/ListOf.js";
import { Toc } from "../src/userland/Toc.js";

// HTML backend tests that assert on the emitted HTML body content
// (figures, tables, custom intrinsics, fixed overlays, and the
// reference-graph machinery exposed through userland helpers:
// ListOf, Toc, Index, Bibliography — each composing the engine
// data-source primitives).

function createPaper() {
  return (
    <document title="Pipeline Test" author="Anya Strunk">
      <section role="abstract" title="">
        <p>
          Testing <em>end-to-end</em> resolution.
        </p>
      </section>
      <section title="Intro">
        <p>
          Hello <strong>world</strong>.
        </p>
        <p>
          Visit <link href="https://example.com">the notes</link>.
        </p>
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactwright-swatch.png")}
          alt="Tiny test swatch"
          caption="A tiny figure used to validate image support."
          width="35mm"
        />
        <code-block language="txt">plain-text block</code-block>
        <quote>
          <p>A quoted observation for the HTML backend.</p>
        </quote>
        <list>
          <item>
            <p>First bullet.</p>
          </item>
          <item>
            <p>Second bullet.</p>
          </item>
        </list>
        <table caption="House seats">
          <row>
            <cell header>
              <p>House</p>
            </cell>
            <cell header>
              <p>Seat</p>
            </cell>
          </row>
          <row>
            <cell>
              <p>Vael</p>
            </cell>
            <cell>
              <p>Greycrown</p>
            </cell>
          </row>
        </table>
      </section>
    </document>
  );
}

function createTemplate() {
  return (
    <page style={{ size: "a4", margin: "25mm", fontSize: "11pt" }}>
      <stack gap="8mm">
        <region style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region>
          <slot name="abstract" />
        </region>
        <region>
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}

test("HTML backend emits expected content", () => {
  const html = renderResolvedToHTML(
    resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()))
  );

  assert.match(html, /<h1[^>]*>Pipeline Test<\/h1>/);
  assert.match(html, /<em>end-to-end<\/em>/);
  assert.match(html, /<h2[^>]*>Intro<\/h2>/);
  assert.match(html, /<figure[^>]*>/);
  assert.match(html, /reactwright-swatch\.png/);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /<pre[^>]*data-language="txt"><code>plain-text block<\/code><\/pre>/);
  assert.match(html, /<blockquote[^>]*>/);
  assert.match(html, /<ul[^>]*>/);
  assert.match(html, /<table[^>]*>/);
  assert.match(html, /<caption>House seats<\/caption>/);
  assert.match(html, /<th><p>House<\/p><\/th>/);
});

test("custom template intrinsic renders through HTML backend", () => {
  registerTemplateIntrinsic({
    name: "callout-test",
    html: ({ children, renderChildren }) =>
      `<aside data-node="callout-test">${renderChildren(children)}</aside>`
  });

  const template = (
    <page>
      {React.createElement("callout-test", null, <slot name="abstract" />)}
      <region>
        <slot name="body" />
      </region>
    </page>
  );

  const html = renderResolvedToHTML(
    resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(template))
  );

  assert.match(html, /data-node="callout-test"/);
});

test("fixed overlay renders with data attributes for anchor and when", () => {
  const template = (
    <page page={{ size: "a4", margin: "25mm" }}>
      <fixed anchor="page-bottom-right" when="first-page" typography={{ fontSize: "8pt" }}>
        <page-number />
      </fixed>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(
    resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(template))
  );

  assert.match(html, /data-node="fixed" data-when="first-page"/);
  assert.match(html, /data-node="page-number"/);
});

test("list-of (userland) collects figures with auto-generated ids", () => {
  const documentTree = renderContentToIR(
    <document title="ListOf Test">
      <section title="Body">
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactwright-swatch.png")}
          caption="Tiny swatch one"
          width="20mm"
        />
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactwright-swatch.png")}
          caption="Tiny swatch two"
          width="20mm"
          id="fig-named"
        />
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <ListOf of="figure" title="List of Figures" />
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /href="#reactwright-fig-1"/);
  assert.match(html, /href="#fig-named"/);
  assert.match(html, /Tiny swatch one/);
  assert.match(html, /class="reactwright-list-of-link"/);
});

test("toc (userland) collects sections with auto-generated ids", () => {
  const documentTree = renderContentToIR(
    <document title="Toc Test">
      <section title="Introduction">
        <p>Hi.</p>
      </section>
      <section title="Body" id="body">
        <p>Yo.</p>
        <section title="Subsection">
          <p>Sub.</p>
        </section>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <Toc title="Contents" />
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /href="#reactwright-sec-introduction"/);
  assert.match(html, /href="#body"/);
  assert.match(html, /Subsection/);
  assert.match(html, /reactwright-toc-page::after\{content:target-counter/);
});

test("index (userland) collects term anchors to a back-matter index", () => {
  const documentTree = renderContentToIR(
    <document title="Indexed">
      <section title="Chapter">
        <p>
          Magic<index term="magic" /> was discussed.
        </p>
        <p>
          More on magic<index term="magic" /> appears here.
        </p>
        <p>
          Aspects<index term="aspect" /> too.
        </p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <slot name="body" />
        <UserlandIndex title="Index" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  // The collected per-term anchor ids end up on the in-body
  // `<index term=...>` markers; the userland helper links each into
  // the back-matter section.
  assert.match(html, /id="reactwright-idx-magic-1"/);
  assert.match(html, /id="reactwright-idx-magic-2"/);
  assert.match(html, /id="reactwright-idx-aspect-1"/);
  assert.match(html, /href="#reactwright-idx-magic-1"/);
  assert.match(html, /class="reactwright-index-pagerefs"/);
});

test("cite + bibliography (userland) emit a bibliography section keyed to cited refs", () => {
  const documentTree = renderContentToIR(
    <document title="Cited">
      <section title="Body">
        <p>
          Per <cite cite="smith-2024" />, the result is robust.
        </p>
      </section>
      <refs>
        <ref-entry refKey="smith-2024">
          Smith, A. (2024). <em>Robust Results.</em>
        </ref-entry>
      </refs>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <slot name="body" />
        <Bibliography title="References" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /data-node="cite"/);
  // Userland <Bibliography> sets data-counter="reactwright-bib" on
  // the rendered <section>, so the static cite cross-ref machinery
  // resolves against this list.
  assert.match(html, /<section[^>]*data-counter="reactwright-bib"/);
  assert.match(html, /id="reactwright-bib-smith-2024"/);
  // The ref-entry inline body survives substitution (the <em> renders).
  assert.match(html, /<em>Robust Results\.<\/em>/);
});

// RW-5 / RW-7 — when no `<refs>` block is supplied (and no cites
// fire), Bibliography emits nothing rather than producing an orphan
// "References" / "Works Cited" header on a blank trailing page.
test("userland Bibliography emits no section when there are no refs", () => {
  const documentTree = renderContentToIR(
    <document title="No refs">
      <section title="Body">
        <p>Nothing to cite here.</p>
      </section>
    </document>
  );
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <slot name="body" />
        <Bibliography title="References" />
      </stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));
  // The static CSS still references `data-counter="reactwright-bib"`
  // (for cite cross-refs at large), so assert only that no `<section>`
  // element actually carries that data attribute in the rendered body.
  assert.doesNotMatch(html, /<section[^>]*data-counter="reactwright-bib"/);
  assert.doesNotMatch(html, /References<\/h2>|Works Cited<\/h2>/);
});

// Companion: userland Toc emits nothing when no sections exist that
// could populate a TOC. The condition is rarer in practice (a TOC
// over a document with zero h2-level sections is unusual) but the
// same guard applies and removes the orphan "Contents" heading.
test("userland Toc emits no section when there are no entries", () => {
  const documentTree = renderContentToIR(
    <document title="No sections">
      <p>Just a paragraph at the root.</p>
    </document>
  );
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <Toc title="Contents" />
        <slot name="body" />
      </stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));
  assert.doesNotMatch(html, /Contents<\/h2>/);
});
