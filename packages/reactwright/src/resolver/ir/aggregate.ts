// Aggregation-related resolved entry types. The TOC, list-of, index,
// and bibliography data-source primitives surface these to userland
// render-prop helpers, but no resolved-IR template node carries them
// directly — the userland helpers re-enter the content reconciler.

export type ResolvedIndexEntry = {
  term: string;
  anchorIds: string[];
};

export type ResolvedTocEntry = {
  id: string;
  title: string;
  depth: number;
};

export type ResolvedListOfEntry = {
  id: string;
  caption: string;
};

export type ResolvedBibliographyEntry = {
  key: string;
  text?: string;
  used: boolean;
};
