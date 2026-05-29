import type {
  ResolvedFixedNode,
  ResolvedPageNode
} from "../../resolver/ir.js";
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

// Static CSS defaults applied to every document. Kept here (rather
// than in css.ts) because they aren't computed from any page IR — they
// are a fixed reset / typography baseline. If a default needs to vary
// by document configuration, lift it into a `build*Css` function in
// css.ts.
const STATIC_DEFAULTS_CSS = [
  "body{margin:0;}",
  ".reactdoc-flow{box-sizing:border-box;position:relative;}",
  ".reactdoc-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}",
  ".reactdoc-page-number::before{content:counter(page);}",
  ".reactdoc-page-count::before{content:counter(pages);}",
  ".reactdoc-ref-number::after{content:target-counter(attr(href url), reactdoc-ref);}",
  ".reactdoc-ref-page::after{content:target-counter(attr(href url), page);}",
  ".reactdoc-ref-title::after{content:target-text(attr(href url));}",
  ".reactdoc-ref-number-and-page::after{content:target-counter(attr(href url), reactdoc-ref) ' on p. ' target-counter(attr(href url), page);}",
  ".reactdoc-cite::before{content:'[';}",
  ".reactdoc-cite::after{content:target-counter(attr(href url), reactdoc-bib) ']';}",
  ".reactdoc-bibliography ol{padding-left:1.5em;}",
  ".reactdoc-index-pageref::after{content:target-counter(attr(href url), page);}",
  ".reactdoc-index-pagerefs a + a::before{content:', ';}",
  ".reactdoc-toc ol{list-style:none;padding-left:0;}",
  ".reactdoc-toc-link{display:flex;justify-content:space-between;text-decoration:none;color:inherit;}",
  ".reactdoc-toc-page::after{content:target-counter(attr(href url, '#'), page);}",
  ".reactdoc-toc-depth-2{padding-left:1.5em;}",
  ".reactdoc-toc-depth-3{padding-left:3em;}",
  ".reactdoc-toc-depth-4{padding-left:4.5em;}",
  ".reactdoc-list-of ol{list-style:none;padding-left:0;}",
  ".reactdoc-list-of-link{display:flex;justify-content:space-between;text-decoration:none;color:inherit;}",
  ".reactdoc-list-of-page::after{content:target-counter(attr(href url, '#'), page);}",
  "h1,h2,h3,h4,h5,h6,p,figure,table,blockquote,ul,ol,pre{margin:0;}",
  // Headings should never inherit text-align: justify from a parent
  // region — that produces gigantic word-spacing in short titles.
  // Default to left alignment unless a role rule explicitly opts in.
  "h1,h2,h3,h4,h5,h6{text-align:left;}",
  "h1{font-size:1.6em;font-weight:bold;margin-bottom:0.4em;}",
  "h2{font-size:1.2em;font-weight:bold;margin-top:1em;margin-bottom:0.25em;}",
  "h3{font-size:1.05em;font-weight:bold;margin-top:0.8em;margin-bottom:0.2em;}",
  "p + p{margin-top:0.6em;}",
  "section + section{margin-top:1em;}",
  "blockquote{padding-left:1.5em;border-left:2px solid #cbd5e1;}",
  "ul,ol{padding-left:1.5em;}",
  "li + li{margin-top:0.25em;}",
  "code{font-family:'SFMono-Regular',Consolas,Menlo,monospace;background:#f1f5f9;padding:0.1em 0.25em;border-radius:0.2em;}",
  "table{border-collapse:collapse;width:100%;}",
  "th,td{border:1px solid #cbd5e1;padding:0.25em 0.5em;text-align:left;}",
  "figure img{max-width:100%;height:auto;}",
  // Math block centering is robust against parent text-align:justify
  // by pinning the inner .katex-display to a centered block. The
  // numbered-equation ::before counter floats at the right margin.
  ".reactdoc-math-block{position:relative;text-align:center;margin:0.6em 0;}",
  ".reactdoc-math-block .katex-display{margin:0;text-align:center;}",
  ".reactdoc-math-block .katex-display>.katex{display:inline-block;text-align:initial;}",
  ".reactdoc-math-block[data-variant]::before{position:absolute;right:0;top:50%;transform:translateY(-50%);font-style:normal;text-align:right;}"
].join("");

// Render a resolved page IR to a complete HTML document for Paged.js.
// Coordinates per-subsystem builders (CSS, fonts, margin matter,
// content body) and stitches them together. All subsystem details live
// in dedicated modules; this function is composition only.
export function renderResolvedToHTML(page: ResolvedPageNode): string {
  setRenderScopeRegimeFlows(page.regimeFlows);

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

  // 6. Assemble the style block.
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
    STATIC_DEFAULTS_CSS
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
    "<title>ReactDoc Preview</title>",
    ...fontTags,
    hasMathNodes(page) ? `<link rel="stylesheet" href="${KATEX_CSS}" />` : "",
    `<style>${styleRules}</style>`,
    `<script src="${PAGED_JS_SCRIPT}"></script>`,
    "</head>",
    "<body>",
    marginMatterHtml,
    overlays.length > 0 ? `<div class="reactdoc-overlay">${overlays}</div>` : "",
    `<div class="reactdoc-flow">${flowBody}</div>`,
    "</body>",
    "</html>"
  ]
    .filter((s) => s.length > 0)
    .join("");

  setRenderScopeRegimeFlows(undefined);
  return html;
}
