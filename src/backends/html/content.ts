import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedCellNode,
  ResolvedChild,
  ResolvedCodeBlockNode,
  ResolvedContentNode,
  ResolvedDefNode,
  ResolvedDefsNode,
  ResolvedFigureNode,
  ResolvedHeadingNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedMathNode,
  ResolvedPageBreakNode,
  ResolvedParagraphNode,
  ResolvedPreNode,
  ResolvedRowNode,
  ResolvedSectionNode,
  ResolvedSetRunningNode,
  ResolvedTableNode,
  ResolvedTitleNode
} from "../../resolver/ir.js";
import { escapeHtml, idAttr, normalizeImageSrc, runningClassFor } from "./utils.js";
import { renderTeX } from "./fonts.js";
import { renderInlineNode } from "./inline.js";
import { renderRegimeFlowNode } from "./regime-flow.js";

// Render-scoped regime-flow table. Set at the top of renderResolvedToHTML
// and cleared in a finally-shaped reset at the bottom. Lives at module
// scope because threading it through every container/content renderer
// would touch ~15 function signatures for a single read site
// (renderSectionNode). Acceptable because (a) the codebase renders one
// document per process, (b) renderResolvedToHTML is synchronous so
// there is no opportunity for parallel/reentrant access. If either
// invariant changes, lift this to an explicit RenderCtx threaded from
// renderResolvedToHTML through every renderer that calls
// renderSectionNode.
let renderScopeRegimeFlows: Record<string, ResolvedChild[]> | undefined;

export function setRenderScopeRegimeFlows(
  flows: Record<string, ResolvedChild[]> | undefined
): void {
  renderScopeRegimeFlows = flows;
}

export function renderParagraphNode(node: ResolvedParagraphNode): string {
  const inner = node.children.map(renderInlineNode).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<p${idAttr(node.id)}${variantAttr}>${inner}</p>`;
}

export function renderFigureNode(node: ResolvedFigureNode): string {
  const widthStyle = node.width != null ? ` style="width:${escapeHtml(node.width)};"` : "";
  // Default alt to empty so a broken-image fallback doesn't double up
  // the figcaption text. Callers that want an explicit accessibility
  // description should set `alt` themselves.
  const alt = escapeHtml(node.alt ?? "");
  const caption =
    node.caption != null ? `<figcaption>${escapeHtml(node.caption)}</figcaption>` : "";
  return `<figure${idAttr(node.id)}><img src="${escapeHtml(normalizeImageSrc(node.src))}" alt="${alt}"${widthStyle} />${caption}</figure>`;
}

export function renderCellNode(node: ResolvedCellNode): string {
  const tag = node.header === true ? "th" : "td";
  return `<${tag}>${node.children.map((child) => renderContentNode(child)).join("")}</${tag}>`;
}

export function renderRowNode(node: ResolvedRowNode): string {
  return `<tr>${node.children.map((child) => renderCellNode(child)).join("")}</tr>`;
}

export function renderTableNode(node: ResolvedTableNode): string {
  const caption = node.caption != null ? `<caption>${escapeHtml(node.caption)}</caption>` : "";
  return `<table${idAttr(node.id)}>${caption}<tbody>${node.children.map((child) => renderRowNode(child)).join("")}</tbody></table>`;
}

export function renderCodeBlockNode(node: ResolvedCodeBlockNode): string {
  const dataAttr = node.language != null ? ` data-language="${escapeHtml(node.language)}"` : "";
  return `<pre${idAttr(node.id)}${dataAttr}><code>${node.children.map((c) => escapeHtml(c.value)).join("")}</code></pre>`;
}

export function renderPreNode(node: ResolvedPreNode): string {
  return `<pre${idAttr(node.id)} data-node="pre">${node.children.map((c) => escapeHtml(c.value)).join("")}</pre>`;
}

export function renderMathNode(node: ResolvedMathNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<div data-node="math-block"${idAttr(node.id)}${variantAttr} class="reactwright-math reactwright-math-block">${renderTeX(node.src, true)}</div>`;
}

export function renderSetRunningNode(node: ResolvedSetRunningNode): string {
  return `<span data-node="set-running" data-running-name="${escapeHtml(node.name)}" class="reactwright-set ${runningClassFor(node.name)}-source" hidden>${escapeHtml(node.value)}</span>`;
}

export function renderBlockQuoteNode(node: ResolvedBlockQuoteNode): string {
  const children = node.children.map((child) => renderContentNode(child)).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<blockquote${idAttr(node.id)}${variantAttr}>${children}</blockquote>`;
}

export function renderPageBreakNode(_node: ResolvedPageBreakNode): string {
  return '<div data-node="page-break" style="break-before:page;page-break-before:always;"></div>';
}

export function renderListItemNode(node: ResolvedListItemNode): string {
  return `<li>${node.children.map((child) => renderContentNode(child)).join("")}</li>`;
}

export function renderListNode(node: ResolvedListNode): string {
  const tag = node.ordered ? "ol" : "ul";
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<${tag}${idAttr(node.id)}${variantAttr}>${node.children.map(renderListItemNode).join("")}</${tag}>`;
}

export function renderDefNode(node: ResolvedDefNode): string {
  const term = `<dt>${escapeHtml(node.term)}</dt>`;
  const body = `<dd>${node.children.map((child) => renderContentNode(child)).join("")}</dd>`;
  return `${term}${body}`;
}

export function renderDefsNode(node: ResolvedDefsNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<dl${idAttr(node.id)}${variantAttr}>${node.children.map(renderDefNode).join("")}</dl>`;
}

export function renderAbstractNode(node: ResolvedAbstractNode): string {
  // The engine doesn't auto-emit a label. Different document formats
  // disagree (IEEE uses an inline "Abstract—" prefix, novels have no
  // abstract at all, APA wants a particular placement) — so the
  // heading is composed at the content or template layer instead.
  return [
    '<section data-slot="abstract" class="reactwright-abstract">',
    ...node.children.map((child) => renderContentNode(child)),
    "</section>"
  ].join("");
}

export function renderTitleNode(node: ResolvedTitleNode): string {
  return `<h1 class="reactwright-document-title">${escapeHtml(node.value)}</h1>`;
}

export function renderHeadingNode(node: ResolvedHeadingNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  const tag = `h${node.level}`;
  return `<${tag}${idAttr(node.id)}${variantAttr}>${escapeHtml(node.title)}</${tag}>`;
}

export function renderAuthorNode(node: ResolvedAuthorNode): string {
  return `<p>${escapeHtml(node.value)}</p>`;
}

export function renderSectionNode(node: ResolvedSectionNode, depth = 1): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  const classes = ["reactwright-section-title"];
  if (depth === 1) classes.push("reactwright-chapter-title");
  const classAttr = ` class="${classes.join(" ")}"`;
  // Heading tag mirrors nesting depth: depth 1 → h2, depth 2 → h3,
  // depth 3 → h4, capped at h6. Depth 1 is h2 rather than h1 because
  // the document title (rendered separately) already occupies h1.
  const headingLevel = Math.min(depth + 1, 6);
  const headingTag = `h${headingLevel}`;
  // Route the section to a named CSS Paged Media regime when
  // `page=<name>` was set. Paged.js honours `page: <name>` to put the
  // element on a page of that type, and inserts the appropriate
  // page-break between adjacent sections targeting different regimes.
  const regimeStyle =
    depth === 1 && typeof node.page === "string" && node.page.length > 0
      ? ` style="page:${escapeHtml(node.page)};"`
      : "";
  const titleHeading =
    node.title.length > 0
      ? `<${headingTag}${classAttr}${variantAttr}>${escapeHtml(node.title)}</${headingTag}>`
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

  // Wrap depth-1 sections in their regime's flow template so a
  // <page-set> can declare per-regime layout (e.g. a script regime
  // that wraps each scene in a monospace block) while sections still
  // stream in document order. CSS Paged Media's `page:` property on
  // each section already implies a page break when the named page
  // changes, so no explicit break marker is needed here.
  const useRegimeFlow =
    depth === 1 &&
    typeof node.page === "string" &&
    node.page.length > 0 &&
    renderScopeRegimeFlows != null;
  if (useRegimeFlow) {
    const flow = renderScopeRegimeFlows![node.page!];
    if (flow != null && flow.length > 0) {
      const flowHtml = flow.map((c) => renderRegimeFlowNode(c, sectionHtml)).join("");
      // If the regime declares no body-slot AND the section has no
      // children of its own, the rendered flow consists only of
      // absolute-positioned overlays (fixed/layer/region fill) with
      // no flow content. Paged.js needs at least one flow element to
      // generate a page, so wrap the regime output in a min-height
      // filler that takes the entire page. Otherwise overlay-only
      // covers and chapter title pages collapse into the next page.
      const regimeHasBodySlot = (function hasBodySlot(children: ResolvedChild[]): boolean {
        for (const c of children) {
          if (c.kind === "body-slot") return true;
          if ("children" in c && Array.isArray((c as { children?: unknown }).children)) {
            if (hasBodySlot((c as { children: ResolvedChild[] }).children)) return true;
          }
        }
        return false;
      })(flow);
      if (!regimeHasBodySlot && node.children.length === 0) {
        // Filler carries `page:<name>` so Paged.js routes it to the
        // named regime; min-height takes the full page so the
        // page exists for Paged.js to paginate against. Absolute
        // overlay elements (region fill, fixed) follow as siblings —
        // they remain document-relative, not page-relative
        // (page-set regime isolation refactor #55 Path C still pending).
        return (
          `<div style="page:${escapeHtml(node.page!)};min-height:100vh;"></div>` +
          flowHtml
        );
      }
      return flowHtml;
    }
  }
  return sectionHtml;
}

// Dispatcher for content-IR nodes. Inline kinds fall through to
// renderInlineNode; block kinds dispatch to the per-kind renderer
// above.
export function renderContentNode(node: ResolvedContentNode): string {
  switch (node.kind) {
    case "title":      return renderTitleNode(node);
    case "author":     return renderAuthorNode(node);
    case "abstract":   return renderAbstractNode(node);
    case "section":    return renderSectionNode(node);
    case "figure":     return renderFigureNode(node);
    case "table":      return renderTableNode(node);
    case "code-block": return renderCodeBlockNode(node);
    case "pre":        return renderPreNode(node);
    case "blockquote": return renderBlockQuoteNode(node);
    case "list":       return renderListNode(node);
    case "defs":       return renderDefsNode(node);
    case "def":        return renderDefNode(node);
    case "heading":    return renderHeadingNode(node);
    case "math":       return renderMathNode(node);
    case "refs":
    case "ref-entry":
      // Reference entries are zero-render carriers; the bibliography
      // template node pulls their content via the resolver.
      return "";
    case "page-break":  return renderPageBreakNode(node);
    case "set-running": return renderSetRunningNode(node);
    case "item":        return renderListItemNode(node);
    case "paragraph":   return renderParagraphNode(node);
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
      return escapeHtml(node.value);
  }
  throw new Error("Unsupported resolved content node.");
}
