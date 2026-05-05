import { spawnSync } from "node:child_process";
import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
import { getFont } from "../../fonts/registry.js";
import type {
  ResolvedAbstractNode,
  ResolvedAuthorNode,
  ResolvedBlockQuoteNode,
  ResolvedBoxNode,
  ResolvedChild,
  ResolvedCodeNode,
  ResolvedCodeBlockNode,
  ResolvedContentNode,
  ResolvedCustomTemplateNode,
  ResolvedEmNode,
  ResolvedFixedNode,
  ResolvedPageNumberNode,
  ResolvedFigureNode,
  ResolvedFontNode,
  ResolvedInlineNode,
  ResolvedLinkNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedPageBreakNode,
  ResolvedPageNode,
  ResolvedParagraphNode,
  ResolvedRepeatNode,
  ResolvedRowNode,
  ResolvedRuleNode,
  ResolvedSectionNode,
  ResolvedStackNode,
  ResolvedStrongNode,
  ResolvedThematicBreakNode,
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

type RenderContext = {
  sectionStyle: "heading" | "label";
  blockquoteStyle: "indent" | "plain";
};

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
        child.kind === "row" ||
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

  const visitRules = (node: ResolvedPageNode | ResolvedChild): void => {
    if (node.kind === "rule") {
      const explicit = normalizeHexColor(node.color);
      const styled = normalizeHexColor(node.style?.color);
      if (explicit != null) colors.add(explicit);
      if (styled != null) colors.add(styled);
    }

    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        visitRules(child as ResolvedChild);
      }
    }
  };

  visitRules(page);

  return [...colors];
}

function normalizeFontFamily(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized in FONT_REGISTRY) {
    return normalized;
  }

  return getFont(normalized)?.latex != null ? normalized : null;
}

function collectInlineFontFamilies(node: ResolvedChild | ResolvedInlineNode): string[] {
  const families: string[] = [];

  if (node.kind === "font") {
    families.push(node.family);
    for (const child of node.children) {
      families.push(...collectInlineFontFamilies(child));
    }
    return families;
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children as (ResolvedChild | ResolvedInlineNode)[]) {
      families.push(...collectInlineFontFamilies(child));
    }
  }

  return families;
}

function addFamilyPackage(family: string, packages: Set<string>): void {
  const normalized = normalizeFontFamily(family);
  if (normalized == null) return;

  const builtIn = FONT_REGISTRY[normalized] ?? null;
  if (builtIn != null && isFontDefinitionAvailable(builtIn) && builtIn.package != null) {
    packages.add(builtIn.package);
    return;
  }

  const custom = getFont(normalized)?.latex ?? null;
  if (custom != null) {
    const customDef = { package: custom.package, command: custom.command, metric: custom.metric };
    if (isFontDefinitionAvailable(customDef) && custom.package != null) {
      packages.add(custom.package);
    }
  }
}

function collectFontPackages(page: ResolvedPageNode): string[] {
  const packages = new Set<string>();

  walkTemplateStyles(page, (style) => {
    addFamilyPackage(String(style.fontFamily ?? ""), packages);
  });

  for (const family of collectInlineFontFamilies(page)) {
    addFamilyPackage(family, packages);
  }

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
        child.kind === "row" ||
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

  if (pageContainsLink(page)) {
    lines.push("\\usepackage[hidelinks]{hyperref}");
  }

  if (pageContainsCodeBlock(page)) {
    lines.push("\\usepackage{fancyvrb}");
  }

  if (pageContainsRepeat(page)) {
    lines.push("\\usepackage{fancyhdr}");
    lines.push("\\pagestyle{fancy}");
    lines.push("\\fancyhf{}");
  }

  if (pageContainsFixed(page)) {
    lines.push("\\usepackage{eso-pic}");
  }

  lines.push("\\emergencystretch=1.5em");

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

function pageContainsRepeat(node: ResolvedPageNode | ResolvedChild): boolean {
  if (node.kind === "repeat") {
    return true;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.some((child) => pageContainsRepeat(child as ResolvedChild));
  }

  return false;
}

function pageContainsFixed(node: ResolvedPageNode | ResolvedChild): boolean {
  if (node.kind === "fixed") {
    return true;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.some((child) => pageContainsFixed(child as ResolvedChild));
  }

  return false;
}

function pageContainsLink(node: ResolvedPageNode | ResolvedChild | ResolvedInlineNode): boolean {
  if (node.kind === "link") {
    return true;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.some((child) =>
      pageContainsLink(child as ResolvedChild | ResolvedInlineNode)
    );
  }

  return false;
}

function pageContainsCodeBlock(node: ResolvedPageNode | ResolvedChild): boolean {
  if (node.kind === "code-block") {
    return true;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.some((child) => pageContainsCodeBlock(child as ResolvedChild));
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

function renderFontNode(node: ResolvedFontNode): string {
  const cmd = fontFamilyCommand(node.family);
  const inner = node.children.map(renderInlineNode).join("");
  return cmd != null ? `{${cmd} ${inner}}` : inner;
}

function renderLinkNode(node: ResolvedLinkNode): string {
  const label = node.children.map(renderInlineNode).join("");
  return `\\href{${escapeLatex(node.href)}}{${label}}`;
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
    case "font":
      return renderFontNode(node);
    case "link":
      return renderLinkNode(node);
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

function renderCodeBlockNode(node: ResolvedCodeBlockNode): string {
  const content = node.children.map((child) => child.value).join("");
  return [
    "\\begin{Verbatim}[fontsize=\\small]",
    content,
    "\\end{Verbatim}"
  ].join("\n");
}

function renderThematicBreakNode(_node: ResolvedThematicBreakNode): string {
  return "\\noindent\\rule{\\linewidth}{0.5pt}";
}

function renderSectionNode(node: ResolvedSectionNode, ctx: RenderContext): string {
  let heading: string;

  if (node.variant === "sceneHeading") {
    heading = `\\medskip\\noindent\\textbf{\\MakeUppercase{${escapeLatex(node.title)}}}\\par\\nopagebreak`;
  } else if (ctx.sectionStyle === "label") {
    heading = `\\medskip\\noindent\\textbf{${escapeLatex(node.title)}}\\par\\nopagebreak`;
  } else {
    heading = `\\section{${escapeLatex(node.title)}}`;
  }

  return [heading, ...node.children.map((child) => renderContentNode(child, ctx))].join("\n\n");
}

function renderBlockQuoteNode(node: ResolvedBlockQuoteNode, ctx: RenderContext): string {
  const children = node.children.map((child) => renderContentNode(child, ctx));

  if (node.variant === "dialogueBlock") {
    return ["\\smallskip", ...children].join("\n\n");
  }

  if (ctx.blockquoteStyle === "plain") {
    return children.join("\n\n");
  }

  return [
    "\\begin{quote}",
    ...children,
    "\\end{quote}"
  ].join("\n\n");
}

function renderPageBreakNode(_node: ResolvedPageBreakNode): string {
  return "\\newpage";
}

function renderListItemNode(node: ResolvedListItemNode, ctx: RenderContext): string {
  const body = node.children.map((child) => renderContentNode(child, ctx)).join("\n\n");
  return `\\item ${body}`;
}

function renderListNode(node: ResolvedListNode, ctx: RenderContext): string {
  const environment = node.ordered ? "enumerate" : "itemize";
  return [
    "\\begingroup",
    "\\setlength{\\topsep}{0.4em}",
    "\\setlength{\\itemsep}{0.3em}",
    "\\setlength{\\parsep}{0pt}",
    "\\setlength{\\parskip}{0pt}",
    `\\begin{${environment}}`,
    ...node.children.map((child) => renderListItemNode(child, ctx)),
    `\\end{${environment}}`,
    "\\endgroup"
  ].join("\n");
}

function renderAbstractNode(node: ResolvedAbstractNode, ctx: RenderContext): string {
  return [
    "\\begin{abstract}",
    ...node.children.map((child) => renderContentNode(child, ctx)),
    "\\end{abstract}"
  ].join("\n");
}

function renderTitleNode(node: ResolvedTitleNode): string {
  return `${escapeLatex(node.value)}\\\\`;
}

function renderAuthorNode(node: ResolvedAuthorNode): string {
  return `${escapeLatex(node.value)}\\\\`;
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
    case "code-block":
      return renderCodeBlockNode(node);
    case "thematic-break":
      return renderThematicBreakNode(node);
    case "blockquote":
      return renderBlockQuoteNode(node, ctx);
    case "list":
      return renderListNode(node, ctx);
    case "page-break":
      return renderPageBreakNode(node);
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

  const builtIn = FONT_REGISTRY[family];
  if (builtIn != null) {
    if (!isFontDefinitionAvailable(builtIn)) {
      if (family === "helvetica" || family === "avant-garde") return "\\sffamily";
      if (family === "courier") return "\\ttfamily";
      return "\\rmfamily";
    }
    return builtIn.command;
  }

  const custom = getFont(family)?.latex ?? null;
  if (custom != null) {
    const customDef = { package: custom.package, command: custom.command, metric: custom.metric };
    return isFontDefinitionAvailable(customDef) ? custom.command : "\\rmfamily";
  }

  return null;
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
  const top = normalizeLength(style?.paddingTop) ?? padding ?? "0pt";
  const right = normalizeLength(style?.paddingRight) ?? padding ?? "0pt";
  const bottom = normalizeLength(style?.paddingBottom) ?? padding ?? "0pt";
  const left = normalizeLength(style?.paddingLeft) ?? padding ?? "0pt";
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
    "\\sloppy",
    wrapWithTypography(content, style),
    "\\end{mdframed}"
  ].join("\n");
}

function normalizeRuleLength(value: unknown, axis: "horizontal" | "vertical"): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return axis === "vertical" ? "1.5em" : "\\linewidth";
  }

  const trimmed = value.trim();
  const percent = trimmed.match(/^([0-9.]+)%$/);
  if (percent != null) {
    const ratio = Number(percent[1]) / 100;
    if (Number.isFinite(ratio) && ratio > 0) {
      return axis === "vertical" ? `${ratio.toFixed(4)}\\baselineskip` : `${ratio.toFixed(4)}\\linewidth`;
    }
  }

  return trimmed;
}

function normalizeRowWidth(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  const percent = trimmed.match(/^([0-9.]+)%$/);
  if (percent != null) {
    const ratio = Number(percent[1]) / 100;
    if (Number.isFinite(ratio) && ratio > 0) {
      return `${ratio.toFixed(4)}\\linewidth`;
    }
  }

  return trimmed;
}

function renderRuleNode(node: ResolvedRuleNode): string {
  const axis = node.axis ?? "horizontal";
  const weight = node.weight ?? "0.4pt";
  const color = normalizeHexColor(node.color ?? node.style?.color);
  const length = normalizeRuleLength(node.length ?? node.style?.width, axis);
  const body =
    axis === "vertical" ? `\\rule{${weight}}{${length}}` : `\\rule{${length}}{${weight}}`;

  if (color == null) {
    return `\\noindent${body}`;
  }

  return `\\noindent{\\color{${colorName(color)}}${body}}`;
}

function renderPageNumberNode(_node: ResolvedPageNumberNode): string {
  return "\\thepage";
}

function renderFurnitureInlineNode(node: ResolvedInlineNode): string {
  switch (node.kind) {
    case "text":
      return renderTextNode(node);
    case "em":
      return `\\emph{${node.children.map(renderFurnitureInlineNode).join("")}}`;
    case "strong":
      return `\\textbf{${node.children.map(renderFurnitureInlineNode).join("")}}`;
    case "code":
      return `\\texttt{${node.children.map(renderTextNode).join("")}}`;
    case "font":
      return `{${fontFamilyCommand(node.family) ?? "\\rmfamily"} ${node.children
        .map(renderFurnitureInlineNode)
        .join("")}}`;
    case "link":
      return pageContainsLink({ kind: "page", children: [node], style: undefined })
        ? `\\href{${escapeLatex(node.href)}}{${node.children.map(renderFurnitureInlineNode).join("")}}`
        : node.children.map(renderFurnitureInlineNode).join("");
  }
}

function renderFurnitureChild(node: ResolvedChild, ctx: RenderContext): string {
  switch (node.kind) {
    case "title":
      return escapeLatex(node.value);
    case "author":
      return escapeLatex(node.value);
    case "text":
      return escapeLatex(node.value);
    case "paragraph":
      return node.children.map(renderFurnitureInlineNode).join("");
    case "em":
    case "strong":
    case "code":
    case "font":
    case "link":
      return renderFurnitureInlineNode(node);
    case "rule":
      return renderRuleNode(node);
    case "page-number":
      return renderPageNumberNode(node);
    case "box":
    case "stack":
    case "row":
    case "repeat":
    case "fixed":
    case "custom":
      return node.children.map((child) => renderFurnitureChild(child, ctx)).filter(Boolean).join(" ");
    case "abstract":
    case "section":
    case "figure":
    case "code-block":
    case "thematic-break":
    case "blockquote":
    case "list":
    case "page-break":
    case "item":
    case "page":
      return "";
  }
}

function collectRepeatNodes(node: ResolvedPageNode | ResolvedChild): ResolvedRepeatNode[] {
  const repeats: ResolvedRepeatNode[] = [];

  if (node.kind === "repeat") {
    repeats.push(node);
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      repeats.push(...collectRepeatNodes(child as ResolvedChild));
    }
  }

  return repeats;
}

function collectFixedNodes(node: ResolvedPageNode | ResolvedChild): ResolvedFixedNode[] {
  const fixedNodes: ResolvedFixedNode[] = [];

  if (node.kind === "fixed") {
    fixedNodes.push(node);
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      fixedNodes.push(...collectFixedNodes(child as ResolvedChild));
    }
  }

  return fixedNodes;
}

function latexHeaderSlot(anchor: string): { area: "head" | "foot"; slot: "L" | "C" | "R" } {
  switch (anchor) {
    case "top-left":
      return { area: "head", slot: "L" };
    case "top-center":
      return { area: "head", slot: "C" };
    case "top-right":
      return { area: "head", slot: "R" };
    case "bottom-left":
      return { area: "foot", slot: "L" };
    case "bottom-center":
      return { area: "foot", slot: "C" };
    case "bottom-right":
      return { area: "foot", slot: "R" };
    default:
      return { area: "head", slot: "R" };
  }
}

function buildRepeatPreamble(page: ResolvedPageNode, ctx: RenderContext): string[] {
  const repeats = collectRepeatNodes(page);

  const regular = repeats
    .filter((node) => node.when !== "first-page")
    .map((node) => {
      const content = node.children.map((child) => renderFurnitureChild(child, ctx)).filter(Boolean).join(" ");
      if (content.length === 0) {
        return null;
      }
      const target = latexHeaderSlot(node.anchor);
      return `\\fancy${target.area}[${target.slot}]{${content}}`;
    })
    .filter((line): line is string => line != null);

  const firstPage = repeats
    .filter((node) => node.when !== "not-first-page")
    .map((node) => {
      const content = node.children.map((child) => renderFurnitureChild(child, ctx)).filter(Boolean).join(" ");
      if (content.length === 0) {
        return null;
      }
      const target = latexHeaderSlot(node.anchor);
      return `\\fancy${target.area}[${target.slot}]{${content}}`;
    })
    .filter((line): line is string => line != null);

  const lines = [...regular];
  if (repeats.some((node) => node.when === "first-page" || node.when === "not-first-page")) {
    lines.push("\\fancypagestyle{reactdocfirstpage}{");
    lines.push("\\fancyhf{}");
    lines.push(...firstPage);
    lines.push("}");
  }

  return lines;
}

function fixedAnchorCommand(anchor: string, content: string): string {
  switch (anchor) {
    case "top-left":
    case "page-top-left":
      return `\\AtPageUpperLeft{\\raisebox{-12mm}[0pt][0pt]{\\hspace*{12mm}${content}}}`;
    case "top-center":
      return `\\AtPageUpperLeft{\\raisebox{-12mm}[0pt][0pt]{\\makebox[\\paperwidth][c]{${content}}}}`;
    case "top-right":
    case "page-top-right":
      return `\\AtPageUpperLeft{\\raisebox{-12mm}[0pt][0pt]{\\makebox[\\paperwidth][r]{\\hspace*{-12mm}${content}}}}`;
    case "bottom-left":
    case "page-bottom-left":
      return `\\AtPageLowerLeft{\\raisebox{12mm}[0pt][0pt]{\\hspace*{12mm}${content}}}`;
    case "bottom-center":
      return `\\AtPageLowerLeft{\\raisebox{12mm}[0pt][0pt]{\\makebox[\\paperwidth][c]{${content}}}}`;
    case "bottom-right":
    case "page-bottom-right":
      return `\\AtPageLowerLeft{\\raisebox{12mm}[0pt][0pt]{\\makebox[\\paperwidth][r]{\\hspace*{-12mm}${content}}}}`;
    default:
      return `\\AtPageUpperLeft{\\raisebox{-12mm}[0pt][0pt]{\\hspace*{12mm}${content}}}`;
  }
}

function buildFixedPreamble(page: ResolvedPageNode, ctx: RenderContext): string[] {
  return collectFixedNodes(page)
    .filter((node) => node.when !== "first-page")
    .map((node) => {
      const content = node.children.map((child) => renderFurnitureChild(child, ctx)).filter(Boolean).join(" ");
      if (content.length === 0) {
        return null;
      }
      return `\\AddToShipoutPictureFG{${fixedAnchorCommand(node.anchor, content)}}`;
    })
    .filter((line): line is string => line != null);
}

function buildDocumentStartLines(page: ResolvedPageNode, ctx: RenderContext): string[] {
  const lines: string[] = [];
  const repeats = collectRepeatNodes(page);

  if (repeats.some((node) => node.when === "first-page" || node.when === "not-first-page")) {
    lines.push("\\thispagestyle{reactdocfirstpage}");
  }

  for (const node of collectFixedNodes(page).filter((entry) => entry.when === "first-page")) {
    const content = node.children.map((child) => renderFurnitureChild(child, ctx)).filter(Boolean).join(" ");
    if (content.length === 0) {
      continue;
    }
    lines.push(`\\AddToShipoutPictureFG*{${fixedAnchorCommand(node.anchor, content)}}`);
  }

  return lines;
}

function renderBoxNode(node: ResolvedBoxNode, ctx: RenderContext): string {
  const body = node.children.map((child) => renderResolvedChild(child, ctx)).join("\n\n");
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

function renderCustomNode(node: ResolvedCustomTemplateNode, ctx: RenderContext): string {
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
    renderChildren: (children) => children.map((child) => renderResolvedChild(child, ctx)).join("\n\n"),
    escapeLatex,
    wrapWithAlignment
  });
}

function renderStackNode(node: ResolvedStackNode, ctx: RenderContext): string {
  const pieces = node.children.map((child) => renderResolvedChild(child, ctx));
  const gap = node.gap != null ? `\n\\vspace*{${node.gap}}\n` : "\n\n";
  return pieces.join(gap);
}

function renderRowNode(node: ResolvedRowNode, ctx: RenderContext): string {
  const pieces = node.children.map((child, index) => {
    const width =
      child.kind === "box" || child.kind === "stack" || child.kind === "row" || child.kind === "custom"
        ? normalizeRowWidth(child.style?.width)
        : null;

    const content = renderResolvedChild(child, ctx);
    if (width == null) {
      return `\\begin{minipage}[t]{\\dimexpr\\linewidth / ${Math.max(node.children.length, 1)}\\relax}\n${content}\n\\end{minipage}`;
    }

    return `\\begin{minipage}[t]{${width}}\n${content}\n\\end{minipage}`;
  });

  const gap = node.gap != null ? `\\hspace*{${node.gap}}` : "\\hfill";
  return ["\\noindent", pieces.join(`\n${gap}\n`)].join("\n");
}

function renderPageNode(node: ResolvedPageNode, ctx: RenderContext): string {
  const flowChildren = node.children.filter((child) => child.kind !== "repeat" && child.kind !== "fixed");
  let body = flowChildren.map((child) => renderResolvedChild(child, ctx)).join("\n\n");
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

function renderResolvedChild(node: ResolvedChild, ctx: RenderContext): string {
  switch (node.kind) {
    case "page":
      return renderPageNode(node, ctx);
    case "box":
      return renderBoxNode(node, ctx);
    case "stack":
      return renderStackNode(node, ctx);
    case "row":
      return renderRowNode(node, ctx);
    case "rule":
      return renderRuleNode(node);
    case "page-number":
      return renderPageNumberNode(node);
    case "repeat":
    case "fixed":
      return "";
    case "custom":
      return renderCustomNode(node, ctx);
    case "title":
    case "author":
    case "abstract":
    case "section":
    case "figure":
    case "code-block":
    case "thematic-break":
    case "paragraph":
    case "text":
    case "page-break":
      return renderContentNode(node, ctx);
  }

  throw new Error("Unsupported resolved child node.");
}

function buildRenderContext(page: ResolvedPageNode): RenderContext {
  return {
    sectionStyle: page.style?.sectionStyle === "label" ? "label" : "heading",
    blockquoteStyle: page.style?.blockquoteStyle === "plain" ? "plain" : "indent"
  };
}

export function renderResolvedToLatex(page: ResolvedPageNode): string {
  const ctx = buildRenderContext(page);
  const preamble = collectPreamble(page);
  const repeatPreamble = buildRepeatPreamble(page, ctx);
  const fixedPreamble = buildFixedPreamble(page, ctx);
  const documentStartLines = buildDocumentStartLines(page, ctx);
  const body = renderPageNode(page, ctx);

  return [
    ...preamble,
    ...repeatPreamble,
    ...fixedPreamble,
    "",
    "\\begin{document}",
    ...documentStartLines,
    body,
    "\\end{document}",
    ""
  ].join("\n");
}
