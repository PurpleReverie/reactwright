import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";
import { getTemplateIntrinsic } from "./registry.js";

import type {
  CustomTemplateNode,
  FixedAnchor,
  FixedNode,
  FixedWhen,
  FooterNode,
  BibliographyEntry,
  BibliographyNode,
  FootnoteAreaNode,
  HeaderNode,
  ImageNode,
  IndexTemplateNode,
  SidenoteAreaNode,
  SidenoteAreaSide,
  LayerNode,
  LayerWhen,
  MarginAnchor,
  MarginMatterWhen,
  PageCountNode,
  PageNode,
  PageNumberNode,
  PageRuleNode,
  PageSetNode,
  RegionNode,
  RegionPositioning,
  RoleRuleNode,
  RulesNode,
  RunningNode,
  RunningPolicy,
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
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  center?: boolean;
  policy?: unknown;
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
  const anchor = props.anchor;
  if (typeof anchor === "string" && anchor.trim().length > 0) {
    return anchor.trim();
  }
  if (anchor != null && typeof anchor === "object" && !Array.isArray(anchor)) {
    const coord = anchor as Record<string, unknown>;
    const result: { [k: string]: string } = {};
    for (const key of ["top", "right", "bottom", "left", "inside", "outside"] as const) {
      const value = coord[key];
      if (typeof value === "string" && value.trim().length > 0) {
        result[key] = value.trim();
      }
    }
    if (Object.keys(result).length > 0) {
      return result;
    }
  }
  throw new Error("`fixed` requires a named or coordinate `anchor`.");
}

function readAnchorsMap(props: TemplateProps): Record<string, { top?: string; right?: string; bottom?: string; left?: string; inside?: string; outside?: string }> | undefined {
  const raw = (props as Record<string, unknown>).anchors;
  if (raw == null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("`anchors` must be an object map of name -> coordinate.");
  }
  const result: Record<string, { top?: string; right?: string; bottom?: string; left?: string; inside?: string; outside?: string }> = {};
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Anchor \`${name}\` must be a coordinate object.`);
    }
    const coord = value as Record<string, unknown>;
    const entry: Record<string, string> = {};
    for (const key of ["top", "right", "bottom", "left", "inside", "outside"]) {
      const v = coord[key];
      if (typeof v === "string" && v.trim().length > 0) {
        entry[key] = v.trim();
      }
    }
    result[name] = entry;
  }
  return result;
}

function readMarginAnchor(props: TemplateProps, kind: "header" | "footer"): MarginAnchor {
  switch (props.anchor) {
    case "top-left":
    case "top-center":
    case "top-right":
    case "bottom-left":
    case "bottom-center":
    case "bottom-right":
    case "top-inside":
    case "top-outside":
    case "bottom-inside":
    case "bottom-outside":
    case "left-top":
    case "left-middle":
    case "left-bottom":
    case "right-top":
    case "right-middle":
    case "right-bottom":
      return props.anchor;
    default:
      throw new Error(`\`${kind}\` requires a valid \`anchor\` (e.g. top-left, bottom-center, top-outside).`);
  }
}

function readMarginMatterWhen(props: TemplateProps, kind: "header" | "footer"): MarginMatterWhen | undefined {
  if (props.when == null) {
    return undefined;
  }

  if (props.when === "all" || props.when === "first-page" || props.when === "not-first-page") {
    return props.when;
  }

  throw new Error(`\`${kind}\` \`when\` must be \`all\`, \`first-page\`, or \`not-first-page\`.`);
}

function readLayerWhen(props: TemplateProps): LayerWhen | undefined {
  if (props.when == null) {
    return undefined;
  }

  if (props.when === "all" || props.when === "first-page" || props.when === "not-first-page") {
    return props.when;
  }

  throw new Error("`layer` `when` must be `all`, `first-page`, or `not-first-page`.");
}

function readRegionPositioning(props: TemplateProps): RegionPositioning | undefined {
  const positioning: RegionPositioning = {};
  if (props.fill === true) positioning.fill = true;
  if (props.cover === true) positioning.cover = true;
  if (props.contain === true) positioning.contain = true;
  if (props.center === true) positioning.center = true;
  return Object.keys(positioning).length > 0 ? positioning : undefined;
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
      const anchors = readAnchorsMap(props);
      return {
        kind: "page-set",
        name: readRequiredTemplateToken(props, "name"),
        style,
        ...(anchors != null ? { anchors } : {}),
        children: []
      } satisfies PageSetNode;
    }
    case "region": {
      const style = mergeTemplateStyleGroups(props);
      const positioning = readRegionPositioning(props);
      return {
        kind: "region",
        style,
        ...(positioning != null ? { positioning } : {}),
        children: []
      } satisfies RegionNode;
    }
    case "layer": {
      const style = mergeTemplateStyleGroups(props);
      const name = typeof props.name === "string" && props.name.trim().length > 0 ? props.name.trim() : undefined;
      return {
        kind: "layer",
        ...(name != null ? { name } : {}),
        when: readLayerWhen(props),
        style,
        children: []
      } satisfies LayerNode;
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
    case "page-count":
      return {
        kind: "page-count",
        style: mergeTemplateStyleGroups(props)
      } satisfies PageCountNode;
    case "image": {
      const src = typeof props.src === "string" ? props.src.trim() : "";
      if (src.length === 0) {
        throw new Error("`image` requires a non-empty `src`.");
      }
      const style = mergeTemplateStyleGroups(props);
      const alt = typeof (props as Record<string, unknown>).alt === "string" ? ((props as Record<string, unknown>).alt as string) : undefined;
      const width = typeof (props as Record<string, unknown>).width === "string" ? ((props as Record<string, unknown>).width as string) : undefined;
      return {
        kind: "image",
        src,
        ...(alt != null ? { alt } : {}),
        ...(props.fill === true ? { fill: true } : {}),
        ...(props.cover === true ? { cover: true } : {}),
        ...(props.contain === true ? { contain: true } : {}),
        ...(width != null ? { width } : {}),
        style
      } satisfies ImageNode;
    }
    case "footnote-area":
      return {
        kind: "footnote-area",
        ...((props as Record<string, unknown>).separator === false ? {} : { separator: true }),
        style: mergeTemplateStyleGroups(props)
      } satisfies FootnoteAreaNode;
    case "sidenote-area": {
      const sideRaw = (props as Record<string, unknown>).side;
      let side: SidenoteAreaSide | undefined;
      if (sideRaw != null) {
        if (sideRaw === "outside" || sideRaw === "inside" || sideRaw === "left" || sideRaw === "right") {
          side = sideRaw;
        } else {
          throw new Error("`sidenote-area` `side` must be `outside`, `inside`, `left`, or `right`.");
        }
      }
      const widthRaw = (props as Record<string, unknown>).width;
      const gapRaw = (props as Record<string, unknown>).gap;
      return {
        kind: "sidenote-area",
        ...(side != null ? { side } : {}),
        ...(typeof widthRaw === "string" ? { width: widthRaw } : {}),
        ...(typeof gapRaw === "string" ? { gap: gapRaw } : {}),
        style: mergeTemplateStyleGroups(props)
      } satisfies SidenoteAreaNode;
    }
    case "index": {
      const titleProp = (props as Record<string, unknown>).title;
      const title = typeof titleProp === "string" ? titleProp : undefined;
      return {
        kind: "index-template",
        ...(title != null ? { title } : {}),
        style: mergeTemplateStyleGroups(props)
      } satisfies IndexTemplateNode;
    }
    case "bibliography": {
      const rawEntries = (props as Record<string, unknown>).entries;
      let entries: BibliographyEntry[] | undefined;
      if (Array.isArray(rawEntries)) {
        entries = rawEntries
          .filter(
            (entry): entry is BibliographyEntry =>
              entry != null &&
              typeof entry === "object" &&
              typeof (entry as BibliographyEntry).key === "string" &&
              typeof (entry as BibliographyEntry).text === "string"
          )
          .map((e) => ({ key: e.key, text: e.text }));
      }
      const titleProp = (props as Record<string, unknown>).title;
      const title = typeof titleProp === "string" ? titleProp : undefined;
      return {
        kind: "bibliography",
        ...(title != null ? { title } : {}),
        ...(entries != null ? { entries } : {}),
        style: mergeTemplateStyleGroups(props)
      } satisfies BibliographyNode;
    }
    case "running": {
      const name = typeof props.name === "string" ? props.name.trim() : "";
      if (name.length === 0) {
        throw new Error("`running` requires a non-empty `name`.");
      }
      let policy: RunningPolicy | undefined;
      if (props.policy != null) {
        if (
          props.policy === "start" ||
          props.policy === "first" ||
          props.policy === "last" ||
          props.policy === "first-except"
        ) {
          policy = props.policy;
        } else {
          throw new Error("`running` `policy` must be `start`, `first`, `last`, or `first-except`.");
        }
      }
      return {
        kind: "running",
        name,
        ...(policy != null ? { policy } : {}),
        style: mergeTemplateStyleGroups(props)
      } satisfies RunningNode;
    }
    case "header": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "header",
        anchor: readMarginAnchor(props, "header"),
        when: readMarginMatterWhen(props, "header"),
        style,
        children: []
      } satisfies HeaderNode;
    }
    case "footer": {
      const style = mergeTemplateStyleGroups(props);
      return {
        kind: "footer",
        anchor: readMarginAnchor(props, "footer"),
        when: readMarginMatterWhen(props, "footer"),
        style,
        children: []
      } satisfies FooterNode;
    }
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
      | LayerNode
      | FixedNode
      | HeaderNode
      | FooterNode
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
