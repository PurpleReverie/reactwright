import Reconciler from "react-reconciler";
import type { ReactNode } from "react";

import { templateHostConfig, type TemplateContainer } from "./host-config.js";
import type { PageNode, TemplateNode } from "./ir.js";

const templateReconciler = Reconciler(templateHostConfig);

// Render a React node tree authored against the template JSX
// vocabulary into the template IR (PageNode). The resolver consumes
// this IR alongside the content IR.
export function renderTemplateToIR(node: ReactNode): PageNode {
  const container: TemplateContainer = {
    root: null,
    children: []
  };

  const root = templateReconciler.createContainer(
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

  templateReconciler.updateContainerSync(node, root, null, null);
  templateReconciler.flushSyncWork();

  if (container.root == null) {
    throw new Error("Template renderer produced no root node.");
  }

  if (container.root.kind !== "page") {
    throw new Error("Template renderer expected a `page` root.");
  }

  return container.root;
}

export type { PageNode, TemplateNode };
