import type { DeclarationAst, StylesheetAst } from "./ir.js";

// Lowers a parsed stylesheet to a CSS string the engine injects into
// the document <style> block.
//
// Slice 1 was conservative: each named class produced one
// `.className { property:value; }` rule. Slice 2 adds the first
// "promoted concept" properties whose lowering is non-trivial:
//
//   numbering: counter(NAME, STYLE) "FORMAT"
//       → counter-increment:NAME; ::before{content:counter(NAME,STYLE) "literal";}
//   numbering-reset: NAME [NAME...]
//       → counter-reset:NAME [NAME...];
//   prefix: <css-content-expression>
//       → ::before{content:<expr>;}
//   suffix: <css-content-expression>
//       → ::after{content:<expr>;}
//   break: before(VAL) after(VAL) inside(VAL)
//       → break-* + page-break-* (legacy fallback)
//
// Authors who don't reach for promoted concepts get raw pass-through
// CSS — those properties are emitted unchanged.

export function lowerStylesheet(ss: StylesheetAst): string {
  const out: string[] = [];
  for (const [className, rule] of ss.classes) {
    out.push(...lowerClassRule(className, rule.declarations));
  }
  return out.join("");
}

function lowerClassRule(className: string, decls: DeclarationAst[]): string[] {
  const baseDeclarations: string[] = [];
  const beforeContent: string[] = [];
  const afterContent: string[] = [];

  for (const d of decls) {
    switch (d.property) {
      case "numbering": {
        const parsed = parseNumberingValue(d.value);
        if (parsed == null) {
          // Malformed value — fall through to pass-through. The author
          // gets to see their typo as a CSS warning in the browser
          // rather than a silent drop.
          baseDeclarations.push(`${d.property}:${d.value};`);
          break;
        }
        const { counter, style, format } = parsed;
        baseDeclarations.push(`counter-increment:${counter};`);
        beforeContent.push(formatTokensToCssContent(format, counter, style));
        break;
      }

      case "numbering-reset":
        baseDeclarations.push(`counter-reset:${d.value};`);
        break;

      case "prefix":
        beforeContent.push(d.value);
        break;

      case "suffix":
        afterContent.push(d.value);
        break;

      case "break": {
        const parsed = parseBreakValue(d.value);
        if (parsed == null) {
          baseDeclarations.push(`${d.property}:${d.value};`);
          break;
        }
        if (parsed.before != null) {
          baseDeclarations.push(`break-before:${parsed.before};`);
          baseDeclarations.push(`page-break-before:${parsed.before};`);
        }
        if (parsed.after != null) {
          baseDeclarations.push(`break-after:${parsed.after};`);
          baseDeclarations.push(`page-break-after:${parsed.after};`);
        }
        if (parsed.inside != null) {
          baseDeclarations.push(`break-inside:${parsed.inside};`);
          baseDeclarations.push(`page-break-inside:${parsed.inside};`);
        }
        break;
      }

      default:
        baseDeclarations.push(`${d.property}:${d.value};`);
    }
  }

  const out: string[] = [];
  if (baseDeclarations.length > 0) {
    out.push(`.${className}{${baseDeclarations.join("")}}`);
  }
  if (beforeContent.length > 0) {
    out.push(`.${className}::before{content:${beforeContent.join(" ")};}`);
  }
  if (afterContent.length > 0) {
    out.push(`.${className}::after{content:${afterContent.join(" ")};}`);
  }
  return out;
}

// --- numbering value parser -----------------------------------------

type NumberingValue = {
  counter: string;
  style?: string;
  format: string;
};

// Parse `counter(NAME, STYLE) "FORMAT"` where:
//   - STYLE is optional (defaults to decimal)
//   - FORMAT is a quoted string that may contain $NAME tokens
// Returns null on malformed input — the caller falls back to
// pass-through emission so the author can debug via the browser.
function parseNumberingValue(value: string): NumberingValue | null {
  const trimmed = value.trim();
  // Match: counter( name [, style] ) "..."
  const match = trimmed.match(
    /^counter\(\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?:,\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*)?\)\s*(?:"([^"]*)"|'([^']*)')?$/
  );
  if (match == null) return null;
  const counter = match[1]!;
  const style = match[2];
  const format = match[3] ?? match[4] ?? "";
  return {
    counter,
    ...(style != null ? { style } : {}),
    format
  };
}

// Convert a format string with $NAME tokens to a CSS `content` value.
// Literal slices are quoted; $NAME tokens become counter() calls. When
// `style` is provided, every counter() call gets the style argument.
function formatTokensToCssContent(format: string, fallbackCounter: string, style?: string): string {
  const tokens: string[] = [];
  const re = /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(format)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(quoteContentLiteral(format.slice(lastIndex, match.index)));
    }
    tokens.push(counterCall(match[1]!, style));
    lastIndex = re.lastIndex;
  }
  if (lastIndex < format.length) {
    tokens.push(quoteContentLiteral(format.slice(lastIndex)));
  }
  if (tokens.length === 0) {
    // No $tokens, no literal → just the bare counter.
    return counterCall(fallbackCounter, style);
  }
  return tokens.join(" ");
}

function quoteContentLiteral(s: string): string {
  return `'${s.replace(/'/g, "\\'")}'`;
}

function counterCall(name: string, style?: string): string {
  return style != null ? `counter(${name},${style})` : `counter(${name})`;
}

// --- break value parser ---------------------------------------------

type BreakValue = {
  before?: string;
  after?: string;
  inside?: string;
};

// Parse `before(VAL) after(VAL) inside(VAL)` (any subset, in any order).
function parseBreakValue(value: string): BreakValue | null {
  const out: BreakValue = {};
  // Match each axis call: before(...)/after(...)/inside(...)
  const re = /(before|after|inside)\(\s*([^)]+?)\s*\)/g;
  let any = false;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    any = true;
    const axis = match[1] as "before" | "after" | "inside";
    out[axis] = match[2]!.trim();
  }
  if (!any) return null;
  return out;
}
