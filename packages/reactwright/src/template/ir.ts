import type { Match } from "../styles/ir.js";

export type TemplateStyle = Record<string, unknown>;

export type TemplatePageProps = {
  size?: string;
  orientation?: "portrait" | "landscape";
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  textWidth?: string;
  textHeight?: string;
  bindingOffset?: string;
  twoSided?: boolean;
  columns?: number;
  columnGap?: string;
};

export type TemplateTypographyProps = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontVariant?: string;
  textDecoration?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: string;
  wordSpacing?: string;
  language?: string;
  textAlign?: "left" | "center" | "right" | "justify";
};

export type TemplateParagraphProps = {
  textIndent?: string | number;
  paragraphSpacing?: string;
  textWrap?: string;
  firstLineIndent?: string;
  keepTogether?: boolean;
  widowControl?: number;
  orphanControl?: number;
  hyphenation?: string;
};

export type TemplateBoxProps = {
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  width?: string;
  maxWidth?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderColor?: string;
  borderRadius?: string;
  backgroundColor?: string;
  breakable?: boolean;
};

export type TemplateLayoutProps = {
  gap?: string;
  inlineGap?: string;
  columns?: number;
  columnGap?: string;
  alignSelf?: "left" | "center" | "right" | "stretch";
  width?: string;
  maxWidth?: string;
};

export type TemplateBreaksProps = {
  pageBreakBefore?: string;
  pageBreakAfter?: string;
  breakInside?: string;
  keepTogether?: boolean;
  keepWithNext?: boolean;
  clearFloats?: boolean;
};

// Slot names are open strings. The canonical names "title", "author",
// "abstract", and "body" are populated from DocumentNode scalar props
// and the structural body stream. Any other name is populated by
// `<meta name="X">` content entries. Templates declare what they
// expect; the engine does not interpret names.
export type SlotName = string;
export const CANONICAL_SLOT_NAMES = ["title", "author", "abstract", "body"] as const;
export type CanonicalSlotName = typeof CANONICAL_SLOT_NAMES[number];

export type BreakValue = "auto" | "always" | "avoid" | "page" | "left" | "right" | "recto" | "verso";

export type RoleNumbering = {
  counter: string;
  scope?: string;
  format?: string;
};

export type RoleDropCap = {
  lines?: number;
  font?: string;
  position?: string;
};

export type RoleRuleNode = {
  kind: "role-rule";
  match: string;
  apply: string;
  on?: string;
  breakBefore?: BreakValue;
  breakAfter?: BreakValue;
  breakInside?: "auto" | "avoid";
  numbering?: RoleNumbering;
  dropCap?: RoleDropCap;
  style?: TemplateStyle;
};

export type PageRuleNode = {
  kind: "page-rule";
  match: string;
  use: string;
};

// New-style rule binding: a Match selector and either a className
// (binding to a named class defined in a <styles> block), a style
// (inline declarations the resolver lifts into a synthetic class),
// or both. Matches <role>'s style passthrough so authors don't have
// to write a <styles> block just to attach a one-off declaration.
export type RuleNode = {
  kind: "rule";
  match: Match;
  className?: string;
  style?: TemplateStyle;
};

// A block of styles-dialect text. Compiled at HTML emit time.
export type StylesNode = {
  kind: "styles";
  source: string;
};

export type RulesChild = RoleRuleNode | PageRuleNode | RuleNode;

export type RulesNode = {
  kind: "rules";
  children: RulesChild[];
};

export type PageNode = {
  kind: "page";
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type PageSetNode = {
  kind: "page-set";
  name: string;
  style?: TemplateStyle;
  anchors?: Record<string, CoordinateAnchor>;
  className?: string;
  children: TemplateChild[];
};

// `<page-variant name="V">` declared inside a `<page-set name="P">`.
// Sections opt in via `<section page="P" pageVariant="V">`. The resolver
// materializes this as a derived regime `P__V` whose style overlays
// the parent's, whose body flow falls back to the parent's when not
// declared, and whose chrome inherits the parent's chrome on any
// anchor the variant doesn't itself define.
//
// One level deep only — variants cannot nest variants. The constraint
// keeps the resolver merge logic bounded and matches the IEEE / book
// design need ("chapter opener", "feature spread") without opening a
// rabbit hole.
export type PageVariantNode = {
  kind: "page-variant";
  name: string;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

// Engine-internal delimiter between page-set name and variant name in
// the derived regime name (e.g. `main__opener`). Not part of the
// authoring surface — authors write `pageVariant="opener"`, never see
// the combined form. Kept as a constant so the resolver and renderer
// agree on the spelling.
export const PAGE_VARIANT_SEP = "__";

export type RegionPositioning = {
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  center?: boolean;
};

export type RegionNode = {
  kind: "region";
  style?: TemplateStyle;
  positioning?: RegionPositioning;
  className?: string;
  children: TemplateChild[];
};

export type LayerWhen = "all" | "first-page" | "not-first-page";

export type LayerNode = {
  kind: "layer";
  name?: string;
  when?: LayerWhen;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type StackNode = {
  kind: "stack";
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

// Horizontal-flex layout primitive, symmetric to <stack>. Renderer
// emits `display:flex; flex-direction:row` plus `gap`. Used for
// side-by-side layout that isn't multi-column text flow.
export type TemplateRowNode = {
  kind: "row";
  gap?: string;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type ColumnsNode = {
  kind: "columns";
  gap?: string;
  widths?: string[];
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type ColumnNode = {
  kind: "column";
  width?: string;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type FixedAnchorName =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "page-top-left"
  | "page-top-right"
  | "page-bottom-left"
  | "page-bottom-right";

export type CoordinateAnchor = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  inside?: string;
  outside?: string;
};

export type FixedAnchor = FixedAnchorName | string | CoordinateAnchor;

export type FixedWhen = "all" | "first-page" | "not-first-page";

export type FixedNode = {
  kind: "fixed";
  anchor: FixedAnchor;
  when?: FixedWhen;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type PageNumberNode = {
  kind: "page-number";
  style?: TemplateStyle;
};

export type PageCountNode = {
  kind: "page-count";
  style?: TemplateStyle;
};

export type RunningPolicy = "start" | "first" | "last" | "first-except";

export type RunningNode = {
  kind: "running";
  name: string;
  policy?: RunningPolicy;
  style?: TemplateStyle;
};

export type ImageNode = {
  kind: "image";
  src: string;
  alt?: string;
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  width?: string;
  style?: TemplateStyle;
};

export type FootnoteAreaNode = {
  kind: "footnote-area";
  separator?: boolean;
  style?: TemplateStyle;
};

export type SidenoteAreaSide = "outside" | "inside" | "left" | "right";

export type SidenoteAreaNode = {
  kind: "sidenote-area";
  side?: SidenoteAreaSide;
  width?: string;
  gap?: string;
  style?: TemplateStyle;
};

export type ListOfKind = "figure" | "table" | "equation";

// Data-source primitives. Each captures a render-prop
// function child; the resolver invokes it with the aggregated entries,
// re-enters the template reconciler on the returned JSX, and recursively
// expands the result. None of these carry a renderer — their resolution
// IS the expansion.

export type BibDataEntry = {
  key: string;
  used: boolean;
  text?: string;
};

export type BibDataNode = {
  kind: "bib-data";
  // Render type erased to `unknown` — React JSX types don't survive the
  // factory boundary cleanly. The resolver casts at the call site.
  render: (entries: BibDataEntry[]) => unknown;
};

export type TocDataEntry = {
  id: string;
  title: string;
  depth: number;
};

export type TocDataNode = {
  kind: "toc-data";
  render: (entries: TocDataEntry[]) => unknown;
};

export type ListOfDataEntry = {
  id: string;
  caption: string;
};

export type ListOfDataNode = {
  kind: "list-of-data";
  of: ListOfKind;
  render: (entries: ListOfDataEntry[]) => unknown;
};

export type IndexDataEntry = {
  term: string;
  anchorIds: string[];
};

export type IndexDataNode = {
  kind: "index-data";
  render: (entries: IndexDataEntry[]) => unknown;
};

// `BibEntryContentNode` moved to content side (`src/content/ir.ts`) in
// slice 6.3 (D1). Userland helpers compose it inside content JSX
// returned from a `<bib-data>` render-prop.

export type FontNode = {
  kind: "font";
  family: string;
  src: string;
  weight?: string;
  fontStyle?: string;
  format?: string;
};

export type MarginAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-inside"
  | "top-outside"
  | "bottom-inside"
  | "bottom-outside"
  | "left-top"
  | "left-middle"
  | "left-bottom"
  | "right-top"
  | "right-middle"
  | "right-bottom";

// `when` policy for chrome (header/footer). Scope is whatever the
// chrome lives in: chrome inside a `<page-set>` is regime-scoped (so
// `first-page` means first page of THAT regime); chrome at page root
// is document-scoped. Authors don't think about that distinction —
// they just say "first" relative to the chrome's containing scope.
//
//   first-page     — first page of the containing scope
//   not-first-page — every page except the first of the containing scope
//   left / right   — even/odd pages (CSS `@page :left` / `:right`).
//                    Useful for two-sided layouts where header text
//                    differs by side and the inside/outside anchor
//                    mirroring isn't enough.
//   blank / not-blank — applies to (or suppresses on) implicit blank
//                    pages CSS Paged Media inserts to align spreads
//                    (CSS `@page :blank`). Paged.js support varies.
//   all (default)  — every page in scope
export type MarginMatterWhen =
  | "all"
  | "first-page"
  | "not-first-page"
  | "left"
  | "right"
  | "blank"
  | "not-blank";

export type HeaderNode = {
  kind: "header";
  anchor: MarginAnchor;
  when?: MarginMatterWhen;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type FooterNode = {
  kind: "footer";
  anchor: MarginAnchor;
  when?: MarginMatterWhen;
  style?: TemplateStyle;
  className?: string;
  children: TemplateChild[];
};

export type SlotNode = {
  kind: "slot";
  name: SlotName;
};

export type CustomTemplateNode = {
  kind: "custom";
  name: string;
  props: Record<string, unknown>;
  style?: TemplateStyle;
  children: TemplateChild[];
};

export type TemplateTextNode = {
  kind: "text";
  value: string;
};

export type TemplateNode =
  | PageNode
  | PageSetNode
  | PageVariantNode
  | RegionNode
  | StackNode
  | TemplateRowNode
  | ColumnsNode
  | ColumnNode
  | LayerNode
  | FixedNode
  | HeaderNode
  | FooterNode
  | PageNumberNode
  | PageCountNode
  | RunningNode
  | ImageNode
  | FootnoteAreaNode
  | SidenoteAreaNode
  | BibDataNode
  | TocDataNode
  | ListOfDataNode
  | IndexDataNode
  | FontNode
  | SlotNode
  | CustomTemplateNode
  | RulesNode
  | RulesChild
  | StylesNode
  | TemplateTextNode;

export type TemplateContainerNode =
  | PageNode
  | PageSetNode
  | PageVariantNode
  | RegionNode
  | StackNode
  | TemplateRowNode
  | ColumnsNode
  | ColumnNode
  | LayerNode
  | FixedNode
  | HeaderNode
  | FooterNode
  | CustomTemplateNode
  | RulesNode;

export type TemplateChild =
  | TemplateContainerNode
  | PageNumberNode
  | PageCountNode
  | RunningNode
  | ImageNode
  | FootnoteAreaNode
  | SidenoteAreaNode
  | BibDataNode
  | TocDataNode
  | ListOfDataNode
  | IndexDataNode
  | FontNode
  | SlotNode
  | StylesNode
  | RuleNode
  | TemplateTextNode;
