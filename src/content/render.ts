import Reconciler from "react-reconciler";
import type { ReactNode } from "react";

import { contentHostConfig, type ContentContainer } from "./host-config.js";
import type { DocumentNode, SemanticNode } from "./ir.js";

// Module-level reconciler instance. Holds no per-render mutable state —
// each render passes a fresh `container` object and gets its own root
// fiber — so this is safely re-entrant (verified for slice 6.3, mirrors
// the template reconciler's contract documented in
// `src/template/render.ts`).
const contentReconciler = Reconciler(contentHostConfig);

function renderToContainer(node: ReactNode): ContentContainer {
  const container: ContentContainer = {
    root: null,
    children: []
  };

  const root = contentReconciler.createContainer(
    container,
    0,
    null,
    false,
    null,
    "",
    () => {},
    () => {},
    () => {},
    null
  );

  contentReconciler.updateContainerSync(node, root, null, null);
  contentReconciler.flushSyncWork();
  return container;
}

// Render a React node tree authored against the content JSX vocabulary
// into the semantic IR (DocumentNode). The resolver consumes this IR
// alongside the template IR.
export function renderContentToIR(node: ReactNode): DocumentNode {
  const container = renderToContainer(node);

  if (container.root == null) {
    throw new Error("Content renderer produced no root node.");
  }

  if (container.root.kind !== "document") {
    throw new Error("Content renderer expected a `document` root.");
  }

  return container.root;
}

// Re-entrant variant: renders a React subtree into a flat list of
// top-level content IR nodes, without requiring a `<document>` root.
// Used by the resolver (slice 6.3, D1) to expand data-source primitives
// — the render-prop child returns content JSX which must be turned
// into SemanticNodes for the resolver to walk.
export function renderContentFragmentToIR(node: ReactNode): SemanticNode[] {
  const container = renderToContainer(node);
  return container.children;
}

export type { DocumentNode, SemanticNode };
