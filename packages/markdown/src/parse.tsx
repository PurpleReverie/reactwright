// Markdown -> Reactwright JSX converter.
//
// The pipeline is:
//   1. Pre-process raw source to extract footnote definitions
//      `[^id]: text`, leaving the inline `[^id]` references in place.
//   2. Run `marked.lexer()` to get the block-level token stream.
//   3. Walk blocks; build a nested section tree by tracking heading
//      depth on a stack (Markdown headings are flat siblings; the
//      engine wants nested <section> containers).
//   4. Render each inline-token span through `renderInlineTokens`,
//      which also handles three engine-specific extensions that
//      CommonMark doesn't cover natively:
//        - `$inline$` and `$$display$$` math
//        - Pandoc-style `[@key]` citations
//        - footnote markers `[^id]` (resolved against the def map)
//
// Constraints:
//   - We never modify the engine. Only its public content JSX is used.
//   - List items wrap raw inline content in <p> because the grammar
//      forbids inline children directly under <item>.
//   - Table cells likewise wrap inline content in <p>.

import "reactwright/jsx";
import React, { type ReactElement, type ReactNode } from "react";
import { marked, type Tokens, type Token } from "marked";

import type { MarkdownFrontmatter, MarkdownReference } from "./index.js";

// Regexes shared between the pre-processor (which strips definitions)
// and the inline walker (which expands references).
const FOOTNOTE_DEF_RE = /^\[\^([^\]]+)\]:\s*([\s\S]*?)(?=\n\[\^|\n#|\n\n|$)/gm;
const FOOTNOTE_REF_RE = /\[\^([^\]]+)\]/g;
const CITATION_RE = /\[@([^\]]+)\]/g;
const INLINE_MATH_RE = /\$([^$\n]+?)\$/g;
const DISPLAY_MATH_RE = /\$\$([\s\S]+?)\$\$/g;

type FootnoteMap = Map<string, string>;

type ParseContext = {
  footnotes: FootnoteMap;
  keyCounter: { current: number };
};

function nextKey(ctx: ParseContext): string {
  ctx.keyCounter.current += 1;
  return `md-${ctx.keyCounter.current}`;
}

// React's JSX intrinsic types in the engine don't expose `key` on most
// IR nodes (see CLAUDE.md "key prop on intrinsics"). cloneElement is
// the safe way to stamp a key onto a JSX-built element without
// fighting the type system. The .map() helpers below use this anywhere
// we produce sibling lists; React's runtime then has a stable key for
// reconciliation.
function withKey<P>(element: ReactElement<P>, key: string): ReactElement<P> {
  return React.cloneElement(element, { key } as Partial<P> & { key: string });
}

// Pull out `[^foo]: body` definitions and return the cleaned source.
// We accept any text up to the next blank line, the next definition,
// or the next heading — same heuristic as Pandoc and remark.
function extractFootnoteDefinitions(source: string): { content: string; footnotes: FootnoteMap } {
  const footnotes: FootnoteMap = new Map();
  const cleaned = source.replace(FOOTNOTE_DEF_RE, (_match, id: string, text: string) => {
    footnotes.set(id, text.trim());
    return "";
  });
  return { content: cleaned, footnotes };
}

// Heading-stack reducer. Maintains the chain of currently-open
// <section> nodes (one per active heading depth). When a heading at
// depth D arrives, we pop everything at depth >= D, then push a new
// open section.
type OpenSection = {
  depth: number;
  title: string;
  children: ReactNode[];
};

type SectionStack = {
  // The root is a synthetic depth-0 frame whose children become the
  // top-level <document> children.
  root: OpenSection;
  stack: OpenSection[];
};

function newStack(): SectionStack {
  const root: OpenSection = { depth: 0, title: "", children: [] };
  return { root, stack: [root] };
}

function currentFrame(stack: SectionStack): OpenSection {
  return stack.stack[stack.stack.length - 1];
}

function closeTo(stack: SectionStack, targetDepth: number): void {
  while (stack.stack.length > 1 && currentFrame(stack).depth >= targetDepth) {
    const closing = stack.stack.pop()!;
    const parent = currentFrame(stack);
    parent.children.push(
      withKey(
        <section title={closing.title}>{closing.children}</section>,
        `section-${parent.children.length}`
      )
    );
  }
}

function openSection(stack: SectionStack, depth: number, title: string): void {
  closeTo(stack, depth);
  stack.stack.push({ depth, title, children: [] });
}

function finalizeStack(stack: SectionStack): ReactNode[] {
  closeTo(stack, 1);
  return stack.root.children;
}

// ---- Inline rendering ------------------------------------------------------

// Render an array of marked inline tokens into a flat ReactNode list.
// Text tokens are post-processed for math ($..$, $$..$$), citations
// ([@key]), and footnote markers ([^id]).
function renderInlineTokens(tokens: Token[] | undefined, ctx: ParseContext): ReactNode[] {
  if (tokens == null) return [];
  const out: ReactNode[] = [];
  for (const token of tokens) {
    const rendered = renderInlineToken(token, ctx);
    if (Array.isArray(rendered)) {
      out.push(...rendered);
    } else if (rendered != null) {
      out.push(rendered);
    }
  }
  return out;
}

function renderInlineToken(token: Token, ctx: ParseContext): ReactNode | ReactNode[] {
  switch (token.type) {
    case "text": {
      const t = token as Tokens.Text;
      if (t.tokens != null && t.tokens.length > 0) {
        return renderInlineTokens(t.tokens, ctx);
      }
      return expandTextExtensions(t.text, ctx);
    }
    case "strong": {
      const t = token as Tokens.Strong;
      return withKey(<strong>{renderInlineTokens(t.tokens, ctx)}</strong>, nextKey(ctx));
    }
    case "em": {
      const t = token as Tokens.Em;
      return withKey(<em>{renderInlineTokens(t.tokens, ctx)}</em>, nextKey(ctx));
    }
    case "codespan": {
      const t = token as Tokens.Codespan;
      return withKey(<code>{decodeHtmlEntities(t.text)}</code>, nextKey(ctx));
    }
    case "link": {
      const t = token as Tokens.Link;
      return (
        <link key={nextKey(ctx)} href={t.href}>
          {renderInlineTokens(t.tokens, ctx)}
        </link>
      );
    }
    case "image": {
      const t = token as Tokens.Image;
      return withKey(<img src={t.href} alt={t.text} />, nextKey(ctx));
    }
    case "br":
      return withKey(<br />, nextKey(ctx));
    case "del": {
      // strike-through doesn't exist in the engine; degrade to plain text
      const t = token as Tokens.Del;
      return renderInlineTokens(t.tokens, ctx);
    }
    case "escape": {
      const t = token as Tokens.Escape;
      return t.text;
    }
    case "html": {
      // raw inline HTML — engine has no html primitive; pass through as text
      const t = token as Tokens.HTML;
      return t.text;
    }
    default:
      return null;
  }
}

// Decode the small set of HTML entities marked emits in codespan text.
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Take a plain text run and split it into ReactNodes, recognizing
// $$..$$, $..$, [@key], and [^id]. The four patterns can't overlap
// (math is dollar-delimited; the others are bracket-prefixed) so we
// can walk left-to-right with a single tokenizer.
function expandTextExtensions(text: string, ctx: ParseContext): ReactNode[] {
  if (text.length === 0) return [];
  // Build a list of {start, end, build} entries for every match, then
  // merge them in source order, splicing literal text between.
  type Hit = { start: number; end: number; node: ReactNode };
  const hits: Hit[] = [];

  // Display math nested inside a text run can't lift out to a real
  // block `<math>` from this depth (the engine forbids block children
  // inside <p>), so we emit it as inline `<m>` and leave the visual
  // promotion to the template's styling. Paragraph-level `$$...$$`
  // gets handled in renderBlockToken before this expander runs.
  collectMatches(text, DISPLAY_MATH_RE, (m) => {
    hits.push({
      start: m.index!,
      end: m.index! + m[0].length,
      node: withKey(<m src={m[1].trim()} />, nextKey(ctx))
    });
  });
  // Build a mask of regions covered by display math so we don't try
  // to interpret '$' inside `$$...$$` as inline-math delimiters.
  const masked = maskRanges(text, hits);

  collectMatches(masked, INLINE_MATH_RE, (m) => {
    hits.push({
      start: m.index!,
      end: m.index! + m[0].length,
      node: withKey(<m src={m[1].trim()} />, nextKey(ctx))
    });
  });
  collectMatches(masked, CITATION_RE, (m) => {
    hits.push({
      start: m.index!,
      end: m.index! + m[0].length,
      node: withKey(<cite cite={m[1].trim()} />, nextKey(ctx))
    });
  });
  collectMatches(masked, FOOTNOTE_REF_RE, (m) => {
    const id = m[1].trim();
    const body = ctx.footnotes.get(id);
    if (body == null) {
      // Unknown footnote: emit the marker as literal text so the
      // author can see something went wrong.
      hits.push({ start: m.index!, end: m.index! + m[0].length, node: `[^${id}]` });
      return;
    }
    hits.push({
      start: m.index!,
      end: m.index! + m[0].length,
      node: withKey(
        <footnote>{expandTextExtensions(body, ctx)}</footnote>,
        nextKey(ctx)
      )
    });
  });

  hits.sort((a, b) => a.start - b.start);

  // Splice text + nodes.
  const out: ReactNode[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start < cursor) continue; // overlapping match — keep the first
    if (hit.start > cursor) out.push(text.slice(cursor, hit.start));
    out.push(hit.node);
    cursor = hit.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

// Collect all matches of a /g regex without mutating module-level
// state. We clone the regex per call because expandTextExtensions
// recurses (footnote bodies are themselves Markdown), and sharing
// lastIndex across recursive frames would either skip matches or
// loop forever depending on the order.
function collectMatches(
  source: string,
  re: RegExp,
  visit: (m: RegExpExecArray) => void
): void {
  const local = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null;
  while ((m = local.exec(source)) != null) {
    visit(m);
    if (m.index === local.lastIndex) local.lastIndex += 1;
  }
}

// Replace already-claimed ranges with same-length runs of NULs so
// later regex passes can't match inside them.
function maskRanges(source: string, claimed: { start: number; end: number }[]): string {
  if (claimed.length === 0) return source;
  const chars = source.split("");
  for (const r of claimed) {
    for (let i = r.start; i < r.end && i < chars.length; i += 1) chars[i] = " ";
  }
  return chars.join("");
}

// Detect "this paragraph is just one image": exactly one image
// token, optionally surrounded by whitespace-only text tokens. Returns
// the image's href and alt text on a match, null otherwise. Mixed
// content (image plus other text/links) returns null so the image
// stays inline.
function findSoloImage(
  tokens: Token[] | undefined
): { href: string; alt: string } | null {
  if (tokens == null) return null;
  let image: Tokens.Image | null = null;
  for (const tok of tokens) {
    if (tok.type === "image") {
      if (image != null) return null; // more than one image
      image = tok as Tokens.Image;
      continue;
    }
    if (tok.type === "text") {
      const text = (tok as Tokens.Text).text ?? "";
      if (text.trim().length > 0) return null; // non-whitespace text
      continue;
    }
    return null; // any other token kind disqualifies
  }
  if (image == null) return null;
  return { href: image.href, alt: image.text ?? "" };
}

// ---- Block rendering -------------------------------------------------------

function renderBlockToken(token: Token, ctx: ParseContext): ReactNode {
  switch (token.type) {
    case "paragraph": {
      const t = token as Tokens.Paragraph;
      // A paragraph that is exactly `$$...$$` (possibly with
      // surrounding whitespace) gets promoted to a block <math>. This
      // is the only place we can do the promotion — once we descend
      // into the inline expander, the math has to stay inline.
      const trimmed = t.text.trim();
      const display = /^\$\$([\s\S]+)\$\$$/.exec(trimmed);
      if (display != null) {
        return withKey(<math src={display[1].trim()} />, nextKey(ctx));
      }
      // A paragraph that is *only* an image (optionally with
      // surrounding whitespace) is the Markdown idiom for "this is a
      // figure." Lift it to <figure> so the template can style it via
      // the standard figure-image / caption rules instead of having to
      // post-process the rendered HTML. The image's alt text becomes
      // the caption (the same intuition Pandoc applies). Inline images
      // mixed into prose stay as inline <img>.
      const onlyImage = findSoloImage(t.tokens);
      if (onlyImage != null) {
        return withKey(
          onlyImage.alt.length > 0 ? (
            <figure src={onlyImage.href} alt={onlyImage.alt}>
              <caption>{onlyImage.alt}</caption>
            </figure>
          ) : (
            <figure src={onlyImage.href} />
          ),
          nextKey(ctx)
        );
      }
      return withKey(<p>{renderInlineTokens(t.tokens, ctx)}</p>, nextKey(ctx));
    }
    case "blockquote": {
      const t = token as Tokens.Blockquote;
      return withKey(<quote>{renderBlockTokens(t.tokens, ctx)}</quote>, nextKey(ctx));
    }
    case "code": {
      const t = token as Tokens.Code;
      if (t.lang != null && t.lang.length > 0) {
        return withKey(
          <code-block language={t.lang}>{t.text}</code-block>,
          nextKey(ctx)
        );
      }
      return withKey(<code-block>{t.text}</code-block>, nextKey(ctx));
    }
    case "list": {
      const t = token as Tokens.List;
      return withKey(
        <list ordered={t.ordered}>
          {t.items.map((item) =>
            withKey(<item>{renderListItemContent(item, ctx)}</item>, nextKey(ctx))
          )}
        </list>,
        nextKey(ctx)
      );
    }
    case "table":
      return renderTable(token as Tokens.Table, ctx);
    case "hr":
      return withKey(<page-break />, nextKey(ctx));
    case "space":
    case "html":
      return null;
    default:
      return null;
  }
}

function renderBlockTokens(tokens: Token[] | undefined, ctx: ParseContext): ReactNode[] {
  if (tokens == null) return [];
  const out: ReactNode[] = [];
  for (const token of tokens) {
    const node = renderBlockToken(token, ctx);
    if (node != null) out.push(node);
  }
  return out;
}

// List items in marked are a mix of paragraph and inline tokens. The
// engine grammar requires block children under <item>, so any bare
// inline content gets wrapped in <p>.
function renderListItemContent(item: Tokens.ListItem, ctx: ParseContext): ReactNode[] {
  const out: ReactNode[] = [];
  let inlineBuffer: Token[] = [];

  const flushInline = (): void => {
    if (inlineBuffer.length === 0) return;
    out.push(withKey(<p>{renderInlineTokens(inlineBuffer, ctx)}</p>, nextKey(ctx)));
    inlineBuffer = [];
  };

  for (const child of item.tokens) {
    if (child.type === "text") {
      const t = child as Tokens.Text;
      // List items use `text` tokens to carry their inline content
      // when the item is "tight" (single-paragraph). Treat them as
      // inline so we can wrap them in a <p>.
      if (t.tokens != null) {
        inlineBuffer.push(...t.tokens);
      } else {
        inlineBuffer.push(child);
      }
      continue;
    }
    flushInline();
    const block = renderBlockToken(child, ctx);
    if (block != null) out.push(block);
  }
  flushInline();
  return out;
}

function renderTable(token: Tokens.Table, ctx: ParseContext): ReactNode {
  const rows: ReactNode[] = [];
  if (token.header.length > 0) {
    rows.push(
      <row key={nextKey(ctx)}>
        {token.header.map((cell) => (
          <cell key={nextKey(ctx)} header>
            <p>{renderInlineTokens(cell.tokens, ctx)}</p>
          </cell>
        ))}
      </row>
    );
  }
  for (const row of token.rows) {
    rows.push(
      <row key={nextKey(ctx)}>
        {row.map((cell) => (
          <cell key={nextKey(ctx)}>
            <p>{renderInlineTokens(cell.tokens, ctx)}</p>
          </cell>
        ))}
      </row>
    );
  }
  return withKey(<table>{rows}</table>, nextKey(ctx));
}

// ---- Top-level conversion --------------------------------------------------

export function parseMarkdownToDocument(
  source: string,
  frontmatter: MarkdownFrontmatter
): ReactElement {
  const ctx: ParseContext = {
    footnotes: new Map(),
    keyCounter: { current: 0 }
  };

  const { content, footnotes } = extractFootnoteDefinitions(source);
  ctx.footnotes = footnotes;

  const tokens = marked.lexer(content);
  const stack = newStack();

  for (const token of tokens) {
    if (token.type === "heading") {
      const h = token as Tokens.Heading;
      const title = stringifyInlineTokens(h.tokens, ctx);
      openSection(stack, h.depth, title);
      continue;
    }
    const block = renderBlockToken(token, ctx);
    if (block != null) currentFrame(stack).children.push(block);
  }

  const documentChildren = finalizeStack(stack);
  const refsNode = buildRefsFromFrontmatter(frontmatter.references, ctx);
  if (refsNode != null) documentChildren.push(refsNode);

  const props: { title: string; author?: string; children: ReactNode } = {
    title: typeof frontmatter.title === "string" ? frontmatter.title : "Untitled",
    children: documentChildren
  };
  if (typeof frontmatter.author === "string") props.author = frontmatter.author;

  return <document {...props} />;
}

// Headings need a plain string title for the IR. We collapse inline
// tokens by recursively concatenating their text content; styling on
// headings is rare in markdown and the engine's section title is a
// string field anyway.
function stringifyInlineTokens(tokens: Token[] | undefined, ctx: ParseContext): string {
  if (tokens == null) return "";
  let out = "";
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const t = token as Tokens.Text;
        if (t.tokens != null) {
          out += stringifyInlineTokens(t.tokens, ctx);
        } else {
          out += t.text;
        }
        break;
      }
      case "strong":
        out += stringifyInlineTokens((token as Tokens.Strong).tokens, ctx);
        break;
      case "em":
        out += stringifyInlineTokens((token as Tokens.Em).tokens, ctx);
        break;
      case "codespan":
        out += (token as Tokens.Codespan).text;
        break;
      case "link":
        out += stringifyInlineTokens((token as Tokens.Link).tokens, ctx);
        break;
      case "escape":
        out += (token as Tokens.Escape).text;
        break;
      default:
        break;
    }
  }
  // Strip math/citation/footnote markup from titles — these aren't
  // meaningful in a heading and would survive as raw '$' or '[@x]'.
  return out
    .replace(DISPLAY_MATH_RE, "")
    .replace(INLINE_MATH_RE, "")
    .replace(CITATION_RE, "")
    .replace(FOOTNOTE_REF_RE, "")
    .trim();
}

function buildRefsFromFrontmatter(
  references: MarkdownReference[] | undefined,
  ctx: ParseContext
): ReactNode | null {
  if (references == null || references.length === 0) return null;
  return withKey(
    <refs>
      {references.map((ref) => (
        <ref-entry key={ref.key} refKey={ref.key}>
          {renderRefEntryInlineTokens(ref.text, ctx)}
        </ref-entry>
      ))}
    </refs>,
    nextKey(ctx)
  );
}

// Parse a frontmatter `references[i].text` string. Authors typically
// write a single line containing inline Markdown (em, strong, link);
// pull the inline tokens off the first paragraph the lexer produces.
// Falls back to a plain-text token if the lexer returned nothing
// useful — defensive against odd whitespace.
function renderRefEntryInlineTokens(text: string, ctx: ParseContext): ReactNode[] {
  const tokens = marked.lexer(text);
  const first = tokens[0];
  if (first != null && first.type === "paragraph") {
    return renderInlineTokens((first as Tokens.Paragraph).tokens, ctx);
  }
  return expandTextExtensions(text, ctx);
}
