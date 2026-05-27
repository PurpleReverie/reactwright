import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";

import type {
  CellNode,
  CodeBlockNode,
  CodeNode,
  DocumentChild,
  DocumentNode,
  EmNode,
  FigureNode,
  LinkNode,
  ListItemNode,
  ListNode,
  PageBreakNode,
  ParagraphNode,
  RowNode,
  SemanticBlockChild,
  SemanticContainerNode,
  SemanticNode,
  SetRunningNode,
  StrongNode,
  TableNode,
  TextNode
} from "./ir.js";

type HostContext = {
  scope: "content";
};

type ContentProps = Record<string, unknown> & {
  title?: string;
  author?: string;
  ordered?: boolean;
  src?: string;
  alt?: string;
  caption?: string;
  width?: string;
  header?: boolean;
  href?: string;
  titleText?: string;
  language?: string;
  role?: string;
  page?: string;
  variant?: string;
  speaker?: string;
  running?: string;
  value?: string;
};

type ContentContainer = {
  root: SemanticNode | null;
  children: SemanticNode[];
};

function readOptionalTokenProp(props: ContentProps, key: "role" | "page" | "variant" | "speaker"): string | undefined {
  const value = props[key];
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string when provided.`);
  }

  return value.trim();
}

function createContentNode(type: string, props: ContentProps): SemanticNode {
  const role = readOptionalTokenProp(props, "role");
  const page = readOptionalTokenProp(props, "page");
  const variant = readOptionalTokenProp(props, "variant");
  const speaker = readOptionalTokenProp(props, "speaker");

  switch (type) {
    case "document":
      return {
        kind: "document",
        title: String(props.title ?? ""),
        ...(typeof props.author === "string" ? { author: props.author } : {}),
        children: []
      };
    case "abstract":
      return {
        kind: "abstract",
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        children: []
      };
    case "section":
      return {
        kind: "section",
        title: String(props.title ?? ""),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        children: []
      };
    case "p":
      return {
        kind: "paragraph",
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        children: []
      };
    case "figure":
      return {
        kind: "figure",
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        src: String(props.src ?? ""),
        alt: typeof props.alt === "string" ? props.alt : undefined,
        caption: typeof props.caption === "string" ? props.caption : undefined,
        width: typeof props.width === "string" ? props.width : undefined
      } as FigureNode;
    case "table":
      return {
        kind: "table",
        caption: typeof props.caption === "string" ? props.caption : undefined,
        children: []
      } satisfies TableNode;
    case "row":
      return {
        kind: "row",
        children: []
      } satisfies RowNode;
    case "cell":
      return {
        kind: "cell",
        header: props.header === true ? true : undefined,
        children: []
      } satisfies CellNode;
    case "quote":
      return {
        kind: "blockquote",
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        ...(speaker != null ? { speaker } : {}),
        children: []
      };
    case "code-block":
      return {
        kind: "code-block",
        ...(typeof props.language === "string" && props.language.trim().length > 0
          ? { language: props.language.trim() }
          : {}),
        children: []
      } satisfies CodeBlockNode;
    case "pre":
      return {
        kind: "pre",
        children: []
      };
    case "list":
      return {
        kind: "list",
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        ordered: Boolean(props.ordered),
        children: []
      };
    case "item":
      return {
        kind: "item",
        children: []
      };
    case "em":
      return {
        kind: "em",
        children: []
      };
    case "strong":
      return {
        kind: "strong",
        children: []
      };
    case "code":
      return {
        kind: "code",
        children: []
      };
    case "br":
      return { kind: "br" };
    case "img": {
      const src = typeof props.src === "string" ? props.src.trim() : "";
      if (src.length === 0) {
        throw new Error("`img` requires a non-empty `src`.");
      }
      return {
        kind: "img",
        src,
        ...(typeof props.alt === "string" ? { alt: props.alt } : {}),
        ...(typeof props.width === "string" ? { width: props.width } : {}),
        ...(typeof (props as Record<string, unknown>).height === "string"
          ? { height: (props as Record<string, unknown>).height as string }
          : {})
      };
    }
    case "sub":
      return {
        kind: "sub",
        children: []
      };
    case "sup":
      return {
        kind: "sup",
        children: []
      };
    case "link":
      if (typeof props.href !== "string" || props.href.trim().length === 0) {
        throw new Error("`link` requires a non-empty `href`.");
      }
      return {
        kind: "link",
        href: props.href.trim(),
        ...(typeof props.titleText === "string" && props.titleText.trim().length > 0
          ? { title: props.titleText.trim() }
          : {}),
        children: []
      } satisfies LinkNode;
    case "page-break":
      return {
        kind: "page-break"
      } satisfies PageBreakNode;
    case "set": {
      const name = typeof props.running === "string" ? props.running.trim() : "";
      const value = typeof props.value === "string" ? props.value : "";
      if (name.length === 0) {
        throw new Error("`set` requires a non-empty `running` name.");
      }
      return {
        kind: "set-running",
        name,
        value
      } satisfies SetRunningNode;
    }
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
      if (
        child.kind !== "text" &&
        child.kind !== "em" &&
        child.kind !== "strong" &&
        child.kind !== "code" &&
        child.kind !== "link" &&
        child.kind !== "br" &&
        child.kind !== "sub" &&
        child.kind !== "sup" &&
        child.kind !== "img"
      ) {
        throw new Error("`p` may only contain inline primitives.");
      }
      parent.children.push(child);
      return;
    case "figure":
      throw new Error("`figure` may not contain child nodes.");
    case "table":
      if (child.kind !== "row") {
        throw new Error("`table` may only contain `row` children.");
      }
      parent.children.push(child);
      return;
    case "row":
      if (child.kind !== "cell") {
        throw new Error("`row` may only contain `cell` children.");
      }
      parent.children.push(child);
      return;
    case "cell":
      if (
        child.kind !== "paragraph" &&
        child.kind !== "figure" &&
        child.kind !== "blockquote" &&
        child.kind !== "list" &&
        child.kind !== "code-block" &&
        child.kind !== "pre" &&
        child.kind !== "page-break" &&
        child.kind !== "set-running"
      ) {
        throw new Error("`cell` may only contain block primitives.");
      }
      parent.children.push(child);
      return;
    case "em":
    case "strong":
    case "link":
    case "sub":
    case "sup":
      if (
        child.kind !== "text" &&
        child.kind !== "em" &&
        child.kind !== "strong" &&
        child.kind !== "code" &&
        child.kind !== "link" &&
        child.kind !== "br" &&
        child.kind !== "sub" &&
        child.kind !== "sup" &&
        child.kind !== "img"
      ) {
        throw new Error(`\`${parent.kind}\` may only contain inline primitives.`);
      }
      parent.children.push(child);
      return;
    case "code":
      if (child.kind !== "text") {
        throw new Error("`code` may only contain text.");
      }
      parent.children.push(child);
      return;
    case "code-block":
      if (child.kind !== "text") {
        throw new Error("`code-block` may only contain text.");
      }
      parent.children.push(child);
      return;
    case "pre":
      if (child.kind !== "text") {
        throw new Error("`pre` may only contain text.");
      }
      parent.children.push(child);
      return;
    case "list":
      if (child.kind !== "item") {
        throw new Error("`list` may only contain `item` children.");
      }
      parent.children.push(child);
      return;
    case "item":
      if (
        child.kind !== "paragraph" &&
        child.kind !== "figure" &&
        child.kind !== "table" &&
        child.kind !== "blockquote" &&
        child.kind !== "list" &&
        child.kind !== "code-block" &&
        child.kind !== "pre" &&
        child.kind !== "page-break" &&
        child.kind !== "set-running"
      ) {
        throw new Error("`item` may only contain block primitives.");
      }
      parent.children.push(child);
      return;
    case "document":
      if (
        child.kind !== "abstract" &&
        child.kind !== "section" &&
        child.kind !== "paragraph" &&
        child.kind !== "figure" &&
        child.kind !== "table" &&
        child.kind !== "blockquote" &&
        child.kind !== "list" &&
        child.kind !== "code-block" &&
        child.kind !== "pre" &&
        child.kind !== "page-break" &&
        child.kind !== "set-running"
      ) {
        throw new Error("`document` may only contain document-level block primitives.");
      }
      parent.children.push(child as DocumentChild);
      return;
    case "abstract":
    case "section":
    case "blockquote":
      if (
        child.kind !== "section" &&
        child.kind !== "paragraph" &&
        child.kind !== "figure" &&
        child.kind !== "table" &&
        child.kind !== "blockquote" &&
        child.kind !== "list" &&
        child.kind !== "code-block" &&
        child.kind !== "pre" &&
        child.kind !== "page-break" &&
        child.kind !== "set-running"
      ) {
        throw new Error(`\`${parent.kind}\` may only contain block primitives.`);
      }
      parent.children.push(child as SemanticBlockChild);
      return;
  }
}

function appendChildToContainerNode(container: ContentContainer, child: SemanticNode): void {
  if (isWhitespaceOnlyText(child)) {
    return;
  }

  container.children.push(child);
  if (container.root == null) {
    container.root = child;
  }
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
  createInstance(type: string, props: ContentProps): SemanticNode {
    return createContentNode(type, props);
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
  resetTextContent(instance: ParagraphNode | EmNode | StrongNode | CodeNode): void {
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
