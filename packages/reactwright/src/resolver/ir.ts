// Barrel re-export. Per-domain type definitions live in `./ir/`.
// Downstream consumers continue to `import { … } from "./ir.js"`.
//
// Split (task #68): inline, block, decorations, aggregate, template, page.

export type {
  ResolvedBibEntryContentNode,
  ResolvedBreakNode,
  ResolvedCiteNode,
  ResolvedCodeNode,
  ResolvedEmNode,
  ResolvedFootnoteNode,
  ResolvedIndexEntryNode,
  ResolvedInlineImgNode,
  ResolvedInlineMathNode,
  ResolvedInlineNode,
  ResolvedLinkNode,
  ResolvedRefNode,
  ResolvedSidenoteNode,
  ResolvedStrongNode,
  ResolvedSubNode,
  ResolvedSupNode,
  ResolvedTextNode,
} from "./ir/inline.js";

export type {
  ResolvedBlockQuoteNode,
  ResolvedCaptionNode,
  ResolvedCellNode,
  ResolvedCodeBlockNode,
  ResolvedContentChild,
  ResolvedContentNode,
  ResolvedDefNode,
  ResolvedDefsNode,
  ResolvedFigureImageNode,
  ResolvedFigureNode,
  ResolvedHeadingNode,
  ResolvedListItemNode,
  ResolvedListNode,
  ResolvedMathNode,
  ResolvedPageBreakNode,
  ResolvedParagraphNode,
  ResolvedPreNode,
  ResolvedRefEntryNode,
  ResolvedRefsNode,
  ResolvedRowNode,
  ResolvedSectionHeadingNode,
  ResolvedSectionNode,
  ResolvedSetRunningNode,
  ResolvedTableNode,
} from "./ir/block.js";

export type {
  ResolvedFontNode,
  ResolvedFootnoteAreaNode,
  ResolvedImageNode,
  ResolvedPageCountNode,
  ResolvedPageNumberNode,
  ResolvedRunningNode,
  ResolvedSidenoteAreaNode,
} from "./ir/decorations.js";

export type {
  ResolvedBibliographyEntry,
  ResolvedIndexEntry,
  ResolvedListOfEntry,
  ResolvedTocEntry,
} from "./ir/aggregate.js";

export type {
  ResolvedAnchorCoordinate,
  ResolvedBodySlotNode,
  ResolvedBodyStreamNode,
  ResolvedColumnNode,
  ResolvedColumnsNode,
  ResolvedCustomTemplateNode,
  ResolvedFixedNode,
  ResolvedFooterNode,
  ResolvedHeaderNode,
  ResolvedLayerNode,
  ResolvedPageRegime,
  ResolvedRegionNode,
  ResolvedRegionPositioning,
  ResolvedRoleDropCap,
  ResolvedRoleNumbering,
  ResolvedRoleVariantRule,
  ResolvedStackNode,
  ResolvedStylesheet,
  ResolvedTemplateNode,
  ResolvedTemplateRowNode,
} from "./ir/template.js";

export type {
  ResolvedAuthorNode,
  ResolvedChild,
  ResolvedPageNode,
  ResolvedTitleNode,
} from "./ir/page.js";
