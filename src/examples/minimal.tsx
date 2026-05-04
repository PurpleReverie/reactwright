import React from "react";
import type { ReactElement, ReactNode } from "react";

type DocumentProps = {
  title: string;
  author?: string;
  children?: ReactNode;
};

type SectionProps = {
  title: string;
  children?: ReactNode;
};

type ParagraphProps = {
  children?: ReactNode;
};

const document = ({ title, author, children }: DocumentProps) =>
  React.createElement("document", { title, author }, children);

const section = ({ title, children }: SectionProps) =>
  React.createElement("section", { title }, children);

const paragraph = ({ children }: ParagraphProps) =>
  React.createElement("paragraph", null, children);

const page = ({ children }: { children?: ReactNode }) =>
  React.createElement("page", null, children);

const stack = ({ children }: { children?: ReactNode }) =>
  React.createElement("stack", null, children);

const slot = ({ name }: { name: string }) => React.createElement("slot", { name });

const Paper = () =>
  document({
    title: "Minimal Test",
    author: "Tauraj Greig",
    children: [
      section({
        title: "Introduction",
        children: paragraph({ children: "Hello world." })
      })
    ]
  });

const ArticleTemplate = ({ children }: { children?: ReactNode }) =>
  page({
    children: stack({
      children: [
        slot({ name: "title" }),
        slot({ name: "body" }),
        children
      ]
    })
  });

const app = React.createElement(ArticleTemplate, null, React.createElement(Paper));

function expandNode(node: ReactNode): ReactNode {
  if (
    typeof node === "string" ||
    typeof node === "number" ||
    node == null ||
    typeof node === "boolean"
  ) {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(expandNode);
  }

  const element = node as ReactElement<Record<string, unknown>>;

  if (typeof element.type === "function") {
    const component = element.type as (props: Record<string, unknown>) => ReactNode;
    const rendered = component(element.props);
    return expandNode(rendered);
  }

  const children = expandNode(element.props?.children as ReactNode);
  return React.createElement(element.type, { ...(element.props ?? {}), children });
}

function inspectNode(node: ReactNode): unknown {
  if (typeof node === "string" || typeof node === "number" || node == null) {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(inspectNode);
  }

  const element = node as ReactElement<Record<string, unknown>>;
  const typeName =
    typeof element.type === "string"
      ? element.type
      : typeof element.type === "function"
        ? element.type.name || "AnonymousComponent"
        : "UnknownType";

  const { children, ...props } = element.props ?? {};

  return {
    type: typeName,
    props,
    children: inspectNode(children as ReactNode)
  };
}

console.log("Minimal example tree created.");
console.log(JSON.stringify(inspectNode(expandNode(app)), null, 2));
