import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
import { getAllFonts } from "../../fonts/registry.js";
import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedBoxNode,
  ResolvedChild,
  ResolvedCodeNode,
  ResolvedContentNode,
  ResolvedCustomTemplateNode,
  ResolvedEmNode,
  ResolvedFigureNode,
  ResolvedFontNode,
  ResolvedInlineNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "../../resolver/ir.js";

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

function pageSizeToCss(size: unknown): string | null {
  switch (size) {
    case "a4":
      return "width:210mm;min-height:297mm;";
    case "letter":
      return "width:8.5in;min-height:11in;";
    default:
      return null;
  }
}

export function styleToCss(
  style: TemplateStyle | undefined,
  kind?: "page" | "box" | "stack"
): string {
  if (style == null && kind !== "stack") {
    return "";
  }

  const declarations: string[] = [];

  if (kind === "stack") {
    declarations.push("display:flex;", "flex-direction:column;");
  }

  if (style?.size != null && kind === "page") {
    const pageSizeCss = pageSizeToCss(style.size);
    if (pageSizeCss != null) {
      declarations.push(pageSizeCss);
    }
  }

  if (style?.margin != null && kind === "page") {
    declarations.push(`padding:${String(style.margin)};`);
  }

  const directMap: Record<string, string> = {
    marginTop: "margin-top",
    marginRight: "margin-right",
    marginBottom: "margin-bottom",
    marginLeft: "margin-left",
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
    borderBottom: "border-bottom"
  };

  for (const [key, cssName] of Object.entries(directMap)) {
    const value = style?.[key];
    if (value != null) {
      declarations.push(`${cssName}:${String(value)};`);
    }
  }

  if (kind === "stack" && style?.gap != null) {
    declarations.push(`gap:${String(style.gap)};`);
  }

  if (style?.columns != null) {
    declarations.push(`column-count:${String(style.columns)};`);
  }

  return declarations.join("");
}

function renderTextNode(node: ResolvedTextNode): string {
  return escapeHtml(node.value);
}

function renderFontNode(node: ResolvedFontNode): string {
  return `<span style="font-family:${escapeHtml(node.family)};">${node.children.map(renderInlineNode).join("")}</span>`;
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
    case "font":
      return renderFontNode(node);
  }

  throw new Error("Unsupported resolved inline node.");
}

type RenderContext = {
  blockquoteStyle: "indent" | "plain";
};

function renderParagraphNode(node: ResolvedParagraphNode): string {
  return `<p>${node.children.map(renderInlineNode).join("")}</p>`;
}

function renderFigureNode(node: ResolvedFigureNode): string {
  const widthStyle = node.width != null ? ` style="width:${escapeHtml(node.width)};"` : "";
  const alt = escapeHtml(node.alt ?? node.caption ?? "");
  const caption =
    node.caption != null ? `<figcaption>${escapeHtml(node.caption)}</figcaption>` : "";
  return `<figure><img src="${escapeHtml(node.src)}" alt="${alt}"${widthStyle} />${caption}</figure>`;
}

function renderSectionNode(node: ResolvedSectionNode, ctx: RenderContext): string {
  const headingClass = node.role === "scene-heading" ? ' class="scene-heading"' : "";
  return [
    "<section>",
    `<h2${headingClass}>${escapeHtml(node.title)}</h2>`,
    ...node.children.map((child) => renderContentNode(child, ctx)),
    "</section>"
  ].join("");
}

function renderBlockQuoteNode(node: ResolvedBlockQuoteNode, ctx: RenderContext): string {
  const children = node.children.map((child) => renderContentNode(child, ctx)).join("");

  if (node.role === "dialogue") {
    return `<div class="dialogue">${children}</div>`;
  }

  if (ctx.blockquoteStyle === "plain") {
    return `<div class="blockquote-plain">${children}</div>`;
  }

  return `<blockquote>${children}</blockquote>`;
}

function renderListItemNode(node: ResolvedListItemNode, ctx: RenderContext): string {
  return `<li>${node.children.map((child) => renderContentNode(child, ctx)).join("")}</li>`;
}

function renderListNode(node: ResolvedListNode, ctx: RenderContext): string {
  const tag = node.ordered ? "ol" : "ul";
  return `<${tag}>${node.children.map((child) => renderListItemNode(child, ctx)).join("")}</${tag}>`;
}

function renderAbstractNode(node: ResolvedAbstractNode, ctx: RenderContext): string {
  return [
    '<section data-slot="abstract">',
    "<h2>Abstract</h2>",
    ...node.children.map((child) => renderContentNode(child, ctx)),
    "</section>"
  ].join("");
}

function renderTitleNode(node: ResolvedTitleNode): string {
  return `<h1>${escapeHtml(node.value)}</h1>`;
}

function renderAuthorNode(node: ResolvedAuthorNode): string {
  return `<p>${escapeHtml(node.value)}</p>`;
}

function renderContentNode(node: ResolvedContentNode, ctx: RenderContext): string {
  switch (node.kind) {
    case "title":
      return renderTitleNode(node);
    case "author":
      return renderAuthorNode(node);
    case "abstract":
      return renderAbstractNode(node, ctx);
    case "section":
      return renderSectionNode(node, ctx);
    case "figure":
      return renderFigureNode(node);
    case "blockquote":
      return renderBlockQuoteNode(node, ctx);
    case "list":
      return renderListNode(node, ctx);
    case "item":
      return renderListItemNode(node, ctx);
    case "paragraph":
      return renderParagraphNode(node);
    case "em":
    case "strong":
    case "code":
      return renderInlineNode(node);
    case "text":
      return renderTextNode(node);
  }

  throw new Error("Unsupported resolved content node.");
}

function renderBoxNode(node: ResolvedBoxNode, ctx: RenderContext): string {
  const style = styleToCss(node.style, "box");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="box"${styleAttr}>${node.children.map((child) => renderResolvedChild(child, ctx)).join("")}</div>`;
}

function renderCustomNode(node: ResolvedCustomTemplateNode, ctx: RenderContext): string {
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
    renderChildren: (children) => children.map((child) => renderResolvedChild(child, ctx)).join(""),
    styleToCss,
    escapeHtml
  });
}

function renderStackNode(node: ResolvedStackNode, ctx: RenderContext): string {
  const mergedStyle: TemplateStyle = {
    ...(node.style ?? {}),
    ...(node.gap != null ? { gap: node.gap } : {})
  };
  const style = styleToCss(mergedStyle, "stack");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="stack"${styleAttr}>${node.children.map((child) => renderResolvedChild(child, ctx)).join("")}</div>`;
}

function renderPageNode(node: ResolvedPageNode, ctx: RenderContext): string {
  const style = [
    "box-sizing:border-box;",
    "background:white;",
    "margin:24px auto;",
    "box-shadow:0 12px 32px rgba(15, 23, 42, 0.14);",
    styleToCss(node.style, "page")
  ].join("");
  const styleAttr = ` style="${escapeHtml(style)}"`;

  return `<main data-node="page"${styleAttr}>${node.children.map((child) => renderResolvedChild(child, ctx)).join("")}</main>`;
}

function renderResolvedChild(node: ResolvedChild, ctx: RenderContext): string {
  switch (node.kind) {
    case "page":
      return renderPageNode(node, ctx);
    case "box":
      return renderBoxNode(node, ctx);
    case "stack":
      return renderStackNode(node, ctx);
    case "custom":
      return renderCustomNode(node, ctx);
    case "title":
    case "author":
    case "abstract":
    case "section":
    case "figure":
    case "paragraph":
    case "text":
      return renderContentNode(node, ctx);
  }

  throw new Error("Unsupported resolved child node.");
}

export function renderResolvedToHTML(page: ResolvedPageNode): string {
  const ctx: RenderContext = {
    blockquoteStyle: page.style?.blockquoteStyle === "plain" ? "plain" : "indent"
  };
  const body = renderPageNode(page, ctx);
  const fontTags = buildFontHeadTags(page);

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>ReactDoc Preview</title>",
    ...fontTags,
    "<style>",
    "body{margin:0;padding:32px;background:#e7ebf0;color:#111827;font-family:Georgia,'Times New Roman',serif;}",
    "h1,h2,p{margin:0;}",
    "h1{font-size:inherit;font-weight:bold;line-height:inherit;margin-bottom:0.4em;}",
    "h2{font-size:inherit;font-weight:bold;line-height:inherit;margin-top:1em;margin-bottom:0.25em;}",
    "p + p{margin-top:0.75em;}",
    "section + section{margin-top:1em;}",
    "blockquote{margin:0;padding-left:2em;}",
    ".blockquote-plain{margin:0;}",
    ".dialogue{margin:0.5em 0;}",
    "h2.scene-heading{text-transform:uppercase;}",
    "ul,ol{margin:0;padding-left:1.5rem;}",
    "li + li{margin-top:0.5rem;}",
    "code{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;background:#f1f5f9;padding:0.1rem 0.25rem;border-radius:0.2rem;}",
    "</style>",
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>"
  ].join("");
}
