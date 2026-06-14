import type { TemplateProps } from "../prop-readers.js";
import type {
  BibDataEntry,
  BibDataNode,
  IndexDataEntry,
  IndexDataNode,
  ListOfDataEntry,
  ListOfDataNode,
  ListOfKind,
  TocDataEntry,
  TocDataNode
} from "../ir.js";

// Data-source primitives. Each render-prop factory accepts the
// render function as either an explicit `render={...}` prop OR as
// `children`. The `render` prop is preferred because passing a
// function via `children` triggers React's runtime warning
// "Functions are not valid as a React child" (see the bib-data
// warning called out in the bug plan). Author-facing helpers and
// docs continue to support the children form for back-compat.
//
// Validation deferred: errors thrown from `createInstance` are
// swallowed by React's commit-phase error handling, surfacing instead
// as the generic "Template renderer produced no root node." We capture
// `render` regardless of type and let the resolver assert it's a
// function at expand time — that error path is observable.

function readRenderProp<T>(props: TemplateProps): (entries: T) => unknown {
  const bag = props as Record<string, unknown>;
  const fromProp = bag.render;
  if (typeof fromProp === "function") {
    return fromProp as (entries: T) => unknown;
  }
  // Legacy children-as-render-prop form. Kept so `<bib-data>{(e) =>
  // …}</bib-data>` continues to work; new code should pass
  // `render={...}` to avoid React's "Functions are not valid as a
  // React child" warning.
  return bag.children as unknown as (entries: T) => unknown;
}

export function bibDataNode(props: TemplateProps): BibDataNode {
  return {
    kind: "bib-data",
    render: readRenderProp<BibDataEntry[]>(props)
  };
}

export function tocDataNode(props: TemplateProps): TocDataNode {
  return {
    kind: "toc-data",
    render: readRenderProp<TocDataEntry[]>(props)
  };
}

export function listOfDataNode(props: TemplateProps): ListOfDataNode {
  const ofRaw = (props as Record<string, unknown>).of;
  let of: ListOfKind;
  if (ofRaw === "figure" || ofRaw === "table" || ofRaw === "equation") {
    of = ofRaw;
  } else {
    throw new Error("`list-of-data` `of` must be `figure`, `table`, or `equation`.");
  }
  return {
    kind: "list-of-data",
    of,
    render: readRenderProp<ListOfDataEntry[]>(props)
  };
}

export function indexDataNode(props: TemplateProps): IndexDataNode {
  return {
    kind: "index-data",
    render: readRenderProp<IndexDataEntry[]>(props)
  };
}

// `<bib-entry-content>` lives on the content side. See
// src/content/factories.ts.
