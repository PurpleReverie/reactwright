import { mergeTemplateStyleGroups, type TemplateProps } from "../prop-readers.js";
import type { Match } from "../../styles/ir.js";
import type { RuleNode, StylesNode } from "../ir.js";

// <styles>{`...`}</styles> — its children are the CSS-dialect source.
// React's host config delivers the children as a single text node, which
// the reconciler turns into a child node attached to this StylesNode
// during construction. We store an empty source here; the host config
// concatenates appendChild text into source.
export function stylesNode(_props: TemplateProps): StylesNode {
  return { kind: "styles", source: "" };
}

// <rule match={...} className="X" /> — binds a Match selector to a
// className that must be defined in a sibling <styles> block.
// <rule match={...} style={{ ... }} /> — inline declarations the
// resolver lifts into a synthetic class (the same form <role> accepts).
// Both may be provided; the rule binds both class names.
export function ruleNode(props: TemplateProps): RuleNode {
  const match = (props as Record<string, unknown>).match;
  if (match == null || typeof match !== "object" || Array.isArray(match)) {
    throw new Error("`rule` requires a `match` object.");
  }

  const rawClassName = (props as Record<string, unknown>).className;
  const className =
    typeof rawClassName === "string" && rawClassName.trim().length > 0
      ? rawClassName.trim()
      : undefined;

  // mergeTemplateStyleGroups picks up style + the typed groups
  // (page/typography/...). For <rule> only `style` is meaningful.
  const style = mergeTemplateStyleGroups(props);
  const hasStyle = style != null && Object.keys(style).length > 0;

  if (className == null && !hasStyle) {
    throw new Error("`rule` requires `className`, `style`, or both.");
  }

  return {
    kind: "rule",
    match: match as Match,
    ...(className != null ? { className } : {}),
    ...(hasStyle ? { style } : {})
  };
}
