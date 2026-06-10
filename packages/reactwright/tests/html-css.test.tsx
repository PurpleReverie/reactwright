import test from "node:test";
import assert from "node:assert/strict";
import React from "react";

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
      <section role="abstract" title="">
        <p>Side note.</p>
      </section>
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

test("HTML backend emits overflow-wrap defaults on code and pre", () => {
  // Layout-safety defaults: long unbreakable strings in <code> or
  // <pre> must wrap within their column instead of overflowing the
  // page. Templates can still restyle cosmetics on top of this base.
  const html = renderResolvedToHTML(
    resolveDocument(renderContentToIR(minimalPaper()), renderTemplateToIR(minimalTemplate()))
  );
  assert.match(html, /code\{[^}]*overflow-wrap:anywhere/);
  assert.match(html, /code\{[^}]*word-break:break-word/);
  assert.match(html, /pre\{[^}]*white-space:pre-wrap/);
  assert.match(html, /pre\{[^}]*overflow-wrap:anywhere/);
});

test("meta primitive routes to named slot bucket and renders with data-meta attribute", () => {
  // `<meta name="X">` populates `slots[X]`. A template's `<slot
  // name="X" />` expands those entries; the renderer emits a neutral
  // `<div data-meta="X">` wrapper holding the inline children. The
  // engine carries no opinion about the slot's semantics — title,
  // author, doi, keywords are all opaque to the engine.
  const doc = renderContentToIR(
    <document title="Paper">
      <meta name="doi" value="10.1234/example" />
      <meta name="keywords">
        machine learning, paged media
      </meta>
      <section title="Body">
        <p>Hello.</p>
      </section>
    </document>
  );
  const template = renderTemplateToIR(
    <page style={{ size: "a4", margin: "25mm" }}>
      <stack>
        <slot name="doi" />
        <slot name="keywords" />
        <slot name="body" />
      </stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  assert.match(html, /<div data-meta="doi">10\.1234\/example<\/div>/);
  assert.match(html, /<div data-meta="keywords">[^<]*machine learning, paged media[^<]*<\/div>/);
});

test("unknown slot name expands to empty without error", () => {
  // Slot names are open. A template may reference a slot the document
  // never provided; the slot expands to nothing rather than throwing.
  const doc = renderContentToIR(
    <document title="X">
      <section title="A"><p>hi</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page style={{ size: "a4", margin: "25mm" }}>
      <stack>
        <slot name="never-provided" />
        <slot name="body" />
      </stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // The unknown slot produces no element; body still flows.
  assert.doesNotMatch(html, /data-meta="never-provided"/);
  assert.match(html, /<p[^>]*>hi<\/p>/);
});

test("chrome when=left/right emits @page :left / :right rules", () => {
  // Per-instance chrome policies for non-mirrored anchors. Lets
  // templates split header content across left/right pages without
  // forcing the inside/outside anchor mirroring.
  const doc = renderContentToIR(
    <document title="X">
      <section title="A"><p>hi</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page style={{ size: "a4", margin: "20mm" }}>
      <header anchor="top-left" when="left">verso</header>
      <header anchor="top-right" when="right">recto</header>
      <stack><slot name="body" /></stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  assert.match(html, /@page\s*:left\{@top-left\{content:element\(/);
  assert.match(html, /@page\s*:right\{@top-right\{content:element\(/);
});

test("chrome when=blank/not-blank emits @page :blank rules", () => {
  const doc = renderContentToIR(
    <document title="X">
      <section title="A"><p>hi</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page style={{ size: "a4", margin: "20mm" }}>
      <footer anchor="bottom-center" when="not-blank">
        <page-number />
      </footer>
      <stack><slot name="body" /></stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  assert.match(html, /@page\{@bottom-center\{content:element\(/);
  assert.match(html, /@page\s*:blank\{@bottom-center\{content:none;\}\}/);
});

test("page-variant registers a derived regime with merged style", () => {
  // <page-variant> inside <page-set> creates a derived regime
  // `<set>__<variant>` with style overlaid on the parent. Sections
  // opt in via `pageVariant`, which the renderer composes into the
  // CSS Paged Media `page:` property.
  const doc = renderContentToIR(
    <document title="Book">
      <section page="main" pageVariant="opener" title="Chapter 1">
        <p>Opening.</p>
      </section>
      <section page="main" title="Body">
        <p>Body.</p>
      </section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <page-set name="main" style={{ size: "a4", margin: "25mm" }}>
        <header anchor="top-right"><page-number /></header>
        <region><slot name="body" /></region>
        <page-variant name="opener" style={{ marginTop: "60mm" }} />
      </page-set>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // Parent regime + derived variant regime both registered.
  assert.match(html, /@page\s+main\{[^}]*margin:25mm/);
  assert.match(html, /@page\s+main__opener\{[^}]*margin-top:60mm/);
  // The opener section routes to the derived page name.
  assert.match(html, /style="page:main__opener;"/);
  // The body section stays on the parent regime.
  assert.match(html, /style="page:main;"/);
});

test("page-variant inherits parent chrome at unoverridden anchors", () => {
  // The variant doesn't declare its own top-right header, so it
  // inherits the parent's. The inherited entry emits its own running
  // element + `@page main__opener` rule so Paged.js picks it up.
  const doc = renderContentToIR(
    <document title="Book">
      <section page="main" pageVariant="opener" title="Opener"><p>hi</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <page-set name="main" style={{ size: "a4", margin: "25mm" }}>
        <header anchor="top-right"><page-number /></header>
        <region><slot name="body" /></region>
        <page-variant name="opener" />
      </page-set>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // Both @page rules wire up the top-right margin box.
  assert.match(html, /@page\s+main\{@top-right\{content:element\(/);
  assert.match(html, /@page\s+main__opener\{@top-right\{content:element\(/);
});

test("page-variant chrome overrides parent at same anchor", () => {
  // Variant declares its own top-right header → overrides the
  // parent's. The parent's @page rule keeps its own chrome; the
  // variant's @page rule references the variant's own element.
  const doc = renderContentToIR(
    <document title="Book">
      <section page="main" pageVariant="opener" title="Opener"><p>hi</p></section>
      <section page="main" title="Body"><p>body</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <page-set name="main" style={{ size: "a4", margin: "25mm" }}>
        <header anchor="top-right">body-header</header>
        <region><slot name="body" /></region>
        <page-variant name="opener">
          <header anchor="top-right">opener-header</header>
        </page-variant>
      </page-set>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // Two distinct running elements, one per chrome declaration.
  const matches = html.match(/reactwright-header-\d+/g) ?? [];
  // Deduped count by element class.
  const unique = new Set(matches);
  assert.ok(unique.size >= 2, `expected at least two distinct header elements, got ${unique.size}`);
  // Both regimes get their own @top-right rule.
  assert.match(html, /@page\s+main\{@top-right/);
  assert.match(html, /@page\s+main__opener\{@top-right/);
});

test("page-variant body flow falls back to parent when not declared", () => {
  // Variant only overrides geometry; the body flow comes from the
  // parent regime's <region columns={2}>.
  const doc = renderContentToIR(
    <document title="Book">
      <section page="main" pageVariant="opener" title="Opener"><p>opener body</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <page-set name="main" style={{ size: "a4", margin: "25mm" }}>
        <region style={{ columns: 2 }}><slot name="body" /></region>
        <page-variant name="opener" style={{ marginTop: "60mm" }} />
      </page-set>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // Opener content reaches the rendered page through the inherited
  // two-column region.
  assert.match(html, /opener body/);
  assert.match(html, /column-count:2/);
});

test("section pageVariant requires page", () => {
  // Authoring error: pageVariant without an enclosing page-set name
  // has no derived regime to route to. React swallows the factory
  // error and rethrows a generic message, so we assert that the
  // construction fails — not on a specific message.
  assert.throws(() =>
    renderContentToIR(
      <document title="X">
        <section pageVariant="opener" title="A"><p>x</p></section>
      </document>
    )
  );
});

test("page-variant outside page-set is rejected", () => {
  // The page-set case in expandTemplateChild intercepts variant
  // children before recursion; a top-level <page-variant> is an
  // authoring error.
  const template = renderTemplateToIR(
    <page>
      <page-variant name="orphan" />
      <stack><slot name="body" /></stack>
    </page>
  );
  const doc = renderContentToIR(<document title="X"><section title="A"><p>x</p></section></document>);
  assert.throws(
    () => resolveDocument(doc, template),
    /page-variant.+must be a direct child of `page-set`/
  );
});

test("styles dialect can target sections by pageVariant via attr selector", () => {
  // No new selector needed — the existing `attr` match key reads
  // arbitrary fields off the resolved node, so the styles dialect
  // can already pick out sections by their variant.
  const doc = renderContentToIR(
    <document title="X">
      <section page="main" pageVariant="opener" title="Opener"><p>hi</p></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <styles>{`
        .opener-section { background: yellow; }
      `}</styles>
      <rule
        match={{ kind: "section", attr: { pageVariant: "opener" } }}
        className="opener-section"
      />
      <page-set name="main" style={{ size: "a4", margin: "25mm" }}>
        <region><slot name="body" /></region>
        <page-variant name="opener" />
      </page-set>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  assert.match(html, /<section[^>]*class="opener-section"/);
});

test("rule with inline style lifts declarations into a synthetic class", () => {
  // Authors can attach one-off declarations directly via
  // <rule style={...}> instead of writing a <styles> block + binding.
  // Matches the symmetry with <role style={...}>. Promoted concepts
  // (flow-span etc.) lower through the same path.
  const doc = renderContentToIR(
    <document title="X">
      <section title="A">
        <figure variant="wide" src="x.png" />
        <p>body</p>
      </section>
    </document>
  );
  const template = renderTemplateToIR(
    <page style={{ size: "a4", margin: "20mm" }}>
      <rule
        match={{ kind: "figure", variant: "wide" }}
        style={{ flowSpan: "container", margin: "8pt 0" }}
      />
      <region style={{ columns: 2 }}><slot name="body" /></region>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // A synthetic class was generated, attached to the matching figure,
  // and emitted with both the lowered flow-span concept and the raw
  // margin passthrough.
  assert.match(html, /<figure[^>]*class="__rwsyn-\d+"/);
  assert.match(html, /\.__rwsyn-\d+\{[^}]*column-span:all/);
  assert.match(html, /\.__rwsyn-\d+\{[^}]*margin:8pt 0/);
});

test("rule accepts both className and style; node gets both classes", () => {
  // When both are provided the rule produces two bindings — the
  // named class and the synthetic. Useful for layering one-off
  // overrides on top of a shared style.
  const doc = renderContentToIR(
    <document title="X">
      <section title="A"><figure variant="wide" src="x.png" /></section>
    </document>
  );
  const template = renderTemplateToIR(
    <page style={{ size: "a4", margin: "20mm" }}>
      <styles>{`.shared { padding: 4pt; }`}</styles>
      <rule
        match={{ kind: "figure", variant: "wide" }}
        className="shared"
        style={{ marginTop: "12pt" }}
      />
      <stack><slot name="body" /></stack>
    </page>
  );
  const html = renderResolvedToHTML(resolveDocument(doc, template));
  // Both classes land on the figure.
  assert.match(html, /<figure[^>]*class="[^"]*shared[^"]*"/);
  assert.match(html, /<figure[^>]*class="[^"]*__rwsyn-\d+[^"]*"/);
  // Both class definitions emitted.
  assert.match(html, /\.shared\{padding:4pt/);
  assert.match(html, /\.__rwsyn-\d+\{margin-top:12pt/);
});

test("rule without className or style is rejected at factory time", () => {
  // Catches a common mistake: forgetting both forms.
  assert.throws(() =>
    renderTemplateToIR(
      <page style={{ size: "a4" }}>
        <rule match={{ kind: "figure" }} />
        <stack><slot name="body" /></stack>
      </page>
    )
  );
});

test("template renderer surfaces unknown-intrinsic errors instead of swallowing them", () => {
  // react-reconciler catches sync throws from createInstance and
  // aborts the commit silently, leaving the author with a useless
  // "produced no root node" downstream. The host config now stashes
  // those errors on the container so renderTemplateToIR rethrows
  // the real cause.
  assert.throws(
    () =>
      renderTemplateToIR(
        <page style={{ size: "a4" }}>
          {/* div is not a template intrinsic */}
          {React.createElement("div", { className: "oops" })}
          <stack><slot name="body" /></stack>
        </page>
      ),
    /Unsupported template intrinsic: div/
  );
});

test("content renderer surfaces unknown-intrinsic errors instead of swallowing them", () => {
  assert.throws(
    () =>
      renderContentToIR(
        <document title="x">
          <section title="A">
            {/* widget is not a content intrinsic */}
            {React.createElement("widget", { foo: 1 })}
          </section>
        </document>
      ),
    /Unsupported content intrinsic: widget/
  );
});
