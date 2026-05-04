import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBoxNode,
  ResolvedChild,
  ResolvedContentNode,
  ResolvedCustomTemplateNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "../../resolver/ir.js";

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
    lineHeight: "line-height",
    textAlign: "text-align",
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

  return declarations.join("");
}

function renderTextNode(node: ResolvedTextNode): string {
  return escapeHtml(node.value);
}

function renderParagraphNode(node: ResolvedParagraphNode): string {
  return `<p>${node.children.map(renderTextNode).join("")}</p>`;
}

function renderSectionNode(node: ResolvedSectionNode): string {
  return [
    "<section>",
    `<h2>${escapeHtml(node.title)}</h2>`,
    ...node.children.map(renderContentNode),
    "</section>"
  ].join("");
}

function renderAbstractNode(node: ResolvedAbstractNode): string {
  return [
    '<section data-slot="abstract">',
    "<h2>Abstract</h2>",
    ...node.children.map(renderContentNode),
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
    case "paragraph":
      return renderParagraphNode(node);
    case "text":
      return renderTextNode(node);
  }
}

function renderBoxNode(node: ResolvedBoxNode): string {
  const style = styleToCss(node.style, "box");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="box"${styleAttr}>${node.children.map(renderResolvedChild).join("")}</div>`;
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
    renderChildren: (children) => children.map(renderResolvedChild).join(""),
    styleToCss,
    escapeHtml
  });
}

function renderStackNode(node: ResolvedStackNode): string {
  const mergedStyle: TemplateStyle = {
    ...(node.style ?? {}),
    ...(node.gap != null ? { gap: node.gap } : {})
  };
  const style = styleToCss(mergedStyle, "stack");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="stack"${styleAttr}>${node.children.map(renderResolvedChild).join("")}</div>`;
}

function renderPageNode(node: ResolvedPageNode): string {
  const style = [
    "box-sizing:border-box;",
    "background:white;",
    "margin:24px auto;",
    "box-shadow:0 12px 32px rgba(15, 23, 42, 0.14);",
    styleToCss(node.style, "page")
  ].join("");
  const styleAttr = ` style="${escapeHtml(style)}"`;

  return `<main data-node="page"${styleAttr}>${node.children.map(renderResolvedChild).join("")}</main>`;
}

function renderResolvedChild(node: ResolvedChild): string {
  switch (node.kind) {
    case "page":
      return renderPageNode(node);
    case "box":
      return renderBoxNode(node);
    case "stack":
      return renderStackNode(node);
    case "custom":
      return renderCustomNode(node);
    case "title":
    case "author":
    case "abstract":
    case "section":
    case "paragraph":
    case "text":
      return renderContentNode(node);
  }
}

export function renderResolvedToHTML(page: ResolvedPageNode): string {
  const body = renderPageNode(page);

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>ReactDoc Preview</title>",
    "<style>",
    "body{margin:0;padding:32px;background:#e7ebf0;color:#111827;font-family:Georgia,'Times New Roman',serif;}",
    "h1,h2,p{margin:0;}",
    "h1{font-size:2rem;line-height:1.2;}",
    "h2{font-size:1.2rem;line-height:1.3;margin-bottom:0.75rem;}",
    "p + p{margin-top:0.9rem;}",
    "section + section{margin-top:1.25rem;}",
    "</style>",
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>"
  ].join("");
}
