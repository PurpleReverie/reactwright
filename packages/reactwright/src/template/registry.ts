import type { TemplateStyle } from "./ir.js";
import type { ResolvedChild } from "../resolver/ir.js";

export type CustomTemplateIntrinsicProps = Record<string, unknown> & {
  style?: TemplateStyle;
};

export type CustomTemplateIntrinsicDefinition = {
  name: string;
  html?: (context: {
    props: CustomTemplateIntrinsicProps;
    children: ResolvedChild[];
    renderChildren: (children: ResolvedChild[]) => string;
    styleToCss: (style: TemplateStyle | undefined, kind?: "page" | "region" | "stack") => string;
    escapeHtml: (value: string) => string;
  }) => string;
};

const registry = new Map<string, CustomTemplateIntrinsicDefinition>();

export function registerTemplateIntrinsic(definition: CustomTemplateIntrinsicDefinition): void {
  registry.set(definition.name, definition);
}

export function getTemplateIntrinsic(name: string): CustomTemplateIntrinsicDefinition | undefined {
  return registry.get(name);
}
