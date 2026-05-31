import { mergeTemplateStyleGroups, type TemplateProps } from "../prop-readers.js";
import type {
  BibDataEntry,
  BibDataNode,
  BibEntryContentNode,
  BibliographyEntry,
  BibliographyNode,
  IndexDataEntry,
  IndexDataNode,
  IndexTemplateNode,
  ListOfDataEntry,
  ListOfDataNode,
  ListOfKind,
  ListOfNode,
  TocDataEntry,
  TocDataNode,
  TocNode
} from "../ir.js";

// One-time deprecation-warning gate. Engine compound intrinsics
// (bibliography/toc/list-of/index) are slated for removal at v1.0;
// authors should migrate to userland helpers composed from data-source
// primitives (bib-data, toc-data, list-of-data, index-data) per
// docs/userland-compounds-plan.md.
const deprecatedCompoundsWarned = new Set<string>();
function warnDeprecatedCompound(name: string): void {
  if (deprecatedCompoundsWarned.has(name)) return;
  deprecatedCompoundsWarned.add(name);
  // eslint-disable-next-line no-console
  console.warn(
    `[reactwright] <${name}> is deprecated and will be removed at v1.0. ` +
      `Migrate to a userland helper using <${name === "bibliography" ? "bib" : name.replace("-", "")}-data> ` +
      `— see docs/userland-compounds-plan.md.`
  );
}

/**
 * @deprecated Engine compound primitive. Removed at v1.0. Migrate to a
 * userland helper composed from `<bib-data>` and engine primitives.
 * See `docs/userland-compounds-plan.md`.
 */
export function bibliographyNode(props: TemplateProps): BibliographyNode {
  warnDeprecatedCompound("bibliography");
  const rawEntries = (props as Record<string, unknown>).entries;
  let entries: BibliographyEntry[] | undefined;
  if (Array.isArray(rawEntries)) {
    // The template-prop entries form is the legacy path; content-side
    // <refs><ref-entry> wins when both are present (handled in the
    // resolver). Only well-shaped entries pass through.
    entries = rawEntries
      .filter(
        (entry): entry is BibliographyEntry =>
          entry != null &&
          typeof entry === "object" &&
          typeof (entry as BibliographyEntry).key === "string" &&
          typeof (entry as BibliographyEntry).text === "string"
      )
      .map((e) => ({ key: e.key, text: e.text }));
  }
  const titleProp = (props as Record<string, unknown>).title;
  const title = typeof titleProp === "string" ? titleProp : undefined;
  return {
    kind: "bibliography",
    ...(title != null ? { title } : {}),
    ...(entries != null ? { entries } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}

/**
 * @deprecated Engine compound primitive. Removed at v1.0. Migrate to a
 * userland helper composed from `<toc-data>` and engine primitives.
 * See `docs/userland-compounds-plan.md`.
 */
export function tocNode(props: TemplateProps): TocNode {
  warnDeprecatedCompound("toc");
  const titleProp = (props as Record<string, unknown>).title;
  const title = typeof titleProp === "string" ? titleProp : undefined;
  const depthRaw = (props as Record<string, unknown>).depth;
  const depth = typeof depthRaw === "number" && depthRaw > 0 ? depthRaw : undefined;
  const numbered = (props as Record<string, unknown>).numbered === true ? true : undefined;
  return {
    kind: "toc",
    ...(title != null ? { title } : {}),
    ...(depth != null ? { depth } : {}),
    ...(numbered != null ? { numbered } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}

/**
 * @deprecated Engine compound primitive. Removed at v1.0. Migrate to a
 * userland helper composed from `<list-of-data>` and engine primitives.
 * See `docs/userland-compounds-plan.md`.
 */
export function listOfNode(props: TemplateProps): ListOfNode {
  warnDeprecatedCompound("list-of");
  const ofRaw = (props as Record<string, unknown>).of;
  let of: ListOfKind;
  if (ofRaw === "figure" || ofRaw === "table" || ofRaw === "equation") {
    of = ofRaw;
  } else {
    throw new Error("`list-of` `of` must be `figure`, `table`, or `equation`.");
  }
  const titleProp = (props as Record<string, unknown>).title;
  const title = typeof titleProp === "string" ? titleProp : undefined;
  return {
    kind: "list-of",
    of,
    ...(title != null ? { title } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}

/**
 * @deprecated Engine compound primitive. Removed at v1.0. Migrate to a
 * userland helper composed from `<index-data>` and engine primitives.
 * See `docs/userland-compounds-plan.md`.
 */
export function indexTemplateNode(props: TemplateProps): IndexTemplateNode {
  warnDeprecatedCompound("index");
  const titleProp = (props as Record<string, unknown>).title;
  const title = typeof titleProp === "string" ? titleProp : undefined;
  return {
    kind: "index-template",
    ...(title != null ? { title } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}

// --- Slice 6.2: data-source primitives ------------------------------
//
// Each render-prop factory reads `props.children` as a function. React
// emits a "Functions are not valid as a React child" warning when the
// child reaches reconciliation, but the function survives in the props
// bag handed to `createInstance` and we capture it here.
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

export function bibEntryContentNode(props: TemplateProps): BibEntryContentNode {
  // The JSX prop is `for` (matches html-author intuition); we rename to
  // `refKey` internally to dodge the JS reserved word.
  const raw = (props as Record<string, unknown>).for;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("`bib-entry-content` requires a non-empty `for` prop.");
  }
  return {
    kind: "bib-entry-content",
    refKey: raw.trim()
  };
}
