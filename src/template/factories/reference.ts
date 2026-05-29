import { mergeTemplateStyleGroups, type TemplateProps } from "../prop-readers.js";
import type {
  BibliographyEntry,
  BibliographyNode,
  IndexTemplateNode,
  ListOfKind,
  ListOfNode,
  TocNode
} from "../ir.js";

export function bibliographyNode(props: TemplateProps): BibliographyNode {
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

export function tocNode(props: TemplateProps): TocNode {
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

export function listOfNode(props: TemplateProps): ListOfNode {
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

export function indexTemplateNode(props: TemplateProps): IndexTemplateNode {
  const titleProp = (props as Record<string, unknown>).title;
  const title = typeof titleProp === "string" ? titleProp : undefined;
  return {
    kind: "index-template",
    ...(title != null ? { title } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}
