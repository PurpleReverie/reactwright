import {
  mergeTemplateStyleGroups,
  readMarginAnchor,
  readMarginMatterWhen,
  type TemplateProps
} from "../prop-readers.js";
import type { FooterNode, HeaderNode } from "../ir.js";

export function headerNode(props: TemplateProps): HeaderNode {
  return {
    kind: "header",
    anchor: readMarginAnchor(props, "header"),
    when: readMarginMatterWhen(props, "header"),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}

export function footerNode(props: TemplateProps): FooterNode {
  return {
    kind: "footer",
    anchor: readMarginAnchor(props, "footer"),
    when: readMarginMatterWhen(props, "footer"),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}
