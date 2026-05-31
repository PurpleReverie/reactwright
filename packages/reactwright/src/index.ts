import type { ComponentType } from "react";

export { renderContentToIR } from "./content/render.js";
export { renderTemplateToIR } from "./template/render.js";
export { resolveDocument } from "./resolver/resolve.js";
export { renderResolvedToHTML } from "./backends/html/render.js";
export { buildPdfFromResolved, buildPdfFromHtml } from "./backends/pdf/render.js";
export { runExternalFile } from "./cli/run-file.js";
export { registerTemplateIntrinsic, getTemplateIntrinsic } from "./template/registry.js";
export { registerFont } from "./fonts/registry.js";
export type { FontDefinition, HtmlFontSource } from "./fonts/registry.js";

export type ContentComponent = ComponentType;
export type TemplateComponent = ComponentType;

export type * from "./content/ir.js";
export type * from "./template/ir.js";
export type * from "./resolver/ir.js";
