import type {
  ResolvedCiteNode,
  ResolvedFootnoteNode,
  ResolvedIndexEntryNode,
  ResolvedInlineImgNode,
  ResolvedInlineMathNode,
  ResolvedInlineNode,
  ResolvedLinkNode,
  ResolvedRefNode,
  ResolvedSidenoteNode,
  ResolvedTextNode
} from "../../resolver/ir.js";
import { escapeHtml, normalizeImageSrc } from "./utils.js";
import { renderTeX } from "./fonts.js";

// Inline-node renderers. None of these reach into the content or
// template domains — they call each other through renderInlineNode
// and escape/normalize via utils. Output is a single HTML fragment per
// node.

export function renderTextNode(node: ResolvedTextNode): string {
  return escapeHtml(node.value);
}

export function renderLinkNode(node: ResolvedLinkNode): string {
  const titleAttr = node.title != null ? ` title="${escapeHtml(node.title)}"` : "";
  return `<a href="${escapeHtml(node.href)}"${titleAttr}>${node.children.map(renderInlineNode).join("")}</a>`;
}

export function renderInlineImgNode(node: ResolvedInlineImgNode): string {
  const widthAttr = node.width != null ? ` width="${escapeHtml(node.width)}"` : "";
  const heightAttr = node.height != null ? ` height="${escapeHtml(node.height)}"` : "";
  const altAttr = ` alt="${escapeHtml(node.alt ?? "")}"`;
  return `<img data-inline src="${escapeHtml(normalizeImageSrc(node.src))}"${altAttr}${widthAttr}${heightAttr} />`;
}

function refClassFor(show: string): string {
  return `reactwright-ref reactwright-ref-${show}`;
}

export function renderRefNode(node: ResolvedRefNode): string {
  const href = `#${escapeHtml(node.to)}`;
  return `<a data-node="ref" data-ref-to="${escapeHtml(node.to)}" data-ref-show="${escapeHtml(node.show)}" class="${refClassFor(node.show)}" href="${href}"></a>`;
}

export function renderFootnoteNode(node: ResolvedFootnoteNode): string {
  const markerAttr = node.marker != null ? ` data-marker="${escapeHtml(node.marker)}"` : "";
  const inner = node.children.map(renderInlineNode).join("");
  return `<span data-node="footnote"${markerAttr} class="reactwright-footnote">${inner}</span>`;
}

export function renderSidenoteNode(node: ResolvedSidenoteNode): string {
  const inner = node.children.map(renderInlineNode).join("");
  return `<span data-node="sidenote" class="reactwright-sidenote">${inner}</span>`;
}

export function renderInlineMathNode(node: ResolvedInlineMathNode): string {
  return `<span data-node="math-inline" class="reactwright-math reactwright-math-inline">${renderTeX(node.src, false)}</span>`;
}

export function renderIndexEntryNode(node: ResolvedIndexEntryNode): string {
  return `<span data-node="index-entry" data-index-term="${escapeHtml(node.term)}" id="${escapeHtml(node.anchorId)}" hidden></span>`;
}

export function renderCiteNode(node: ResolvedCiteNode): string {
  const href = `#${escapeHtml("reactwright-bib-" + node.cite)}`;
  return `<a data-node="cite" data-cite-key="${escapeHtml(node.cite)}" class="reactwright-cite" href="${href}"></a>`;
}

export function renderInlineNode(node: ResolvedInlineNode): string {
  switch (node.kind) {
    case "text":     return renderTextNode(node);
    case "em":       return `<em>${node.children.map(renderInlineNode).join("")}</em>`;
    case "strong":   return `<strong>${node.children.map(renderInlineNode).join("")}</strong>`;
    case "code":     return `<code>${node.children.map(renderTextNode).join("")}</code>`;
    case "link":     return renderLinkNode(node);
    case "br":       return "<br />";
    case "sub":      return `<sub>${node.children.map(renderInlineNode).join("")}</sub>`;
    case "sup":      return `<sup>${node.children.map(renderInlineNode).join("")}</sup>`;
    case "img":      return renderInlineImgNode(node);
    case "ref":      return renderRefNode(node);
    case "footnote": return renderFootnoteNode(node);
    case "m":        return renderInlineMathNode(node);
    case "cite":     return renderCiteNode(node);
    case "index":    return renderIndexEntryNode(node);
    case "sidenote": return renderSidenoteNode(node);
  }
  throw new Error("Unsupported resolved inline node.");
}
