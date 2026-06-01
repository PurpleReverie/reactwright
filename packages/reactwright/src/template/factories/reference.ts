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

// Data-source primitives. Each render-prop factory reads
// `props.children` as a function. React emits a "Functions are not
// valid as a React child" warning when the child reaches
// reconciliation, but the function survives in the props bag handed
// to `createInstance` and we capture it here.
//
// Validation deferred: errors thrown from `createInstance` are
// swallowed by React's commit-phase error handling, surfacing instead
// as the generic "Template renderer produced no root node." We capture
// `render` regardless of type and let the resolver assert it's a
// function at expand time — that error path is observable.

function readChildAsRender<T>(props: TemplateProps): (entries: T) => unknown {
  const render = (props as Record<string, unknown>).children;
  // We intentionally do not throw here on non-functions; the resolver
  // produces a clearer, observable error. Cast through `unknown` so the
  // IR stays typed.
  return render as unknown as (entries: T) => unknown;
}

export function bibDataNode(props: TemplateProps): BibDataNode {
  return {
    kind: "bib-data",
    render: readChildAsRender<BibDataEntry[]>(props)
  };
}

export function tocDataNode(props: TemplateProps): TocDataNode {
  return {
    kind: "toc-data",
    render: readChildAsRender<TocDataEntry[]>(props)
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
    render: readChildAsRender<ListOfDataEntry[]>(props)
  };
}

export function indexDataNode(props: TemplateProps): IndexDataNode {
  return {
    kind: "index-data",
    render: readChildAsRender<IndexDataEntry[]>(props)
  };
}

// `<bib-entry-content>` lives on the content side. See
// src/content/factories.ts.
