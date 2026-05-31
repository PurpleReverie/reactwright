import type { ReactNode } from "react";

import { renderContentFragmentToIR } from "../content/render.js";
import type { SemanticBlockChild } from "../content/ir.js";

import { resolveContentChild } from "./block.js";
import { collectCiteKeysFromNode } from "./collect.js";
import type { ResolveContext } from "./context.js";
import type {
  ResolvedChild,
  ResolvedContentNode
} from "./ir.js";

// Helper for the data-source resolvers (slice 6.3, D1): re-enter the
// **content** reconciler on the React node returned from a render-prop,
// resolve each top-level content node, then post-process the resolved
// subtree to splice-replace `<bib-entry-content>` placeholders with
// the resolved inline children of the matching `<ref-entry>` (looked
// up via `ctx.refEntries`). The result fits `ResolvedChild[]` because
// `ResolvedContentNode` is a member of the `ResolvedChild` union.
export function expandRenderProp(
  reactNode: ReactNode,
  ctx: ResolveContext
): ResolvedChild[] {
  const subtree = renderContentFragmentToIR(reactNode);
  const resolved: ResolvedContentNode[] = subtree.map((node) =>
    resolveContentChild(node as SemanticBlockChild) as ResolvedContentNode
  );
  for (const node of resolved) substituteBibEntryContent(node, ctx);
  return resolved as unknown as ResolvedChild[];
}

// Walk a resolved content subtree and splice-replace every
// `<bib-entry-content>` placeholder (inline) with the resolved inline
// children of the matching `<ref-entry>`. Operates in-place on the
// arrays in each container node. Throws if the referenced refKey
// has no `<ref-entry>` in the document — mirrors the slice-6.2
// behaviour at observation time.
function substituteBibEntryContent(node: unknown, ctx: ResolveContext): void {
  if (node == null || typeof node !== "object") return;
  const obj = node as { children?: unknown[]; captionNode?: unknown };
  const kids = obj.children;
  if (Array.isArray(kids)) {
    // Reverse-iterate so splice-replace doesn't desync the loop.
    for (let i = kids.length - 1; i >= 0; i--) {
      const c = kids[i] as { kind?: string; refKey?: string } | null;
      if (c != null && c.kind === "bib-entry-content" && typeof c.refKey === "string") {
        const entry = ctx.refEntries.get(c.refKey);
        if (entry == null) {
          throw new Error(
            `<bib-entry-content for="${c.refKey}" /> has no matching <ref-entry refKey="${c.refKey}" />.`
          );
        }
        // Forbid `<cite>` inside a substituted body — the cite-key
        // collection ran before this resolver, so any nested cite
        // would not register downstream. Mirrors slice-6.2 behaviour.
        const found = new Set<string>();
        for (const ic of entry.children) collectCiteKeysFromNode(ic, found);
        if (found.size > 0) {
          throw new Error(
            `<bib-entry-content for="${c.refKey}" /> body contains a <cite> — cites inside a ref-entry would not register against the bibliography. Move the cite to body content.`
          );
        }
        // Splice in the resolved inline children. The placeholder
        // node sits in an inline context (paragraph/em/…), so the
        // resolved-inline kinds are valid replacements.
        kids.splice(i, 1, ...entry.children);
      } else {
        substituteBibEntryContent(c, ctx);
      }
    }
  }
  if (obj.captionNode != null) substituteBibEntryContent(obj.captionNode, ctx);
}

// Render-prop is captured by the factory without a type check (see
// reference.ts:readChildAsRender). The resolver enforces the contract
// here, at expand time, so the error surfaces cleanly instead of being
// swallowed by React's commit-phase error handling.
export function assertRenderFn(value: unknown, kind: string): void {
  if (typeof value !== "function") {
    throw new Error(
      `<${kind}> requires a function child of the form (entries) => JSX.`
    );
  }
}

export function buildBibDataEntries(ctx: ResolveContext): {
  key: string;
  used: boolean;
  text?: string;
}[] {
  // Same merge order as the engine `<bibliography>` case: content-side
  // <ref-entry> first (no `text`, body lives in ctx.refEntries), then
  // cite-only placeholders. The template-prop `entries={...}` path
  // doesn't apply here — userland helpers compose data via JSX.
  const seen = new Set<string>();
  const result: { key: string; used: boolean; text?: string }[] = [];
  for (const [key] of ctx.refEntries) {
    seen.add(key);
    result.push({ key, used: ctx.citeKeys.has(key) });
  }
  for (const key of ctx.citeKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ key, used: true, text: key });
  }
  return result;
}
