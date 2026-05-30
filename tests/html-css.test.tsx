import test from "node:test";
import assert from "node:assert/strict";

import { renderResolvedToHTML } from "../src/backends/html/render.js";
import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";

// HTML backend tests that assert on the emitted CSS (@page rules,
// margin-box CSS, role-variant CSS, font @font-face, etc.). Each test
// builds a minimal document + template and grep-matches the rendered
// HTML's <style> block.

function minimalPaper() {
  return (
    <document title="Pipeline Test">
      <section title="Intro">
        <p>Hi.</p>
      </section>
    </document>
  );
}

function minimalTemplate() {
  return (
    <page style={{ size: "a4", margin: "25mm" }}>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );
}

test("HTML backend emits CSS Paged Media @page rule and Paged.js script", () => {
  const html = renderResolvedToHTML(
    resolveDocument(renderContentToIR(minimalPaper()), renderTemplateToIR(minimalTemplate()))
  );
  assert.match(html, /@page\{size:A4;margin:25mm;\}/);
  assert.match(html, /pagedjs/);
  assert.match(html, /class="reactwright-flow"/);
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
  assert.match(html, /reactwright-document-title/);
  assert.match(html, /reactwright-section-title/);
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

  const html = renderResolvedToHTML(
    resolveDocument(renderContentToIR(minimalPaper()), renderTemplateToIR(template))
  );

  assert.match(html, /position:running\(reactwright-header-0\)/);
  assert.match(html, /@page\{@bottom-center\{content:element\(reactwright-footer-1\);\}\}/);
  assert.match(html, /@page :first\{@top-center\{content:none;\}\}/);
  assert.match(html, /reactwright-page-number/);
  assert.match(html, /reactwright-page-count/);
  assert.match(html, /counter\(page\)/);
  assert.match(html, /counter\(pages\)/);
});

test("role rules emit dropCap CSS via ::first-letter and initial-letter", () => {
  const documentTree = renderContentToIR(
    <document title="DropCaps">
      <section title="Body">
        <p role="opener">Once upon a time.</p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <rules>
        <role on="paragraph" match="opener" apply="opener" dropCap={{ lines: 3, font: "'Bookerly'" }} />
      </rules>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /\[data-variant="opener"\]::first-letter\{initial-letter:3;-webkit-initial-letter:3;font-family:'Bookerly';padding-right:0\.12em;\}/);
  assert.match(html, /data-variant="opener"/);
});

test("role rules emit numbering CSS via counters and format string", () => {
  const documentTree = renderContentToIR(
    <document title="Numbered">
      <section title="Chapter" role="chapter">
        <p>Body.</p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <rules>
        <role
          on="figure"
          match="numbered"
          apply="numberedFigure"
          numbering={{ counter: "figure", scope: "chapter", format: "Figure $chapter.$figure" }}
        />
        <role on="section" match="chapter" apply="chapter" />
      </rules>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /\[data-variant="numberedFigure"\]\{counter-increment:figure;\}/);
  assert.match(html, /\[data-variant="chapter"\]\{counter-reset:figure;\}/);
  assert.match(html, /\[data-variant="numberedFigure"\]::before\{content:'Figure ' counter\(chapter\) '\.' counter\(figure\);\}/);
});

test("role rules emit break-* CSS keyed by variant", () => {
  const documentTree = renderContentToIR(
    <document title="Breaks">
      <section title="Chapter" role="chapter">
        <p>Body.</p>
      </section>
    </document>
  );

  const template = (
    <page page={{ size: "a4", margin: "20mm" }}>
      <rules>
        <role on="section" match="chapter" apply="chapter" breakBefore="page" breakInside="avoid" />
      </rules>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  const html = renderResolvedToHTML(resolveDocument(documentTree, renderTemplateToIR(template)));

  assert.match(html, /\[data-variant="chapter"\]\{break-before:page;break-inside:avoid;\}/);
  assert.match(html, /data-variant="chapter"/);
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
