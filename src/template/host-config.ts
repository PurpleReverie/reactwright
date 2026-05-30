import { createReconcilerHostConfigBase } from "../shared/reconciler-host-config.js";
import { insertBeforeInList } from "../shared/insert-before.js";

import { createTemplateNode } from "./factories/index.js";
import type { TemplateProps } from "./prop-readers.js";
import type {
  CustomTemplateNode,
  FixedNode,
  FooterNode,
  HeaderNode,
  LayerNode,
  PageNode,
  PageSetNode,
  RegionNode,
  RulesNode,
  StackNode,
  StylesNode,
  TemplateChild,
  TemplateContainerNode,
  TemplateNode,
  TemplateRowNode,
  TemplateTextNode
} from "./ir.js";

// Parent types accepted by the reconciler's append/insert callbacks.
// `<styles>` is included because it captures text children even though
// it isn't a regular container (it stores text in `source`, not
// `children`).
type AppendParent = TemplateContainerNode | StylesNode;

export type TemplateContainer = {
  root: TemplateNode | null;
  children: TemplateNode[];
};

function isWhitespaceOnlyText(node: TemplateNode): boolean {
  return node.kind === "text" && node.value.trim().length === 0;
}

// Template grammar: `<rules>` accepts rule-definition kinds. `<styles>`
// accepts only text children (its CSS source). New-style `<rule>` and
// `<styles>` may appear anywhere a container is allowed, including as
// siblings of `<rules>` or directly under `<page>`. Legacy `<role>` /
// `<page match>` rule definitions stay restricted to `<rules>`.
function appendTemplateChild(
  parent: AppendParent,
  child: TemplateNode
): void {
  // <styles> children: any text becomes appended to source. Anything
  // else is a grammar error.
  if (parent.kind === "styles") {
    if (child.kind === "text") {
      parent.source += child.value;
      return;
    }
    throw new Error("`styles` may only contain text (CSS-dialect source).");
  }

  if (isWhitespaceOnlyText(child)) return;

  if (parent.kind === "rules") {
    if (
      child.kind !== "role-rule" &&
      child.kind !== "page-rule" &&
      child.kind !== "rule"
    ) {
      throw new Error("`rules` may only contain `role`, `page`, or `rule` definitions.");
    }
    parent.children.push(child);
    return;
  }

  if (child.kind === "role-rule" || child.kind === "page-rule") {
    throw new Error("Template rule definitions must be placed inside `rules`.");
  }

  parent.children.push(child as TemplateChild);
}

function appendChildToTemplateContainer(
  container: TemplateContainer,
  child: TemplateNode
): void {
  if (isWhitespaceOnlyText(child)) return;
  container.children.push(child);
  if (container.root == null) {
    container.root = child;
  }
}

// Reconciler host config for the template tree. Boilerplate
// (lifecycle hooks, priority/scheduling) comes from the shared base.
// Template-specific methods below dispatch createInstance through the
// factories and route append/insert/remove through the template
// grammar.
export const templateHostConfig = {
  ...createReconcilerHostConfigBase("template"),
  getPublicInstance(instance: TemplateNode): TemplateNode {
    return instance;
  },
  createInstance(type: string, props: TemplateProps): TemplateNode {
    return createTemplateNode(type, props);
  },
  appendInitialChild(parent: AppendParent, child: TemplateNode): void {
    appendTemplateChild(parent, child);
  },
  createTextInstance(text: string): TemplateTextNode {
    return { kind: "text", value: text };
  },
  appendChild(parent: AppendParent, child: TemplateNode): void {
    appendTemplateChild(parent, child);
  },
  appendChildToContainer(container: TemplateContainer, child: TemplateNode): void {
    appendChildToTemplateContainer(container, child);
  },
  insertBefore(parent: AppendParent, child: TemplateNode, beforeChild: TemplateNode): void {
    if (parent.kind === "styles") {
      // Inserting a child of styles is unusual — JSX with a single
      // template literal should only call appendChild. If we get here,
      // treat as appendChild (concatenate to source).
      appendTemplateChild(parent, child);
      return;
    }
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
  removeChild(parent: AppendParent, child: TemplateNode): void {
    if (parent.kind === "styles") {
      // Removing a child of styles drops its contribution to source.
      // Naive but acceptable for slice 1; <styles> text rarely changes
      // at runtime.
      if (child.kind === "text") {
        parent.source = parent.source.replace(child.value, "");
      }
      return;
    }
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
  commitTextUpdate(textInstance: TemplateTextNode, _oldText: string, newText: string): void {
    textInstance.value = newText;
  },
  resetTextContent(
    instance:
      | PageNode
      | PageSetNode
      | RegionNode
      | StackNode
      | TemplateRowNode
      | LayerNode
      | FixedNode
      | HeaderNode
      | FooterNode
      | CustomTemplateNode
      | RulesNode
      | StylesNode
  ): void {
    if (instance.kind === "styles") {
      instance.source = "";
      return;
    }
    instance.children = [];
  }
};
