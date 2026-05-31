import type { TemplateStyle } from "../../template/ir.js";
import { getTemplateIntrinsic } from "../../template/registry.js";
import type {
  ResolvedBibliographyNode,
  ResolvedChild,
  ResolvedColumnNode,
  ResolvedColumnsNode,
  ResolvedContentNode,
  ResolvedCustomTemplateNode,
  ResolvedFixedNode,
  ResolvedImageNode,
  ResolvedIndexTemplateNode,
  ResolvedLayerNode,
  ResolvedListOfNode,
  ResolvedPageCountNode,
  ResolvedPageNode,
  ResolvedPageNumberNode,
  ResolvedRegionNode,
  ResolvedRunningNode,
  ResolvedStackNode,
  ResolvedTemplateRowNode,
  ResolvedTocNode
} from "../../resolver/ir.js";
import {
  anchorToCss,
  coordinateAnchorToCss,
  escapeHtml,
  normalizeImageSrc,
  regionPositioningCss,
  runningClassFor
} from "./utils.js";
import { renderInlineNode } from "./inline.js";
import { styleToCss, styleToInlineCss, type MarginMatterEntry } from "./css.js";
import { renderContentNode, renderSectionNode } from "./content.js";
import { classAttr, classAttrWithBase } from "./class-bindings.js";

// Render an array of children to a single HTML string. Used at every
// container call-site that needs to pass its rendered children into a
// container renderer's innerHtml parameter.
export function renderChildren(children: ResolvedChild[]): string {
  return children.map((c) => renderResolvedChild(c)).join("");
}

// --- Container renderers (all take pre-rendered innerHtml) -----------

export function renderRegionNode(node: ResolvedRegionNode, innerHtml: string): string {
  const positioning = regionPositioningCss(node);
  const inline = styleToInlineCss(node.style, "region");
  const combined = positioning + inline;
  const styleAttr = combined.length > 0 ? ` style="${escapeHtml(combined)}"` : "";
  return `<div data-node="region"${styleAttr}${classAttr(node)}>${innerHtml}</div>`;
}

export function renderStackNode(node: ResolvedStackNode, innerHtml: string): string {
  const mergedStyle: TemplateStyle = {
    ...(node.style ?? {}),
    ...(node.gap != null ? { gap: node.gap } : {})
  };
  const style = styleToInlineCss(mergedStyle, "stack");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="stack"${styleAttr}${classAttr(node)}>${innerHtml}</div>`;
}

// Horizontal-flex layout, symmetric to renderStackNode but with
// flex-direction: row. Emits `data-node="template-row"` so the DOM
// distinguishes it from the content-side table row.
export function renderTemplateRowNode(node: ResolvedTemplateRowNode, innerHtml: string): string {
  const baseStyle = "display:flex;flex-direction:row;";
  const gapStyle = node.gap != null ? `gap:${escapeHtml(node.gap)};` : "";
  const extraStyle = styleToInlineCss(node.style, "region");
  const style = `${baseStyle}${gapStyle}${extraStyle}`;
  return `<div data-node="template-row" style="${escapeHtml(style)}"${classAttr(node)}>${innerHtml}</div>`;
}

export function renderColumnsNode(node: ResolvedColumnsNode, innerHtml: string): string {
  const widths = node.widths;
  const explicit = node.children.filter(
    (c): c is ResolvedColumnNode => (c as ResolvedChild).kind === "column"
  );
  const gap = node.gap ?? "8mm";
  let gridTemplate: string;
  if (explicit.length > 0) {
    gridTemplate = explicit
      .map((c, i) => c.width ?? widths?.[i] ?? "1fr")
      .join(" ");
  } else if (widths && widths.length > 0) {
    gridTemplate = widths.join(" ");
  } else {
    gridTemplate = "1fr 1fr";
  }
  const style = `display:grid;grid-template-columns:${gridTemplate};gap:${gap};${styleToInlineCss(node.style, "region")}`;
  return `<div data-node="columns" style="${escapeHtml(style)}"${classAttr(node)}>${innerHtml}</div>`;
}

export function renderColumnNode(node: ResolvedColumnNode, innerHtml: string): string {
  const style = styleToInlineCss(node.style, "region");
  const styleAttr = style.length > 0 ? ` style="${escapeHtml(style)}"` : "";
  return `<div data-node="column"${styleAttr}${classAttr(node)}>${innerHtml}</div>`;
}

export function renderFixedNode(node: ResolvedFixedNode, innerHtml: string): string {
  const anchorCss =
    typeof node.anchor === "string" ? anchorToCss(node.anchor) : coordinateAnchorToCss(node.anchor);
  // position:fixed (rather than absolute) means Paged.js + CSS Paged
  // Media clone the element onto every paginated page at the
  // anchor-computed coordinates. This makes <fixed> behave the way
  // its name suggests: repeating page chrome — watermarks, page
  // borders, every-page logos. Per-regime "appears only on cover"
  // semantics still need a future `when=` prop + Paged.js handler
  // (page-set regime isolation refactor #55 Path C, pending).
  const style = [
    "position:fixed;",
    "z-index:2;",
    anchorCss,
    styleToInlineCss(node.style, "region")
  ].join("");
  const whenAttr = node.when != null ? ` data-when="${escapeHtml(node.when)}"` : "";
  const anchorAttr =
    typeof node.anchor === "string" ? ` data-anchor="${escapeHtml(node.anchor)}"` : "";
  return `<div data-node="fixed"${whenAttr}${anchorAttr} style="${escapeHtml(style)}"${classAttr(node)}>${innerHtml}</div>`;
}

export function renderLayerNode(node: ResolvedLayerNode, zIndex: number, innerHtml: string): string {
  const nameAttr = node.name != null ? ` data-name="${escapeHtml(node.name)}"` : "";
  const whenAttr = node.when != null ? ` data-when="${escapeHtml(node.when)}"` : "";
  const inline = styleToInlineCss(node.style, "region");
  const positioning = `position:absolute;inset:0;z-index:${zIndex};`;
  const combined = positioning + inline;
  return `<div data-node="layer"${nameAttr}${whenAttr} style="${escapeHtml(combined)}"${classAttr(node)}>${innerHtml}</div>`;
}

// --- Decoration-style renderers (no children) ------------------------

export function renderPageNumberNode(_node: ResolvedPageNumberNode): string {
  return '<span data-node="page-number" class="reactwright-page-number"></span>';
}

export function renderPageCountNode(_node: ResolvedPageCountNode): string {
  return '<span data-node="page-count" class="reactwright-page-count"></span>';
}

export function renderRunningNode(node: ResolvedRunningNode): string {
  const policyAttr = node.policy != null ? ` data-policy="${escapeHtml(node.policy)}"` : "";
  return `<span data-node="running" data-running-name="${escapeHtml(node.name)}"${policyAttr} class="${runningClassFor(node.name)}"></span>`;
}

export function renderImageNode(node: ResolvedImageNode): string {
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
  return `<img data-node="image" src="${escapeHtml(normalizeImageSrc(node.src))}"${altAttr}${styleAttr} />`;
}

// --- Reference renderers --------------------------------------------

// TOC and list-of entries split the row into two sibling anchors:
// one wraps the title text, one is the empty page-number node whose
// ::after content reads via target-counter(attr(href url), page).
// Both anchors must carry the href so attr(href url) resolves on
// each of them — putting the page span inside the title <a> meant
// the page span had no href and target-counter returned 0.
export function renderListOfNode(node: ResolvedListOfNode): string {
  const title = node.title != null ? `<h2 class="reactwright-list-of-title">${escapeHtml(node.title)}</h2>` : "";
  const items = node.entries
    .map((e) => {
      const href = `#${escapeHtml(e.id)}`;
      return `<li class="reactwright-list-of-entry"><a class="reactwright-list-of-link" href="${href}"><span class="reactwright-list-of-text">${escapeHtml(e.caption)}</span></a><a class="reactwright-list-of-page" href="${href}"></a></li>`;
    })
    .join("");
  return `<nav data-node="list-of" data-of="${escapeHtml(node.of)}" class="reactwright-list-of">${title}<ol>${items}</ol></nav>`;
}

export function renderTocNode(node: ResolvedTocNode): string {
  const title = node.title != null ? `<h2 class="reactwright-toc-title">${escapeHtml(node.title)}</h2>` : "";
  const items = node.entries
    .map((e) => {
      const depthClass = ` class="reactwright-toc-entry reactwright-toc-depth-${e.depth}"`;
      const numberedAttr = node.numbered === true ? ` data-numbered="true"` : "";
      const href = `#${escapeHtml(e.id)}`;
      return `<li${depthClass}${numberedAttr}><a class="reactwright-toc-link" href="${href}"><span class="reactwright-toc-text">${escapeHtml(e.title)}</span></a><a class="reactwright-toc-page" href="${href}"></a></li>`;
    })
    .join("");
  return `<nav data-node="toc" class="reactwright-toc">${title}<ol>${items}</ol></nav>`;
}

export function renderIndexTemplateNode(node: ResolvedIndexTemplateNode): string {
  const title = node.title != null ? `<h2 class="reactwright-index-title">${escapeHtml(node.title)}</h2>` : "";
  const items = node.entries
    .map((e) => {
      const refs = e.anchorIds
        .map((id) => `<a class="reactwright-index-pageref" href="#${escapeHtml(id)}"></a>`)
        .join(", ");
      return `<li data-index-term="${escapeHtml(e.term)}">${escapeHtml(e.term)}<span class="reactwright-index-pagerefs"> ${refs}</span></li>`;
    })
    .join("");
  return `<section data-node="index" class="reactwright-index">${title}<ul>${items}</ul></section>`;
}

export function renderBibliographyNode(node: ResolvedBibliographyNode): string {
  // Slice 5.3: the synthesized headingNode / listNode carry any
  // rule-applied classes via `classAttr` so authors can target the
  // rendered <h2>/<ol> via kind:"bibliography-heading" / kind:"bibliography-list".
  const headingClassAttr = node.headingNode != null
    ? classAttrWithBase(node.headingNode, "reactwright-bibliography-title")
    : ' class="reactwright-bibliography-title"';
  const listClassAttr = node.listNode != null ? classAttr(node.listNode) : "";
  const title = node.title != null ? `<h2${headingClassAttr}>${escapeHtml(node.title)}</h2>` : "";
  // Bibliography counter wiring: counter-reset on the section and
  // counter-increment per <li> are emitted via STATIC_DEFAULTS_CSS
  // class rules (.reactwright-bibliography / .reactwright-bibliography ol > li)
  // rather than inline styles. Paged.js's target-counter() does not
  // see inline-style counter-increments when resolving cross-page
  // <cite> references — using CSS rules fixes that.
  const items = node.entries
    .map((e) => {
      const usedAttr = e.used ? ` data-used="true"` : "";
      const body =
        e.inline != null && e.inline.length > 0
          ? e.inline.map((c) => renderInlineNode(c)).join("")
          : escapeHtml(e.text ?? e.key);
      // The entry's source `ResolvedRefEntryNode` (when present) is the
      // identity rules bind to — look up its class list so a
      // `<rule match={{ kind: "ref-entry" }} className="..." />` lands
      // on the rendered <li>.
      const entryClass = e.sourceNode != null ? classAttr(e.sourceNode) : "";
      return `<li id="reactwright-bib-${escapeHtml(e.key)}" data-bib-key="${escapeHtml(e.key)}"${usedAttr}${entryClass}>${body}</li>`;
    })
    .join("");
  return `<section data-node="bibliography" class="reactwright-bibliography">${title}<ol${listClassAttr}>${items}</ol></section>`;
}

// --- Custom intrinsic --------------------------------------------------

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

// --- Dispatcher --------------------------------------------------------

// Universal node-kind dispatcher. Inline + content kinds fall through
// to renderContentNode (which itself routes inline kinds onward).
// Template kinds dispatch to the per-kind renderer above.
export function renderResolvedChild(node: ResolvedChild): string {
  switch (node.kind) {
    case "page":
      throw new Error("Nested page nodes are not supported in the resolved tree.");
    case "body-slot":
      // Body-slot markers live inside regime flow templates and are
      // substituted by the section renderer; they should never reach
      // the main flow.
      return "";
    case "body-stream":
      // Auto-streamed body sections: render each in document order.
      // Depth-1 sections with a regime get wrapped by
      // renderSectionNode.
      return node.children
        .map((c) => (c.kind === "section" ? renderSectionNode(c, 1) : renderContentNode(c)))
        .join("");
    case "region":  return renderRegionNode(node, renderChildren(node.children));
    case "stack":   return renderStackNode(node, renderChildren(node.children));
    case "template-row": return renderTemplateRowNode(node, renderChildren(node.children));
    case "columns": return renderColumnsNode(node, renderChildren(node.children));
    case "column":  return renderColumnNode(node, renderChildren(node.children));
    case "layer":   return renderLayerNode(node, 0, renderChildren(node.children));
    case "page-number":  return renderPageNumberNode(node);
    case "page-count":   return renderPageCountNode(node);
    case "running":      return renderRunningNode(node);
    case "image":        return renderImageNode(node);
    case "fixed":        return renderFixedNode(node, renderChildren(node.children));
    case "footnote-area":
      // Extracted to @footnote margin-box CSS at the page level.
      return "";
    case "bibliography":   return renderBibliographyNode(node);
    case "index-template": return renderIndexTemplateNode(node);
    case "toc":            return renderTocNode(node);
    case "list-of":        return renderListOfNode(node);
    case "sidenote-area":
      // Extracted to absolute-positioned margin CSS at the page level.
      return "";
    case "font":
      // Font declarations are extracted to @font-face CSS in the head.
      return "";
    case "header":
    case "footer":
      // Header/footer are extracted to CSS margin boxes by the page
      // renderer. Reaching this case implies an unexpected nested
      // placement.
      return "";
    case "custom":
      return renderCustomNode(node);
    case "title":
    case "author":
    case "section":
    case "section-heading":
    case "figure":
    case "figure-image":
    case "caption":
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
    case "refs":
    case "ref-entry":
    case "text":
    case "page-break":
    case "set-running":
      return renderContentNode(node as ResolvedContentNode);
  }
}

// --- Margin-matter collection (lives here because it needs renderResolvedChild) -----

export function collectMarginMatter(page: ResolvedPageNode): MarginMatterEntry[] {
  const entries: MarginMatterEntry[] = [];
  let counter = 0;

  const visit = (children: ResolvedChild[]): void => {
    for (const child of children) {
      if (child.kind === "header" || child.kind === "footer") {
        const flowName = `reactwright-${child.kind}-${counter}`;
        counter += 1;
        const inner = child.children.map((c) => renderResolvedChild(c)).join("");
        const html = `<div class="${flowName}" data-margin-flow="${flowName}">${inner}</div>`;
        entries.push({
          kind: child.kind,
          anchor: child.anchor,
          when: child.when,
          regime: child.regime,
          flowName,
          html
        });
      }
    }
  };
  visit(page.children);
  // Also walk regime flow templates so chrome (header/footer) declared
  // inside a page-set still gets surfaced — though the resolver
  // currently hoists chrome to the page tree, regime flows are walked
  // for safety.
  if (page.regimeFlows != null) {
    for (const flow of Object.values(page.regimeFlows)) {
      visit(flow);
    }
  }

  return entries;
}

// Running-string name collection — gathers every `<set running>` and
// `<running name>` so the head CSS can wire up the corresponding
// string-set / string() rules.
export function collectRunningStringNames(
  node: ResolvedPageNode | ResolvedChild,
  names: Set<string>
): void {
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
