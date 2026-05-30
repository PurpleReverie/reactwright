import type { TemplateChild, TemplateNode } from "../template/ir.js";
import { parseStylesheet } from "../styles/parser.js";
import type { RuleBinding, StylesheetAst } from "../styles/ir.js";

// Walks the template tree, collecting all <styles> source strings and
// all <rule match className> bindings. Run during resolveDocument
// before the resolved tree is built (or in parallel — neither depends
// on the other's output).
//
// Returns a unified StylesheetAst (parsed from all <styles> sources
// concatenated) and a list of RuleBindings (one per <rule> JSX node).

export type StylesCollectionResult = {
  stylesheet: StylesheetAst;
  bindings: RuleBinding[];
};

export function collectStylesAndRules(template: TemplateNode): StylesCollectionResult {
  const sources: string[] = [];
  const bindings: RuleBinding[] = [];
  collect(template, sources, bindings);

  // Parse all <styles> sources concatenated. The parser emits a
  // duplicate-class error if any class is declared more than once
  // across all blocks.
  const stylesheet = parseStylesheet(sources.join("\n"));
  return { stylesheet, bindings };
}

function collect(node: TemplateNode, sources: string[], bindings: RuleBinding[]): void {
  switch (node.kind) {
    case "styles":
      if (node.source.length > 0) sources.push(node.source);
      return;
    case "rule":
      bindings.push({
        match: node.match,
        className: node.className,
        source: { line: 0, column: 0 }
      });
      return;
    case "rules":
      for (const child of node.children) {
        // RulesChild includes role-rule, page-rule, rule
        if (child.kind === "rule") {
          bindings.push({
            match: child.match,
            className: child.className,
            source: { line: 0, column: 0 }
          });
        }
      }
      return;
    case "page":
    case "page-set":
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
      for (const child of node.children) collect(child as TemplateNode, sources, bindings);
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
  const sources: string[] = [];
  const bindings: RuleBinding[] = [];
  for (const child of children) collect(child as TemplateNode, sources, bindings);
  const stylesheet = parseStylesheet(sources.join("\n"));
  return { stylesheet, bindings };
}
