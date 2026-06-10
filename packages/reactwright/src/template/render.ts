import Reconciler from "react-reconciler";
import type { ReactNode } from "react";

import { templateHostConfig, type TemplateContainer } from "./host-config.js";
import type { PageNode, TemplateNode } from "./ir.js";

// Module-level reconciler instance. The reconciler itself holds no
// per-render mutable state — each render passes a fresh `container`
// object and gets its own root fiber — so this is safely re-entrant.
// Slice 6.2 (data-source primitives) relies on this: a `<bib-data>`
// resolver case re-enters the reconciler with the result of the
// render-prop child, which may itself contain further template JSX.
const templateReconciler = Reconciler(templateHostConfig);

function renderToContainer(node: ReactNode): TemplateContainer {
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

  return container;
}

// Render a React node tree authored against the template JSX
// vocabulary into the template IR (PageNode). The resolver consumes
// this IR alongside the content IR.
export function renderTemplateToIR(node: ReactNode): PageNode {
  const container = renderToContainer(node);
  throwIfContainerErrors(container);

  if (container.root == null) {
    throw new Error("Template renderer produced no root node.");
  }

  if (container.root.kind !== "page") {
    throw new Error("Template renderer expected a `page` root.");
  }

  return container.root;
}

// Re-entrant variant: renders a React subtree into a flat list of
// top-level template IR nodes, without requiring a `<page>` root. Used
// by the resolver to expand data-source primitives (<bib-data>, etc.)
// — the render-prop child returns arbitrary template JSX which must be
// turned into TemplateNodes for the resolver to walk.
export function renderTemplateFragmentToIR(node: ReactNode): TemplateNode[] {
  const container = renderToContainer(node);
  throwIfContainerErrors(container);
  return container.children;
}

// react-reconciler catches sync throws from createInstance and aborts
// the commit. The host config stashes those errors on the container;
// surface them here so authors see the real cause instead of a
// useless "produced no root node" downstream.
function throwIfContainerErrors(container: TemplateContainer): void {
  const errs = container.errors;
  if (errs == null || errs.length === 0) return;
  if (errs.length === 1) throw errs[0];
  const message = errs.map((e, i) => `[${i + 1}] ${e.message}`).join("\n");
  throw new Error(`Template renderer encountered ${errs.length} errors:\n${message}`);
}

export type { PageNode, TemplateNode };
