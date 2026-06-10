import type {
  RuleNode,
  TemplateChild,
  TemplateNode,
  TemplateStyle
} from "../template/ir.js";
import { parseStylesheet } from "../styles/parser.js";
import type { RuleBinding, StylesheetAst } from "../styles/ir.js";

// Walks the template tree, collecting all <styles> source strings and
// all <rule match className style> bindings. Run during resolveDocument
// before the resolved tree is built (or in parallel — neither depends
// on the other's output).
//
// Returns a unified StylesheetAst (parsed from all <styles> sources +
// any synthetic classes lifted from <rule style={...}>) and a list of
// RuleBindings (one per <rule> JSX node, plus a second binding when a
// rule has both className and style).

export type StylesCollectionResult = {
  stylesheet: StylesheetAst;
  bindings: RuleBinding[];
};

// Counter for synthetic class names generated from <rule style={...}>.
// Module-scoped because collectStylesAndRules runs once per document;
// the counter resets via state.counter = 0 inside that entry point.
type CollectorState = {
  sources: string[];
  bindings: RuleBinding[];
  syntheticCounter: number;
};

export function collectStylesAndRules(template: TemplateNode): StylesCollectionResult {
  const state: CollectorState = { sources: [], bindings: [], syntheticCounter: 0 };
  collect(template, state);

  const stylesheet = parseStylesheet(state.sources.join("\n"));
  return { stylesheet, bindings: state.bindings };
}

// Inline-style on <rule> is lifted to a synthetic class so the lower
// pass handles its declarations through the same code path as named
// classes. The synthetic class name carries a prefix unlikely to
// collide with author classes.
function handleRuleNode(node: RuleNode, state: CollectorState): void {
  if (node.style != null && Object.keys(node.style).length > 0) {
    const synthName = `__rwsyn-${state.syntheticCounter}`;
    state.syntheticCounter += 1;
    state.sources.push(`.${synthName}{${templateStyleToDialectDeclarations(node.style)}}`);
    state.bindings.push({
      match: node.match,
      className: synthName,
      source: { line: 0, column: 0 }
    });
  }
  if (node.className != null) {
    state.bindings.push({
      match: node.match,
      className: node.className,
      source: { line: 0, column: 0 }
    });
  }
}

// Convert a TemplateStyle (camelCase JS object) into a CSS-dialect
// declaration list. Keys are kebab-cased so promoted concepts like
// `flowSpan` → `flow-span` route through the dialect lowerer.
function templateStyleToDialectDeclarations(style: TemplateStyle): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value == null) continue;
    const property = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    parts.push(`${property}:${String(value)};`);
  }
  return parts.join("");
}

function collect(node: TemplateNode, state: CollectorState): void {
  switch (node.kind) {
    case "styles":
      if (node.source.length > 0) state.sources.push(node.source);
      return;
    case "rule":
      handleRuleNode(node, state);
      return;
    case "rules":
      for (const child of node.children) {
        // RulesChild includes role-rule, page-rule, rule
        if (child.kind === "rule") handleRuleNode(child, state);
      }
      return;
    case "page":
    case "page-set":
    case "page-variant":
    case "region":
    case "stack":
    case "row":
    case "columns":
    case "column":
    case "layer":
    case "fixed":
    case "header":
    case "footer":
    case "custom":
      for (const child of node.children) collect(child as TemplateNode, state);
      return;
    default:
      // page-number, page-count, running, image, font, slot, toc,
      // list-of, index-template, bibliography, footnote-area,
      // sidenote-area, role-rule, page-rule, text — none contain
      // <styles> or <rule> children.
      return;
  }
}

// Re-collect after a separate template subtree (e.g. a per-regime
// flow tree) — useful if regime flows ever embed styles. Not used in
// slice 1 but exported for future composition.
export function collectStylesFromChildren(
  children: TemplateChild[]
): StylesCollectionResult {
  const state: CollectorState = { sources: [], bindings: [], syntheticCounter: 0 };
  for (const child of children) collect(child as TemplateNode, state);
  const stylesheet = parseStylesheet(state.sources.join("\n"));
  return { stylesheet, bindings: state.bindings };
}
