import { spawnSync } from "node:child_process";
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
  ResolvedFigureNode,
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

type FontDefinition = {
  metric?: string;
  package?: string;
  command: string;
};

const FONT_REGISTRY: Record<string, FontDefinition> = {
  serif: { command: "\\rmfamily" },
  roman: { command: "\\rmfamily" },
  sans: { command: "\\sffamily" },
  mono: { command: "\\ttfamily" },
  courier: { package: "courier", metric: "pcrr8t.tfm", command: "\\ttfamily" },
  helvetica: { package: "helvet", metric: "phvr8t.tfm", command: "\\sffamily" },
  palatino: { package: "mathpazo", metric: "pplr8t.tfm", command: "\\rmfamily" },
  times: { package: "mathptmx", metric: "ptmr8t.tfm", command: "\\rmfamily" },
  "avant-garde": { package: "avant", metric: "pagd8t.tfm", command: "\\sffamily" }
};

const fontAvailabilityCache = new Map<string, boolean>();

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

function normalizeFontSize(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return /^[0-9.]+pt$/.test(value.trim()) ? value.trim() : null;
}

function fontSizeToBaseline(fontSize: string, lineHeight: unknown): string {
  const size = Number(fontSize.replace("pt", ""));
  if (!Number.isFinite(size)) {
    return "14pt";
  }

  const multiplier = typeof lineHeight === "number" && lineHeight > 0 ? lineHeight : 1.2;
  return `${(size * multiplier).toFixed(2)}pt`;
}

function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return match?.[1]?.toUpperCase() ?? null;
}

function parseBorder(value: unknown): { width: string; color: string } | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value
    .trim()
    .match(/^([0-9.]+(?:pt|px|mm|cm|in|em|ex))\s+(?:solid|dashed|dotted)\s+(#?[0-9a-fA-F]{6})$/);

  if (match == null) {
    return null;
  }

  return {
    width: match[1] ?? "0.4pt",
    color: normalizeHexColor(match[2]) ?? "000000"
  };
}

function colorName(hex: string): string {
  return `reactdoc${hex}`;
}

function walkTemplateStyles(
  node: ResolvedPageNode | ResolvedChild,
  visit: (style: TemplateStyle) => void
): void {
  if ("style" in node && node.style != null) {
    visit(node.style);
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (
        child.kind === "page" ||
        child.kind === "box" ||
        child.kind === "stack" ||
        child.kind === "custom"
      ) {
        walkTemplateStyles(child, visit);
      }
    }
  }
}

function collectDefinedColors(page: ResolvedPageNode): string[] {
  const colors = new Set<string>();

  walkTemplateStyles(page, (style) => {
    const text = normalizeHexColor(style.color);
    const background = normalizeHexColor(style.backgroundColor);
    const border = parseBorder(style.border)?.color ?? null;
    const borderBottom = parseBorder(style.borderBottom)?.color ?? null;

    if (text != null) colors.add(text);
    if (background != null) colors.add(background);
    if (border != null) colors.add(border);
    if (borderBottom != null) colors.add(borderBottom);
  });

  return [...colors];
}

function normalizeFontFamily(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized in FONT_REGISTRY ? normalized : null;
}

function collectFontPackages(page: ResolvedPageNode): string[] {
  const packages = new Set<string>();

  walkTemplateStyles(page, (style) => {
    const family = normalizeFontFamily(style.fontFamily);
    const definition = family != null ? FONT_REGISTRY[family] : null;
    const pkg =
      definition != null && isFontDefinitionAvailable(definition) ? definition.package ?? null : null;
    if (pkg != null) {
      packages.add(pkg);
    }
  });

  return [...packages];
}

function isFontDefinitionAvailable(definition: FontDefinition): boolean {
  if (definition.package == null || definition.metric == null) {
    return true;
  }

  const cacheKey = `${definition.package}:${definition.metric}`;
  const cached = fontAvailabilityCache.get(cacheKey);
  if (cached != null) {
    return cached;
  }

  const result = spawnSync("kpsewhich", [definition.metric], {
    encoding: "utf8"
  });
  const available = result.status === 0 && result.stdout.trim().length > 0;
  fontAvailabilityCache.set(cacheKey, available);
  return available;
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
  for (const pkg of collectFontPackages(page)) {
    lines.push(`\\usepackage{${pkg}}`);
  }
  for (const hex of collectDefinedColors(page)) {
    lines.push(`\\definecolor{${colorName(hex)}}{HTML}{${hex}}`);
  }

  const lineHeight = page.style?.lineHeight;
  if (typeof lineHeight === "number") {
    lines.push("\\usepackage{setspace}");
    lines.push(`\\setstretch{${lineHeight}}`);
  }

  if (findFirstStyleValue(page, "columns") != null) {
    lines.push("\\usepackage{multicol}");
  }

  if (findFirstStyleValue(page, "breakable") === true) {
    lines.push("\\usepackage{mdframed}");
  }

  if (pageContainsFigure(page)) {
    lines.push("\\usepackage{graphicx}");
  }

  return lines;
}

function pageContainsFigure(node: ResolvedPageNode | ResolvedChild): boolean {
  if (node.kind === "figure") {
    return true;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.some((child) => pageContainsFigure(child as ResolvedChild));
  }

  return false;
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

function renderFigureNode(node: ResolvedFigureNode): string {
  const width = node.width ?? "0.8\\linewidth";
  const parts = [
    "\\begin{center}",
    `\\includegraphics[width=${width}]{\\detokenize{${node.src.replaceAll("\\", "/")}}}`
  ];

  if (node.caption != null) {
    parts.push(`\\\\[0.5em]\\small ${escapeLatex(node.caption)}`);
  }

  parts.push("\\end{center}");
  return parts.join("\n");
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
    case "figure":
      return renderFigureNode(node);
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

function wrapWithTextColor(content: string, color: unknown): string {
  const hex = normalizeHexColor(color);
  if (hex == null) {
    return content;
  }

  return `{\\color{${colorName(hex)}}${content}}`;
}

function fontFamilyCommand(value: unknown): string | null {
  const family = normalizeFontFamily(value);
  if (family == null) {
    return null;
  }

  const definition = FONT_REGISTRY[family];
  if (definition == null) {
    return null;
  }

  if (!isFontDefinitionAvailable(definition)) {
    if (family === "helvetica" || family === "avant-garde") {
      return "\\sffamily";
    }

    if (family === "courier") {
      return "\\ttfamily";
    }

    return "\\rmfamily";
  }

  return definition.command;
}

function fontWeightCommand(value: unknown): string | null {
  return value === "bold" ? "\\bfseries" : null;
}

function fontStyleCommand(value: unknown): string | null {
  return value === "italic" ? "\\itshape" : null;
}

function wrapWithTypography(content: string, style: TemplateStyle | undefined): string {
  const commands: string[] = [];
  const family = fontFamilyCommand(style?.fontFamily);
  const weight = fontWeightCommand(style?.fontWeight);
  const shape = fontStyleCommand(style?.fontStyle);
  const fontSize = normalizeFontSize(style?.fontSize);

  if (family != null) {
    commands.push(family);
  }

  if (weight != null) {
    commands.push(weight);
  }

  if (shape != null) {
    commands.push(shape);
  }

  if (fontSize != null) {
    commands.push(
      `\\fontsize{${fontSize}}{${fontSizeToBaseline(fontSize, style?.lineHeight)}}\\selectfont`
    );
  }

  let styled = wrapWithTextColor(content, style?.color);
  if (commands.length === 0) {
    return styled;
  }

  styled = ["{", ...commands, styled, "}"].join("\n");
  return styled;
}

function wrapWithStyledFrame(content: string, style: TemplateStyle | undefined): string {
  const backgroundColor = normalizeHexColor(style?.backgroundColor);
  const textColor = normalizeHexColor(style?.color);
  const border = parseBorder(style?.border);
  const padding = normalizeLength(style?.padding);
  const top = normalizeLength(style?.paddingTop) ?? padding;
  const right = normalizeLength(style?.paddingRight) ?? padding;
  const bottom = normalizeLength(style?.paddingBottom) ?? padding;
  const left = normalizeLength(style?.paddingLeft) ?? padding;
  const hasFrameStyle =
    backgroundColor != null ||
    textColor != null ||
    border != null ||
    top != null ||
    right != null ||
    bottom != null ||
    left != null;

  if (!hasFrameStyle) {
    return wrapWithTextColor(content, textColor);
  }

  if (border == null && backgroundColor == null) {
    const innerWidthParts = ["\\linewidth"];
    if (left != null) {
      innerWidthParts.push(`- ${left}`);
    }
    if (right != null) {
      innerWidthParts.push(`- ${right}`);
    }

    const innerContent = [
      top != null ? `\\vspace*{${top}}` : "",
      left != null ? `\\hspace*{${left}}` : "",
      `\\begin{minipage}{\\dimexpr ${innerWidthParts.join(" ")}\\relax}`,
      wrapWithTextColor(content, textColor),
      "\\end{minipage}",
      bottom != null ? `\\vspace*{${bottom}}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    return ["\\begingroup", innerContent, "\\endgroup"].join("\n");
  }

  const frameColor = border?.color ?? backgroundColor ?? "FFFFFF";
  const frameWidth = border?.width ?? "0pt";
  const boxBackground = backgroundColor ?? null;
  const innerWidthParts = ["\\linewidth", "- 2\\fboxrule"];
  if (left != null) {
    innerWidthParts.push(`- ${left}`);
  }
  if (right != null) {
    innerWidthParts.push(`- ${right}`);
  }

  const innerContent = [
    top != null ? `\\vspace*{${top}}` : "",
    left != null ? `\\hspace*{${left}}` : "",
    `\\begin{minipage}{\\dimexpr ${innerWidthParts.join(" ")}\\relax}`,
    wrapWithTextColor(content, textColor),
    "\\end{minipage}",
    bottom != null ? `\\vspace*{${bottom}}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "\\begingroup",
    "\\setlength{\\fboxsep}{0pt}",
    `\\setlength{\\fboxrule}{${frameWidth}}`,
    `\\noindent\\fcolorbox{${colorName(frameColor)}}{${boxBackground != null ? colorName(boxBackground) : "white"}}{%`,
    `\\begin{minipage}{\\dimexpr\\linewidth - 2\\fboxrule\\relax}`,
    innerContent,
    "\\end{minipage}",
    "}",
    "\\endgroup"
  ].join("\n");
}

function wrapWithBreakableFrame(content: string, style: TemplateStyle | undefined): string {
  const backgroundColor = normalizeHexColor(style?.backgroundColor);
  const border = parseBorder(style?.border);
  const padding = normalizeLength(style?.padding);
  const top = normalizeLength(style?.paddingTop) ?? padding ?? "6pt";
  const right = normalizeLength(style?.paddingRight) ?? padding ?? "6pt";
  const bottom = normalizeLength(style?.paddingBottom) ?? padding ?? "6pt";
  const left = normalizeLength(style?.paddingLeft) ?? padding ?? "6pt";
  const options = [
    "skipabove=0pt",
    "skipbelow=0pt",
    "innertopmargin=" + top,
    "innerbottommargin=" + bottom,
    "innerleftmargin=" + left,
    "innerrightmargin=" + right
  ];

  if (backgroundColor != null) {
    options.push(`backgroundcolor=${colorName(backgroundColor)}`);
  }

  if (border != null) {
    options.push(`linecolor=${colorName(border.color)}`);
    options.push(`linewidth=${border.width}`);
  } else {
    options.push("hidealllines=true");
  }

  return [
    `\\begin{mdframed}[${options.join(",")}]`,
    wrapWithTypography(content, style),
    "\\end{mdframed}"
  ].join("\n");
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

  const isBreakable = node.style?.breakable === true;

  if (isBreakable) {
    aligned = wrapWithBreakableFrame(aligned, node.style);
  } else {
    aligned = wrapWithTypography(aligned, node.style);
  }

  const hasTColorBoxStyling =
    normalizeHexColor(node.style?.backgroundColor) != null ||
    parseBorder(node.style?.border) != null ||
    normalizeLength(node.style?.padding) != null ||
    normalizeLength(node.style?.paddingTop) != null ||
    normalizeLength(node.style?.paddingRight) != null ||
    normalizeLength(node.style?.paddingLeft) != null;

  if (hasTColorBoxStyling && !isBreakable) {
    aligned = wrapWithStyledFrame(aligned, node.style);
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
  let body = node.children.map(renderResolvedChild).join("\n\n");
  const pageBackground = normalizeHexColor(node.style?.backgroundColor);
  const pageBorder = parseBorder(node.style?.border);

  body = wrapWithTypography(body, node.style);

  if (pageBackground != null) {
    body = [`\\pagecolor{${colorName(pageBackground)}}`, body].join("\n\n");
  }

  if (pageBorder != null) {
    body = wrapWithStyledFrame(body, node.style);
  }

  return body;
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
    case "figure":
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
