import Reconciler from "react-reconciler";
import type { ReactNode } from "react";

import { contentHostConfig, type ContentContainer } from "./host-config.js";
import type { DocumentNode, SemanticNode } from "./ir.js";

const contentReconciler = Reconciler(contentHostConfig);

// Render a React node tree authored against the content JSX vocabulary
// into the semantic IR (DocumentNode). The resolver consumes this IR
// alongside the template IR.
export function renderContentToIR(node: ReactNode): DocumentNode {
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

  if (container.root == null) {
    throw new Error("Content renderer produced no root node.");
  }

  if (container.root.kind !== "document") {
    throw new Error("Content renderer expected a `document` root.");
  }

  return container.root;
}

export type { DocumentNode, SemanticNode };
