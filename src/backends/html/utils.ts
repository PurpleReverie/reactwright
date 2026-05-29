import type { ResolvedRegionNode } from "../../resolver/ir.js";

// HTML-escape a string for safe insertion into element bodies and
// attribute values. Used everywhere a renderer interpolates dynamic
// content into a string template.
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Normalize CSS Paged Media page sizes to their canonical names
// (A4/Letter/etc.) so the `@page { size: ...; }` rule is uppercase as
// the spec requires.
export function normalizePageSize(size: unknown): string | null {
  if (typeof size !== "string") return null;
  const lower = size.trim().toLowerCase();
  if (lower === "a4" || lower === "letter" || lower === "a5" || lower === "a3" || lower === "legal") {
    return lower.toUpperCase();
  }
  return size.trim();
}

// Optional `id="..."` attribute emitter.
export function idAttr(id: string | undefined): string {
  return id != null ? ` id="${escapeHtml(id)}"` : "";
}

// Absolute filesystem paths (POSIX) become file:// URLs so they load
// in headless Chromium and in browsers opened directly on the HTML.
// Other schemes (http, https, data, file already) and relative paths
// pass through.
export function normalizeImageSrc(src: string): string {
  if (src.startsWith("/")) return `file://${src}`;
  return src;
}

// Anchor name → CSS Paged Media margin-box selector.
//
// Mirror-aware anchors (top-inside / top-outside / bottom-inside /
// bottom-outside) map to top-left/top-right via @page :left/:right
// rules; emitted under explicit :left/:right page selectors by the
// caller.
export function marginAnchorToCssBox(anchor: string): string {
  switch (anchor) {
    case "top-left":      return "@top-left";
    case "top-center":    return "@top-center";
    case "top-right":     return "@top-right";
    case "bottom-left":   return "@bottom-left";
    case "bottom-center": return "@bottom-center";
    case "bottom-right":  return "@bottom-right";
    case "top-inside":
    case "top-outside":
      return anchor === "top-inside" ? "@top-left" : "@top-right";
    case "bottom-inside":
    case "bottom-outside":
      return anchor === "bottom-inside" ? "@bottom-left" : "@bottom-right";
    case "left-top":      return "@left-top";
    case "left-middle":   return "@left-middle";
    case "left-bottom":   return "@left-bottom";
    case "right-top":     return "@right-top";
    case "right-middle":  return "@right-middle";
    case "right-bottom":  return "@right-bottom";
    default:              return "@top-center";
  }
}

// Named anchor → absolute-position CSS declarations for <fixed>
// overlays. "page-*" aliases route to the same set as the corner
// shortcuts so authors can write the form they prefer.
export function anchorToCss(anchor: string): string {
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

// Coordinate anchor (top/right/bottom/left as inline values) →
// absolute-position CSS declarations.
export function coordinateAnchorToCss(
  coord: { top?: string; right?: string; bottom?: string; left?: string }
): string {
  const parts: string[] = [];
  if (coord.top != null) parts.push(`top:${coord.top};`);
  if (coord.right != null) parts.push(`right:${coord.right};`);
  if (coord.bottom != null) parts.push(`bottom:${coord.bottom};`);
  if (coord.left != null) parts.push(`left:${coord.left};`);
  return parts.join("");
}

// Region positioning flags (fill, center) → CSS declarations.
export function regionPositioningCss(node: ResolvedRegionNode): string {
  const p = node.positioning;
  if (p == null) return "";
  const declarations: string[] = [];
  if (p.fill === true) declarations.push("position:absolute;", "inset:0;");
  if (p.center === true) {
    declarations.push("display:flex;", "align-items:center;", "justify-content:center;");
  }
  return declarations.join("");
}
