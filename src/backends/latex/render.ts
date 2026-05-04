import type { TemplateStyle } from "../../template/ir.js";
import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBoxNode,
  ResolvedChild,
  ResolvedContentNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedTextNode,
  ResolvedTitleNode
} from "../../resolver/ir.js";

function escapeLatex(value: string): string {
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
  const lines = ["\\documentclass[11pt]{article}"];
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

  return lines;
}

function wrapWithAlignment(content: string, textAlign: unknown): string {
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

function renderParagraphNode(node: ResolvedParagraphNode): string {
  return `${node.children.map(renderTextNode).join("")}\n`;
}

function renderSectionNode(node: ResolvedSectionNode): string {
  return [
    `\\section{${escapeLatex(node.title)}}`,
    ...node.children.map(renderContentNode)
  ].join("\n\n");
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
    case "paragraph":
      return renderParagraphNode(node);
    case "text":
      return renderTextNode(node);
  }
}

function renderBoxNode(node: ResolvedBoxNode): string {
  const body = node.children.map(renderResolvedChild).join("\n\n");
  const aligned = wrapWithAlignment(body, node.style?.textAlign);

  const parts = [aligned];

  if (typeof node.style?.paddingBottom === "string") {
    parts.push(`\\vspace*{${node.style.paddingBottom}}`);
  }

  if (typeof node.style?.borderBottom === "string") {
    parts.push("\\noindent\\rule{\\linewidth}{0.4pt}");
  }

  return parts.join("\n\n");
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
    case "title":
    case "author":
    case "abstract":
    case "section":
    case "paragraph":
    case "text":
      return renderContentNode(node);
  }
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
