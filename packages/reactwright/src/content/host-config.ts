import { createReconcilerHostConfigBase } from "../shared/reconciler-host-config.js";
import { insertBeforeInList } from "../shared/insert-before.js";

import { createContentNode, type ContentProps } from "./factories.js";
import { appendSemanticChild } from "./grammar.js";
import type {
  CodeNode,
  EmNode,
  ParagraphNode,
  SemanticContainerNode,
  SemanticNode,
  StrongNode,
  TextNode
} from "./ir.js";

export type ContentContainer = {
  root: SemanticNode | null;
  children: SemanticNode[];
  // react-reconciler swallows sync errors thrown from createInstance
  // and aborts the commit silently — the symptom is a useless
  // "produced no root node" downstream. We catch errors here so the
  // top-level renderer can rethrow them with the author's actual
  // mistake (e.g. "Unsupported content intrinsic: div").
  errors?: Error[];
};

function appendChildToContainerNode(container: ContentContainer, child: SemanticNode): void {
  if (child.kind === "text" && child.value.trim().length === 0) {
    return;
  }
  container.children.push(child);
  if (container.root == null) {
    container.root = child;
  }
}

// Active container, set by `withActiveContainer` from render.ts for
// the duration of a single reconciler commit. The append* host-config
// methods that operate on intermediate parents (not the root
// container) need a way back to the container so they can stash any
// grammar-violation error and let the render orchestrator surface it
// later. Without this, react-reconciler silently swallows sync throws
// from appendChild / appendInitialChild and the user only sees the
// opaque "Content renderer produced no root node." — see RW-1/RW-2.
let activeContainer: ContentContainer | null = null;

export function withActiveContainer<T>(container: ContentContainer, fn: () => T): T {
  const prev = activeContainer;
  activeContainer = container;
  try {
    return fn();
  } finally {
    activeContainer = prev;
  }
}

function recordError(err: unknown): void {
  if (activeContainer == null) return;
  const list = activeContainer.errors ?? (activeContainer.errors = []);
  list.push(err instanceof Error ? err : new Error(String(err)));
}

function trapAppend(parent: SemanticContainerNode, child: SemanticNode): void {
  try {
    appendSemanticChild(parent, child);
  } catch (err) {
    const original = err instanceof Error ? err : new Error(String(err));
    // Mirror the createInstance shape so authors see the parent kind
    // and the offending child kind alongside the grammar rule's own
    // message. Grammar messages are written assuming this context
    // (e.g. "`list` may only contain `item` children.").
    const wrapped = new Error(
      `[reactwright] <${parent.kind}> > <${child.kind}>: ${original.message}`
    );
    (wrapped as Error & { cause?: unknown }).cause = original;
    recordError(wrapped);
  }
}

// Reconciler host config for the content tree. The boilerplate
// (lifecycle hooks, priority/scheduling) comes from the shared base.
// What's content-specific is below: createInstance dispatches to the
// factories, createTextInstance builds a TextNode, and the
// append/insert/remove plumbing routes through the grammar table.
export const contentHostConfig = {
  ...createReconcilerHostConfigBase("content"),
  getPublicInstance(instance: SemanticNode): SemanticNode {
    return instance;
  },
  createInstance(
    type: string,
    props: ContentProps,
    rootContainer: ContentContainer
  ): SemanticNode {
    try {
      return createContentNode(type, props);
    } catch (err) {
      const list = rootContainer.errors ?? (rootContainer.errors = []);
      const original = err instanceof Error ? err : new Error(String(err));
      // Prefix with the offending intrinsic so users see *which*
      // element produced the failure even when the original message is
      // generic ("requires a non-empty `title`"). React doesn't expose
      // _source / _owner on props passed to host configs, so we lean
      // on the intrinsic name as the locator.
      const wrapped = new Error(`[reactwright] <${type}>: ${original.message}`);
      // Preserve the original cause for debuggers that surface it.
      (wrapped as Error & { cause?: unknown }).cause = original;
      list.push(wrapped);
      // Stub so reconciliation completes; renderContentToIR rethrows.
      return { kind: "text", value: "" };
    }
  },
  appendInitialChild(parent: SemanticContainerNode, child: SemanticNode): void {
    trapAppend(parent, child);
  },
  createTextInstance(text: string): TextNode {
    return { kind: "text", value: text };
  },
  appendChild(parent: SemanticContainerNode, child: SemanticNode): void {
    trapAppend(parent, child);
  },
  appendChildToContainer(container: ContentContainer, child: SemanticNode): void {
    appendChildToContainerNode(container, child);
  },
  insertBefore(parent: SemanticContainerNode, child: SemanticNode, beforeChild: SemanticNode): void {
    if ("children" in parent) {
      insertBeforeInList(parent.children as SemanticNode[], child, beforeChild);
    }
  },
  insertInContainerBefore(
    container: ContentContainer,
    child: SemanticNode,
    beforeChild: SemanticNode
  ): void {
    insertBeforeInList(container.children, child, beforeChild);
    container.root = container.children[0] ?? null;
  },
  removeChild(parent: SemanticContainerNode, child: SemanticNode): void {
    if ("children" in parent) {
      const nextChildren = (parent.children as SemanticNode[]).filter((entry) => entry !== child);
      parent.children.length = 0;
      parent.children.push(...(nextChildren as never[]));
    }
  },
  removeChildFromContainer(container: ContentContainer, child: SemanticNode): void {
    container.children = container.children.filter((entry) => entry !== child);
    container.root = container.children[0] ?? null;
  },
  clearContainer(container: ContentContainer): void {
    container.children = [];
    container.root = null;
  },
  commitTextUpdate(textInstance: TextNode, _oldText: string, newText: string): void {
    textInstance.value = newText;
  },
  resetTextContent(instance: ParagraphNode | EmNode | StrongNode | CodeNode): void {
    instance.children = [];
  }
};
