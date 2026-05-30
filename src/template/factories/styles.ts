import type { Match } from "../../styles/ir.js";
import type { RuleNode, StylesNode } from "../ir.js";
import type { TemplateProps } from "../prop-readers.js";

// <styles>{`...`}</styles> — its children are the CSS-dialect source.
// React's host config delivers the children as a single text node, which
// the reconciler turns into a child node attached to this StylesNode
// during construction. We store an empty source here; the host config
// concatenates appendChild text into source.
export function stylesNode(_props: TemplateProps): StylesNode {
  return { kind: "styles", source: "" };
}

// <rule match={...} className="X" /> — binds a Match selector to a
// className that must be defined in a sibling <styles> block. The
// resolver evaluates the match against every node in the resolved IR
// and tags matching nodes with the className.
export function ruleNode(props: TemplateProps): RuleNode {
  const match = (props as Record<string, unknown>).match;
  if (match == null || typeof match !== "object" || Array.isArray(match)) {
    throw new Error("`rule` requires a `match` object.");
  }

  const className = (props as Record<string, unknown>).className;
  if (typeof className !== "string" || className.trim().length === 0) {
    throw new Error("`rule` requires a non-empty `className` string.");
  }

  return {
    kind: "rule",
    match: match as Match,
    className: className.trim()
  };
}
