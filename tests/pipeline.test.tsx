import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import React from "react";

import { renderResolvedToHTML } from "../src/backends/html/render.js";
import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";
import { registerTemplateIntrinsic } from "../src/template/registry.js";

function createPaper() {
  return (
    <document title="Pipeline Test" author="Tauraj Greig">
      <abstract>
        <p>
          Testing <em>end-to-end</em> resolution.
        </p>
      </abstract>

      <section title="Intro">
        <p>
          Hello <strong>world</strong>.
        </p>
        <p>
          Visit <link href="https://example.com">the notes</link>.
        </p>
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
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

test("resolver fills title author abstract and body slots", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));

  assert.equal(resolved.kind, "page");
  assert.equal(resolved.children[0]?.kind, "stack");
  const stack = resolved.children[0];
  assert.equal(stack.kind, "stack");
  assert.equal(stack.children[0]?.kind, "region");
  assert.equal(stack.children[1]?.kind, "region");
  assert.equal(stack.children[2]?.kind, "region");
});

test("HTML backend emits running-string CSS for set and running primitives", () => {
  const documentTree = renderContentToIR(
    <document title="Runtime Test">
      <section title="Scene Twelve">
        <set running="scene-location" value="River bank" />
        <p>Dialogue here.</p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <header anchor="top-right">
        <running name="scene-location" />
      </header>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /string-set:scene-location content\(\)/);
  assert.match(html, /content:string\(scene-location\)/);
  assert.match(html, /data-running-name="scene-location"/);
  assert.match(html, /data-node="set-running"/);
  assert.match(html, /reactdoc-document-title/);
  assert.match(html, /reactdoc-section-title/);
});

test("HTML backend emits CSS Paged Media @page rule and Paged.js script", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));
  const html = renderResolvedToHTML(resolved);

  assert.match(html, /@page\{size:A4;margin:25mm;\}/);
  assert.match(html, /pagedjs/);
  assert.match(html, /class="reactdoc-flow"/);
});

test("HTML backend emits expected content", () => {
  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(createTemplate()));
  const html = renderResolvedToHTML(resolved);

  assert.match(html, /<h1[^>]*>Pipeline Test<\/h1>/);
  assert.match(html, /<em>end-to-end<\/em>/);
  assert.match(html, /<h2[^>]*>Intro<\/h2>/);
  assert.match(html, /<figure[^>]*>/);
  assert.match(html, /reactdoc-swatch\.png/);
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

  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(template));
  const html = renderResolvedToHTML(resolved);

  assert.match(html, /data-node="callout-test"/);
});

test("header/footer compile to CSS Paged Media margin boxes with running elements", () => {
  const template = (
    <page page={{ size: "a4", margin: "25mm" }}>
      <header anchor="top-center" when="not-first-page">
        <slot name="title" />
      </header>
      <footer anchor="bottom-center">
        <page-number /> of <page-count />
      </footer>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(template));
  const html = renderResolvedToHTML(resolved);

  assert.match(html, /position:running\(reactdoc-header-0\)/);
  assert.match(html, /@page\{@bottom-center\{content:element\(reactdoc-footer-1\);\}\}/);
  assert.match(html, /@page :first\{@top-center\{content:none;\}\}/);
  assert.match(html, /reactdoc-page-number/);
  assert.match(html, /reactdoc-page-count/);
  assert.match(html, /counter\(page\)/);
  assert.match(html, /counter\(pages\)/);
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

  const resolved = resolveDocument(renderContentToIR(createPaper()), renderTemplateToIR(template));
  const html = renderResolvedToHTML(resolved);

  assert.match(html, /data-node="fixed" data-when="first-page"/);
  assert.match(html, /data-node="page-number"/);
});

test("font template primitive emits @font-face declarations", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <font family="Bookerly" src="/fonts/bookerly.woff2" format="woff2" weight="400" />
      <font family="Bookerly" src="/fonts/bookerly-italic.woff2" format="woff2" fontStyle="italic" />
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const documentTree = renderContentToIR(
    <document title="Font Test">
      <p>Hi.</p>
    </document>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /@font-face\{font-family:'Bookerly';src:url\('\/fonts\/bookerly\.woff2'\) format\('woff2'\);font-weight:400;\}/);
  assert.match(html, /font-style:italic;/);
});

test("columns/column emits CSS grid with explicit and inferred widths", () => {
  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <columns gap="6mm" widths={["2fr", "1fr"]}>
        <column>
          <region>
            <slot name="body" />
          </region>
        </column>
        <column width="60mm">
          <region>
            <slot name="abstract" />
          </region>
        </column>
      </columns>
    </page>
  );

  const documentTree = renderContentToIR(
    <document title="Cols">
      <abstract>
        <p>Side note.</p>
      </abstract>
      <p>Main.</p>
    </document>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /data-node="columns"/);
  assert.match(html, /grid-template-columns:2fr 60mm/);
  assert.match(html, /data-node="column"/);
});

test("list-of template primitive collects figures with auto-generated ids", () => {
  const documentTree = renderContentToIR(
    <document title="ListOf Test">
      <section title="Body">
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
          caption="Tiny swatch one"
          width="20mm"
        />
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
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
        <list-of of="figure" title="List of Figures" />
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /data-node="list-of" data-of="figure"/);
  assert.match(html, /href="#reactdoc-fig-1"/);
  assert.match(html, /href="#fig-named"/);
  assert.match(html, /Tiny swatch one/);
});

test("toc template primitive collects sections with auto-generated ids", () => {
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
        <toc title="Contents" depth={2} />
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /data-node="toc"/);
  assert.match(html, /href="#reactdoc-sec-introduction"/);
  assert.match(html, /href="#body"/);
  assert.match(html, /Subsection/);
  assert.match(html, /reactdoc-toc-page::after\{content:target-counter/);
});

test("index entries collect to back-matter index with anchor refs", () => {
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
        <index title="Index" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /data-node="index"/);
  assert.match(html, /data-node="index-entry"/);
  assert.match(html, /id="reactdoc-idx-magic-1"/);
  assert.match(html, /id="reactdoc-idx-magic-2"/);
  assert.match(html, /id="reactdoc-idx-aspect-1"/);
  assert.match(html, /data-index-term="magic"/);
});

test("cite + bibliography collect cited keys and emit a bibliography section", () => {
  const documentTree = renderContentToIR(
    <document title="Cited">
      <section title="Body">
        <p>
          Per <cite cite="smith-2024" />, the result is robust.
        </p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <stack>
        <slot name="body" />
        <bibliography
          title="References"
          entries={[
            { key: "smith-2024", text: "Smith, A. (2024). Robust Results." },
            { key: "unused", text: "Unused." }
          ]}
        />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /data-node="cite"/);
  assert.match(html, /data-node="bibliography"/);
  assert.match(html, /id="reactdoc-bib-smith-2024"/);
  assert.match(html, /data-bib-key="smith-2024" data-used="true"/);
  assert.match(html, /data-bib-key="unused"/);
  assert.ok(!/data-bib-key="unused" data-used/.test(html));
});

test("footnote primitive + footnote-area emit float:footnote and @footnote CSS", () => {
  const documentTree = renderContentToIR(
    <document title="Footnoted">
      <section title="Body">
        <p>
          Inline text<footnote>An aside.</footnote> continues.
        </p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <footnote-area />
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /float:footnote/);
  assert.match(html, /@page\{@footnote\{/);
  assert.match(html, /data-node="footnote"/);
});

test("resolver applies unified role rules and page-set filtering", () => {
  const documentTree = renderContentToIR(
    <document title="Story Pilot">
      <section title="World" page="world">
        <p role="lead">World copy.</p>
        <figure
          role="map"
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
          caption="Map"
          width="20mm"
        />
        <list role="checklist">
          <item>
            <p>Bullet.</p>
          </item>
        </list>
      </section>
      <section title="Scene One" role="scene-heading" page="script">
        <quote role="dialogue">
          <p>Dialogue line.</p>
        </quote>
      </section>
    </document>
  );

  const templateTree = renderTemplateToIR(
    <page>
      <rules>
        <role on="section" match="scene-heading" apply="sceneHeading" />
        <role on="quote" match="dialogue" apply="dialogueBlock" />
        <role on="paragraph" match="lead" apply="leadParagraph" />
        <role on="list" match="checklist" apply="compactChecklist" />
        <role on="figure" match="map" apply="framedMap" />
        <page match="world" use="world" />
        <page match="script" use="script" />
      </rules>
      <stack>
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
      </stack>
    </page>
  );

  const resolved = resolveDocument(documentTree, templateTree);
  const stack = resolved.children[0];
  assert.equal(stack?.kind, "stack");
  assert.equal(stack.children.length, 2);

  const worldRegion = stack.children[0];
  assert.equal(worldRegion?.kind, "region");
  assert.equal(worldRegion.children[0]?.kind, "section");
  assert.equal(worldRegion.children[0]?.title, "World");
  assert.equal(worldRegion.children[0]?.children[0]?.kind, "paragraph");
  assert.equal(worldRegion.children[0]?.children[0]?.variant, "leadParagraph");
  assert.equal(worldRegion.children[0]?.children[1]?.kind, "figure");
  assert.equal(worldRegion.children[0]?.children[1]?.variant, "framedMap");
  assert.equal(worldRegion.children[0]?.children[2]?.kind, "list");
  assert.equal(worldRegion.children[0]?.children[2]?.variant, "compactChecklist");

  const scriptRegion = stack.children[1];
  assert.equal(scriptRegion?.kind, "region");
  assert.equal(scriptRegion.children[0]?.kind, "section");
  assert.equal(scriptRegion.children[0]?.variant, "sceneHeading");
  assert.equal(scriptRegion.children[0]?.children[0]?.kind, "blockquote");
  assert.equal(scriptRegion.children[0]?.children[0]?.variant, "dialogueBlock");
});
