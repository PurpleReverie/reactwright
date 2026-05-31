import { createRequire } from "node:module";

import { getAllFonts } from "../../fonts/registry.js";
import type {
  ResolvedChild,
  ResolvedContentNode,
  ResolvedFontNode,
  ResolvedInlineNode,
  ResolvedPageNode
} from "../../resolver/ir.js";
import { escapeHtml } from "./utils.js";

// KaTeX CSS bundled by the same CDN serving the Chromium-side fonts.
export const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css";

// Lazy KaTeX import so we don't pay the require cost for documents
// that have no math. Result is cached after first use. KaTeX ships as
// CJS; we require via createRequire so the dep is optional (tolerant
// of missing install).
type KatexImpl = {
  renderToString: (tex: string, opts?: Record<string, unknown>) => string;
};

let katexImpl: KatexImpl | null = null;
const requireFromHere = createRequire(import.meta.url);

function getKatex(): KatexImpl | null {
  if (katexImpl != null) return katexImpl;
  try {
    const mod = requireFromHere("katex") as { default?: KatexImpl } | KatexImpl;
    katexImpl = (mod as { default?: KatexImpl }).default ?? (mod as KatexImpl);
    return katexImpl;
  } catch {
    return null;
  }
}

export function renderTeX(src: string, displayMode: boolean): string {
  const k = getKatex();
  if (k == null) {
    // KaTeX unavailable; fall back to plain text so the doc still renders.
    return escapeHtml(src);
  }
  try {
    return k.renderToString(src, {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: "ignore"
    });
  } catch {
    return escapeHtml(src);
  }
}

// True if the tree contains any math nodes; used to decide whether to
// pull in the KaTeX stylesheet.
export function hasMathNodes(
  node: ResolvedPageNode | ResolvedChild | ResolvedContentNode | ResolvedInlineNode
): boolean {
  if ("kind" in node && (node.kind === "math" || node.kind === "m")) return true;
  if ("children" in node && Array.isArray(node.children)) {
    for (const c of node.children) {
      if (hasMathNodes(c as ResolvedChild)) return true;
    }
  }
  return false;
}

// Walk the tree and gather every fontFamily string in use. Lower-cased
// for case-insensitive registry lookup.
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

// Walk the tree and gather every declarative <font/> node so its
// stylesheet or @font-face URL can be emitted.
function collectTemplateFonts(page: ResolvedPageNode): ResolvedFontNode[] {
  const out: ResolvedFontNode[] = [];
  const walk = (n: ResolvedChild | ResolvedPageNode): void => {
    if ("kind" in n && n.kind === "font") {
      out.push(n as ResolvedFontNode);
      return;
    }
    if ("children" in n && Array.isArray(n.children)) {
      for (const c of n.children) walk(c as ResolvedChild);
    }
  };
  walk(page);
  return out;
}

// Build the <link>/<style> tags that go in the document head. Sources:
//   - registered fonts whose family is referenced in the tree.
//   - <font/> nodes declared in the template. CSS-stylesheet URLs
//     (Google Fonts, Fontsource, etc.) become <link>; direct font-file
//     URLs become @font-face rules.
export function buildFontHeadTags(page: ResolvedPageNode): string[] {
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
      const formatAttr =
        def.html.format != null ? ` format('${escapeHtml(def.html.format)}')` : "";
      faces.push(
        `@font-face{font-family:'${escapeHtml(family)}';src:url('${escapeHtml(def.html.src)}')${formatAttr};}`
      );
    }
  }

  const seenStylesheet = new Set<string>();
  for (const f of collectTemplateFonts(page)) {
    const looksLikeStylesheet =
      f.src.includes("/css") ||
      f.src.endsWith(".css") ||
      f.src.includes("fonts.googleapis.com");
    if (looksLikeStylesheet) {
      if (seenStylesheet.has(f.src)) continue;
      seenStylesheet.add(f.src);
      links.push(`<link rel="stylesheet" href="${escapeHtml(f.src)}" />`);
      continue;
    }
    const formatPart = f.format != null ? ` format('${escapeHtml(f.format)}')` : "";
    const weightPart = f.weight != null ? `font-weight:${escapeHtml(f.weight)};` : "";
    const stylePart = f.fontStyle != null ? `font-style:${escapeHtml(f.fontStyle)};` : "";
    faces.push(
      `@font-face{font-family:'${escapeHtml(f.family)}';src:url('${escapeHtml(f.src)}')${formatPart};${weightPart}${stylePart}}`
    );
  }

  const tags: string[] = [...links];
  if (faces.length > 0) {
    tags.push(`<style>${faces.join("")}</style>`);
  }
  return tags;
}
