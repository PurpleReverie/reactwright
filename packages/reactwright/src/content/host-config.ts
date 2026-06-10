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
      list.push(err instanceof Error ? err : new Error(String(err)));
      // Stub so reconciliation completes; renderContentToIR rethrows.
      return { kind: "text", value: "" };
    }
  },
  appendInitialChild(parent: SemanticContainerNode, child: SemanticNode): void {
    appendSemanticChild(parent, child);
  },
  createTextInstance(text: string): TextNode {
    return { kind: "text", value: text };
  },
  appendChild(parent: SemanticContainerNode, child: SemanticNode): void {
    appendSemanticChild(parent, child);
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
