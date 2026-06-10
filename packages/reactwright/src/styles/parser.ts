import type {
  DeclarationAst,
  Match,
  RuleAst,
  SourceLoc,
  StylesheetAst
} from "./ir.js";

// Hand-rolled lexer + parser for the reactwright styling dialect.
//
// Grammar (slice 1):
//   stylesheet     := rule-block*
//   rule-block     := selector-list "{" declarations "}"
//   selector-list  := selector ("," selector)*
//   selector       := atom (combinator atom)*
//   combinator     := whitespace      ; descendant ("within")
//                   | ">"             ; direct child ("parent")
//                   | "+"             ; adjacent sibling ("follows")
//   atom           := "." class-name
//                   | kind-name
//                   | kind-name "[" attr-test "]"
//                   | (preceded by) ":<pseudo>(arg)"
//   pseudo         := has | not | first | last | nth | slot | role | variant | depth
//   declarations   := (declaration ";")*
//   declaration    := property ":" value
//
// Comments (/* ... */) are stripped. @-rules, nesting, vendor prefixes,
// CSS variables, and :is/:where/:nth-child are out of scope for v1.

// --- Error type ------------------------------------------------------

export class StylesParseError extends Error {
  source: SourceLoc;
  constructor(message: string, source: SourceLoc) {
    super(`${message} (at ${source.file != null ? source.file + ":" : ""}${source.line}:${source.column})`);
    this.source = source;
  }
}

// --- Lexer state -----------------------------------------------------

type Lexer = {
  input: string;
  pos: number;
  line: number;
  column: number;
  file?: string;
};

function makeLexer(input: string, file?: string): Lexer {
  return { input, pos: 0, line: 1, column: 1, file };
}

function loc(l: Lexer): SourceLoc {
  return l.file != null
    ? { file: l.file, line: l.line, column: l.column }
    : { line: l.line, column: l.column };
}

function peek(l: Lexer, offset = 0): string {
  return l.input.charAt(l.pos + offset);
}

function advance(l: Lexer): string {
  const ch = l.input.charAt(l.pos);
  l.pos += 1;
  if (ch === "\n") {
    l.line += 1;
    l.column = 1;
  } else {
    l.column += 1;
  }
  return ch;
}

function eof(l: Lexer): boolean {
  return l.pos >= l.input.length;
}

// Skip whitespace and /* ... */ comments. Returns true if any
// whitespace (significant for descendant combinator) was consumed.
function skipWhitespaceAndComments(l: Lexer): boolean {
  let consumedWs = false;
  while (!eof(l)) {
    const ch = peek(l);
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      consumedWs = true;
      advance(l);
      continue;
    }
    if (ch === "/" && peek(l, 1) === "*") {
      advance(l);
      advance(l);
      while (!eof(l) && !(peek(l) === "*" && peek(l, 1) === "/")) {
        advance(l);
      }
      if (!eof(l)) {
        advance(l);
        advance(l);
      }
      consumedWs = true;
      continue;
    }
    break;
  }
  return consumedWs;
}

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isIdentCont(ch: string): boolean {
  return /[A-Za-z0-9_-]/.test(ch);
}

function readIdent(l: Lexer): string {
  let out = "";
  while (!eof(l) && isIdentCont(peek(l))) {
    out += advance(l);
  }
  return out;
}

// --- Atom parsing ----------------------------------------------------

function parseAtom(l: Lexer): Match {
  let match: Match = {};

  const ch = peek(l);
  if (ch === ".") {
    advance(l);
    if (!isIdentStart(peek(l))) {
      throw new StylesParseError("Expected class name after '.'", loc(l));
    }
    match.class = readIdent(l);
  } else if (isIdentStart(ch)) {
    match.kind = readIdent(l);
  } else if (ch === ":") {
    // Pseudo-only atom — match every node, refined by the pseudo
    // (legitimate for `:slot(abstract) paragraph`).
    // (handled in pseudo loop below)
  } else {
    throw new StylesParseError(`Unexpected character '${ch}' in selector`, loc(l));
  }

  // Attribute test:  kind[attr]  or  kind[attr=value]
  while (peek(l) === "[") {
    advance(l);
    if (!isIdentStart(peek(l))) {
      throw new StylesParseError("Expected attribute name inside '[' ']'", loc(l));
    }
    const name = readIdent(l);
    let value: unknown = true;
    skipWhitespaceAndComments(l);
    if (peek(l) === "=") {
      advance(l);
      skipWhitespaceAndComments(l);
      value = parseAttrValue(l);
      skipWhitespaceAndComments(l);
    }
    if (peek(l) !== "]") {
      throw new StylesParseError("Expected ']' after attribute test", loc(l));
    }
    advance(l);
    match.attr = { ...(match.attr ?? {}), [name]: value };
  }

  // Pseudo-classes
  while (peek(l) === ":") {
    advance(l);
    if (!isIdentStart(peek(l))) {
      throw new StylesParseError("Expected pseudo-class name after ':'", loc(l));
    }
    const name = readIdent(l);
    match = applyPseudo(l, match, name);
  }

  return match;
}

function parseAttrValue(l: Lexer): unknown {
  const ch = peek(l);
  if (ch === '"' || ch === "'") {
    const quote = ch;
    advance(l);
    let value = "";
    while (!eof(l) && peek(l) !== quote) {
      value += advance(l);
    }
    if (eof(l)) {
      throw new StylesParseError("Unterminated string in attribute test", loc(l));
    }
    advance(l);
    return value;
  }
  // Bare identifier, number, or boolean
  let raw = "";
  while (!eof(l) && peek(l) !== "]" && peek(l) !== " " && peek(l) !== "\t") {
    raw += advance(l);
  }
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (!Number.isNaN(n) && raw.length > 0 && /^[\d.+-]+$/.test(raw)) return n;
  return raw;
}

function applyPseudo(l: Lexer, match: Match, name: string): Match {
  switch (name) {
    case "first":
      return { ...match, index: "first" };
    case "last":
      return { ...match, index: "last" };
    case "nth": {
      expectChar(l, "(");
      const n = readInteger(l);
      expectChar(l, ")");
      return { ...match, index: n };
    }
    case "slot": {
      expectChar(l, "(");
      const name = readIdent(l);
      expectChar(l, ")");
      // Slot names are open (post-meta-primitive). Any identifier is
      // accepted; matching against an empty bucket is a no-op at apply
      // time.
      if (name.length === 0) {
        throw new StylesParseError("Empty slot name in :slot()", loc(l));
      }
      return { ...match, slot: name };
    }
    case "role": {
      expectChar(l, "(");
      const role = readIdent(l);
      expectChar(l, ")");
      return { ...match, role };
    }
    case "variant": {
      expectChar(l, "(");
      const v = readIdent(l);
      expectChar(l, ")");
      return { ...match, variant: v };
    }
    case "depth": {
      expectChar(l, "(");
      skipWhitespaceAndComments(l);
      // Forms: :depth(1), :depth(gte:2), :depth(lte:3), :depth(1-3)
      let prefix = "";
      const firstCh = peek(l);
      if (isIdentStart(firstCh)) {
        prefix = readIdent(l);
        if (prefix === "gte" || prefix === "lte") {
          expectChar(l, ":");
          const n = readInteger(l);
          expectChar(l, ")");
          return { ...match, depth: prefix === "gte" ? { gte: n } : { lte: n } };
        }
        throw new StylesParseError(`Expected 'gte' or 'lte' before ':' in :depth, got '${prefix}'`, loc(l));
      }
      const n = readInteger(l);
      // Range form: 1-3
      if (peek(l) === "-") {
        advance(l);
        const m = readInteger(l);
        expectChar(l, ")");
        return { ...match, depth: { gte: n, lte: m } };
      }
      expectChar(l, ")");
      return { ...match, depth: n };
    }
    case "has": {
      expectChar(l, "(");
      const inner = parseSelector(l);
      skipWhitespaceAndComments(l);
      expectChar(l, ")");
      return { ...match, has: inner };
    }
    case "not": {
      expectChar(l, "(");
      const inner = parseSelector(l);
      skipWhitespaceAndComments(l);
      expectChar(l, ")");
      return { ...match, not: inner };
    }
    default:
      throw new StylesParseError(`Unknown pseudo-class ':${name}'`, loc(l));
  }
}

function expectChar(l: Lexer, ch: string): void {
  skipWhitespaceAndComments(l);
  if (peek(l) !== ch) {
    throw new StylesParseError(`Expected '${ch}', got '${peek(l)}'`, loc(l));
  }
  advance(l);
}

function readInteger(l: Lexer): number {
  skipWhitespaceAndComments(l);
  let raw = "";
  if (peek(l) === "-" || peek(l) === "+") raw += advance(l);
  while (!eof(l) && /[0-9]/.test(peek(l))) {
    raw += advance(l);
  }
  if (raw.length === 0 || raw === "+" || raw === "-") {
    throw new StylesParseError("Expected integer", loc(l));
  }
  return Number(raw);
}

// --- Selector parsing -----------------------------------------------

function parseSelector(l: Lexer): Match {
  skipWhitespaceAndComments(l);
  let head: Match = parseAtom(l);

  while (true) {
    const wsConsumed = skipWhitespaceAndComments(l);
    const ch = peek(l);
    if (ch === "" || ch === "{" || ch === "," || ch === ")") break;

    let combinator: "follows" | "parent" | "within";
    if (ch === ">") {
      advance(l);
      skipWhitespaceAndComments(l);
      combinator = "parent";
    } else if (ch === "+") {
      advance(l);
      skipWhitespaceAndComments(l);
      combinator = "follows";
    } else if (wsConsumed && (isIdentStart(ch) || ch === "." || ch === ":")) {
      combinator = "within";
    } else {
      break;
    }

    const next = parseAtom(l);
    // Combinator semantics: `head [combinator] next` means "next, with
    // combinator pointing back at head". Build it that way.
    const wrapped: Match = { ...next };
    if (combinator === "parent") wrapped.parent = head;
    else if (combinator === "follows") wrapped.follows = head;
    else wrapped.within = head;
    head = wrapped;
  }

  return head;
}

function parseSelectorList(l: Lexer): Match[] {
  const list: Match[] = [];
  list.push(parseSelector(l));
  while (true) {
    skipWhitespaceAndComments(l);
    if (peek(l) !== ",") break;
    advance(l);
    list.push(parseSelector(l));
  }
  return list;
}

// --- Declarations ---------------------------------------------------

function parseDeclarations(l: Lexer): DeclarationAst[] {
  const decls: DeclarationAst[] = [];
  while (true) {
    skipWhitespaceAndComments(l);
    if (peek(l) === "}" || eof(l)) break;

    const declLoc = loc(l);
    // Property — kebab-case identifier
    let property = "";
    while (!eof(l) && (isIdentCont(peek(l)) || peek(l) === "-")) {
      property += advance(l);
    }
    if (property.length === 0) {
      throw new StylesParseError("Expected property name", declLoc);
    }
    skipWhitespaceAndComments(l);
    if (peek(l) !== ":") {
      throw new StylesParseError(`Expected ':' after property '${property}'`, loc(l));
    }
    advance(l);
    skipWhitespaceAndComments(l);

    // Value — everything up to the next `;` or `}` at brace depth 0.
    let value = "";
    let depth = 0;
    while (!eof(l)) {
      const ch = peek(l);
      if (depth === 0 && (ch === ";" || ch === "}")) break;
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      value += advance(l);
    }
    value = value.trim();
    if (value.length === 0) {
      throw new StylesParseError(`Empty value for property '${property}'`, declLoc);
    }
    if (peek(l) === ";") advance(l);
    decls.push({ property, value, source: declLoc });
  }
  return decls;
}

// --- Top-level ------------------------------------------------------

function parseRuleBlock(l: Lexer): RuleAst {
  const blockLoc = loc(l);
  const selectors = parseSelectorList(l);
  skipWhitespaceAndComments(l);
  if (peek(l) !== "{") {
    throw new StylesParseError("Expected '{' after selector list", loc(l));
  }
  advance(l);
  const declarations = parseDeclarations(l);
  skipWhitespaceAndComments(l);
  if (peek(l) !== "}") {
    throw new StylesParseError("Expected '}' after declarations", loc(l));
  }
  advance(l);

  // If selector list is a single `.className` form, lift the class
  // name so the lookup map keys correctly.
  let className: string | undefined;
  if (selectors.length === 1 && selectors[0]!.class != null && Object.keys(selectors[0]!).length === 1) {
    className = selectors[0]!.class;
  }

  return {
    selectors,
    declarations,
    ...(className != null ? { className } : {}),
    source: blockLoc
  };
}

// Public entry — parse a complete stylesheet source string.
export function parseStylesheet(input: string, file?: string): StylesheetAst {
  const lexer = makeLexer(input, file);
  const rules: RuleAst[] = [];
  const classes = new Map<string, RuleAst>();

  while (true) {
    skipWhitespaceAndComments(lexer);
    if (eof(lexer)) break;
    const rule = parseRuleBlock(lexer);
    if (rule.className != null) {
      if (classes.has(rule.className)) {
        const prev = classes.get(rule.className)!.source;
        throw new StylesParseError(
          `Duplicate class '.${rule.className}' — first declared at ${prev.line}:${prev.column}`,
          rule.source
        );
      }
      classes.set(rule.className, rule);
    }
    rules.push(rule);
  }

  return { rules, classes };
}
