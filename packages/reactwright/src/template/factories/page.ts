import {
  isPageRule,
  mergeTemplateStyleGroups,
  readAnchorsMap,
  readRequiredTemplateToken,
  type TemplateProps
} from "../prop-readers.js";
import type {
  PageNode,
  PageRuleNode,
  PageSetNode,
  PageVariantNode,
  TemplateNode
} from "../ir.js";

// `<page>` is dual-shape:
//   - `<page match="X" use="Y" />` is a page-rule (sits inside <rules>)
//   - `<page page={...} typography={...}>...</page>` is the document
//     root container
// We dispatch on whether match/use props are present.
export function pageNode(props: TemplateProps): TemplateNode {
  if (isPageRule(props)) {
    return {
      kind: "page-rule",
      match: readRequiredTemplateToken(props, "match"),
      use: readRequiredTemplateToken(props, "use")
    } satisfies PageRuleNode;
  }
  return {
    kind: "page",
    style: mergeTemplateStyleGroups(props),
    children: []
  } satisfies PageNode;
}

export function pageSetNode(props: TemplateProps): PageSetNode {
  const anchors = readAnchorsMap(props);
  return {
    kind: "page-set",
    name: readRequiredTemplateToken(props, "name"),
    style: mergeTemplateStyleGroups(props),
    ...(anchors != null ? { anchors } : {}),
    children: []
  };
}

export function pageVariantNode(props: TemplateProps): PageVariantNode {
  return {
    kind: "page-variant",
    name: readRequiredTemplateToken(props, "name"),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}
