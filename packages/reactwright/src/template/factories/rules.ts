import {
  mergeTemplateStyleGroups,
  readOptionalTemplateToken,
  readRequiredTemplateToken,
  type TemplateProps
} from "../prop-readers.js";
import type { BreakValue, RoleDropCap, RoleNumbering, RoleRuleNode, RulesNode } from "../ir.js";

// `<rules>` is a passthrough container; only `<role>` and `<page
// match=... use=...>` children are valid (grammar enforced by
// appendTemplateChild).
export function rulesNode(_props: TemplateProps): RulesNode {
  return { kind: "rules", children: [] };
}

// Role-rule reader helpers, promoted from inner lambdas inside the
// original createTemplateNode `role` case. Each parses one optional
// sub-prop on the <role> element.

const BREAK_VALUES: readonly BreakValue[] = [
  "auto", "always", "avoid", "page", "left", "right", "recto", "verso"
];

function readBreakValue(
  props: TemplateProps,
  key: "breakBefore" | "breakAfter"
): BreakValue | undefined {
  const value = (props as Record<string, unknown>)[key];
  if (value == null) return undefined;
  if (BREAK_VALUES.includes(value as BreakValue)) {
    return value as BreakValue;
  }
  throw new Error(`\`role\` \`${key}\` must be a valid CSS break value.`);
}

function readBreakInside(props: TemplateProps): "auto" | "avoid" | undefined {
  const value = (props as Record<string, unknown>).breakInside;
  if (value == null) return undefined;
  if (value === "auto" || value === "avoid") return value;
  throw new Error("`role` `breakInside` must be `auto` or `avoid`.");
}

function readDropCap(props: TemplateProps): RoleDropCap | undefined {
  const value = (props as Record<string, unknown>).dropCap;
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("`role` `dropCap` must be an object.");
  }
  const obj = value as Record<string, unknown>;
  return {
    ...(typeof obj.lines === "number" ? { lines: obj.lines } : {}),
    ...(typeof obj.font === "string" ? { font: obj.font } : {}),
    ...(typeof obj.position === "string" ? { position: obj.position } : {})
  };
}

function readNumbering(props: TemplateProps): RoleNumbering | undefined {
  const value = (props as Record<string, unknown>).numbering;
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("`role` `numbering` must be an object.");
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.counter !== "string" || obj.counter.length === 0) {
    throw new Error("`role` `numbering.counter` is required.");
  }
  return {
    counter: obj.counter,
    ...(typeof obj.scope === "string" ? { scope: obj.scope } : {}),
    ...(typeof obj.format === "string" ? { format: obj.format } : {})
  };
}

export function roleRuleNode(props: TemplateProps): RoleRuleNode {
  const on = readOptionalTemplateToken(props, "on");
  const breakBefore = readBreakValue(props, "breakBefore");
  const breakAfter = readBreakValue(props, "breakAfter");
  const breakInside = readBreakInside(props);
  const numbering = readNumbering(props);
  const dropCap = readDropCap(props);
  const style = mergeTemplateStyleGroups(props);
  return {
    kind: "role-rule",
    match: readRequiredTemplateToken(props, "match"),
    apply: readRequiredTemplateToken(props, "apply"),
    ...(on != null ? { on } : {}),
    ...(breakBefore != null ? { breakBefore } : {}),
    ...(breakAfter != null ? { breakAfter } : {}),
    ...(breakInside != null ? { breakInside } : {}),
    ...(numbering != null ? { numbering } : {}),
    ...(dropCap != null ? { dropCap } : {}),
    ...(style != null ? { style } : {})
  };
}
