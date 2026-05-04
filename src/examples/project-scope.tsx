import { writeFile } from "node:fs/promises";

import { renderResolvedToHTML } from "../backends/html/render.js";
import { renderResolvedToLatex } from "../backends/latex/render.js";
import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";
import { ResearchMemo } from "../../playground/custom-content.js";
import { ResearchMemoTemplate } from "../../playground/custom-template.js";

const documentTree = renderContentToIR(<ResearchMemo />);
const templateTree = renderTemplateToIR(<ResearchMemoTemplate />);
const resolvedTree = resolveDocument(documentTree, templateTree);

const html = renderResolvedToHTML(resolvedTree);
const latex = renderResolvedToLatex(resolvedTree);

await writeFile("build/project-scope-demo.html", html, "utf8");
await writeFile("build/project-scope-demo.tex", latex, "utf8");

console.log("Project-scope custom content and template demo created.");
console.log(
  JSON.stringify(
    {
      htmlPath: "build/project-scope-demo.html",
      texPath: "build/project-scope-demo.tex"
    },
    null,
    2
  )
);
