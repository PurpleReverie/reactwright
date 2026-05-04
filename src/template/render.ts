import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";
import { getTemplateIntrinsic } from "./registry.js";

import type {
  BoxNode,
  CustomTemplateNode,
  PageNode,
  SlotName,
  SlotNode,
  StackNode,
  TemplateChild,
  TemplateContainerNode,
  TemplateNode,
  TemplateStyle,
  TemplateTextNode
} from "./ir.js";

type HostContext = {
  scope: "template";
};

type TemplateProps = Record<string, unknown> & {
  style?: TemplateStyle;
  gap?: string;
  name?: string;
};

type TemplateContainer = {
  root: TemplateNode | null;
  children: TemplateNode[];
};

function createTemplateNode(type: string, props: TemplateProps): TemplateNode {
  switch (type) {
    case "page":
      return {
        kind: "page",
        style: props.style,
        children: []
      };
    case "box":
      return {
        kind: "box",
        style: props.style,
        children: []
      };
    case "stack":
      return {
        kind: "stack",
        gap: typeof props.gap === "string" ? props.gap : undefined,
        style: props.style,
        children: []
      };
    case "slot":
      return {
        kind: "slot",
        name: validateSlotName(props.name)
      };
    default:
      if (getTemplateIntrinsic(type) != null) {
        const { children: _children, ...restProps } = props;
        return {
          kind: "custom",
          name: type,
          props: restProps,
          style: props.style,
          children: []
        };
      }
      throw new Error(`Unsupported template intrinsic: ${type}`);
  }
}

function validateSlotName(name: unknown): SlotName {
  if (name === "title" || name === "author" || name === "abstract" || name === "body") {
    return name;
  }

  throw new Error(`Unsupported template slot: ${String(name)}`);
}

function isWhitespaceOnlyText(node: TemplateNode): boolean {
  return node.kind === "text" && node.value.trim().length === 0;
}

function appendTemplateChild(parent: TemplateContainerNode, child: TemplateNode): void {
  if (isWhitespaceOnlyText(child)) {
    return;
  }

  parent.children.push(child as TemplateChild);
}

function appendChildToTemplateContainer(container: TemplateContainer, child: TemplateNode): void {
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

const templateHostConfig = {
  rendererPackageName: "reactdoc-template",
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
    return { scope: "template" };
  },
  getChildHostContext(parentHostContext: HostContext): HostContext {
    return parentHostContext;
  },
  prepareForCommit(): null {
    return null;
  },
  resetAfterCommit(): void {},
  preparePortalMount(): void {},
  getPublicInstance(instance: TemplateNode): TemplateNode {
    return instance;
  },
  createInstance(type: string, props: TemplateProps): TemplateNode {
    return createTemplateNode(type, props);
  },
  appendInitialChild(parent: TemplateContainerNode, child: TemplateNode): void {
    appendTemplateChild(parent, child);
  },
  finalizeInitialChildren(): boolean {
    return false;
  },
  shouldSetTextContent(): boolean {
    return false;
  },
  createTextInstance(text: string): TemplateTextNode {
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
  appendChild(parent: TemplateContainerNode, child: TemplateNode): void {
    appendTemplateChild(parent, child);
  },
  appendChildToContainer(container: TemplateContainer, child: TemplateNode): void {
    appendChildToTemplateContainer(container, child);
  },
  insertBefore(parent: TemplateContainerNode, child: TemplateNode, beforeChild: TemplateNode): void {
    insertBeforeInList(parent.children as TemplateNode[], child, beforeChild);
  },
  insertInContainerBefore(
    container: TemplateContainer,
    child: TemplateNode,
    beforeChild: TemplateNode
  ): void {
    insertBeforeInList(container.children, child, beforeChild);
    container.root = container.children[0] ?? null;
  },
  removeChild(parent: TemplateContainerNode, child: TemplateNode): void {
    const nextChildren = (parent.children as TemplateNode[]).filter((entry) => entry !== child);
    parent.children.length = 0;
    parent.children.push(...(nextChildren as never[]));
  },
  removeChildFromContainer(container: TemplateContainer, child: TemplateNode): void {
    container.children = container.children.filter((entry) => entry !== child);
    container.root = container.children[0] ?? null;
  },
  clearContainer(container: TemplateContainer): void {
    container.children = [];
    container.root = null;
  },
  commitUpdate(): void {},
  commitTextUpdate(textInstance: TemplateTextNode, _oldText: string, newText: string): void {
    textInstance.value = newText;
  },
  resetTextContent(instance: BoxNode | PageNode | StackNode | CustomTemplateNode): void {
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

const templateReconciler = Reconciler(templateHostConfig);

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
