import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";

import { renderResolvedToHTML } from "../backends/html/render.js";
import { buildPdfFromResolved } from "../backends/latex/build.js";
import { renderResolvedToLatex } from "../backends/latex/render.js";
import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { ArticleTemplate } from "../templates/article.js";
import { renderTemplateToIR } from "../template/render.js";

type OutputFormat = "html" | "latex" | "pdf";
type TemplateName = "article";

type RunExternalFileOptions = {
  inputPath: string;
  outDir?: string;
  formats: OutputFormat[];
  template?: TemplateName;
};

type RunExternalFileResult = {
  inputPath: string;
  outDir: string;
  baseName: string;
  formats: OutputFormat[];
  template: TemplateName | "external";
  htmlPath?: string;
  texPath?: string;
  pdfPath?: string;
};

type ExternalDocumentModule =
  | {
      default?: unknown;
      Template?: unknown;
      template?: unknown;
      Content?: unknown;
      content?: unknown;
    }
  | unknown;

function usage(): string {
  return [
    "Usage:",
    "  node --import tsx ./src/cli/run-file.ts <input.tsx> [--format html,latex,pdf] [--out ./build/reactdoc-run] [--template article]",
    "",
    "Examples:",
    "  node --import tsx ./src/cli/run-file.ts ./playground/paper.tsx --format html",
    "  node --import tsx ./src/cli/run-file.ts ./playground/paper.tsx --format html,latex,pdf --out ./build/reactdoc-run"
  ].join("\n");
}

function parseFormats(value: string | undefined): OutputFormat[] {
  const raw = (value ?? "html").split(",").map((entry) => entry.trim()).filter(Boolean);
  const formats = new Set<OutputFormat>();

  for (const entry of raw) {
    if (entry === "html" || entry === "latex" || entry === "pdf") {
      formats.add(entry);
      continue;
    }

    throw new Error(`Unsupported format: ${entry}`);
  }

  return [...formats];
}

function parseTemplate(value: string | undefined): TemplateName {
  if (value == null || value === "article") {
    return "article";
  }

  throw new Error(`Unknown template: ${value}`);
}

function getBuiltInTemplate(template: TemplateName) {
  switch (template) {
    case "article":
      return ArticleTemplate;
  }
}

async function loadExternalDocumentModule(inputPath: string): Promise<unknown> {
  const absolutePath = resolve(inputPath);
  return import(pathToFileURL(absolutePath).href);
}

function isComponent(value: unknown): value is React.ComponentType {
  return typeof value === "function";
}

function getDocumentComponent(moduleValue: ExternalDocumentModule): React.ComponentType {
  if (typeof moduleValue === "object" && moduleValue != null) {
    if (isComponent((moduleValue as { default?: unknown }).default)) {
      return (moduleValue as { default: React.ComponentType }).default;
    }

    if (isComponent((moduleValue as { Content?: unknown }).Content)) {
      return (moduleValue as { Content: React.ComponentType }).Content;
    }

    if (isComponent((moduleValue as { content?: unknown }).content)) {
      return (moduleValue as { content: React.ComponentType }).content;
    }
  }

  throw new Error(
    "Input file must export content as `default`, `Content`, or `content`."
  );
}

function getExternalTemplateComponent(moduleValue: ExternalDocumentModule): React.ComponentType | null {
  if (typeof moduleValue === "object" && moduleValue != null) {
    if (isComponent((moduleValue as { Template?: unknown }).Template)) {
      return (moduleValue as { Template: React.ComponentType }).Template;
    }

    if (isComponent((moduleValue as { template?: unknown }).template)) {
      return (moduleValue as { template: React.ComponentType }).template;
    }
  }

  return null;
}

async function writeHtmlOutput(outDir: string, baseName: string, html: string): Promise<string> {
  const htmlPath = join(outDir, `${baseName}.html`);
  await writeFile(htmlPath, html, "utf8");
  return htmlPath;
}

async function writeLatexOutput(outDir: string, baseName: string, latex: string): Promise<string> {
  const texPath = join(outDir, `${baseName}.tex`);
  await writeFile(texPath, latex, "utf8");
  return texPath;
}

export async function runExternalFile(options: RunExternalFileOptions): Promise<RunExternalFileResult> {
  const absoluteInputPath = resolve(options.inputPath);
  const outDir = resolve(options.outDir ?? "build/reactdoc-run");
  const template = options.template ?? "article";
  const baseName = basename(absoluteInputPath, extname(absoluteInputPath));

  await mkdir(outDir, { recursive: true });

  const loadedModule = (await loadExternalDocumentModule(absoluteInputPath)) as ExternalDocumentModule;
  const DocumentComponent = getDocumentComponent(loadedModule);
  const ExternalTemplateComponent = getExternalTemplateComponent(loadedModule);
  const contentElement = React.createElement(DocumentComponent);
  const templateElement = React.createElement(
    ExternalTemplateComponent ?? getBuiltInTemplate(template),
    null
  );

  const documentTree = renderContentToIR(contentElement);
  const templateTree = renderTemplateToIR(templateElement);
  const resolvedTree = resolveDocument(documentTree, templateTree);

  const result: RunExternalFileResult = {
    inputPath: absoluteInputPath,
    outDir,
    baseName,
    formats: options.formats,
    template: ExternalTemplateComponent == null ? template : "external"
  };

  if (options.formats.includes("html")) {
    result.htmlPath = await writeHtmlOutput(outDir, baseName, renderResolvedToHTML(resolvedTree));
  }

  if (options.formats.includes("latex")) {
    result.texPath = await writeLatexOutput(outDir, baseName, renderResolvedToLatex(resolvedTree));
  }

  if (options.formats.includes("pdf")) {
    const pdfResult = await buildPdfFromResolved(resolvedTree, {
      outputDir: outDir,
      baseName
    });
    result.texPath ??= pdfResult.texPath;
    result.pdfPath = pdfResult.pdfPath;
  }

  return result;
}

function parseArgs(argv: string[]): RunExternalFileOptions {
  const positional: string[] = [];
  let outDir: string | undefined;
  let formatValue: string | undefined;
  let templateValue: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--out") {
      outDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--format") {
      formatValue = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--template") {
      templateValue = argv[index + 1];
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  const inputPath = positional[0];
  if (inputPath == null) {
    throw new Error(usage());
  }

  return {
    inputPath,
    outDir,
    formats: parseFormats(formatValue),
    template: parseTemplate(templateValue)
  };
}

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    const result = await runExternalFile(parseArgs(process.argv.slice(2)));
    console.log("ReactDoc external file run completed.");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
