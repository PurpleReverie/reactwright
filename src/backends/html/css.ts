import type { TemplateStyle } from "../../template/ir.js";
import type {
  ResolvedFootnoteAreaNode,
  ResolvedLayerNode,
  ResolvedPageNode,
  ResolvedSidenoteAreaNode
} from "../../resolver/ir.js";
import { marginAnchorToCssBox, normalizePageSize } from "./utils.js";

// Style keys that belong to the @page rule (page geometry) and should
// NOT be re-emitted as inline CSS on region/stack/column elements.
// `columns` and `columnGap` used to be in this set, but multi-column
// layout is per element, not page-level, so they need to flow through
// to inline CSS.
const PAGE_GROUP_KEYS = new Set([
  "size",
  "orientation",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft"
]);

// JS style key → CSS property name. Each entry is emitted verbatim
// from a style value via `styleToInlineCss`. Adding a new style key
// usually means adding one entry here.
const cssPropertyMap: Record<string, string> = {
  margin: "margin",
  marginTop: "margin-top",
  marginRight: "margin-right",
  marginBottom: "margin-bottom",
  marginLeft: "margin-left",
  maxWidth: "max-width",
  minWidth: "min-width",
  width: "width",
  minHeight: "min-height",
  maxHeight: "max-height",
  height: "height",
  display: "display",
  alignItems: "align-items",
  justifyContent: "justify-content",
  flexDirection: "flex-direction",
  flexWrap: "flex-wrap",
  gap: "gap",
  rowGap: "row-gap",
  opacity: "opacity",
  transform: "transform",
  objectFit: "object-fit",
  padding: "padding",
  paddingTop: "padding-top",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  fontStyle: "font-style",
  fontVariant: "font-variant",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  wordSpacing: "word-spacing",
  textAlign: "text-align",
  textTransform: "text-transform",
  textDecoration: "text-decoration",
  textIndent: "text-indent",
  columns: "column-count",
  columnGap: "column-gap",
  columnSpan: "column-span",
  columnFill: "column-fill",
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

// Inline `style="..."` declarations from a TemplateStyle. The stack
// branch injects flex defaults that have no style-key equivalent.
export function styleToInlineCss(
  style: TemplateStyle | undefined,
  kind?: "stack" | "region"
): string {
  if (style == null && kind !== "stack") return "";

  const declarations: string[] = [];

  if (kind === "stack") {
    declarations.push("display:flex;", "flex-direction:column;");
  }

  for (const [key, cssName] of Object.entries(cssPropertyMap)) {
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

// Public alias preserved for custom-intrinsic compatibility. The
// "page" kind returns nothing because page geometry is emitted as an
// @page rule, not an inline style.
export function styleToCss(
  style: TemplateStyle | undefined,
  kind?: "page" | "region" | "stack"
): string {
  if (kind === "page") return "";
  return styleToInlineCss(style, kind === "region" ? "region" : kind);
}

// @page rule for a named regime or the default. Emits size, margin*,
// and background-color when present on the style.
export function buildAtPageRule(
  style: TemplateStyle | undefined,
  name?: string
): string | null {
  if (style == null) return null;
  const declarations: string[] = [];

  const size = normalizePageSize(style.size);
  if (size != null) {
    const orientation =
      style.orientation === "landscape" ? " landscape"
        : style.orientation === "portrait" ? " portrait" : "";
    declarations.push(`size:${size}${orientation};`);
  }

  if (style.margin != null) declarations.push(`margin:${String(style.margin)};`);
  if (style.marginTop != null) declarations.push(`margin-top:${String(style.marginTop)};`);
  if (style.marginRight != null) declarations.push(`margin-right:${String(style.marginRight)};`);
  if (style.marginBottom != null) declarations.push(`margin-bottom:${String(style.marginBottom)};`);
  if (style.marginLeft != null) declarations.push(`margin-left:${String(style.marginLeft)};`);
  if (style.backgroundColor != null) declarations.push(`background-color:${String(style.backgroundColor)};`);

  if (declarations.length === 0) return null;

  const selector = name != null ? `@page ${name}` : "@page";
  return `${selector}{${declarations.join("")}}`;
}

// Body-text rule emitted as `.reactwright-flow { ... }`. Covers the
// document-wide typography choices that don't belong on @page.
export function buildBodyTextRule(style: TemplateStyle | undefined): string | null {
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
  return `.reactwright-flow{${declarations.join("")}}`;
}

// Running-string wiring: built-in title strings plus per-name <set>
// source / <running> sink rules.
export function buildRunningStringsCss(names: Set<string>): string {
  if (names.size === 0) return "";
  const rules: string[] = [];

  rules.push("h1.reactwright-document-title{string-set:document-title content();}");
  rules.push("h2.reactwright-section-title{string-set:section-title content();}");
  rules.push("h2.reactwright-chapter-title{string-set:chapter-title content();}");

  for (const name of names) {
    const cls = `reactwright-running-${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    rules.push(`.${cls}-source{string-set:${name} content();}`);
    rules.push(`.${cls}::before{content:string(${name});}`);
  }

  return rules.join("");
}

// Entry shape produced by collectMarginMatter. Stays in collectors but
// the type ships here so buildMarginMatterCss can consume it.
export type MarginMatterEntry = {
  kind: "header" | "footer";
  anchor: string;
  when?: string;
  regime?: string;
  flowName: string;
  html: string;
};

// @page margin-box CSS for the collected header/footer entries.
// Handles three concerns:
//   - one-sided anchors (top-left etc.) emit a single rule.
//   - mirrored anchors (top-inside, bottom-outside, etc.) emit
//     :left/:right pair rules.
//   - `when` policy (first-page / not-first-page / all) gates which
//     rules apply.
export function buildMarginMatterCss(entries: MarginMatterEntry[]): string {
  if (entries.length === 0) return "";

  const rules: string[] = [];

  // Each margin flow needs `position: running(name)` so Paged.js lifts
  // the div out of body flow.
  for (const e of entries) {
    rules.push(`.${e.flowName}{position:running(${e.flowName});}`);
  }

  const atPage = (extra: string) => (e: MarginMatterEntry): string =>
    e.regime != null ? `@page ${e.regime}${extra}` : `@page${extra}`;
  const atPageDefault = atPage("");
  const atPageLeft = atPage(" :left");
  const atPageRight = atPage(" :right");
  const atPageFirst = atPage(" :first");

  for (const e of entries) {
    const box = marginAnchorToCssBox(e.anchor);
    const isInside = e.anchor.endsWith("inside");
    const isOutside = e.anchor.endsWith("outside");

    if (isInside || isOutside) {
      // Two-sided: @page :left and @page :right invert.
      const leftBox =
        e.anchor.startsWith("top")
          ? isInside ? "@top-right" : "@top-left"
          : isInside ? "@bottom-right" : "@bottom-left";
      const rightBox = box;
      const whenSuppress = e.when === "not-first-page";

      if (e.when === "first-page") {
        rules.push(`${atPageFirst(e)}{${leftBox}{content:element(${e.flowName});}${rightBox}{content:element(${e.flowName});}}`);
      } else {
        rules.push(`${atPageLeft(e)}{${leftBox}{content:element(${e.flowName});}}`);
        rules.push(`${atPageRight(e)}{${rightBox}{content:element(${e.flowName});}}`);
        if (whenSuppress) {
          rules.push(`${atPageFirst(e)}{${leftBox}{content:none;}${rightBox}{content:none;}}`);
        }
      }
    } else {
      if (e.when === "first-page") {
        rules.push(`${atPageFirst(e)}{${box}{content:element(${e.flowName});}}`);
      } else if (e.when === "not-first-page") {
        rules.push(`${atPageDefault(e)}{${box}{content:element(${e.flowName});}}`);
        rules.push(`${atPageFirst(e)}{${box}{content:none;}}`);
      } else {
        rules.push(`${atPageDefault(e)}{${box}{content:element(${e.flowName});}}`);
      }
    }
  }

  return rules.join("");
}

// Footnote area: float:footnote on footnote nodes + @footnote margin
// box styling. `separator={false}` removes the divider rule.
export function buildFootnoteAreaCss(page: ResolvedPageNode): string {
  const area = page.children.find(
    (child): child is ResolvedFootnoteAreaNode => child.kind === "footnote-area"
  );
  if (area == null) return "";
  const rules: string[] = [];
  rules.push(".reactwright-footnote{float:footnote;}");
  rules.push("@page{@footnote{border-top:1px solid #999;padding-top:0.25em;}}");
  if (area.separator === false) {
    rules.push("@page{@footnote{border-top:none;}}");
  }
  return rules.join("");
}

// Replace $name tokens in a numbering format string ("Figure
// $chapter.$figure") with CSS counter() calls, quoting the in-between
// literals so they pass through CSS unchanged.
export function numberingFormatToCssContent(format: string, fallbackCounter: string): string {
  const tokens: string[] = [];
  const re = /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(format)) !== null) {
    if (match.index > lastIndex) {
      const literal = format.slice(lastIndex, match.index);
      tokens.push(`'${literal.replace(/'/g, "\\'")}'`);
    }
    tokens.push(`counter(${match[1]})`);
    lastIndex = re.lastIndex;
  }
  if (lastIndex < format.length) {
    const tail = format.slice(lastIndex);
    tokens.push(`'${tail.replace(/'/g, "\\'")}'`);
  }
  if (tokens.length === 0) return `counter(${fallbackCounter})`;
  return tokens.join(" ");
}

// Per-role-variant CSS: break-*, counter wiring, drop-cap, and
// arbitrary style passthrough. This is how a template declares what
// a vocabulary role like "plate" or "callout" actually looks like,
// without the engine baking in specific role names.
export function buildRoleVariantCss(page: ResolvedPageNode): string {
  const rules = page.variantRules ?? [];
  if (rules.length === 0) return "";
  const out: string[] = [];
  for (const r of rules) {
    const selector = `[data-variant="${r.apply}"]`;
    const decls: string[] = [];
    if (r.breakBefore != null) decls.push(`break-before:${r.breakBefore};`);
    if (r.breakAfter != null) decls.push(`break-after:${r.breakAfter};`);
    if (r.breakInside != null) decls.push(`break-inside:${r.breakInside};`);
    if (r.numbering != null) {
      decls.push(`counter-increment:${r.numbering.counter};`);
    }
    if (r.style != null) {
      const styleCss = styleToInlineCss(r.style, "region");
      if (styleCss.length > 0) decls.push(styleCss);
    }
    if (decls.length > 0) out.push(`${selector}{${decls.join("")}}`);
    if (r.numbering != null) {
      if (r.numbering.scope != null) {
        out.push(`[data-variant="${r.numbering.scope}"]{counter-reset:${r.numbering.counter};}`);
      }
      if (r.numbering.format != null) {
        const content = numberingFormatToCssContent(r.numbering.format, r.numbering.counter);
        out.push(`${selector}::before{content:${content};}`);
      }
    }
    if (r.dropCap != null) {
      const dc = r.dropCap;
      const lines = dc.lines ?? 3;
      const fontPart = dc.font != null ? `font-family:${dc.font};` : "";
      // -webkit-initial-letter for Chromium/Safari support; padding-right
      // keeps wrapped text from touching the cap.
      out.push(
        `${selector}::first-letter{initial-letter:${lines};-webkit-initial-letter:${lines};${fontPart}padding-right:0.12em;}`
      );
    }
  }
  return out.join("");
}

// Sidenote area: absolute-positioned column on the page margin.
export function buildSidenoteAreaCss(page: ResolvedPageNode): string {
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
    `.reactwright-sidenote{position:absolute;${sideRule}width:${width};font-size:0.85em;line-height:1.3;}`,
    ".reactwright-flow{position:relative;}"
  ].join("");
}

// Content-less <layer> with a backgroundColor becomes an @page
// background. Layers inside a page-set scope to that regime's @page X
// rule. Layers with children stay as in-flow positioned divs (handled
// in the main renderer).
export function buildPageBackgroundLayersCss(page: ResolvedPageNode): string {
  const all: ResolvedLayerNode[] = [];
  const collect = (children: readonly { kind: string }[]): void => {
    for (const c of children) {
      if (c.kind === "layer") all.push(c as ResolvedLayerNode);
    }
  };
  collect(page.children);

  const byRegime = new Map<string, string[]>();
  for (const layer of all) {
    if (layer.children.length > 0) continue;
    const s = layer.style;
    if (s?.backgroundColor == null) continue;
    const key = layer.regime ?? "";
    const list = byRegime.get(key) ?? [];
    list.push(`background-color:${String(s.backgroundColor)};`);
    byRegime.set(key, list);
  }
  if (byRegime.size === 0) return "";
  const rules: string[] = [];
  for (const [regime, decls] of byRegime) {
    const sel = regime.length > 0 ? `@page ${regime}` : "@page";
    rules.push(`${sel}{${decls.join("")}}`);
  }
  return rules.join("");
}

// Emit one @page rule per declared regime so per-regime geometry
// applies even before any content routes to it.
export function buildPageRegimesCss(page: ResolvedPageNode): string {
  const regimes = page.regimes ?? [];
  if (regimes.length === 0) return "";
  return regimes
    .map((r) => buildAtPageRule(r.style, r.name) ?? `@page ${r.name}{}`)
    .join("");
}
