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
  term?: string;
  level?: number;
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

function readOptionalIdProp(props: ContentProps): string | undefined {
  const value = (props as Record<string, unknown>).id;
  if (value == null) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("`id` must be a non-empty string when provided.");
  }
  return value.trim();
}

function createContentNode(type: string, props: ContentProps): SemanticNode {
  const role = readOptionalTokenProp(props, "role");
  const page = readOptionalTokenProp(props, "page");
  const variant = readOptionalTokenProp(props, "variant");
  const speaker = readOptionalTokenProp(props, "speaker");
  const id = readOptionalIdProp(props);

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
        ...(id != null ? { id } : {}),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        children: []
      };
    case "heading": {
      const rawLevel = (props as Record<string, unknown>).level;
      const level = typeof rawLevel === "number" ? rawLevel : 1;
      if (![1, 2, 3, 4, 5, 6].includes(level)) {
        throw new Error("`heading` `level` must be 1-6.");
      }
      const title = typeof props.title === "string" ? props.title : "";
      if (title.length === 0) {
        throw new Error("`heading` requires a non-empty `title`.");
      }
      return {
        kind: "heading",
        level: level as 1 | 2 | 3 | 4 | 5 | 6,
        title,
        ...(id != null ? { id } : {}),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {})
      };
    }
    case "p":
      return {
        kind: "paragraph",
        ...(id != null ? { id } : {}),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        children: []
      };
    case "figure":
      return {
        kind: "figure",
        ...(id != null ? { id } : {}),
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
        ...(id != null ? { id } : {}),
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
        ...(id != null ? { id } : {}),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        ...(speaker != null ? { speaker } : {}),
        children: []
      };
    case "code-block":
      return {
        kind: "code-block",
        ...(id != null ? { id } : {}),
        ...(typeof props.language === "string" && props.language.trim().length > 0
          ? { language: props.language.trim() }
          : {}),
        children: []
      } satisfies CodeBlockNode;
    case "pre":
      return {
        kind: "pre",
        ...(id != null ? { id } : {}),
        children: []
      };
    case "list":
      return {
        kind: "list",
        ...(id != null ? { id } : {}),
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
    case "defs":
      return {
        kind: "defs",
        ...(id != null ? { id } : {}),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {}),
        children: []
      };
    case "def": {
      const term = typeof props.term === "string" ? props.term.trim() : "";
      if (term.length === 0) {
        throw new Error("`def` requires a non-empty `term`.");
      }
      return {
        kind: "def",
        term,
        children: []
      };
    }
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
    case "footnote": {
      const marker = typeof (props as Record<string, unknown>).marker === "string"
        ? ((props as Record<string, unknown>).marker as string)
        : undefined;
      return {
        kind: "footnote",
        ...(marker != null ? { marker } : {}),
        children: []
      };
    }
    case "sidenote":
      return {
        kind: "sidenote",
        children: []
      };
    case "refs":
      return {
        kind: "refs",
        children: []
      };
    case "ref-entry": {
      const refKey = typeof (props as Record<string, unknown>).refKey === "string"
        ? ((props as Record<string, unknown>).refKey as string).trim()
        : (typeof (props as Record<string, unknown>)["key"] === "string"
            ? ((props as Record<string, unknown>)["key"] as string).trim()
            : "");
      if (refKey.length === 0) {
        throw new Error("`ref-entry` requires a non-empty `refKey` (or `key`).");
      }
      return {
        kind: "ref-entry",
        refKey,
        children: []
      };
    }
    case "ref": {
      const to = typeof (props as Record<string, unknown>).to === "string"
        ? ((props as Record<string, unknown>).to as string).trim()
        : "";
      if (to.length === 0) {
        throw new Error("`ref` requires a non-empty `to`.");
      }
      const showRaw = (props as Record<string, unknown>).show;
      let show: "number" | "page" | "title" | "number-and-page" | undefined;
      if (showRaw != null) {
        if (showRaw === "number" || showRaw === "page" || showRaw === "title" || showRaw === "number-and-page") {
          show = showRaw;
        } else {
          throw new Error("`ref` `show` must be `number`, `page`, `title`, or `number-and-page`.");
        }
      }
      return {
        kind: "ref",
        to,
        ...(show != null ? { show } : {})
      };
    }
    case "math": {
      const src = typeof (props as Record<string, unknown>).src === "string"
        ? ((props as Record<string, unknown>).src as string)
        : "";
      if (src.length === 0) {
        throw new Error("`math` requires a non-empty `src` TeX string.");
      }
      return {
        kind: "math",
        src,
        ...(id != null ? { id } : {}),
        ...(role != null ? { role } : {}),
        ...(page != null ? { page } : {}),
        ...(variant != null ? { variant } : {})
      };
    }
    case "m": {
      const src = typeof (props as Record<string, unknown>).src === "string"
        ? ((props as Record<string, unknown>).src as string)
        : "";
      if (src.length === 0) {
        throw new Error("`m` requires a non-empty `src` TeX string.");
      }
      return { kind: "m", src };
    }
    case "cite": {
      const key = typeof (props as Record<string, unknown>).cite === "string"
        ? ((props as Record<string, unknown>).cite as string).trim()
        : "";
      if (key.length === 0) {
        throw new Error("`cite` requires a non-empty `cite` key.");
      }
      return { kind: "cite", cite: key };
    }
    case "index": {
      const term = typeof (props as Record<string, unknown>).term === "string"
        ? ((props as Record<string, unknown>).term as string).trim()
        : "";
      if (term.length === 0) {
        throw new Error("`index` requires a non-empty `term`.");
      }
      return { kind: "index", term };
    }
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
        child.kind !== "img" &&
        child.kind !== "ref" &&
        child.kind !== "footnote" &&
        child.kind !== "m" &&
        child.kind !== "cite" &&
        child.kind !== "index" &&
        child.kind !== "sidenote"
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
        child.kind !== "defs" &&
        child.kind !== "heading" &&
        child.kind !== "math" &&
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
    case "footnote":
    case "sidenote":
      if (
        child.kind !== "text" &&
        child.kind !== "em" &&
        child.kind !== "strong" &&
        child.kind !== "code" &&
        child.kind !== "link" &&
        child.kind !== "br" &&
        child.kind !== "sub" &&
        child.kind !== "sup" &&
        child.kind !== "img" &&
        child.kind !== "ref" &&
        child.kind !== "footnote" &&
        child.kind !== "m" &&
        child.kind !== "cite" &&
        child.kind !== "index" &&
        child.kind !== "sidenote"
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
    case "refs":
      if (child.kind !== "ref-entry") {
        throw new Error("`refs` may only contain `ref-entry` children.");
      }
      parent.children.push(child);
      return;
    case "ref-entry":
      if (
        child.kind !== "text" &&
        child.kind !== "em" &&
        child.kind !== "strong" &&
        child.kind !== "code" &&
        child.kind !== "link" &&
        child.kind !== "br" &&
        child.kind !== "sub" &&
        child.kind !== "sup"
      ) {
        throw new Error("`ref-entry` may only contain inline primitives.");
      }
      parent.children.push(child);
      return;
    case "defs":
      if (child.kind !== "def") {
        throw new Error("`defs` may only contain `def` children.");
      }
      parent.children.push(child);
      return;
    case "def":
      if (
        child.kind !== "paragraph" &&
        child.kind !== "figure" &&
        child.kind !== "table" &&
        child.kind !== "blockquote" &&
        child.kind !== "list" &&
        child.kind !== "code-block" &&
        child.kind !== "pre" &&
        child.kind !== "defs" &&
        child.kind !== "heading" &&
        child.kind !== "math" &&
        child.kind !== "page-break" &&
        child.kind !== "set-running"
      ) {
        throw new Error("`def` may only contain block primitives.");
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
        child.kind !== "defs" &&
        child.kind !== "heading" &&
        child.kind !== "math" &&
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
        child.kind !== "defs" &&
        child.kind !== "heading" &&
        child.kind !== "math" &&
        child.kind !== "refs" &&
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
        child.kind !== "defs" &&
        child.kind !== "heading" &&
        child.kind !== "math" &&
        child.kind !== "refs" &&
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
