import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";
import { getTemplateIntrinsic } from "./registry.js";

import type {
  BoxNode,
  CustomTemplateNode,
  FixedAnchor,
  FixedWhen,
  FixedNode,
  FigureRoleRuleNode,
  ListRoleRuleNode,
  PageNumberNode,
  PageNode,
  PageRoleRuleNode,
  PageSetNode,
  ParagraphRoleRuleNode,
  RepeatAnchor,
  RepeatWhen,
  RepeatNode,
  RowNode,
  RuleNode,
  TemplateBreaksProps,
  TemplateBoxProps,
  TemplateHeadingProps,
  TemplateLayoutProps,
  SlotName,
  SlotNode,
  StackNode,
  QuoteRoleRuleNode,
  RulesNode,
  SectionRoleRuleNode,
  TemplateChild,
  TemplateContainerNode,
  TemplateNode,
  TemplatePageProps,
  TemplateParagraphProps,
  TemplateStyle,
  TemplateTypographyProps,
  TemplateTextNode
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
  heading?: TemplateHeadingProps;
  gap?: string;
  name?: string;
  role?: string;
  variant?: string;
  page?: string;
  use?: string;
  count?: number;
  axis?: unknown;
  weight?: unknown;
  color?: unknown;
  length?: unknown;
  anchor?: unknown;
  when?: unknown;
};

type TemplateContainer = {
  root: TemplateNode | null;
  children: TemplateNode[];
};

function readOptionalObjectProp<T extends Record<string, unknown>>(
  props: TemplateProps,
  key: "page" | "typography" | "paragraph" | "box" | "layout" | "breaks" | "heading"
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

function flattenHeadingProps(heading: TemplateHeadingProps | undefined): TemplateStyle {
  if (heading == null) {
    return {};
  }

  const flattened: TemplateStyle = {};

  for (const [key, value] of Object.entries(heading)) {
    flattened[`section.${key}`] = value;
  }

  return flattened;
}

function mergeTemplateStyleGroups(props: TemplateProps): TemplateStyle | undefined {
  const page = readOptionalObjectProp<TemplatePageProps>(props, "page");
  const typography = readOptionalObjectProp<TemplateTypographyProps>(props, "typography");
  const paragraph = readOptionalObjectProp<TemplateParagraphProps>(props, "paragraph");
  const box = readOptionalObjectProp<TemplateBoxProps>(props, "box");
  const layout = readOptionalObjectProp<TemplateLayoutProps>(props, "layout");
  const breaks = readOptionalObjectProp<TemplateBreaksProps>(props, "breaks");
  const heading = readOptionalObjectProp<TemplateHeadingProps>(props, "heading");

  const merged: TemplateStyle = {
    ...(page ?? {}),
    ...(typography ?? {}),
    ...(paragraph ?? {}),
    ...(box ?? {}),
    ...(layout ?? {}),
    ...(breaks ?? {}),
    ...flattenHeadingProps(heading),
    ...(props.style ?? {})
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function readRequiredTemplateToken(
  props: TemplateProps,
  key: "name" | "role" | "variant" | "page" | "use"
): string {
  const value = props[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalTemplateToken(props: TemplateProps, key: "gap"): string | undefined {
  const value = props[key];
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string when provided.`);
  }

  return value.trim();
}

function readOptionalRuleToken(props: TemplateProps, key: "weight" | "color" | "length"): string | undefined {
  const value = props[key];
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string when provided.`);
  }

  return value.trim();
}

function readOptionalRuleAxis(props: TemplateProps): "horizontal" | "vertical" | undefined {
  if (props.axis == null) {
    return undefined;
  }

  if (props.axis === "horizontal" || props.axis === "vertical") {
    return props.axis;
  }

  throw new Error("`axis` must be `horizontal` or `vertical` when provided.");
}

function readRepeatAnchor(props: TemplateProps): RepeatAnchor {
  switch (props.anchor) {
    case "top-left":
    case "top-center":
    case "top-right":
    case "bottom-left":
    case "bottom-center":
    case "bottom-right":
      return props.anchor;
    default:
      throw new Error("`repeat` requires an `anchor` like `top-right` or `bottom-center`.");
  }
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

function readRepeatWhen(props: TemplateProps): RepeatWhen | undefined {
  if (props.when == null) {
    return undefined;
  }

  if (props.when === "all" || props.when === "first-page" || props.when === "not-first-page") {
    return props.when;
  }

  throw new Error("`repeat` `when` must be `all`, `first-page`, or `not-first-page`.");
}

function readFixedWhen(props: TemplateProps): FixedWhen | undefined {
  if (props.when == null) {
    return undefined;
  }

  if (props.when === "all" || props.when === "first-page") {
    return props.when;
  }

  throw new Error("`fixed` `when` must be `all` or `first-page`.");
}

function createTemplateNode(type: string, props: TemplateProps): TemplateNode {
  switch (type) {
    case "template":
    case "page": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "page",
        style,
        children: []
      };
    }
    case "region":
    case "box": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "box",
        style,
        children: []
      };
    }
    case "flow":
    case "stack": {
      const style = mergeTemplateStyleGroups(props);
      const inferredGap = typeof style?.gap === "string" ? style.gap : undefined;
      const gap = readOptionalTemplateToken(props, "gap") ?? inferredGap;
      return {
        kind: "stack",
        gap,
        style,
        children: []
      };
    }
    case "row": {
      const style = mergeTemplateStyleGroups(props);
      const inferredGap = typeof style?.gap === "string" ? style.gap : undefined;
      const gap = readOptionalTemplateToken(props, "gap") ?? inferredGap;
      return {
        kind: "row",
        gap,
        style,
        children: []
      } satisfies RowNode;
    }
    case "columns": {
      const style = mergeTemplateStyleGroups(props);
      const inferredGap = typeof style?.gap === "string" ? style.gap : undefined;
      const gap = readOptionalTemplateToken(props, "gap") ?? inferredGap;
      if (!Number.isInteger(props.count) || Number(props.count) < 1) {
        throw new Error("`columns` requires a positive integer `count`.");
      }
      return {
        kind: "box",
        style: {
          ...(style ?? {}),
          columns: props.count,
          ...(gap != null ? { columnGap: gap } : {})
        },
        children: []
      };
    }
    case "slot":
      return {
        kind: "slot",
        name: validateSlotName(props.name)
      };
    case "rule":
      return {
        kind: "rule",
        axis: readOptionalRuleAxis(props),
        weight: readOptionalRuleToken(props, "weight"),
        color: readOptionalRuleToken(props, "color"),
        length: readOptionalRuleToken(props, "length"),
        style: mergeTemplateStyleGroups(props)
      } satisfies RuleNode;
    case "repeat": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "repeat",
        anchor: readRepeatAnchor(props),
        when: readRepeatWhen(props),
        style,
        children: []
      } satisfies RepeatNode;
    }
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
    case "page-set":
      return {
        kind: "page-set",
        name: readRequiredTemplateToken(props, "name"),
        children: []
      } satisfies PageSetNode;
    case "rules":
      return {
        kind: "rules",
        children: []
      } satisfies RulesNode;
    case "section-role":
      return {
        kind: "section-role",
        role: readRequiredTemplateToken(props, "role"),
        variant: readRequiredTemplateToken(props, "variant")
      } satisfies SectionRoleRuleNode;
    case "quote-role":
      return {
        kind: "quote-role",
        role: readRequiredTemplateToken(props, "role"),
        variant: readRequiredTemplateToken(props, "variant")
      } satisfies QuoteRoleRuleNode;
    case "page-role":
      return {
        kind: "page-role",
        page: readRequiredTemplateToken(props, "page"),
        use: readRequiredTemplateToken(props, "use")
      } satisfies PageRoleRuleNode;
    case "paragraph-role":
      return {
        kind: "paragraph-role",
        role: readRequiredTemplateToken(props, "role"),
        variant: readRequiredTemplateToken(props, "variant")
      } satisfies ParagraphRoleRuleNode;
    case "list-role":
      return {
        kind: "list-role",
        role: readRequiredTemplateToken(props, "role"),
        variant: readRequiredTemplateToken(props, "variant")
      } satisfies ListRoleRuleNode;
    case "figure-role":
      return {
        kind: "figure-role",
        role: readRequiredTemplateToken(props, "role"),
        variant: readRequiredTemplateToken(props, "variant")
      } satisfies FigureRoleRuleNode;
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

  if (parent.kind === "rules") {
    if (
      child.kind !== "section-role" &&
      child.kind !== "quote-role" &&
      child.kind !== "page-role" &&
      child.kind !== "paragraph-role" &&
      child.kind !== "list-role" &&
      child.kind !== "figure-role"
    ) {
      throw new Error("`rules` may only contain rule definitions.");
    }
    parent.children.push(child);
    return;
  }

  if (
    child.kind === "section-role" ||
    child.kind === "quote-role" ||
    child.kind === "page-role" ||
    child.kind === "paragraph-role" ||
    child.kind === "list-role" ||
    child.kind === "figure-role"
  ) {
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
    instance: BoxNode | PageNode | StackNode | RowNode | RepeatNode | FixedNode | CustomTemplateNode | PageSetNode | RulesNode
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
