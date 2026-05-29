import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
import {
  anchorToCss,
  coordinateAnchorToCss,
  escapeHtml,
  idAttr,
  normalizeImageSrc,
  regionPositioningCss
} from "./utils.js";
import { KATEX_CSS, buildFontHeadTags, hasMathNodes, renderTeX } from "./fonts.js";
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
  styleToCss,
  styleToInlineCss,
  type MarginMatterEntry
} from "./css.js";

// Re-export styleToCss for the custom-intrinsic registry callback shape.
export { styleToCss };
import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedCellNode,
  ResolvedChild,
  ResolvedCodeBlockNode,
  ResolvedCodeNode,
  ResolvedContentNode,
  ResolvedColumnNode,
  ResolvedColumnsNode,
  ResolvedCustomTemplateNode,
  ResolvedDefNode,
  ResolvedDefsNode,
  ResolvedEmNode,
  ResolvedHeadingNode,
  ResolvedFigureNode,
  ResolvedFixedNode,
  ResolvedFooterNode,
  ResolvedHeaderNode,
  ResolvedImageNode,
  ResolvedInlineImgNode,
  ResolvedInlineNode,
  ResolvedLayerNode,
  ResolvedLinkNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedPageCountNode,
  ResolvedPageNode,
  ResolvedPageNumberNode,
  ResolvedParagraphNode,
  ResolvedPreNode,
  ResolvedRefNode,
  ResolvedBibliographyNode,
  ResolvedCiteNode,
  ResolvedIndexEntryNode,
  ResolvedIndexTemplateNode,
  ResolvedTocNode,
  ResolvedListOfNode,
  ResolvedFootnoteAreaNode,
  ResolvedFootnoteNode,
  ResolvedSidenoteAreaNode,
  ResolvedSidenoteNode,
  ResolvedInlineMathNode,
  ResolvedMathNode,
  ResolvedRegionNode,
  ResolvedRowNode,
  ResolvedRunningNode,
  ResolvedSectionNode,
  ResolvedSetRunningNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedTableNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "../../resolver/ir.js";

const PAGED_JS_SCRIPT = "https://unpkg.com/pagedjs/dist/paged.polyfill.js";

// Style keys that belong to the @page rule (page geometry) and should NOT
// be re-emitted as inline CSS on region/stack/column elements. `columns`
// and `columnGap` used to be in this set, but multi-column layout is per
// element, not page-level, so they need to flow through to inline CSS.
function renderTextNode(node: ResolvedTextNode): string {
  return escapeHtml(node.value);
}

function renderLinkNode(node: ResolvedLinkNode): string {
  const titleAttr = node.title != null ? ` title="${escapeHtml(node.title)}"` : "";
  return `<a href="${escapeHtml(node.href)}"${titleAttr}>${node.children.map(renderInlineNode).join("")}</a>`;
}

function renderInlineNode(node: ResolvedInlineNode): string {
  switch (node.kind) {
    case "text":
      return renderTextNode(node);
    case "em":
      return `<em>${node.children.map(renderInlineNode).join("")}</em>`;
    case "strong":
      return `<strong>${node.children.map(renderInlineNode).join("")}</strong>`;
    case "code":
      return `<code>${node.children.map(renderTextNode).join("")}</code>`;
    case "link":
      return renderLinkNode(node);
    case "br":
      return "<br />";
    case "sub":
      return `<sub>${node.children.map(renderInlineNode).join("")}</sub>`;
    case "sup":
      return `<sup>${node.children.map(renderInlineNode).join("")}</sup>`;
    case "img":
      return renderInlineImgNode(node);
    case "ref":
      return renderRefNode(node);
    case "footnote":
      return renderFootnoteNode(node);
    case "m":
      return renderInlineMathNode(node);
    case "cite":
      return renderCiteNode(node);
    case "index":
      return renderIndexEntryNode(node);
    case "sidenote":
      return renderSidenoteNode(node);
  }

  throw new Error("Unsupported resolved inline node.");
}

function renderInlineImgNode(node: ResolvedInlineImgNode): string {
  const widthAttr = node.width != null ? ` width="${escapeHtml(node.width)}"` : "";
  const heightAttr = node.height != null ? ` height="${escapeHtml(node.height)}"` : "";
  const altAttr = ` alt="${escapeHtml(node.alt ?? "")}"`;
  return `<img data-inline src="${escapeHtml(normalizeImageSrc(node.src))}"${altAttr}${widthAttr}${heightAttr} />`;
}

function refClassFor(show: string): string {
  return `reactdoc-ref reactdoc-ref-${show}`;
}

function renderRefNode(node: ResolvedRefNode): string {
  const href = `#${escapeHtml(node.to)}`;
  return `<a data-node="ref" data-ref-to="${escapeHtml(node.to)}" data-ref-show="${escapeHtml(node.show)}" class="${refClassFor(node.show)}" href="${href}"></a>`;
}

function renderFootnoteNode(node: ResolvedFootnoteNode): string {
  const markerAttr = node.marker != null ? ` data-marker="${escapeHtml(node.marker)}"` : "";
  const inner = node.children.map(renderInlineNode).join("");
  return `<span data-node="footnote"${markerAttr} class="reactdoc-footnote">${inner}</span>`;
}

function renderSidenoteNode(node: ResolvedSidenoteNode): string {
  const inner = node.children.map(renderInlineNode).join("");
  return `<span data-node="sidenote" class="reactdoc-sidenote">${inner}</span>`;
}

function renderInlineMathNode(node: ResolvedInlineMathNode): string {
  return `<span data-node="math-inline" class="reactdoc-math reactdoc-math-inline">${renderTeX(node.src, false)}</span>`;
}

function renderMathNode(node: ResolvedMathNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<div data-node="math-block"${idAttr(node.id)}${variantAttr} class="reactdoc-math reactdoc-math-block">${renderTeX(node.src, true)}</div>`;
}

function renderIndexEntryNode(node: ResolvedIndexEntryNode): string {
  return `<span data-node="index-entry" data-index-term="${escapeHtml(node.term)}" id="${escapeHtml(node.anchorId)}" hidden></span>`;
}

function renderListOfNode(node: ResolvedListOfNode): string {
  const title = node.title != null ? `<h2 class="reactdoc-list-of-title">${escapeHtml(node.title)}</h2>` : "";
  const items = node.entries
    .map(
      (e) =>
        `<li class="reactdoc-list-of-entry"><a class="reactdoc-list-of-link" href="#${escapeHtml(e.id)}"><span class="reactdoc-list-of-text">${escapeHtml(e.caption)}</span><span class="reactdoc-list-of-page"></span></a></li>`
    )
    .join("");
  return `<nav data-node="list-of" data-of="${escapeHtml(node.of)}" class="reactdoc-list-of">${title}<ol>${items}</ol></nav>`;
}

function renderTocNode(node: ResolvedTocNode): string {
  const title = node.title != null ? `<h2 class="reactdoc-toc-title">${escapeHtml(node.title)}</h2>` : "";
  const items = node.entries
    .map((e) => {
      const depthClass = ` class="reactdoc-toc-entry reactdoc-toc-depth-${e.depth}"`;
      const numberedAttr = node.numbered === true ? ` data-numbered="true"` : "";
      return `<li${depthClass}${numberedAttr}><a class="reactdoc-toc-link" href="#${escapeHtml(e.id)}"><span class="reactdoc-toc-text">${escapeHtml(e.title)}</span><span class="reactdoc-toc-page"></span></a></li>`;
    })
    .join("");
  return `<nav data-node="toc" class="reactdoc-toc">${title}<ol>${items}</ol></nav>`;
}

function renderIndexTemplateNode(node: ResolvedIndexTemplateNode): string {
  const title = node.title != null ? `<h2 class="reactdoc-index-title">${escapeHtml(node.title)}</h2>` : "";
  const items = node.entries
    .map((e) => {
      const refs = e.anchorIds
        .map(
          (id) =>
            `<a class="reactdoc-index-pageref" href="#${escapeHtml(id)}"></a>`
        )
        .join(", ");
      return `<li data-index-term="${escapeHtml(e.term)}">${escapeHtml(e.term)}<span class="reactdoc-index-pagerefs"> ${refs}</span></li>`;
    })
    .join("");
  return `<section data-node="index" class="reactdoc-index">${title}<ul>${items}</ul></section>`;
}

function renderCiteNode(node: ResolvedCiteNode): string {
  const href = `#${escapeHtml("reactdoc-bib-" + node.cite)}`;
  return `<a data-node="cite" data-cite-key="${escapeHtml(node.cite)}" class="reactdoc-cite" href="${href}"></a>`;
}

function renderBibliographyNode(node: ResolvedBibliographyNode): string {
  const title = node.title != null ? `<h2 class="reactdoc-bibliography-title">${escapeHtml(node.title)}</h2>` : "";
  // Each entry carries an explicit reactdoc-bib counter increment so that
  // <cite> can resolve to the right number via target-counter(url, reactdoc-bib).
  // Implicit list-item counters do not survive Paged.js chunking reliably.
  const items = node.entries
    .map((e) => {
      const usedAttr = e.used ? ` data-used="true"` : "";
      const body =
        e.inline != null && e.inline.length > 0
          ? e.inline.map((c) => renderInlineNode(c)).join("")
          : escapeHtml(e.text ?? e.key);
      return `<li id="reactdoc-bib-${escapeHtml(e.key)}" data-bib-key="${escapeHtml(e.key)}"${usedAttr} style="counter-increment:reactdoc-bib;">${body}</li>`;
    })
    .join("");
  return `<section data-node="bibliography" class="reactdoc-bibliography" style="counter-reset:reactdoc-bib;">${title}<ol>${items}</ol></section>`;
}

function renderParagraphNode(node: ResolvedParagraphNode): string {
  const inner = node.children.map(renderInlineNode).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<p${idAttr(node.id)}${variantAttr}>${inner}</p>`;
}

function renderFigureNode(node: ResolvedFigureNode): string {
  const widthStyle = node.width != null ? ` style="width:${escapeHtml(node.width)};"` : "";
  // Default alt to empty so a broken-image fallback doesn't double up the
  // figcaption text in the rendered output. Callers that want an explicit
  // accessibility description should set `alt` themselves.
  const alt = escapeHtml(node.alt ?? "");
  const caption =
    node.caption != null ? `<figcaption>${escapeHtml(node.caption)}</figcaption>` : "";
  return `<figure${idAttr(node.id)}><img src="${escapeHtml(normalizeImageSrc(node.src))}" alt="${alt}"${widthStyle} />${caption}</figure>`;
}

function renderCellNode(node: ResolvedCellNode): string {
  const tag = node.header === true ? "th" : "td";
  return `<${tag}>${node.children.map((child) => renderContentNode(child)).join("")}</${tag}>`;
}

function renderRowNode(node: ResolvedRowNode): string {
  return `<tr>${node.children.map((child) => renderCellNode(child)).join("")}</tr>`;
}

function renderTableNode(node: ResolvedTableNode): string {
  const caption = node.caption != null ? `<caption>${escapeHtml(node.caption)}</caption>` : "";
  return `<table${idAttr(node.id)}>${caption}<tbody>${node.children.map((child) => renderRowNode(child)).join("")}</tbody></table>`;
}

function renderCodeBlockNode(node: ResolvedCodeBlockNode): string {
  const dataAttr = node.language != null ? ` data-language="${escapeHtml(node.language)}"` : "";
  return `<pre${idAttr(node.id)}${dataAttr}><code>${node.children.map(renderTextNode).join("")}</code></pre>`;
}

function renderPreNode(node: ResolvedPreNode): string {
  return `<pre${idAttr(node.id)} data-node="pre">${node.children.map(renderTextNode).join("")}</pre>`;
}

function renderPageNumberNode(_node: ResolvedPageNumberNode): string {
  return '<span data-node="page-number" class="reactdoc-page-number"></span>';
}

function renderPageCountNode(_node: ResolvedPageCountNode): string {
  return '<span data-node="page-count" class="reactdoc-page-count"></span>';
}

function runningClassFor(name: string): string {
  return `reactdoc-running-${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function renderRunningNode(node: ResolvedRunningNode): string {
  const policyAttr = node.policy != null ? ` data-policy="${escapeHtml(node.policy)}"` : "";
  return `<span data-node="running" data-running-name="${escapeHtml(node.name)}"${policyAttr} class="${runningClassFor(node.name)}"></span>`;
}

function renderImageNode(node: ResolvedImageNode): string {
  const declarations: string[] = [];
  if (node.fill === true) {
    declarations.push("position:absolute;", "inset:0;", "width:100%;", "height:100%;");
  } else if (node.width != null) {
    declarations.push(`width:${node.width};`);
  }
  if (node.cover === true) declarations.push("object-fit:cover;");
  if (node.contain === true) declarations.push("object-fit:contain;");
  const inline = styleToInlineCss(node.style, "region");
  const combined = declarations.join("") + inline;
  const styleAttr = combined.length > 0 ? ` style="${escapeHtml(combined)}"` : "";
  const altAttr = ` alt="${escapeHtml(node.alt ?? "")}"`;
  return `<img data-node="image" src="${escapeHtml(normalizeImageSrc(node.src))}"${altAttr}${styleAttr} />`;
}

function renderSetRunningNode(node: ResolvedSetRunningNode): string {
  return `<span data-node="set-running" data-running-name="${escapeHtml(node.name)}" class="reactdoc-set ${runningClassFor(node.name)}-source" hidden>${escapeHtml(node.value)}</span>`;
}

// Render-scoped regime-flow table. Set at the top of renderResolvedToHTML
// and cleared in a finally-shaped reset at the bottom. Lives at module
// scope because threading it through every container/content renderer
// would touch ~15 function signatures for a single read site
// (renderSectionNode). Acceptable because (a) the codebase renders one
// document per process, (b) renderResolvedToHTML is synchronous so there
// is no opportunity for parallel/reentrant access. If either invariant
// changes, lift this to an explicit RenderCtx threaded from
// renderResolvedToHTML through every renderer that calls renderSectionNode.
let renderScopeRegimeFlows: Record<string, ResolvedChild[]> | undefined;

function renderSectionNode(node: ResolvedSectionNode, depth = 1): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  const classes = ["reactdoc-section-title"];
  if (depth === 1) classes.push("reactdoc-chapter-title");
  const classAttr = ` class="${classes.join(" ")}"`;
  // Route the section to a named CSS Paged Media regime when `page=<name>`
  // was set. Paged.js honours `page: <name>` to put the element on a page
  // of that type, and inserts the appropriate page-break between adjacent
  // sections targeting different regimes.
  const regimeStyle =
    depth === 1 && typeof node.page === "string" && node.page.length > 0
      ? ` style="page:${escapeHtml(node.page)};"`
      : "";
  const titleHeading =
    node.title.length > 0
      ? `<h2${classAttr}${variantAttr}>${escapeHtml(node.title)}</h2>`
      : "";
  const sectionHtml = [
    `<section${idAttr(node.id)}${regimeStyle}>`,
    titleHeading,
    ...node.children.map((child) =>
      child.kind === "section"
        ? renderSectionNode(child, depth + 1)
        : renderContentNode(child)
    ),
    "</section>"
  ].join("");

  // Wrap depth-1 sections in their regime's flow template so a <page-set>
  // can declare per-regime layout (e.g. a script regime that wraps each
  // scene in a monospace block) while sections still stream in document
  // order.
  if (
    depth === 1 &&
    typeof node.page === "string" &&
    node.page.length > 0 &&
    renderScopeRegimeFlows != null
  ) {
    const flow = renderScopeRegimeFlows[node.page];
    if (flow != null && flow.length > 0) {
      return flow.map((c) => renderRegimeFlowNode(c, sectionHtml)).join("");
    }
  }
  return sectionHtml;
}

// Renders a regime-flow template node, substituting the body-slot marker
// with the section's pre-rendered HTML.
// Render a regime-flow node, substituting the body-slot marker with
// the already-rendered section HTML. For container kinds, recurses
// through the regime flow and feeds the substituted inner HTML to the
// same canonical container renderers used by the main flow — no
// parallel implementations.
function renderRegimeFlowNode(node: ResolvedChild, sectionHtml: string): string {
  if (node.kind === "body-slot") {
    return sectionHtml;
  }
  const renderRegimeChildren = (children: ResolvedChild[]): string =>
    children.map((c) => renderRegimeFlowNode(c, sectionHtml)).join("");

  switch (node.kind) {
    case "region":  return renderRegionNode(node,  renderRegimeChildren(node.children));
    case "stack":   return renderStackNode(node,   renderRegimeChildren(node.children));
    case "columns": return renderColumnsNode(node, renderRegimeChildren(node.children));
    case "column":  return renderColumnNode(node,  renderRegimeChildren(node.children));
    case "fixed":   return renderFixedNode(node,   renderRegimeChildren(node.children));
    default:        return renderResolvedChild(node);
  }
}

function renderBlockQuoteNode(node: ResolvedBlockQuoteNode): string {
  const children = node.children.map((child) => renderContentNode(child)).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<blockquote${idAttr(node.id)}${variantAttr}>${children}</blockquote>`;
}

function renderPageBreakNode(_node: ResolvedPageBreakNode): string {
  return '<div data-node="page-break" style="break-before:page;page-break-before:always;"></div>';
}

function renderListItemNode(node: ResolvedListItemNode): string {
  return `<li>${node.children.map((child) => renderContentNode(child)).join("")}</li>`;
}

function renderListNode(node: ResolvedListNode): string {
  const tag = node.ordered ? "ol" : "ul";
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<${tag}${idAttr(node.id)}${variantAttr}>${node.children.map((child) => renderListItemNode(child)).join("")}</${tag}>`;
}

function renderDefNode(node: ResolvedDefNode): string {
  const term = `<dt>${escapeHtml(node.term)}</dt>`;
  const body = `<dd>${node.children.map((child) => renderContentNode(child)).join("")}</dd>`;
  return `${term}${body}`;
}

function renderDefsNode(node: ResolvedDefsNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<dl${idAttr(node.id)}${variantAttr}>${node.children.map((child) => renderDefNode(child)).join("")}</dl>`;
}

function renderAbstractNode(node: ResolvedAbstractNode): string {
  return [
    '<section data-slot="abstract">',
    "<h2>Abstract</h2>",
    ...node.children.map((child) => renderContentNode(child)),
    "</section>"
  ].join("");
}

function renderTitleNode(node: ResolvedTitleNode): string {
  return `<h1 class="reactdoc-document-title">${escapeHtml(node.value)}</h1>`;
}

function renderHeadingNode(node: ResolvedHeadingNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  const tag = `h${node.level}`;
  return `<${tag}${idAttr(node.id)}${variantAttr}>${escapeHtml(node.title)}</${tag}>`;
}

function renderAuthorNode(node: ResolvedAuthorNode): string {
  return `<p>${escapeHtml(node.value)}</p>`;
}

function renderContentNode(node: ResolvedContentNode): string {
  switch (node.kind) {
    case "title":
      return renderTitleNode(node);
    case "author":
      return renderAuthorNode(node);
    case "abstract":
      return renderAbstractNode(node);
    case "section":
      return renderSectionNode(node);
    case "figure":
      return renderFigureNode(node);
    case "table":
      return renderTableNode(node);
    case "code-block":
      return renderCodeBlockNode(node);
    case "pre":
      return renderPreNode(node);
    case "blockquote":
      return renderBlockQuoteNode(node);
    case "list":
      return renderListNode(node);
    case "defs":
      return renderDefsNode(node);
    case "def":
      return renderDefNode(node);
    case "heading":
      return renderHeadingNode(node);
    case "math":
      return renderMathNode(node);
    case "refs":
    case "ref-entry":
      // Reference entries are zero-render carriers; the bibliography
      // template node pulls their content via the resolver.
      return "";
    case "page-break":
      return renderPageBreakNode(node);
    case "set-running":
      return renderSetRunningNode(node);
    case "item":
      return renderListItemNode(node);
    case "paragraph":
      return renderParagraphNode(node);
    case "em":
    case "strong":
    case "code":
    case "link":
    case "br":
    case "sub":
    case "sup":
    case "img":
    case "ref":
    case "footnote":
    case "m":
    case "cite":
    case "index":
    case "sidenote":
      return renderInlineNode(node);
    case "text":
      return renderTextNode(node);
  }

  throw new Error("Unsupported resolved content node.");
}

function renderRegionNode(node: ResolvedRegionNode, innerHtml: string): string {
  const positioning = regionPositioningCss(node);
  const inline = styleToInlineCss(node.style, "region");
  const combined = positioning + inline;
  const styleAttr = combined.length > 0 ? ` style="${escapeHtml(combined)}"` : "";
  return `<div data-node="region"${styleAttr}>${innerHtml}</div>`;
}

function renderLayerNode(node: ResolvedLayerNode, zIndex: number, innerHtml: string): string {
  const nameAttr = node.name != null ? ` data-name="${escapeHtml(node.name)}"` : "";
  const whenAttr = node.when != null ? ` data-when="${escapeHtml(node.when)}"` : "";
  const inline = styleToInlineCss(node.style, "region");
  const positioning = `position:absolute;inset:0;z-index:${zIndex};`;
  const combined = positioning + inline;
  return `<div data-node="layer"${nameAttr}${whenAttr} style="${escapeHtml(combined)}">${innerHtml}</div>`;
}

function renderCustomNode(node: ResolvedCustomTemplateNode): string {
  const definition = getTemplateIntrinsic(node.name);
  if (definition?.html == null) {
    throw new Error(`No HTML renderer registered for custom template intrinsic: ${node.name}`);
  }

  return definition.html({
    props: {
      ...node.props,
      ...(node.style != null ? { style: node.style } : {})
    },
    children: node.children,
    renderChildren: (children) => children.map((child) => renderResolvedChild(child)).join(""),
    styleToCss,
    escapeHtml
  });
}

function renderColumnsNode(node: ResolvedColumnsNode, innerHtml: string): string {
  const widths = node.widths;
  const explicit = node.children.filter(
    (c): c is ResolvedColumnNode => (c as ResolvedChild).kind === "column"
  );
  const gap = node.gap ?? "8mm";
  let gridTemplate: string;
  if (explicit.length > 0) {
    gridTemplate = explicit
      .map((c, i) => c.width ?? widths?.[i] ?? "1fr")
      .join(" ");
  } else if (widths && widths.length > 0) {
    gridTemplate = widths.join(" ");
  } else {
    gridTemplate = "1fr 1fr";
  }
  const style = `display:grid;grid-template-columns:${gridTemplate};gap:${gap};${styleToInlineCss(node.style, "region")}`;
  return `<div data-node="columns" style="${escapeHtml(style)}">${innerHtml}</div>`;
}

function renderColumnNode(node: ResolvedColumnNode, innerHtml: string): string {
  const style = styleToInlineCss(node.style, "region");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="column"${styleAttr}>${innerHtml}</div>`;
}

function renderStackNode(node: ResolvedStackNode, innerHtml: string): string {
  const mergedStyle: TemplateStyle = {
    ...(node.style ?? {}),
    ...(node.gap != null ? { gap: node.gap } : {})
  };
  const style = styleToInlineCss(mergedStyle, "stack");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="stack"${styleAttr}>${innerHtml}</div>`;
}

// Render an array of children to a single concatenated HTML string.
// Used at every container call-site that needs to pass its rendered
// children into a container renderer's innerHtml parameter.
function renderChildren(children: ResolvedChild[]): string {
  return children.map((c) => renderResolvedChild(c)).join("");
}

function renderFixedNode(node: ResolvedFixedNode, innerHtml: string): string {
  const anchorCss =
    typeof node.anchor === "string" ? anchorToCss(node.anchor) : coordinateAnchorToCss(node.anchor);
  const style = [
    "position:absolute;",
    "z-index:2;",
    anchorCss,
    styleToInlineCss(node.style, "region")
  ].join("");
  const whenAttr = node.when != null ? ` data-when="${escapeHtml(node.when)}"` : "";
  const anchorAttr =
    typeof node.anchor === "string" ? ` data-anchor="${escapeHtml(node.anchor)}"` : "";
  return `<div data-node="fixed"${whenAttr}${anchorAttr} style="${escapeHtml(style)}">${innerHtml}</div>`;
}

function renderResolvedChild(node: ResolvedChild): string {
  switch (node.kind) {
    case "page":
      throw new Error("Nested page nodes are not supported in the resolved tree.");
    case "body-slot":
      // Body-slot markers live inside regime flow templates and are
      // substituted by the section renderer; they should never reach the
      // main flow.
      return "";
    case "body-stream":
      // Auto-streamed body sections: render each in document order.
      // Depth-1 sections with a regime get wrapped by renderSectionNode.
      return node.children
        .map((c) => (c.kind === "section" ? renderSectionNode(c, 1) : renderContentNode(c)))
        .join("");
    case "region":
      return renderRegionNode(node, renderChildren(node.children));
    case "stack":
      return renderStackNode(node, renderChildren(node.children));
    case "columns":
      return renderColumnsNode(node, renderChildren(node.children));
    case "column":
      return renderColumnNode(node, renderChildren(node.children));
    case "layer":
      return renderLayerNode(node, 0, renderChildren(node.children));
    case "page-number":
      return renderPageNumberNode(node);
    case "page-count":
      return renderPageCountNode(node);
    case "running":
      return renderRunningNode(node);
    case "image":
      return renderImageNode(node);
    case "fixed":
      return renderFixedNode(node, renderChildren(node.children));
    case "footnote-area":
      // footnote-area is extracted to @footnote margin-box CSS at the page level.
      return "";
    case "bibliography":
      return renderBibliographyNode(node);
    case "index-template":
      return renderIndexTemplateNode(node);
    case "toc":
      return renderTocNode(node);
    case "list-of":
      return renderListOfNode(node);
    case "sidenote-area":
      // sidenote-area is extracted to absolute-positioned margin CSS at the page level.
      return "";
    case "font":
      // font declarations are extracted to @font-face CSS in the head.
      return "";
    case "header":
    case "footer":
      // Header/footer are extracted to CSS margin boxes by the page renderer.
      // Reaching this case implies an unexpected nested placement.
      return "";
    case "custom":
      return renderCustomNode(node);
    case "title":
    case "author":
    case "abstract":
    case "section":
    case "figure":
    case "table":
    case "row":
    case "cell":
    case "code-block":
    case "pre":
    case "defs":
    case "def":
    case "heading":
    case "math":
    case "paragraph":
    case "blockquote":
    case "list":
    case "item":
    case "em":
    case "strong":
    case "code":
    case "link":
    case "br":
    case "sub":
    case "sup":
    case "img":
    case "ref":
    case "footnote":
    case "m":
    case "cite":
    case "index":
    case "sidenote":
    case "refs":
    case "ref-entry":
    case "text":
    case "page-break":
    case "set-running":
      return renderContentNode(node as ResolvedContentNode);
  }
}

function collectRunningStringNames(node: ResolvedPageNode | ResolvedChild, names: Set<string>): void {
  if ("kind" in node) {
    if (node.kind === "running" || node.kind === "set-running") {
      names.add(node.name);
    }
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectRunningStringNames(child as ResolvedChild, names);
    }
  }
}

function collectMarginMatter(page: ResolvedPageNode): MarginMatterEntry[] {
  const entries: MarginMatterEntry[] = [];
  let counter = 0;

  const visit = (children: ResolvedChild[]): void => {
    for (const child of children) {
      if (child.kind === "header" || child.kind === "footer") {
        const flowName = `reactdoc-${child.kind}-${counter}`;
        counter += 1;
        const inner = child.children.map((c) => renderResolvedChild(c)).join("");
        const html = `<div class="${flowName}" data-margin-flow="${flowName}">${inner}</div>`;
        entries.push({
          kind: child.kind,
          anchor: child.anchor,
          when: child.when,
          regime: child.regime,
          flowName,
          html
        });
        continue;
      }
    }
  };
  visit(page.children);
  // Also walk regime flow templates so chrome (header/footer) declared
  // inside a page-set still gets surfaced — though the resolver currently
  // hoists chrome to the page tree, regime flows are walked for safety.
  if (page.regimeFlows != null) {
    for (const flow of Object.values(page.regimeFlows)) {
      visit(flow);
    }
  }

  return entries;
}


export function renderResolvedToHTML(page: ResolvedPageNode): string {
  renderScopeRegimeFlows = page.regimeFlows;
  const atPageRule = buildAtPageRule(page.style);
  const bodyTextRule = buildBodyTextRule(page.style);
  const pageBackgroundLayersCss = buildPageBackgroundLayersCss(page);
  const pageRegimesCss = buildPageRegimesCss(page);
  const footnoteAreaCss = buildFootnoteAreaCss(page);
  const sidenoteAreaCss = buildSidenoteAreaCss(page);
  const variantRulesCss = buildRoleVariantCss(page);

  const runningNames = new Set<string>();
  collectRunningStringNames(page, runningNames);
  // Built-in auto-set strings: include even without explicit <running> references
  // so that templates added later in the same session see the wiring.
  runningNames.add("document-title");
  runningNames.add("section-title");
  runningNames.add("chapter-title");

  const runningStringsCss = buildRunningStringsCss(runningNames);

  const marginMatter = collectMarginMatter(page);
  const marginMatterCss = buildMarginMatterCss(marginMatter);
  const marginMatterHtml = marginMatter.map((e) => e.html).join("");

  const overlays = page.children
    .filter((child): child is ResolvedFixedNode => child.kind === "fixed")
    .map((child) => renderFixedNode(child, renderChildren(child.children)))
    .join("");

  const flowChildren = page.children.filter(
    (child) =>
      child.kind !== "fixed" &&
      child.kind !== "header" &&
      child.kind !== "footer" &&
      // Content-less layers are emitted as page-level @page background CSS,
      // not as in-flow divs.
      !(child.kind === "layer" && child.children.length === 0)
  );

  // Content layers stack by JSX position relative to non-layer content. A
  // layer that appears before the first non-layer child sits behind it
  // (negative z-index); one that appears after sits in front (positive).
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

  const fontTags = buildFontHeadTags(page);

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
    // Headings should never inherit text-align: justify from a parent region
    // — that produces gigantic word-spacing in short titles. Default to left
    // alignment unless a role rule explicitly opts in.
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
    // Math block centering is robust against parent text-align:justify by
    // pinning the inner .katex-display to a centered block. The numbered-
    // equation ::before counter floats at the right margin.
    ".reactdoc-math-block{position:relative;text-align:center;margin:0.6em 0;}",
    ".reactdoc-math-block .katex-display{margin:0;text-align:center;}",
    ".reactdoc-math-block .katex-display>.katex{display:inline-block;text-align:initial;}",
    ".reactdoc-math-block[data-variant]::before{position:absolute;right:0;top:50%;transform:translateY(-50%);font-style:normal;text-align:right;}"
  ]
    .filter((s) => s.length > 0)
    .join("");

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

  renderScopeRegimeFlows = undefined;
  return html;
}
