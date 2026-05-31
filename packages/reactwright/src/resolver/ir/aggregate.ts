import type { TemplateStyle } from "../../template/ir.js";
import type { ResolvedInlineNode } from "./inline.js";

export type ResolvedIndexEntry = {
  term: string;
  anchorIds: string[];
};

export type ResolvedIndexTemplateNode = {
  kind: "index-template";
  title?: string;
  entries: ResolvedIndexEntry[];
  style?: TemplateStyle;
};

export type ResolvedTocEntry = {
  id: string;
  title: string;
  depth: number;
};

export type ResolvedTocNode = {
  kind: "toc";
  title?: string;
  depth?: number;
  numbered?: boolean;
  entries: ResolvedTocEntry[];
  style?: TemplateStyle;
};

export type ResolvedListOfEntry = {
  id: string;
  caption: string;
};

export type ResolvedListOfNode = {
  kind: "list-of";
  of: "figure" | "table" | "equation";
  title?: string;
  entries: ResolvedListOfEntry[];
  style?: TemplateStyle;
};

export type ResolvedBibliographyEntry = {
  key: string;
  text?: string;
  inline?: ResolvedInlineNode[];
  used: boolean;
  // Identity of the source `ResolvedRefEntryNode` that produced this
  // entry (for content-side entries). The renderer passes it to
  // `classAttr` so authors can target bibliography <li>s via
  // `<rule match={{ kind: "ref-entry" }} />`. Absent when the entry
  // came from the template-prop `entries={...}` path or was synthesised
  // for a citation with no entry.
  sourceNode?: unknown;
};

export type ResolvedBibliographyHeadingNode = {
  kind: "bibliography-heading";
  text: string;
  className?: string;
};

export type ResolvedBibliographyListNode = {
  kind: "bibliography-list";
  className?: string;
};

export type ResolvedBibliographyNode = {
  kind: "bibliography";
  title?: string;
  entries: ResolvedBibliographyEntry[];
  style?: TemplateStyle;
  // Synthesized child IR nodes for the rendered <h2> + <ol> wrappers,
  // so authors can target them via `<rule match={{kind:"bibliography-heading"}}>`
  // / `<rule match={{kind:"bibliography-list"}}>`. Slice 5.3 (the
  // back-compat path while engine <bibliography> stays deprecated;
  // slice 6.3 will replace this with userland composition).
  headingNode?: ResolvedBibliographyHeadingNode;
  listNode?: ResolvedBibliographyListNode;
};
