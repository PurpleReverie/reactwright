import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { ReactNode } from "react";
import { getTemplateIntrinsic } from "./registry.js";

import {
  isPageRule,
  mergeTemplateStyleGroups,
  readAnchorsMap,
  readFixedAnchor,
  readFixedWhen,
  readLayerWhen,
  readMarginAnchor,
  readMarginMatterWhen,
  readOptionalTemplateToken,
  readRegionPositioning,
  readRequiredTemplateToken,
  type TemplateProps
} from "./prop-readers.js";
import type {
  ColumnNode,
  ColumnsNode,
  CustomTemplateNode,
  FixedNode,
  FooterNode,
  BibliographyEntry,
  BibliographyNode,
  FootnoteAreaNode,
  HeaderNode,
  ImageNode,
  IndexTemplateNode,
  SidenoteAreaNode,
  SidenoteAreaSide,
  TocNode,
  ListOfNode,
  ListOfKind,
  FontNode,
  LayerNode,
  PageCountNode,
  PageNode,
  PageNumberNode,
  BreakValue,
  PageRuleNode,
  RoleNumbering,
  RoleDropCap,
  PageSetNode,
  RegionNode,
  RoleRuleNode,
  RulesNode,
  RunningNode,
  RunningPolicy,
  SlotName,
  SlotNode,
  StackNode,
  TemplateChild,
  TemplateContainerNode,
  TemplateNode,
  TemplateTextNode
} from "./ir.js";

type HostContext = {
  scope: "template";
};

type TemplateContainer = {
  root: TemplateNode | null;
  children: TemplateNode[];
};

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
    case "columns": {
      const style = mergeTemplateStyleGroups(props);
      const gap = readOptionalTemplateToken(props, "gap");
      const widthsRaw = (props as Record<string, unknown>).widths;
      let widths: string[] | undefined;
      if (Array.isArray(widthsRaw)) {
        widths = widthsRaw.filter((w): w is string => typeof w === "string" && w.length > 0);
        if (widths.length === 0) widths = undefined;
      }
      return {
        kind: "columns",
        ...(gap != null ? { gap } : {}),
        ...(widths != null ? { widths } : {}),
        style,
        children: []
      } satisfies ColumnsNode;
    }
    case "column": {
      const style = mergeTemplateStyleGroups(props);
      const widthRaw = (props as Record<string, unknown>).width;
      const width = typeof widthRaw === "string" ? widthRaw : undefined;
      return {
        kind: "column",
        ...(width != null ? { width } : {}),
        style,
        children: []
      } satisfies ColumnNode;
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
    case "font": {
      const familyRaw = (props as Record<string, unknown>).family;
      const family = typeof familyRaw === "string" ? familyRaw.trim() : "";
      if (family.length === 0) {
        throw new Error("`font` requires a non-empty `family`.");
      }
      const srcRaw = (props as Record<string, unknown>).src;
      const src = typeof srcRaw === "string" ? srcRaw.trim() : "";
      if (src.length === 0) {
        throw new Error("`font` requires a non-empty `src`.");
      }
      const weightRaw = (props as Record<string, unknown>).weight;
      const weight = typeof weightRaw === "string" || typeof weightRaw === "number" ? String(weightRaw) : undefined;
      const fontStyleRaw = (props as Record<string, unknown>).fontStyle;
      const fontStyle = typeof fontStyleRaw === "string" ? fontStyleRaw : undefined;
      const formatRaw = (props as Record<string, unknown>).format;
      const format = typeof formatRaw === "string" ? formatRaw : undefined;
      return {
        kind: "font",
        family,
        src,
        ...(weight != null ? { weight } : {}),
        ...(fontStyle != null ? { fontStyle } : {}),
        ...(format != null ? { format } : {})
      } satisfies FontNode;
    }
    case "list-of": {
      const ofRaw = (props as Record<string, unknown>).of;
      let of: ListOfKind;
      if (ofRaw === "figure" || ofRaw === "table" || ofRaw === "equation") {
        of = ofRaw;
      } else {
        throw new Error("`list-of` `of` must be `figure`, `table`, or `equation`.");
      }
      const titleProp = (props as Record<string, unknown>).title;
      const title = typeof titleProp === "string" ? titleProp : undefined;
      return {
        kind: "list-of",
        of,
        ...(title != null ? { title } : {}),
        style: mergeTemplateStyleGroups(props)
      } satisfies ListOfNode;
    }
    case "toc": {
      const titleProp = (props as Record<string, unknown>).title;
      const title = typeof titleProp === "string" ? titleProp : undefined;
      const depthRaw = (props as Record<string, unknown>).depth;
      const depth = typeof depthRaw === "number" && depthRaw > 0 ? depthRaw : undefined;
      const numbered = (props as Record<string, unknown>).numbered === true ? true : undefined;
      return {
        kind: "toc",
        ...(title != null ? { title } : {}),
        ...(depth != null ? { depth } : {}),
        ...(numbered != null ? { numbered } : {}),
        style: mergeTemplateStyleGroups(props)
      } satisfies TocNode;
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
    case "role": {
      const readBreak = (key: string): BreakValue | undefined => {
        const v = (props as Record<string, unknown>)[key];
        if (v == null) return undefined;
        if (
          v === "auto" ||
          v === "always" ||
          v === "avoid" ||
          v === "page" ||
          v === "left" ||
          v === "right" ||
          v === "recto" ||
          v === "verso"
        ) {
          return v;
        }
        throw new Error(`\`role\` \`${key}\` must be a valid CSS break value.`);
      };
      const readBreakInside = (): "auto" | "avoid" | undefined => {
        const v = (props as Record<string, unknown>).breakInside;
        if (v == null) return undefined;
        if (v === "auto" || v === "avoid") return v;
        throw new Error("`role` `breakInside` must be `auto` or `avoid`.");
      };
      const readDropCap = (): RoleDropCap | undefined => {
        const v = (props as Record<string, unknown>).dropCap;
        if (v == null) return undefined;
        if (typeof v !== "object" || Array.isArray(v)) {
          throw new Error("`role` `dropCap` must be an object.");
        }
        const obj = v as Record<string, unknown>;
        return {
          ...(typeof obj.lines === "number" ? { lines: obj.lines } : {}),
          ...(typeof obj.font === "string" ? { font: obj.font } : {}),
          ...(typeof obj.position === "string" ? { position: obj.position } : {})
        };
      };
      const readNumbering = (): RoleNumbering | undefined => {
        const v = (props as Record<string, unknown>).numbering;
        if (v == null) return undefined;
        if (typeof v !== "object" || Array.isArray(v)) {
          throw new Error("`role` `numbering` must be an object.");
        }
        const obj = v as Record<string, unknown>;
        if (typeof obj.counter !== "string" || obj.counter.length === 0) {
          throw new Error("`role` `numbering.counter` is required.");
        }
        return {
          counter: obj.counter,
          ...(typeof obj.scope === "string" ? { scope: obj.scope } : {}),
          ...(typeof obj.format === "string" ? { format: obj.format } : {})
        };
      };
      return {
        kind: "role-rule",
        match: readRequiredTemplateToken(props, "match"),
        apply: readRequiredTemplateToken(props, "apply"),
        ...(readOptionalTemplateToken(props, "on") != null
          ? { on: readOptionalTemplateToken(props, "on") }
          : {}),
        ...(readBreak("breakBefore") != null ? { breakBefore: readBreak("breakBefore") } : {}),
        ...(readBreak("breakAfter") != null ? { breakAfter: readBreak("breakAfter") } : {}),
        ...(readBreakInside() != null ? { breakInside: readBreakInside() } : {}),
        ...(readNumbering() != null ? { numbering: readNumbering() } : {}),
        ...(readDropCap() != null ? { dropCap: readDropCap() } : {}),
        ...(mergeTemplateStyleGroups(props) != null
          ? { style: mergeTemplateStyleGroups(props) }
          : {})
      } satisfies RoleRuleNode;
    }
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
