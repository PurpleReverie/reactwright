import type { ResolvedChild } from "../../resolver/ir.js";
import {
  renderColumnNode,
  renderColumnsNode,
  renderFixedNode,
  renderRegionNode,
  renderResolvedChild,
  renderStackNode
} from "./template.js";

// Render a regime-flow node, substituting the body-slot marker with
// the already-rendered section HTML. For container kinds, recurses
// through the regime flow and feeds the substituted inner HTML to the
// same canonical container renderers used by the main flow — no
// parallel implementations.
export function renderRegimeFlowNode(node: ResolvedChild, sectionHtml: string): string {
  if (node.kind === "body-slot") return sectionHtml;

  const renderRegimeChildren = (children: ResolvedChild[]): string =>
    children.map((c) => renderRegimeFlowNode(c, sectionHtml)).join("");

  switch (node.kind) {
    case "region":  return renderRegionNode(node,  renderRegimeChildren(node.children));
    case "stack":   return renderStackNode(node,   renderRegimeChildren(node.children));
    case "columns": return renderColumnsNode(node, renderRegimeChildren(node.children));
    case "column":  return renderColumnNode(node,  renderRegimeChildren(node.children));
    case "fixed":   return renderFixedNode(node,   renderRegimeChildren(node.children));
    default:        return renderResolvedChild(node);
  }
}
