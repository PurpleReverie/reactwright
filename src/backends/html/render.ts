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
  return `<img data-inline src="${escapeHtml(node.src)}"${altAttr}${widthAttr}${heightAttr} />`;
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
  return `<span data-node="math-inline" class="reactdoc-math reactdoc-math-inline">${escapeHtml(node.src)}</span>`;
}

function renderMathNode(node: ResolvedMathNode): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<div data-node="math-block"${idAttr(node.id)}${variantAttr} class="reactdoc-math reactdoc-math-block">${escapeHtml(node.src)}</div>`;
}

function renderIndexEntryNode(node: ResolvedIndexEntryNode): string {
  return `<span data-node="index-entry" data-index-term="${escapeHtml(node.term)}" id="${escapeHtml(node.anchorId)}" hidden></span>`;
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
  const items = node.entries
    .map((e) => {
      const usedAttr = e.used ? ` data-used="true"` : "";
      return `<li id="reactdoc-bib-${escapeHtml(e.key)}" data-bib-key="${escapeHtml(e.key)}"${usedAttr}>${escapeHtml(e.text)}</li>`;
    })
    .join("");
  return `<section data-node="bibliography" class="reactdoc-bibliography">${title}<ol>${items}</ol></section>`;
}

function idAttr(id: string | undefined): string {
  return id != null ? ` id="${escapeHtml(id)}"` : "";
}

function renderParagraphNode(node: ResolvedParagraphNode): string {
  const inner = node.children.map(renderInlineNode).join("");
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  return `<p${idAttr(node.id)}${variantAttr}>${inner}</p>`;
}

function renderFigureNode(node: ResolvedFigureNode): string {
  const widthStyle = node.width != null ? ` style="width:${escapeHtml(node.width)};"` : "";
  const alt = escapeHtml(node.alt ?? node.caption ?? "");
  const caption =
    node.caption != null ? `<figcaption>${escapeHtml(node.caption)}</figcaption>` : "";
  return `<figure${idAttr(node.id)}><img src="${escapeHtml(node.src)}" alt="${alt}"${widthStyle} />${caption}</figure>`;
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
  return `<img data-node="image" src="${escapeHtml(node.src)}"${altAttr}${styleAttr} />`;
}

function renderSetRunningNode(node: ResolvedSetRunningNode): string {
  return `<span data-node="set-running" data-running-name="${escapeHtml(node.name)}" class="reactdoc-set ${runningClassFor(node.name)}-source" hidden>${escapeHtml(node.value)}</span>`;
}

function marginAnchorToCssBox(anchor: string): string {
  // Maps the spec's anchor names to CSS Paged Media margin-box selectors.
  switch (anchor) {
    case "top-left":
      return "@top-left";
    case "top-center":
      return "@top-center";
    case "top-right":
      return "@top-right";
    case "bottom-left":
      return "@bottom-left";
    case "bottom-center":
      return "@bottom-center";
    case "bottom-right":
      return "@bottom-right";
    case "top-inside":
    case "top-outside":
      // Mirror-aware anchors map to top-left/top-right via @page :left/:right rules.
      // Emitted under explicit :left/:right page selectors by the caller.
      return anchor === "top-inside" ? "@top-left" : "@top-right";
    case "bottom-inside":
    case "bottom-outside":
      return anchor === "bottom-inside" ? "@bottom-left" : "@bottom-right";
    case "left-top":
      return "@left-top";
    case "left-middle":
      return "@left-middle";
    case "left-bottom":
      return "@left-bottom";
    case "right-top":
      return "@right-top";
    case "right-middle":
      return "@right-middle";
    case "right-bottom":
      return "@right-bottom";
    default:
      return "@top-center";
  }
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

function renderSectionNode(node: ResolvedSectionNode, depth = 1): string {
  const variantAttr = node.variant != null ? ` data-variant="${escapeHtml(node.variant)}"` : "";
  const classes = ["reactdoc-section-title"];
  if (depth === 1) classes.push("reactdoc-chapter-title");
  const classAttr = ` class="${classes.join(" ")}"`;
  return [
    `<section${idAttr(node.id)}>`,
    `<h2${classAttr}${variantAttr}>${escapeHtml(node.title)}</h2>`,
    ...node.children.map((child) =>
      child.kind === "section"
        ? renderSectionNode(child, depth + 1)
        : renderContentNode(child)
    ),
    "</section>"
  ].join("");
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

function coordinateAnchorToCss(
  coord: { top?: string; right?: string; bottom?: string; left?: string }
): string {
  const parts: string[] = [];
  if (coord.top != null) parts.push(`top:${coord.top};`);
  if (coord.right != null) parts.push(`right:${coord.right};`);
  if (coord.bottom != null) parts.push(`bottom:${coord.bottom};`);
  if (coord.left != null) parts.push(`left:${coord.left};`);
  return parts.join("");
}

function renderFixedNode(node: ResolvedFixedNode): string {
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
  return `<div data-node="fixed"${whenAttr}${anchorAttr} style="${escapeHtml(style)}">${node.children
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
    case "page-count":
      return renderPageCountNode(node);
    case "running":
      return renderRunningNode(node);
    case "image":
      return renderImageNode(node);
    case "fixed":
      return renderFixedNode(node);
    case "footnote-area":
      // footnote-area is extracted to @footnote margin-box CSS at the page level.
      return "";
    case "bibliography":
      return renderBibliographyNode(node);
    case "index-template":
      return renderIndexTemplateNode(node);
    case "sidenote-area":
      // sidenote-area is extracted to absolute-positioned margin CSS at the page level.
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

function buildRunningStringsCss(names: Set<string>): string {
  if (names.size === 0) return "";
  const rules: string[] = [];

  // Auto-set rules for built-in strings derived from document/section/chapter titles.
  rules.push("h1.reactdoc-document-title{string-set:document-title content();}");
  rules.push("h2.reactdoc-section-title{string-set:section-title content();}");
  rules.push("h2.reactdoc-chapter-title{string-set:chapter-title content();}");

  // Per-name rules for <set> sources and <running> sinks.
  for (const name of names) {
    const cls = `reactdoc-running-${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    rules.push(`.${cls}-source{string-set:${name} content();}`);
    rules.push(`.${cls}::before{content:string(${name});}`);
  }

  return rules.join("");
}

type MarginMatterEntry = {
  kind: "header" | "footer";
  anchor: string;
  when?: string;
  flowName: string;
  html: string;
};

function collectMarginMatter(page: ResolvedPageNode): MarginMatterEntry[] {
  const entries: MarginMatterEntry[] = [];
  let counter = 0;

  for (const child of page.children) {
    if (child.kind !== "header" && child.kind !== "footer") continue;

    const flowName = `reactdoc-${child.kind}-${counter}`;
    counter += 1;

    const inner = child.children.map((c) => renderResolvedChild(c)).join("");
    const html = `<div class="${flowName}" data-margin-flow="${flowName}">${inner}</div>`;

    entries.push({
      kind: child.kind,
      anchor: child.anchor,
      when: child.when,
      flowName,
      html
    });
  }

  return entries;
}

function buildMarginMatterCss(entries: MarginMatterEntry[]): string {
  if (entries.length === 0) return "";

  const rules: string[] = [];

  // Each margin flow needs `position: running(name)` so Paged.js lifts the div
  // out of body flow.
  for (const e of entries) {
    rules.push(`.${e.flowName}{position:running(${e.flowName});}`);
  }

  // Group entries by their effective @page selector based on `when` and anchor
  // mirror semantics. For simplicity, emit one rule per entry.
  for (const e of entries) {
    const box = marginAnchorToCssBox(e.anchor);
    const isInside = e.anchor.endsWith("inside");
    const isOutside = e.anchor.endsWith("outside");

    if (isInside || isOutside) {
      // Two-sided: @page :left and @page :right invert.
      const leftBox =
        e.anchor.startsWith("top")
          ? isInside
            ? "@top-right"
            : "@top-left"
          : isInside
            ? "@bottom-right"
            : "@bottom-left";
      const rightBox = box;
      const whenPrefix = e.when === "first-page" ? ":first" : "";
      const whenSuppress = e.when === "not-first-page";

      rules.push(`@page :left${whenPrefix}{${leftBox}{content:element(${e.flowName});}}`);
      rules.push(`@page :right${whenPrefix}{${rightBox}{content:element(${e.flowName});}}`);

      if (whenSuppress) {
        rules.push(`@page :first{${leftBox}{content:none;}${rightBox}{content:none;}}`);
      }
    } else {
      if (e.when === "first-page") {
        rules.push(`@page :first{${box}{content:element(${e.flowName});}}`);
      } else if (e.when === "not-first-page") {
        rules.push(`@page{${box}{content:element(${e.flowName});}}`);
        rules.push(`@page :first{${box}{content:none;}}`);
      } else {
        rules.push(`@page{${box}{content:element(${e.flowName});}}`);
      }
    }
  }

  return rules.join("");
}

function buildFootnoteAreaCss(page: ResolvedPageNode): string {
  const area = page.children.find(
    (child): child is ResolvedFootnoteAreaNode => child.kind === "footnote-area"
  );
  if (area == null) return "";
  const rules: string[] = [];
  rules.push(".reactdoc-footnote{float:footnote;}");
  rules.push("@page{@footnote{border-top:1px solid #999;padding-top:0.25em;}}");
  if (area.separator === false) {
    rules.push("@page{@footnote{border-top:none;}}");
  }
  return rules.join("");
}

function buildSidenoteAreaCss(page: ResolvedPageNode): string {
  const area = page.children.find(
    (child): child is ResolvedSidenoteAreaNode => child.kind === "sidenote-area"
  );
  if (area == null) return "";
  const side = area.side ?? "outside";
  const width = area.width ?? "30mm";
  const gap = area.gap ?? "4mm";
  const sideRule =
    side === "left"
      ? `left:calc(-1 * (${width} + ${gap}));`
      : side === "right"
        ? `right:calc(-1 * (${width} + ${gap}));`
        : side === "inside"
          ? `left:calc(-1 * (${width} + ${gap}));`
          : `right:calc(-1 * (${width} + ${gap}));`;
  return [
    `.reactdoc-sidenote{position:absolute;${sideRule}width:${width};font-size:0.85em;line-height:1.3;}`,
    ".reactdoc-flow{position:relative;}"
  ].join("");
}

export function renderResolvedToHTML(page: ResolvedPageNode): string {
  const atPageRule = buildAtPageRule(page.style);
  const bodyTextRule = buildBodyTextRule(page.style);
  const footnoteAreaCss = buildFootnoteAreaCss(page);
  const sidenoteAreaCss = buildSidenoteAreaCss(page);

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
    .map((child) => renderFixedNode(child))
    .join("");

  const flowChildren = page.children.filter(
    (child) => child.kind !== "fixed" && child.kind !== "header" && child.kind !== "footer"
  );

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
    marginMatterCss,
    runningStringsCss,
    footnoteAreaCss,
    sidenoteAreaCss,
    "body{margin:0;}",
    ".reactdoc-flow{box-sizing:border-box;}",
    ".reactdoc-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}",
    ".reactdoc-page-number::before{content:counter(page);}",
    ".reactdoc-page-count::before{content:counter(pages);}",
    ".reactdoc-ref-number::after{content:target-counter(attr(href url), reactdoc-ref);}",
    ".reactdoc-ref-page::after{content:target-counter(attr(href url), page);}",
    ".reactdoc-ref-title::after{content:target-text(attr(href url));}",
    ".reactdoc-ref-number-and-page::after{content:target-counter(attr(href url), reactdoc-ref) ' on p. ' target-counter(attr(href url), page);}",
    ".reactdoc-cite::before{content:'[';}",
    ".reactdoc-cite::after{content:target-counter(attr(href url), list-item) ']';}",
    ".reactdoc-bibliography ol{padding-left:1.5em;}",
    ".reactdoc-index-pageref::after{content:target-counter(attr(href url), page);}",
    ".reactdoc-index-pagerefs a + a::before{content:', ';}",
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
    marginMatterHtml,
    overlays.length > 0 ? `<div class="reactdoc-overlay">${overlays}</div>` : "",
    `<div class="reactdoc-flow">${flowBody}</div>`,
    "</body>",
    "</html>"
  ]
    .filter((s) => s.length > 0)
    .join("");
}
