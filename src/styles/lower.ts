import type { StylesheetAst } from "./ir.js";

// Lowers a parsed stylesheet to a CSS string the engine can inject
// into the document <style> block.
//
// Slice 1 lowering is conservative: each named class becomes a
// `.className { property:value; }` rule. Properties pass through
// unchanged. Element-kind / pseudo / combinator selectors that don't
// resolve to a class are NOT emitted — they're only useful via
// `<rule match={...} className="...">` which lifts them to a marker
// class during apply.
//
// Future slices add:
//  - dialect-specific properties (numbering, prefix, suffix, wrap,
//    break, indent, text-flow, column-fit, ...) → expanded CSS
//  - selector-based rule emission for raw `kind {...}` blocks → marker
//    class assignment during apply

export function lowerStylesheet(ss: StylesheetAst): string {
  const out: string[] = [];
  for (const [className, rule] of ss.classes) {
    const declarations = rule.declarations
      .map((d) => `${d.property}:${d.value};`)
      .join("");
    out.push(`.${className}{${declarations}}`);
  }
  return out.join("");
}
