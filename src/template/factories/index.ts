import { getTemplateIntrinsic } from "../registry.js";
import { mergeTemplateStyleGroups, type TemplateProps } from "../prop-readers.js";
import type { CustomTemplateNode, TemplateNode } from "../ir.js";

import { pageNode, pageSetNode } from "./page.js";
import { columnNode, columnsNode, fixedNode, layerNode, regionNode, stackNode, templateRowNode } from "./regions.js";
import { footerNode, headerNode } from "./margin-matter.js";
import {
  bibDataNode,
  bibliographyNode,
  indexDataNode,
  indexTemplateNode,
  listOfDataNode,
  listOfNode,
  tocDataNode,
  tocNode
} from "./reference.js";
import {
  fontNode,
  imageNode,
  pageCountNode,
  pageNumberNode,
  runningNode
} from "./decorations.js";
import { footnoteAreaNode, sidenoteAreaNode } from "./footnotes.js";
import { roleRuleNode, rulesNode } from "./rules.js";
import { slotNode } from "./slot.js";
import { ruleNode, stylesNode } from "./styles.js";

// Adding a template intrinsic = one entry here + its factory function
// in one of the per-category files above.
const FACTORIES: Record<string, (props: TemplateProps) => TemplateNode> = {
  page: pageNode,
  "page-set": pageSetNode,
  region: regionNode,
  layer: layerNode,
  stack: stackNode,
  row: templateRowNode,
  columns: columnsNode,
  column: columnNode,
  fixed: fixedNode,
  header: headerNode,
  footer: footerNode,
  bibliography: bibliographyNode,
  toc: tocNode,
  "list-of": listOfNode,
  index: indexTemplateNode,
  "bib-data": bibDataNode,
  "toc-data": tocDataNode,
  "list-of-data": listOfDataNode,
  "index-data": indexDataNode,
  font: fontNode,
  image: imageNode,
  running: runningNode,
  "page-number": pageNumberNode,
  "page-count": pageCountNode,
  "footnote-area": footnoteAreaNode,
  "sidenote-area": sidenoteAreaNode,
  rules: rulesNode,
  role: roleRuleNode,
  rule: ruleNode,
  styles: stylesNode,
  slot: slotNode
};

// Custom intrinsics — registered via registerTemplateIntrinsic — fall
// through to a generic <custom> node. Their renderer lives on the
// registry entry and runs at HTML emission time.
function customNode(type: string, props: TemplateProps): CustomTemplateNode {
  const { children: _children, ...restProps } = props;
  return {
    kind: "custom",
    name: type,
    props: restProps,
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}

export function createTemplateNode(type: string, props: TemplateProps): TemplateNode {
  const factory = FACTORIES[type];
  if (factory != null) {
    return factory(props);
  }
  if (getTemplateIntrinsic(type) != null) {
    return customNode(type, props);
  }
  throw new Error(`Unsupported template intrinsic: ${type}`);
}
