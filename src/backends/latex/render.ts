import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
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

export function escapeLatex(value: string): string {
  return value
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("_", "\\_")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("~", "\\textasciitilde{}")
    .replaceAll("^", "\\textasciicircum{}");
}

function normalizeLength(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function findFirstStyleValue(
  node: ResolvedPageNode | ResolvedChild,
  key: string
): unknown {
  if ("style" in node && node.style != null && key in node.style) {
    return node.style[key];
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (
        child.kind === "page" ||
        child.kind === "box" ||
        child.kind === "stack" ||
        child.kind === "custom"
      ) {
        const found = findFirstStyleValue(child, key);
        if (found != null) {
          return found;
        }
      }
    }
  }

  return null;
}

function collectPageOptions(style: TemplateStyle | undefined): string[] {
  const options: string[] = [];

  if (style?.size === "a4") {
    options.push("a4paper");
  }

  const margin = normalizeLength(style?.margin);
  if (margin != null) {
    options.push(`margin=${margin}`);
  } else {
    const top = normalizeLength(style?.marginTop);
    const right = normalizeLength(style?.marginRight);
    const bottom = normalizeLength(style?.marginBottom);
    const left = normalizeLength(style?.marginLeft);

    if (top != null) options.push(`top=${top}`);
    if (right != null) options.push(`right=${right}`);
    if (bottom != null) options.push(`bottom=${bottom}`);
    if (left != null) options.push(`left=${left}`);
  }

  return options;
}

function collectPreamble(page: ResolvedPageNode): string[] {
  const fontSize =
    typeof page.style?.fontSize === "string" && /pt$/.test(page.style.fontSize)
      ? page.style.fontSize
      : "11pt";
  const lines = [`\\documentclass[${fontSize}]{article}`];
  const geometryOptions = collectPageOptions(page.style);

  if (geometryOptions.length > 0) {
    lines.push(`\\usepackage[${geometryOptions.join(",")}]{geometry}`);
  }

  lines.push("\\usepackage[T1]{fontenc}");
  lines.push("\\usepackage[utf8]{inputenc}");
  lines.push("\\usepackage{xcolor}");

  const lineHeight = page.style?.lineHeight;
  if (typeof lineHeight === "number") {
    lines.push("\\usepackage{setspace}");
    lines.push(`\\setstretch{${lineHeight}}`);
  }

  if (findFirstStyleValue(page, "columns") != null) {
    lines.push("\\usepackage{multicol}");
  }

  return lines;
}

export function wrapWithAlignment(content: string, textAlign: unknown): string {
  if (textAlign === "center") {
    return ["\\begin{center}", content, "\\end{center}"].join("\n");
  }

  if (textAlign === "right") {
    return ["\\begin{flushright}", content, "\\end{flushright}"].join("\n");
  }

  if (textAlign === "left") {
    return ["\\begin{flushleft}", content, "\\end{flushleft}"].join("\n");
  }

  return content;
}

function renderTextNode(node: ResolvedTextNode): string {
  return escapeLatex(node.value);
}

function renderInlineNode(node: ResolvedInlineNode): string {
  switch (node.kind) {
    case "text":
      return renderTextNode(node);
    case "em":
      return `\\emph{${node.children.map(renderInlineNode).join("")}}`;
    case "strong":
      return `\\textbf{${node.children.map(renderInlineNode).join("")}}`;
    case "code":
      return `\\texttt{${node.children.map(renderTextNode).join("")}}`;
  }

  throw new Error("Unsupported resolved inline node.");
}

function renderParagraphNode(node: ResolvedParagraphNode): string {
  return `${node.children.map(renderInlineNode).join("")}\n`;
}

function renderSectionNode(node: ResolvedSectionNode): string {
  return [
    `\\section{${escapeLatex(node.title)}}`,
    ...node.children.map(renderContentNode)
  ].join("\n\n");
}

function renderBlockQuoteNode(node: ResolvedBlockQuoteNode): string {
  return [
    "\\begin{quote}",
    ...node.children.map(renderContentNode),
    "\\end{quote}"
  ].join("\n\n");
}

function renderListItemNode(node: ResolvedListItemNode): string {
  const body = node.children.map(renderContentNode).join("\n\n");
  return `\\item ${body}`;
}

function renderListNode(node: ResolvedListNode): string {
  const environment = node.ordered ? "enumerate" : "itemize";
  return [
    `\\begin{${environment}}`,
    ...node.children.map(renderListItemNode),
    `\\end{${environment}}`
  ].join("\n");
}

function renderAbstractNode(node: ResolvedAbstractNode): string {
  return [
    "\\begin{abstract}",
    ...node.children.map(renderContentNode),
    "\\end{abstract}"
  ].join("\n");
}

function renderTitleNode(node: ResolvedTitleNode): string {
  return `\\LARGE ${escapeLatex(node.value)}\\\\`;
}

function renderAuthorNode(node: ResolvedAuthorNode): string {
  return `\\large ${escapeLatex(node.value)}\\\\`;
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
    case "blockquote":
      return renderBlockQuoteNode(node);
    case "list":
      return renderListNode(node);
    case "item":
      return renderListItemNode(node);
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

function renderBoxNode(node: ResolvedBoxNode): string {
  const body = node.children.map(renderResolvedChild).join("\n\n");
  let aligned = wrapWithAlignment(body, node.style?.textAlign);

  const columns =
    typeof node.style?.columns === "number"
      ? node.style.columns
      : typeof node.style?.columns === "string"
        ? Number(node.style.columns)
        : null;

  if (columns != null && Number.isFinite(columns) && columns > 1) {
    const columnGap = typeof node.style?.columnGap === "string" ? node.style.columnGap : null;
    aligned = [
      columnGap != null ? `\\setlength{\\columnsep}{${columnGap}}` : "",
      `\\begin{multicols}{${columns}}`,
      aligned,
      "\\end{multicols}"
    ]
      .filter(Boolean)
      .join("\n");
  }

  const parts = [aligned];

  if (typeof node.style?.paddingBottom === "string") {
    parts.push(`\\vspace*{${node.style.paddingBottom}}`);
  }

  if (typeof node.style?.borderBottom === "string") {
    parts.push("\\noindent\\rule{\\linewidth}{0.4pt}");
  }

  return parts.join("\n\n");
}

function renderCustomNode(node: ResolvedCustomTemplateNode): string {
  const definition = getTemplateIntrinsic(node.name);
  if (definition?.latex == null) {
    throw new Error(`No LaTeX renderer registered for custom template intrinsic: ${node.name}`);
  }

  return definition.latex({
    props: {
      ...node.props,
      ...(node.style != null ? { style: node.style } : {})
    },
    children: node.children,
    renderChildren: (children) => children.map(renderResolvedChild).join("\n\n"),
    escapeLatex,
    wrapWithAlignment
  });
}

function renderStackNode(node: ResolvedStackNode): string {
  const pieces = node.children.map(renderResolvedChild);
  const gap = node.gap != null ? `\n\\vspace*{${node.gap}}\n` : "\n\n";
  return pieces.join(gap);
}

function renderPageNode(node: ResolvedPageNode): string {
  return node.children.map(renderResolvedChild).join("\n\n");
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

  throw new Error("Unsupported resolved child node.");
}

export function renderResolvedToLatex(page: ResolvedPageNode): string {
  const preamble = collectPreamble(page);
  const body = renderPageNode(page);

  return [
    ...preamble,
    "",
    "\\begin{document}",
    body,
    "\\end{document}",
    ""
  ].join("\n");
}
