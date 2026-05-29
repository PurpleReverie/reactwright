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
  TemplateChild,
  TemplateContainerNode,
  TemplateNode,
  TemplateTextNode
} from "./ir.js";

export type TemplateContainer = {
  root: TemplateNode | null;
  children: TemplateNode[];
};

function isWhitespaceOnlyText(node: TemplateNode): boolean {
  return node.kind === "text" && node.value.trim().length === 0;
}

// Template grammar is simpler than content's: `<rules>` accepts only
// role-rule / page-rule children, and those rule kinds may not appear
// outside `<rules>`. Everything else is a passthrough container.
function appendTemplateChild(parent: TemplateContainerNode, child: TemplateNode): void {
  if (isWhitespaceOnlyText(child)) return;

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
  appendInitialChild(parent: TemplateContainerNode, child: TemplateNode): void {
    appendTemplateChild(parent, child);
  },
  createTextInstance(text: string): TemplateTextNode {
    return { kind: "text", value: text };
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
  }
};
