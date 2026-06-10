import {
  resolveContentChild,
  resolveSectionNode
} from "./block.js";
import { resolveInlineNode } from "./inline.js";
import type {
  DocumentNode,
  MetaNode,
  SectionNode
} from "../content/ir.js";

import type { SlotMap } from "./context.js";
import type {
  ResolvedAuthorNode,
  ResolvedContentNode,
  ResolvedMetaNode,
  ResolvedTitleNode
} from "./ir.js";

export function buildSlotMap(document: DocumentNode): SlotMap {
  const slots: SlotMap = {};

  slots.title = [
    {
      kind: "title",
      value: document.title
    } satisfies ResolvedTitleNode
  ];

  slots.author =
    typeof document.author === "string"
      ? [
          {
            kind: "author",
            value: document.author
          } satisfies ResolvedAuthorNode
        ]
      : [];

  // Slice 6.5: the abstract slot is now routed by role, not by a
  // dedicated engine intrinsic. `<section role="abstract">` populates
  // `slots.abstract`; all other document children flow into `slots.body`.
  // Meta entries are filtered out of body — they're slot routing, not
  // body content.
  slots.abstract = document.children
    .filter((child): child is SectionNode => child.kind === "section" && child.role === "abstract")
    .map((child) => resolveSectionNode(child));

  slots.body = document.children
    .filter((child) =>
      child.kind !== "meta" &&
      !(child.kind === "section" && child.role === "abstract")
    )
    .map((child) => resolveContentChild(child as Exclude<typeof child, MetaNode>));

  // <meta name="X"> entries populate slots[X]. Multiple <meta> with the
  // same name accumulate in document order. If `name` collides with a
  // canonical slot (e.g. <meta name="author">), the meta entries are
  // appended after the scalar-derived entry — letting authors stack
  // multiple authors on top of the back-compat scalar.
  for (const child of document.children) {
    if (child.kind !== "meta") continue;
    const resolved: ResolvedMetaNode = {
      kind: "meta",
      name: child.name,
      ...(child.className != null ? { className: child.className } : {}),
      children: child.children.map(resolveInlineNode)
    };
    const bucket: ResolvedContentNode[] = slots[child.name] ?? [];
    bucket.push(resolved);
    slots[child.name] = bucket;
  }

  return slots;
}
