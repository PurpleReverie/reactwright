import type { SemanticContainerNode, SemanticNode } from "./ir.js";

// Declarative content grammar. For each container kind, list which
// child kinds are accepted. The reconciler's appendSemanticChild()
// dispatches through this table — adding a new content primitive
// means editing one entry, not threading a new branch through a
// 220-line switch.
//
// A parent kind absent from GRAMMAR (or marked "leaf") rejects all
// children. Whitespace-only text is silently dropped at the top of
// appendSemanticChild, so authors can format JSX freely.

type Kind = SemanticNode["kind"];

// Inline primitives — accepted inside paragraphs and other inline
// containers.
const INLINE_KINDS = new Set<Kind>([
  "text", "em", "strong", "code", "link", "br",
  "sub", "sup", "img", "ref", "footnote", "m",
  "cite", "index", "sidenote", "bib-entry-content"
]);

// Inline subset for ref-entry — no nested footnotes, refs, citations,
// index marks, or sidenotes (those are document-flow citations, not
// bibliography prose).
const REF_ENTRY_INLINE_KINDS = new Set<Kind>([
  "text", "em", "strong", "code", "link", "br", "sub", "sup"
]);

// Block primitives — accepted inside cell, def, item, and similar
// "any-block" containers.
const BLOCK_KINDS = new Set<Kind>([
  "paragraph", "figure", "table", "blockquote", "list",
  "code-block", "pre", "defs", "heading", "math",
  "page-break", "set-running"
]);

// Block primitives plus section/refs — accepted inside section and
// blockquote. Lets authors nest sections.
const SECTION_CHILD_KINDS = new Set<Kind>([
  ...BLOCK_KINDS, "section", "refs"
]);

// Document-level — block primitives plus section/refs/meta.
const DOCUMENT_CHILD_KINDS = new Set<Kind>([
  ...BLOCK_KINDS, "section", "refs", "meta"
]);

type GrammarRule = {
  allowed: Set<Kind>;
  message: string;
};

const GRAMMAR: Partial<Record<Kind, GrammarRule>> = {
  document:   { allowed: DOCUMENT_CHILD_KINDS, message: "`document` may only contain document-level block primitives." },
  section:    { allowed: SECTION_CHILD_KINDS,  message: "`section` may only contain block primitives." },
  blockquote: { allowed: SECTION_CHILD_KINDS,  message: "`blockquote` may only contain block primitives." },

  meta:      { allowed: INLINE_KINDS, message: "`meta` may only contain inline primitives." },

  paragraph: { allowed: INLINE_KINDS, message: "`p` may only contain inline primitives." },
  heading:   { allowed: INLINE_KINDS, message: "`heading` may only contain inline primitives." },
  em:        { allowed: INLINE_KINDS, message: "`em` may only contain inline primitives." },
  strong:    { allowed: INLINE_KINDS, message: "`strong` may only contain inline primitives." },
  link:      { allowed: INLINE_KINDS, message: "`link` may only contain inline primitives." },
  sub:       { allowed: INLINE_KINDS, message: "`sub` may only contain inline primitives." },
  sup:       { allowed: INLINE_KINDS, message: "`sup` may only contain inline primitives." },
  footnote:  { allowed: INLINE_KINDS, message: "`footnote` may only contain inline primitives." },
  sidenote:  { allowed: INLINE_KINDS, message: "`sidenote` may only contain inline primitives." },

  "ref-entry": { allowed: REF_ENTRY_INLINE_KINDS, message: "`ref-entry` may only contain inline primitives." },

  table:   { allowed: new Set(["row", "caption"]), message: "`table` may only contain `row` or `caption` children." },
  row:     { allowed: new Set(["cell"]),           message: "`row` may only contain `cell` children." },
  cell:    { allowed: BLOCK_KINDS,                 message: "`cell` may only contain block primitives." },
  caption: { allowed: INLINE_KINDS,                message: "`caption` may only contain inline primitives." },
  figure:  { allowed: new Set(["caption"]),        message: "`figure` may only contain a `caption` child." },

  list:  { allowed: new Set(["item"]), message: "`list` may only contain `item` children." },
  item:  { allowed: BLOCK_KINDS,       message: "`item` may only contain block primitives." },

  defs:  { allowed: new Set(["def"]),  message: "`defs` may only contain `def` children." },
  def:   { allowed: BLOCK_KINDS,       message: "`def` may only contain block primitives." },

  refs:  { allowed: new Set(["ref-entry"]), message: "`refs` may only contain `ref-entry` children." },

  code:         { allowed: new Set(["text"]), message: "`code` may only contain text." },
  "code-block": { allowed: new Set(["text"]), message: "`code-block` may only contain text." },
  pre:          { allowed: new Set(["text"]), message: "`pre` may only contain text." }
  // figure, heading, math, br, img, ref, m, cite, index, page-break,
  // set-running, text are leaves — they reject all children via the
  // "absent from GRAMMAR" default.
};

const LEAF_MESSAGES: Partial<Record<Kind, string>> = {};

function isWhitespaceOnlyText(node: SemanticNode): boolean {
  return node.kind === "text" && node.value.trim().length === 0;
}

// Append `child` to `parent` after checking the grammar table. The
// reconciler calls this on every JSX child of a container. The cast
// at the push site collapses the parent-specific child unions
// (DocumentChild, SemanticBlockChild, InlineNode, ...) into one
// — `SemanticNode` — because TypeScript can't infer the parent's
// expected child type from a runtime lookup.
export function appendSemanticChild(
  parent: SemanticContainerNode,
  child: SemanticNode
): void {
  const rule = GRAMMAR[parent.kind];
  // Whitespace-only text between *block* children (sections,
  // paragraphs, figures…) is just JSX indentation — drop it. But
  // when the parent accepts text as a child (paragraph, em, strong,
  // code, link, quote, item…), the space between "TeX " and
  // <cite/> is significant: keep it.
  if (isWhitespaceOnlyText(child)) {
    if (rule == null || !rule.allowed.has("text")) return;
  }

  if (rule == null) {
    const message = LEAF_MESSAGES[parent.kind] ?? `\`${parent.kind}\` may not contain child nodes.`;
    throw new Error(message);
  }
  if (!rule.allowed.has(child.kind)) {
    throw new Error(rule.message);
  }

  // figure and table store their caption child on `captionNode` rather
  // than in `children`, so the existing renderers (which expect figure
  // to be a leaf and table.children to be RowNodes) keep working.
  if (child.kind === "caption" && (parent.kind === "figure" || parent.kind === "table")) {
    (parent as { captionNode?: SemanticNode }).captionNode = child;
    return;
  }

  // The parent's `children` array is one of several typed unions; from
  // the grammar lookup we know `child` satisfies the parent's allowed
  // set. Cast through a `{ children: SemanticNode[] }` shape — the
  // leaf-parent kinds in SemanticContainerNode (e.g. FigureNode) don't
  // have `children`, but we've already thrown above for those cases.
  (parent as unknown as { children: SemanticNode[] }).children.push(child);
}
