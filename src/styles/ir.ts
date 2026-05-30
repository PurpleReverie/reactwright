// Styles dialect — typed IR for selectors, declarations, and rule sets.
//
// Compiled at HTML-emit time from <styles> blocks and <rule> JSX nodes
// into target CSS. The user-facing surface is a CSS-superset dialect
// operating on the reactwright semantic IR, never on rendered HTML.
//
// See docs/styling-spec.md for the design.

// Matches the SlotName union in template/ir.ts. Inlined here to avoid
// a circular type dependency between the styles IR and the template IR
// (template IR imports Match from this file).
type SlotName = "title" | "author" | "abstract" | "body";

export type SourceLoc = {
  file?: string;
  line: number;
  column: number;
};

// One selector node. Combinators recurse via `follows`, `parent`, …;
// boolean operators recurse via `and`/`or`/`not`. Atomic match keys
// (`kind`, `role`, `depth`, …) are sibling fields on the same object.
//
// "Match" is the public name (used in JSX `<rule match={...}>`); the
// engine refers to it as a Selector internally where the distinction
// matters.
export type Match = {
  // Atomic keys
  kind?: string;
  role?: string;
  variant?: string;
  depth?: number | { gte?: number; lte?: number };
  index?: "first" | "last" | number;
  id?: string;
  attr?: Record<string, unknown>;
  class?: string;

  // Combinators
  follows?: Match;
  precedes?: Match;
  parent?: Match;
  within?: Match;
  has?: Match;
  slot?: SlotName;

  // Boolean
  not?: Match;
  and?: Match[];
  or?: Match[];
};

// One CSS-style declaration: `property: value`.
export type DeclarationAst = {
  property: string;
  value: string;
  source: SourceLoc;
};

// One stylesheet rule: a selector list (comma-separated) plus
// declarations. `className` is set when this rule originated from a
// named class definition (".foo { ... }"); null for raw-selector form
// (kind/element-based selectors only).
export type RuleAst = {
  selectors: Match[];
  declarations: DeclarationAst[];
  className?: string;
  source: SourceLoc;
};

// Parsed <styles> block. Multiple <styles> blocks in a document each
// produce one StylesheetAst; the resolver concatenates them.
export type StylesheetAst = {
  rules: RuleAst[];
  // .className → its rule (last-wins is forbidden by decision #4; the
  // parser produces an error before this map is built. Kept here for
  // O(1) lookup during class application.)
  classes: Map<string, RuleAst>;
};

// Empty stylesheet, used when a template has no <styles> block.
export const EMPTY_STYLESHEET: StylesheetAst = {
  rules: [],
  classes: new Map()
};

// One (Match → className) binding contributed by a <rule> JSX node.
// Collected separately from <styles>-block parsing so that the
// resolver can attribute rules to their JSX source location.
export type RuleBinding = {
  match: Match;
  className: string;
  source: SourceLoc;
};
