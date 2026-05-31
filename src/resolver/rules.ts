import type { RulesChild, TemplateChild, TemplateNode } from "../template/ir.js";
import type { ResolvedContentNode } from "./ir.js";

export type RoleRule = {
  match: string;
  apply: string;
  on?: string;
  breakBefore?: string;
  breakAfter?: string;
  breakInside?: string;
  numbering?: { counter: string; scope?: string; format?: string };
  dropCap?: { lines?: number; font?: string; position?: string };
  style?: Record<string, unknown>;
};

export type RuleMaps = {
  roles: RoleRule[];
  pages: Map<string, string>;
};

// `<role on="X" />` accepts a content-IR kind, but some legacy/aliased
// names map to a different IR kind (e.g. `on="p"` means `paragraph`,
// `on="quote"` means `blockquote`). Lookup table for that mapping.
const ROLE_ON_ELEMENT_KIND: Record<string, string> = {
  section: "section",
  paragraph: "paragraph",
  p: "paragraph",
  quote: "blockquote",
  blockquote: "blockquote",
  list: "list",
  defs: "defs",
  heading: "heading",
  math: "math",
  figure: "figure"
};

// Recursive walk: collect all `<rules>` children from the template
// tree into a single RuleMaps. Rules can appear at any nesting depth.
export function collectRulesFromChildren(children: TemplateChild[], rules: RuleMaps): void {
  for (const child of children) {
    if (child.kind === "rules") {
      for (const rule of child.children) {
        applyRule(rule, rules);
      }
      continue;
    }
    if (
      child.kind === "page" ||
      child.kind === "page-set" ||
      child.kind === "region" ||
      child.kind === "stack" ||
      child.kind === "columns" ||
      child.kind === "column" ||
      child.kind === "layer" ||
      child.kind === "fixed" ||
      child.kind === "header" ||
      child.kind === "footer" ||
      child.kind === "custom"
    ) {
      collectRulesFromChildren(child.children, rules);
    }
  }
}

// Add one rule-definition node to RuleMaps. Role-rules append to the
// roles list (first-match wins at lookup time); page-rules set into
// the pages map.
export function applyRule(rule: RulesChild, rules: RuleMaps): void {
  switch (rule.kind) {
    case "role-rule":
      if (rule.match.length > 0 && rule.apply.length > 0) {
        rules.roles.push({
          match: rule.match,
          apply: rule.apply,
          ...(rule.on != null ? { on: rule.on } : {}),
          ...(rule.breakBefore != null ? { breakBefore: rule.breakBefore } : {}),
          ...(rule.breakAfter != null ? { breakAfter: rule.breakAfter } : {}),
          ...(rule.breakInside != null ? { breakInside: rule.breakInside } : {}),
          ...(rule.numbering != null ? { numbering: rule.numbering } : {}),
          ...(rule.dropCap != null ? { dropCap: rule.dropCap } : {}),
          ...(rule.style != null ? { style: rule.style } : {})
        });
      }
      return;
    case "page-rule":
      if (rule.match.length > 0 && rule.use.length > 0) {
        rules.pages.set(rule.match, rule.use);
      }
      return;
  }
}

// Build the RuleMaps for a whole template tree in one walk.
export function buildRuleMaps(template: TemplateNode): RuleMaps {
  const rules: RuleMaps = {
    roles: [],
    pages: new Map<string, string>()
  };
  if (
    template.kind === "page" ||
    template.kind === "page-set" ||
    template.kind === "region" ||
    template.kind === "stack" ||
    template.kind === "columns" ||
    template.kind === "column" ||
    template.kind === "layer" ||
    template.kind === "fixed" ||
    template.kind === "header" ||
    template.kind === "footer" ||
    template.kind === "custom"
  ) {
    collectRulesFromChildren(template.children, rules);
  }
  return rules;
}

// First-matching role for a content node's role + element kind.
// Returns the `apply` target (the variant name), or undefined if no
// rule matches.
export function findMatchingRole(
  roleValue: string,
  elementKind: string,
  rules: RuleMaps
): string | undefined {
  for (const rule of rules.roles) {
    if (rule.match !== roleValue) continue;
    if (rule.on == null) return rule.apply;
    const wantedKind = ROLE_ON_ELEMENT_KIND[rule.on] ?? rule.on;
    if (wantedKind === elementKind) return rule.apply;
  }
  return undefined;
}

// If `node.role` matches a rule, return `node` with `variant` set to
// the rule's apply target. Otherwise return the node unchanged. The
// kindForLookup arg is the IR kind to match against (usually
// node.kind, but may differ for aliased rules).
function withVariant<T extends { kind: string; role?: string; variant?: string }>(
  node: T,
  kindForLookup: string,
  rules: RuleMaps
): T {
  if (node.role == null) return node;
  const apply = findMatchingRole(node.role, kindForLookup, rules);
  if (apply == null) return node;
  return { ...node, variant: apply };
}

// Walk a resolved content tree and tag each node with the role-rule
// variant that matches it. Inline kinds and leaf kinds don't have a
// `role` field so they pass through unchanged. Block kinds with
// children recurse; their own variant is set via withVariant.
export function assignRoleVariants<T extends ResolvedContentNode>(node: T, rules: RuleMaps): T {
  switch (node.kind) {
    case "section":
      return {
        ...withVariant(node, "section", rules),
        children: node.children.map((child) => assignRoleVariants(child, rules))
      } as T;
    case "blockquote":
      return {
        ...withVariant(node, "blockquote", rules),
        children: node.children.map((child) => assignRoleVariants(child, rules))
      } as T;
    case "list":
      return {
        ...withVariant(node, "list", rules),
        children: node.children.map((child) => ({
          ...child,
          children: child.children.map((grandchild) => assignRoleVariants(grandchild, rules))
        }))
      } as T;
    case "defs":
      return {
        ...withVariant(node, "defs", rules),
        children: node.children.map((child) => ({
          ...child,
          children: child.children.map((grandchild) => assignRoleVariants(grandchild, rules))
        }))
      } as T;
    case "table":
      return {
        ...node,
        children: node.children.map((row) => ({
          ...row,
          children: row.children.map((cell) => ({
            ...cell,
            children: cell.children.map((child) => assignRoleVariants(child, rules))
          }))
        }))
      } as T;
    case "paragraph": return withVariant(node, "paragraph", rules);
    case "figure":    return withVariant(node, "figure", rules);
    case "heading":   return withVariant(node, "heading", rules);
    case "math":      return withVariant(node, "math", rules);
    default:
      // All other kinds (inline, row/cell, code-block, pre, def,
      // refs/ref-entry, item, title, author, em/strong/code/link/br/
      // sub/sup/img/ref/footnote/m/cite/index/sidenote, text,
      // page-break, set-running) don't carry a `role` field that
      // resolves to a variant.
      return node;
  }
}
