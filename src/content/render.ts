import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";

import type {
  AbstractNode,
  DocumentNode,
  ParagraphNode,
  SectionNode,
  SemanticChild,
  SemanticContainerNode,
  SemanticNode,
  TextNode
} from "./ir.js";

type HostContext = {
  scope: "content";
};

type ContentProps = Record<string, unknown> & {
  title?: string;
  author?: string;
};

type ContentContainer = {
  root: SemanticNode | null;
  children: SemanticNode[];
};

function createContainerNode(type: string, props: ContentProps): SemanticContainerNode {
  switch (type) {
    case "document":
      return {
        kind: "document",
        title: String(props.title ?? ""),
        author: typeof props.author === "string" ? props.author : undefined,
        children: []
      };
    case "abstract":
      return {
        kind: "abstract",
        children: []
      };
    case "section":
      return {
        kind: "section",
        title: String(props.title ?? ""),
        children: []
      };
    case "paragraph":
      return {
        kind: "paragraph",
        children: []
      };
    default:
      throw new Error(`Unsupported content intrinsic: ${type}`);
  }
}

function isWhitespaceOnlyText(node: SemanticNode): boolean {
  return node.kind === "text" && node.value.trim().length === 0;
}

function appendSemanticChild(parent: SemanticContainerNode, child: SemanticNode): void {
  if (isWhitespaceOnlyText(child)) {
    return;
  }

  switch (parent.kind) {
    case "paragraph":
      if (child.kind !== "text") {
        throw new Error("`paragraph` may only contain text in v0.");
      }
      parent.children.push(child);
      return;
    case "document":
    case "abstract":
    case "section":
      parent.children.push(child as SemanticChild);
      return;
  }
}

function appendChildToContainerNode(container: ContentContainer, child: SemanticNode): void {
  if (isWhitespaceOnlyText(child)) {
    return;
  }

  container.children.push(child);
  container.root = child;
}

function insertBeforeInList<T>(items: T[], child: T, beforeChild: T): void {
  const existingIndex = items.indexOf(child);
  if (existingIndex >= 0) {
    items.splice(existingIndex, 1);
  }

  const beforeIndex = items.indexOf(beforeChild);
  if (beforeIndex === -1) {
    items.push(child);
    return;
  }

  items.splice(beforeIndex, 0, child);
}

const contentHostConfig = {
  rendererPackageName: "reactdoc-content",
  rendererVersion: "0.0.0",
  supportsMutation: true,
  isPrimaryRenderer: false,
  supportsPersistence: false,
  supportsHydration: false,
  supportsMicrotasks: true,
  noTimeout: -1,
  warnsIfNotActing: false,
  now: Date.now,
  getRootHostContext(): HostContext {
    return { scope: "content" };
  },
  getChildHostContext(parentHostContext: HostContext): HostContext {
    return parentHostContext;
  },
  prepareForCommit(): null {
    return null;
  },
  resetAfterCommit(): void {},
  preparePortalMount(): void {},
  getPublicInstance(instance: SemanticNode): SemanticNode {
    return instance;
  },
  createInstance(type: string, props: ContentProps): SemanticContainerNode {
    return createContainerNode(type, props);
  },
  appendInitialChild(parent: SemanticContainerNode, child: SemanticNode): void {
    appendSemanticChild(parent, child);
  },
  finalizeInitialChildren(): boolean {
    return false;
  },
  shouldSetTextContent(): boolean {
    return false;
  },
  createTextInstance(text: string): TextNode {
    return {
      kind: "text",
      value: text
    };
  },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  scheduleMicrotask: queueMicrotask,
  setCurrentUpdatePriority(): void {},
  getCurrentUpdatePriority(): number {
    return DefaultEventPriority;
  },
  resolveUpdatePriority(): number {
    return DefaultEventPriority;
  },
  getCurrentEventPriority(): number {
    return DefaultEventPriority;
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
  commitUpdate(): void {},
  commitTextUpdate(textInstance: TextNode, _oldText: string, newText: string): void {
    textInstance.value = newText;
  },
  resetTextContent(instance: ParagraphNode): void {
    instance.children = [];
  },
  prepareUpdate(): null {
    return null;
  },
  hideInstance(): void {},
  hideTextInstance(): void {},
  unhideInstance(): void {},
  unhideTextInstance(): void {},
  maySuspendCommit(): boolean {
    return false;
  },
  detachDeletedInstance(): void {}
};

const contentReconciler = Reconciler(contentHostConfig);

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
