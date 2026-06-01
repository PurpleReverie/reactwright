import type {
  ResolvedFixedNode,
  ResolvedPageNode
} from "../../resolver/ir.js";
import { lowerStylesheet } from "../../styles/lower.js";
import type { StylesheetAst } from "../../styles/ir.js";
import { setRenderScopeClassBindings } from "./class-bindings.js";
import {
  buildAtPageRule,
  buildBodyTextRule,
  buildFootnoteAreaCss,
  buildMarginMatterCss,
  buildPageBackgroundLayersCss,
  buildPageRegimesCss,
  buildRoleVariantCss,
  buildRunningStringsCss,
  buildSidenoteAreaCss,
  styleToCss
} from "./css.js";
import { buildFontHeadTags, hasMathNodes, KATEX_CSS } from "./fonts.js";
import { setRenderScopeRegimeFlows } from "./content.js";
import {
  collectMarginMatter,
  collectRunningStringNames,
  renderChildren,
  renderFixedNode,
  renderLayerNode,
  renderResolvedChild
} from "./template.js";

// Re-export styleToCss for the custom-intrinsic registry callback shape.
export { styleToCss };

const PAGED_JS_SCRIPT = "https://unpkg.com/pagedjs/dist/paged.polyfill.js";

// Static CSS defaults applied to every document. Strictly machinery
// (counter wiring, target-counter / target-text functions, page
// number/count counters, math-block centering geometry) plus a
// minimal typography reset (margin: 0 on block elements, headings
// don't inherit justify, paragraphs don't stretch their last line).
//
// Cosmetic defaults — heading font sizes, paragraph/section spacing,
// code styling, table borders, blockquote bars — are NOT in this
// block. They are opinionated and would force every template to
// fight the engine. Templates that want a "looks reasonable out of
// the box" baseline can opt into `defaultTypography` from
// reactwright/typography via customCss.
const STATIC_DEFAULTS_CSS = [
  // ── machinery: page chrome and counters ───────────────────────
  "body{margin:0;}",
  ".reactwright-flow{box-sizing:border-box;position:relative;}",
  ".reactwright-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}",
  ".reactwright-page-number::before{content:counter(page);}",
  ".reactwright-page-count::before{content:counter(pages);}",
  // ── machinery: cross-references and citations ────────────────
  ".reactwright-ref-number::after{content:target-counter(attr(href url), reactwright-ref);}",
  ".reactwright-ref-page::after{content:target-counter(attr(href url), page);}",
  ".reactwright-ref-title::after{content:target-text(attr(href url));}",
  ".reactwright-ref-number-and-page::after{content:target-counter(attr(href url), reactwright-ref) ' ' target-counter(attr(href url), page);}",
  ".reactwright-cite::after{content:target-counter(attr(href url), reactwright-bib);}",
  // Bibliography counter wiring lives in CSS rules (not inline
  // styles on the <li>) so that target-counter() resolves
  // correctly across Paged.js page chunks. The userland
  // `<Bibliography>` helper sets `counter="reactwright-bib"` on its
  // `<section>`, which emits as `data-counter="reactwright-bib"`,
  // so `<cite>` cross-refs (resolved via
  // `target-counter(attr(href url), reactwright-bib)`) produce
  // `[1]`, `[2]`, … against the entry list.
  "[data-counter=\"reactwright-bib\"]{counter-reset:reactwright-bib;}",
  "[data-counter=\"reactwright-bib\"] ol > li{counter-increment:reactwright-bib;}",
  // reactwright-ref counter: incremented on every id-bearing element
  // that can be the target of <ref show="number">. Same constraint
  // as reactwright-bib — must be a CSS rule, not inline, so Paged.js
  // resolves target-counter() across pages. Single shared counter
  // returns ordinal position; per-kind counters (figure number vs
  // section number) would require a richer ref API.
  ".reactwright-flow{counter-reset:reactwright-ref;}",
  ".reactwright-flow section[id],.reactwright-flow figure[id],.reactwright-flow table[id],.reactwright-flow [data-node='math-block'][id]{counter-increment:reactwright-ref;}",
  ".reactwright-index-pageref::after{content:target-counter(attr(href url), page);}",
  ".reactwright-index-pagerefs a + a::before{content:', ';}",
  // ── machinery: TOC / list-of leader formatting ────────────────
  // Classes consumed by the userland `<Toc>` / `<ListOf>` helpers in
  // `reactwright/userland`. The page-number column is an empty
  // anchor; ::after pulls in the target page via target-counter().
  // Userland `<Toc>` / `<ListOf>` wrap their two link siblings in a
  // `<p>` (the `<item>` grammar requires a block child), so the flex
  // layout lives on the inner `<p>`, not the `<li>` wrapper.
  ".reactwright-toc-entry > p{display:flex;justify-content:space-between;}",
  ".reactwright-toc-link,.reactwright-toc-page{text-decoration:none;color:inherit;}",
  ".reactwright-toc-page::after{content:target-counter(attr(href url), page);}",
  ".reactwright-list-of-entry > p{display:flex;justify-content:space-between;}",
  ".reactwright-list-of-link,.reactwright-list-of-page{text-decoration:none;color:inherit;}",
  ".reactwright-list-of-page::after{content:target-counter(attr(href url), page);}",
  // ── reset: block elements have no UA margin ───────────────────
  "h1,h2,h3,h4,h5,h6,p,figure,table,blockquote,ul,ol,pre{margin:0;}",
  // Headings shouldn't inherit text-align: justify from a parent
  // region — that produces gigantic word-spacing in short titles.
  // `text-align-last:left` is also required: when the parent column
  // flow inherits `text-align: justify`, the heading's single line
  // still computes as a "last line" and gets word-spread without it.
  "h1,h2,h3,h4,h5,h6{text-align:left;text-align-last:left;}",
  // Last-line of justified paragraphs aligns to start (left in LTR),
  // not stretched. Without this Chrome can produce word-spread gaps
  // on the final line.
  ".reactwright-flow p{text-align-last:left;}",
  // Inline code: monospace font only. No background, padding, or
  // border — those are opinionated cosmetics.
  "code{font-family:'SFMono-Regular',Consolas,Menlo,monospace;}",
  // Table cells need border-collapse for any border styling to
  // compose; width:100% is a sensible default. No cell borders.
  "table{border-collapse:collapse;width:100%;}",
  "figure img{max-width:100%;height:auto;}",
  // ── machinery: math block centering ───────────────────────────
  ".reactwright-math-block{position:relative;text-align:center;margin:0.6em 0;}",
  ".reactwright-math-block .katex-display{margin:0;text-align:center;}",
  ".reactwright-math-block .katex-display>.katex{display:inline-block;text-align:initial;}",
  ".reactwright-math-block[data-variant]::before{position:absolute;right:0;top:50%;transform:translateY(-50%);font-style:normal;text-align:right;}"
].join("");

// Render a resolved page IR to a complete HTML document for Paged.js.
// Coordinates per-subsystem builders (CSS, fonts, margin matter,
// content body) and stitches them together. All subsystem details live
// in dedicated modules; this function is composition only.
export function renderResolvedToHTML(page: ResolvedPageNode): string {
  setRenderScopeRegimeFlows(page.regimeFlows);
  setRenderScopeClassBindings(page.classBindings);

  // 1. Compute the per-document CSS pieces.
  const atPageRule = buildAtPageRule(page.style);
  const bodyTextRule = buildBodyTextRule(page.style);
  const pageBackgroundLayersCss = buildPageBackgroundLayersCss(page);
  const pageRegimesCss = buildPageRegimesCss(page);
  const footnoteAreaCss = buildFootnoteAreaCss(page);
  const sidenoteAreaCss = buildSidenoteAreaCss(page);
  const variantRulesCss = buildRoleVariantCss(page);

  const runningNames = new Set<string>();
  collectRunningStringNames(page, runningNames);
  // Built-in auto-set strings: include even without explicit <running>
  // references so that templates added later in the same session see
  // the wiring.
  runningNames.add("document-title");
  runningNames.add("section-title");
  runningNames.add("chapter-title");
  const runningStringsCss = buildRunningStringsCss(runningNames);

  // 2. Margin matter (headers/footers): collect, then build CSS +
  // running-element HTML.
  const marginMatter = collectMarginMatter(page);
  const marginMatterCss = buildMarginMatterCss(marginMatter);
  const marginMatterHtml = marginMatter.map((e) => e.html).join("");

  // 3. Fixed overlays (page.children of kind "fixed") render outside
  // the main flow.
  const overlays = page.children
    .filter((child): child is ResolvedFixedNode => child.kind === "fixed")
    .map((child) => renderFixedNode(child, renderChildren(child.children)))
    .join("");

  // 4. Main body: everything except fixed, header, footer, and
  // content-less layers (those become @page background CSS, not
  // in-flow divs).
  const flowChildren = page.children.filter(
    (child) =>
      child.kind !== "fixed" &&
      child.kind !== "header" &&
      child.kind !== "footer" &&
      !(child.kind === "layer" && child.children.length === 0)
  );

  // Content layers stack by JSX position relative to non-layer
  // content. A layer that appears before the first non-layer child
  // sits behind it (negative z-index); one that appears after sits in
  // front (positive).
  const firstContentIdx = flowChildren.findIndex((c) => c.kind !== "layer");
  let beforeIdx = 0;
  let afterIdx = 0;
  const flowBody = flowChildren
    .map((child, idx) => {
      if (child.kind === "layer") {
        const before = firstContentIdx === -1 || idx < firstContentIdx;
        const z = before ? -10 - beforeIdx : 10 + afterIdx;
        if (before) beforeIdx += 1;
        else afterIdx += 1;
        return renderLayerNode(child, z, renderChildren(child.children));
      }
      return renderResolvedChild(child);
    })
    .join("");

  // 5. Font and KaTeX head tags.
  const fontTags = buildFontHeadTags(page);

  // 6. Assemble the style block. Order matters for cascade:
  //   1. machinery (engine defaults)
  //   2. template-applied styles dialect (named classes from <styles>)
  //   3. template-supplied customCss (last so it can override)
  const customCss = typeof page.style?.customCss === "string" ? page.style.customCss : "";
  const stylesCss = page.stylesheet != null
    ? lowerStylesheet(page.stylesheet as StylesheetAst)
    : "";
  const styleRules = [
    atPageRule ?? "",
    pageRegimesCss,
    pageBackgroundLayersCss,
    bodyTextRule ?? "",
    marginMatterCss,
    runningStringsCss,
    footnoteAreaCss,
    sidenoteAreaCss,
    variantRulesCss,
    STATIC_DEFAULTS_CSS,
    stylesCss,
    customCss
  ]
    .filter((s) => s.length > 0)
    .join("");

  // 7. Final document.
  const html = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>Reactwright Preview</title>",
    ...fontTags,
    hasMathNodes(page) ? `<link rel="stylesheet" href="${KATEX_CSS}" />` : "",
    `<style>${styleRules}</style>`,
    `<script src="${PAGED_JS_SCRIPT}"></script>`,
    "</head>",
    "<body>",
    marginMatterHtml,
    overlays.length > 0 ? `<div class="reactwright-overlay">${overlays}</div>` : "",
    `<div class="reactwright-flow">${flowBody}</div>`,
    "</body>",
    "</html>"
  ]
    .filter((s) => s.length > 0)
    .join("");

  setRenderScopeRegimeFlows(undefined);
  setRenderScopeClassBindings(undefined);
  return html;
}
