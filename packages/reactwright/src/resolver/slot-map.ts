import {
  resolveContentChild,
  resolveSectionNode
} from "./block.js";
import type {
  DocumentNode,
  SectionNode
} from "../content/ir.js";

import type { SlotMap } from "./context.js";
import type {
  ResolvedAuthorNode,
  ResolvedTitleNode
} from "./ir.js";

export function buildSlotMap(document: DocumentNode): SlotMap {
  const title: ResolvedTitleNode[] = [
    {
      kind: "title",
      value: document.title
    }
  ];

  const author: ResolvedAuthorNode[] =
    typeof document.author === "string"
      ? [
          {
            kind: "author",
            value: document.author
          }
        ]
      : [];

  // Slice 6.5: the abstract slot is now routed by role, not by a
  // dedicated engine intrinsic. `<section role="abstract">` populates
  // `slots.abstract`; all other document children flow into `slots.body`.
  const abstract = document.children
    .filter((child): child is SectionNode => child.kind === "section" && child.role === "abstract")
    .map((child) => resolveSectionNode(child));

  const body = document.children
    .filter((child) => !(child.kind === "section" && child.role === "abstract"))
    .map(resolveContentChild);

  return {
    title,
    author,
    abstract,
    body
  };
}
