import type { ComponentType } from "react";

export { renderContentToIR } from "./content/render.js";
export { renderTemplateToIR } from "./template/render.js";
export { resolveDocument } from "./resolver/resolve.js";
export { renderResolvedToHTML } from "./backends/html/render.js";
export { renderResolvedToLatex } from "./backends/latex/render.js";
export { buildPdfFromResolved } from "./backends/latex/build.js";
export { runExternalFile } from "./cli/run-file.js";
export { registerTemplateIntrinsic, getTemplateIntrinsic } from "./template/registry.js";
export { ArticleTemplate } from "./templates/article.js";
export { IEEETemplate } from "./templates/ieee.js";

export type ContentComponent = ComponentType;
export type TemplateComponent = ComponentType;

export type * from "./content/ir.js";
export type * from "./template/ir.js";
export type * from "./resolver/ir.js";
