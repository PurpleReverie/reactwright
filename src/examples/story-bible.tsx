import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderResolvedToHTML } from "../backends/html/render.js";
import { buildPdfFromResolved } from "../backends/latex/build.js";
import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";
import StoryBible, { Template as StoryBibleTemplate } from "../../playground/story-bible.js";

const documentTree = renderContentToIR(<StoryBible />);
const templateTree = renderTemplateToIR(<StoryBibleTemplate />);
const resolvedTree = resolveDocument(documentTree, templateTree);

const outputDir = resolve("build/story-bible");
await mkdir(outputDir, { recursive: true });

const htmlPath = join(outputDir, "story-bible.html");
await writeFile(htmlPath, renderResolvedToHTML(resolvedTree), "utf8");
console.log(`HTML written to ${htmlPath}`);

const result = await buildPdfFromResolved(resolvedTree, {
  outputDir,
  baseName: "story-bible"
});
console.log(`PDF written to ${result.pdfPath}`);
