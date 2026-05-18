import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
import { getAllFonts } from "../../fonts/registry.js";
import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedCellNode,
  ResolvedChild,
  ResolvedCodeBlockNode,
  ResolvedCodeNode,
  ResolvedContentNode,
  ResolvedCustomTemplateNode,
  ResolvedEmNode,
  ResolvedFigureNode,
  ResolvedFixedNode,
  ResolvedInlineNode,
  ResolvedLayerNode,
  ResolvedLinkNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedPageNode,
  ResolvedPageNumberNode,
  ResolvedParagraphNode,
  ResolvedRegionNode,
  ResolvedRowNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedTableNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "../../resolver/ir.js";

const PAGED_JS_SCRIPT = "https://unpkg.com/pagedjs/dist/paged.polyfill.js";

const PAGE_GROUP_KEYS = new Set([
  "size",
  "orientation",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "columns",
  "columnGap"
]);

function collectUsedFontFamilies(node: ResolvedPageNode | ResolvedChild): Set<string> {
  const families = new Set<string>();

  if ("style" in node && node.style != null) {
    const v = node.style.fontFamily;
    if (typeof v === "string" && v.trim().length > 0) {
      families.add(v.trim().toLowerCase());
    }
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      for (const f of collectUsedFontFamilies(child as ResolvedChild)) {
        families.add(f);
      }
    }
  }

  return families;
}

function buildFontHeadTags(page: ResolvedPageNode): string[] {
  const used = collectUsedFontFamilies(page);
  const registry = getAllFonts();
  const links: string[] = [];
  const faces: string[] = [];

  for (const family of used) {
    const def = registry.get(family);
    if (def?.html == null) continue;

    if (def.html.kind === "link") {
      links.push(`<link rel="stylesheet" href="${escapeHtml(def.html.href)}" />`);
    } else {
      const formatAttr = def.html.format != null ? ` format('${escapeHtml(def.html.format)}')` : "";
      faces.push(
        `@font-face{font-family:'${escapeHtml(family)}';src:url('${escapeHtml(def.html.src)}')${formatAttr};}`
      );
    }
  }

  const tags: string[] = [...links];
  if (faces.length > 0) {
    tags.push(`<style>${faces.join("")}</style>`);
  }
  return tags;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizePageSize(size: unknown): string | null {
  if (typeof size !== "string") return null;
  const lower = size.trim().toLowerCase();
  if (lower === "a4" || lower === "letter" || lower === "a5" || lower === "a3" || lower === "legal") {
    return lower.toUpperCase();
  }
  return size.trim();
}

function buildAtPageRule(style: TemplateStyle | undefined, name?: string): string | null {
  if (style == null) return null;
  const declarations: string[] = [];

  const size = normalizePageSize(style.size);
  if (size != null) {
    const orientation =
      style.orientation === "landscape" ? " landscape" : style.orientation === "portrait" ? " portrait" : "";
    declarations.push(`size:${size}${orientation};`);
  }

  if (style.margin != null) {
    declarations.push(`margin:${String(style.margin)};`);
  }
  if (style.marginTop != null) declarations.push(`margin-top:${String(style.marginTop)};`);
  if (style.marginRight != null) declarations.push(`margin-right:${String(style.marginRight)};`);
  if (style.marginBottom != null) declarations.push(`margin-bottom:${String(style.marginBottom)};`);
  if (style.marginLeft != null) declarations.push(`margin-left:${String(style.marginLeft)};`);

  if (declarations.length === 0) return null;

  const selector = name != null ? `@page ${name}` : "@page";
  return `${selector}{${declarations.join("")}}`;
}

function buildBodyTextRule(style: TemplateStyle | undefined): string | null {
  if (style == null) return null;
  const declarations: string[] = [];

  if (style.fontFamily != null) declarations.push(`font-family:${String(style.fontFamily)};`);
  if (style.fontSize != null) declarations.push(`font-size:${String(style.fontSize)};`);
  if (style.fontWeight != null) declarations.push(`font-weight:${String(style.fontWeight)};`);
  if (style.fontStyle != null) declarations.push(`font-style:${String(style.fontStyle)};`);
  if (style.color != null) declarations.push(`color:${String(style.color)};`);
  if (style.lineHeight != null) declarations.push(`line-height:${String(style.lineHeight)};`);
  if (style.letterSpacing != null) declarations.push(`letter-spacing:${String(style.letterSpacing)};`);
  if (style.textAlign != null) declarations.push(`text-align:${String(style.textAlign)};`);
  if (style.columns != null) declarations.push(`column-count:${String(style.columns)};`);
  if (style.columnGap != null) declarations.push(`column-gap:${String(style.columnGap)};`);

  if (declarations.length === 0) return null;
  return `.reactdoc-flow{${declarations.join("")}}`;
}

function styleToInlineCss(style: TemplateStyle | undefined, kind?: "stack" | "region"): string {
  if (style == null && kind !== "stack") {
    return "";
  }

  const declarations: string[] = [];

  if (kind === "stack") {
    declarations.push("display:flex;", "flex-direction:column;");
  }

  const directMap: Record<string, string> = {
    marginTop: "margin-top",
    marginRight: "margin-right",
    marginBottom: "margin-bottom",
    marginLeft: "margin-left",
    maxWidth: "max-width",
    width: "width",
    padding: "padding",
    paddingTop: "padding-top",
    paddingRight: "padding-right",
    paddingBottom: "padding-bottom",
    paddingLeft: "padding-left",
    fontFamily: "font-family",
    fontSize: "font-size",
    fontWeight: "font-weight",
    fontStyle: "font-style",
    lineHeight: "line-height",
    textAlign: "text-align",
    columnGap: "column-gap",
    color: "color",
    backgroundColor: "background-color",
    border: "border",
    borderTop: "border-top",
    borderRight: "border-right",
    borderBottom: "border-bottom",
    borderLeft: "border-left",
    borderRadius: "border-radius",
    alignSelf: "align-self"
  };

  for (const [key, cssName] of Object.entries(directMap)) {
    if (PAGE_GROUP_KEYS.has(key)) continue;
    const value = style?.[key];
    if (value != null) {
      declarations.push(`${cssName}:${String(value)};`);
    }
  }

  if (kind === "stack" && style?.gap != null) {
    declarations.push(`gap:${String(style.gap)};`);
  }

  return declarations.join("");
}

// Public alias preserved for custom-intrinsic compatibility.
export function styleToCss(
  style: TemplateStyle | undefined,
  kind?: "page" | "region" | "stack"
): string {
  if (kind === "page") return "";
  return styleToInlineCss(style, kind === "region" ? "region" : kind);
}

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
  }

  throw new Error("Unsupported resolved inline node.");
}

function renderParagraphNode(node: ResolvedParagraphNode): string {
  const inner = node.children.map(renderInlineNode).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<p${variantAttr}>${inner}</p>`;
}

function renderFigureNode(node: ResolvedFigureNode): string {
  const widthStyle = node.width != null ? ` style="width:${escapeHtml(node.width)};"` : "";
  const alt = escapeHtml(node.alt ?? node.caption ?? "");
  const caption =
    node.caption != null ? `<figcaption>${escapeHtml(node.caption)}</figcaption>` : "";
  return `<figure><img src="${escapeHtml(node.src)}" alt="${alt}"${widthStyle} />${caption}</figure>`;
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
  return `<table>${caption}<tbody>${node.children.map((child) => renderRowNode(child)).join("")}</tbody></table>`;
}

function renderCodeBlockNode(node: ResolvedCodeBlockNode): string {
  const dataAttr = node.language != null ? ` data-language="${escapeHtml(node.language)}"` : "";
  return `<pre${dataAttr}><code>${node.children.map(renderTextNode).join("")}</code></pre>`;
}

function renderPageNumberNode(_node: ResolvedPageNumberNode): string {
  return '<span data-node="page-number">1</span>';
}

function anchorToCss(anchor: string): string {
  switch (anchor) {
    case "top-left":
    case "page-top-left":
      return "top:0;left:0;";
    case "top-center":
      return "top:0;left:50%;transform:translateX(-50%);";
    case "top-right":
    case "page-top-right":
      return "top:0;right:0;";
    case "bottom-left":
    case "page-bottom-left":
      return "bottom:0;left:0;";
    case "bottom-center":
      return "bottom:0;left:50%;transform:translateX(-50%);";
    case "bottom-right":
    case "page-bottom-right":
      return "bottom:0;right:0;";
    default:
      return "top:0;left:0;";
  }
}

function renderSectionNode(node: ResolvedSectionNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return [
    "<section>",
    `<h2${variantAttr}>${escapeHtml(node.title)}</h2>`,
    ...node.children.map((child) => renderContentNode(child)),
    "</section>"
  ].join("");
}

function renderBlockQuoteNode(node: ResolvedBlockQuoteNode): string {
  const children = node.children.map((child) => renderContentNode(child)).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<blockquote${variantAttr}>${children}</blockquote>`;
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
  return `<${tag}${variantAttr}>${node.children.map((child) => renderListItemNode(child)).join("")}</${tag}>`;
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
  return `<h1>${escapeHtml(node.value)}</h1>`;
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
    case "blockquote":
      return renderBlockQuoteNode(node);
    case "list":
      return renderListNode(node);
    case "page-break":
      return renderPageBreakNode(node);
    case "item":
      return renderListItemNode(node);
    case "paragraph":
      return renderParagraphNode(node);
    case "em":
    case "strong":
    case "code":
    case "link":
      return renderInlineNode(node);
    case "text":
      return renderTextNode(node);
  }

  throw new Error("Unsupported resolved content node.");
}

function regionPositioningCss(node: ResolvedRegionNode): string {
  const p = node.positioning;
  if (p == null) return "";
  const declarations: string[] = [];
  if (p.fill === true) declarations.push("position:absolute;", "inset:0;");
  if (p.center === true) {
    declarations.push("display:flex;", "align-items:center;", "justify-content:center;");
  }
  return declarations.join("");
}

function renderRegionNode(node: ResolvedRegionNode): string {
  const positioning = regionPositioningCss(node);
  const inline = styleToInlineCss(node.style, "region");
  const combined = positioning + inline;
  const styleAttr = combined.length > 0 ? ` style="${escapeHtml(combined)}"` : "";
  return `<div data-node="region"${styleAttr}>${node.children.map((child) => renderResolvedChild(child)).join("")}</div>`;
}

function renderLayerNode(node: ResolvedLayerNode, zIndex: number): string {
  const nameAttr = node.name != null ? ` data-name="${escapeHtml(node.name)}"` : "";
  const whenAttr = node.when != null ? ` data-when="${escapeHtml(node.when)}"` : "";
  const inline = styleToInlineCss(node.style, "region");
  const positioning = `position:absolute;inset:0;z-index:${zIndex};`;
  const combined = positioning + inline;
  return `<div data-node="layer"${nameAttr}${whenAttr} style="${escapeHtml(combined)}">${node.children
    .map((child) => renderResolvedChild(child))
    .join("")}</div>`;
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

function renderStackNode(node: ResolvedStackNode): string {
  const mergedStyle: TemplateStyle = {
    ...(node.style ?? {}),
    ...(node.gap != null ? { gap: node.gap } : {})
  };
  const style = styleToInlineCss(mergedStyle, "stack");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="stack"${styleAttr}>${node.children.map((child) => renderResolvedChild(child)).join("")}</div>`;
}

function renderFixedNode(node: ResolvedFixedNode): string {
  const style = [
    "position:absolute;",
    "z-index:2;",
    anchorToCss(node.anchor),
    styleToInlineCss(node.style, "region")
  ].join("");
  const whenAttr = node.when != null ? ` data-when="${escapeHtml(node.when)}"` : "";
  return `<div data-node="fixed"${whenAttr} style="${escapeHtml(style)}">${node.children
    .map((child) => renderResolvedChild(child))
    .join("")}</div>`;
}

function renderResolvedChild(node: ResolvedChild): string {
  switch (node.kind) {
    case "page":
      throw new Error("Nested page nodes are not supported in the resolved tree.");
    case "region":
      return renderRegionNode(node);
    case "stack":
      return renderStackNode(node);
    case "layer":
      return renderLayerNode(node, 0);
    case "page-number":
      return renderPageNumberNode(node);
    case "fixed":
      return renderFixedNode(node);
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
    case "paragraph":
    case "blockquote":
    case "list":
    case "item":
    case "em":
    case "strong":
    case "code":
    case "link":
    case "text":
    case "page-break":
      return renderContentNode(node as ResolvedContentNode);
  }
}

export function renderResolvedToHTML(page: ResolvedPageNode): string {
  const atPageRule = buildAtPageRule(page.style);
  const bodyTextRule = buildBodyTextRule(page.style);

  const overlays = page.children
    .filter((child): child is ResolvedFixedNode => child.kind === "fixed")
    .map((child) => renderFixedNode(child))
    .join("");
  const flowChildren = page.children.filter((child) => child.kind !== "fixed");

  let layerIndex = 0;
  const flowBody = flowChildren
    .map((child) => {
      if (child.kind === "layer") {
        const rendered = renderLayerNode(child, layerIndex);
        layerIndex += 1;
        return rendered;
      }
      return renderResolvedChild(child);
    })
    .join("");

  const fontTags = buildFontHeadTags(page);

  const styleRules = [
    atPageRule ?? "",
    bodyTextRule ?? "",
    "body{margin:0;}",
    ".reactdoc-flow{box-sizing:border-box;}",
    ".reactdoc-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}",
    "h1,h2,p,figure,table,blockquote,ul,ol,pre{margin:0;}",
    "h1{font-size:1.6em;font-weight:bold;margin-bottom:0.4em;}",
    "h2{font-size:1.2em;font-weight:bold;margin-top:1em;margin-bottom:0.25em;}",
    "p + p{margin-top:0.6em;}",
    "section + section{margin-top:1em;}",
    "blockquote{padding-left:1.5em;border-left:2px solid #cbd5e1;}",
    "ul,ol{padding-left:1.5em;}",
    "li + li{margin-top:0.25em;}",
    "code{font-family:'SFMono-Regular',Consolas,Menlo,monospace;background:#f1f5f9;padding:0.1em 0.25em;border-radius:0.2em;}",
    "table{border-collapse:collapse;width:100%;}",
    "th,td{border:1px solid #cbd5e1;padding:0.25em 0.5em;text-align:left;}",
    "figure img{max-width:100%;height:auto;}"
  ]
    .filter((s) => s.length > 0)
    .join("");

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>ReactDoc Preview</title>",
    ...fontTags,
    `<style>${styleRules}</style>`,
    `<script src="${PAGED_JS_SCRIPT}"></script>`,
    "</head>",
    "<body>",
    overlays.length > 0 ? `<div class="reactdoc-overlay">${overlays}</div>` : "",
    `<div class="reactdoc-flow">${flowBody}</div>`,
    "</body>",
    "</html>"
  ]
    .filter((s) => s.length > 0)
    .join("");
}
