import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";
import { getTemplateIntrinsic } from "./registry.js";

import type {
  CustomTemplateNode,
  FixedAnchor,
  FixedNode,
  FixedWhen,
  PageNode,
  PageNumberNode,
  PageRuleNode,
  PageSetNode,
  RegionNode,
  RoleRuleNode,
  RulesNode,
  SlotName,
  SlotNode,
  StackNode,
  TemplateBoxProps,
  TemplateBreaksProps,
  TemplateChild,
  TemplateContainerNode,
  TemplateLayoutProps,
  TemplateNode,
  TemplatePageProps,
  TemplateParagraphProps,
  TemplateStyle,
  TemplateTextNode,
  TemplateTypographyProps
} from "./ir.js";

type HostContext = {
  scope: "template";
};

type TemplateProps = Record<string, unknown> & {
  style?: TemplateStyle;
  page?: TemplatePageProps;
  typography?: TemplateTypographyProps;
  paragraph?: TemplateParagraphProps;
  box?: TemplateBoxProps;
  layout?: TemplateLayoutProps;
  breaks?: TemplateBreaksProps;
  gap?: string;
  name?: string;
  match?: string;
  apply?: string;
  on?: string;
  use?: string;
  anchor?: unknown;
  when?: unknown;
};

type TemplateContainer = {
  root: TemplateNode | null;
  children: TemplateNode[];
};

function readOptionalObjectProp<T extends Record<string, unknown>>(
  props: TemplateProps,
  key: "page" | "typography" | "paragraph" | "box" | "layout" | "breaks"
): T | undefined {
  const value = props[key];
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`\`${key}\` must be an object when provided.`);
  }

  return value as T;
}

function mergeTemplateStyleGroups(props: TemplateProps): TemplateStyle | undefined {
  const page = readOptionalObjectProp<TemplatePageProps>(props, "page");
  const typography = readOptionalObjectProp<TemplateTypographyProps>(props, "typography");
  const paragraph = readOptionalObjectProp<TemplateParagraphProps>(props, "paragraph");
  const box = readOptionalObjectProp<TemplateBoxProps>(props, "box");
  const layout = readOptionalObjectProp<TemplateLayoutProps>(props, "layout");
  const breaks = readOptionalObjectProp<TemplateBreaksProps>(props, "breaks");

  const merged: TemplateStyle = {
    ...(page ?? {}),
    ...(typography ?? {}),
    ...(paragraph ?? {}),
    ...(box ?? {}),
    ...(layout ?? {}),
    ...(breaks ?? {}),
    ...(props.style ?? {})
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function readRequiredTemplateToken(
  props: TemplateProps,
  key: "name" | "match" | "apply" | "on" | "use"
): string {
  const value = props[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalTemplateToken(props: TemplateProps, key: "gap" | "on"): string | undefined {
  const value = props[key];
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string when provided.`);
  }

  return value.trim();
}

function readFixedAnchor(props: TemplateProps): FixedAnchor {
  switch (props.anchor) {
    case "top-left":
    case "top-center":
    case "top-right":
    case "bottom-left":
    case "bottom-center":
    case "bottom-right":
    case "page-top-left":
    case "page-top-right":
    case "page-bottom-left":
    case "page-bottom-right":
      return props.anchor;
    default:
      throw new Error("`fixed` requires a supported page anchor like `page-top-right`.");
  }
}

function readFixedWhen(props: TemplateProps): FixedWhen | undefined {
  if (props.when == null) {
    return undefined;
  }

  if (props.when === "all" || props.when === "first-page" || props.when === "not-first-page") {
    return props.when;
  }

  throw new Error("`fixed` `when` must be `all`, `first-page`, or `not-first-page`.");
}

function isPageRule(props: TemplateProps): boolean {
  return typeof props.match === "string" || typeof props.use === "string";
}

function createTemplateNode(type: string, props: TemplateProps): TemplateNode {
  switch (type) {
    case "page": {
      if (isPageRule(props)) {
        return {
          kind: "page-rule",
          match: readRequiredTemplateToken(props, "match"),
          use: readRequiredTemplateToken(props, "use")
        } satisfies PageRuleNode;
      }
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "page",
        style,
        children: []
      } satisfies PageNode;
    }
    case "page-set": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "page-set",
        name: readRequiredTemplateToken(props, "name"),
        style,
        children: []
      } satisfies PageSetNode;
    }
    case "region": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "region",
        style,
        children: []
      } satisfies RegionNode;
    }
    case "stack": {
      const style = mergeTemplateStyleGroups(props);
      const inferredGap = typeof style?.gap === "string" ? style.gap : undefined;
      const gap = readOptionalTemplateToken(props, "gap") ?? inferredGap;
      return {
        kind: "stack",
        gap,
        style,
        children: []
      } satisfies StackNode;
    }
    case "slot":
      return {
        kind: "slot",
        name: validateSlotName(props.name)
      } satisfies SlotNode;
    case "fixed": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "fixed",
        anchor: readFixedAnchor(props),
        when: readFixedWhen(props),
        style,
        children: []
      } satisfies FixedNode;
    }
    case "page-number":
      return {
        kind: "page-number",
        style: mergeTemplateStyleGroups(props)
      } satisfies PageNumberNode;
    case "rules":
      return {
        kind: "rules",
        children: []
      } satisfies RulesNode;
    case "role":
      return {
        kind: "role-rule",
        match: readRequiredTemplateToken(props, "match"),
        apply: readRequiredTemplateToken(props, "apply"),
        ...(readOptionalTemplateToken(props, "on") != null
          ? { on: readOptionalTemplateToken(props, "on") }
          : {})
      } satisfies RoleRuleNode;
    default:
      if (getTemplateIntrinsic(type) != null) {
        const style = mergeTemplateStyleGroups(props);
        const { children: _children, ...restProps } = props;
        return {
          kind: "custom",
          name: type,
          props: restProps,
          style,
          children: []
        } satisfies CustomTemplateNode;
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

  if (parent.kind === "rules") {
    if (child.kind !== "role-rule" && child.kind !== "page-rule") {
      throw new Error("`rules` may only contain `role` or `page` rule definitions.");
    }
    parent.children.push(child);
    return;
  }

  if (child.kind === "role-rule" || child.kind === "page-rule") {
    throw new Error("Template rule definitions must be placed inside `rules`.");
  }

  parent.children.push(child as TemplateChild);
}

function appendChildToTemplateContainer(container: TemplateContainer, child: TemplateNode): void {
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
  resetTextContent(
    instance:
      | PageNode
      | PageSetNode
      | RegionNode
      | StackNode
      | FixedNode
      | CustomTemplateNode
      | RulesNode
  ): void {
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
