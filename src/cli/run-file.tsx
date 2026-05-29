import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";

import { renderResolvedToHTML } from "../backends/html/render.js";
import { buildPdfFromHtml } from "../backends/pdf/render.js";
import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";

// Minimal fallback template used when an input .tsx doesn't export a Template.
// Templates are user-land; the engine doesn't ship a starter kit. This is a
// last-resort default so a bare content file still renders something.
function DefaultTemplate() {
  return (
    <page style={{ size: "a4", margin: "25mm", fontFamily: "serif", fontSize: "11pt", lineHeight: 1.4 }}>
      <stack gap="6mm">
        <region style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region>
          <slot name="abstract" />
        </region>
        <region>
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}

type OutputFormat = "html" | "pdf";

type RunExternalFileOptions = {
  inputPath: string;
  outDir?: string;
  formats: OutputFormat[];
};

type RunExternalFileResult = {
  inputPath: string;
  outDir: string;
  baseName: string;
  formats: OutputFormat[];
  template: "default" | "external";
  htmlPath?: string;
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
    "  node --import tsx ./src/cli/run-file.ts <input.tsx> [--format html,pdf] [--out ./build/reactdoc-run]",
    "",
    "Examples:",
    "  node --import tsx ./src/cli/run-file.ts ./playground/paper.tsx --format html",
    "  node --import tsx ./src/cli/run-file.ts ./playground/paper.tsx --format html,pdf",
    "",
    "PDF output requires `puppeteer` or `puppeteer-core` to be installed:",
    "  npm install puppeteer        # bundles its own Chromium",
    "  npm install puppeteer-core  # uses system Chrome via PUPPETEER_EXECUTABLE_PATH"
  ].join("\n");
}

function parseFormats(value: string | undefined): OutputFormat[] {
  const raw = (value ?? "html").split(",").map((entry) => entry.trim()).filter(Boolean);
  const formats = new Set<OutputFormat>();

  for (const entry of raw) {
    if (entry === "html" || entry === "pdf") {
      formats.add(entry);
      continue;
    }

    throw new Error(`Unsupported format: ${entry}. Supported formats: html, pdf.`);
  }

  return [...formats];
}

async function loadExternalDocumentModule(inputPath: string): Promise<unknown> {
  const absolutePath = resolve(inputPath);
  return import(pathToFileURL(absolutePath).href);
}

function isComponent(value: unknown): value is React.ComponentType {
  return typeof value === "function";
}

// Look up the first function-typed export among `names` on the loaded
// module. Used to find both the document component (default / Content
// / content) and the template component (Template / template).
function pickComponent(
  moduleValue: ExternalDocumentModule,
  names: readonly string[]
): React.ComponentType | null {
  if (typeof moduleValue !== "object" || moduleValue == null) return null;
  const bag = moduleValue as Record<string, unknown>;
  for (const name of names) {
    if (isComponent(bag[name])) return bag[name] as React.ComponentType;
  }
  return null;
}

function getDocumentComponent(moduleValue: ExternalDocumentModule): React.ComponentType {
  const found = pickComponent(moduleValue, ["default", "Content", "content"]);
  if (found != null) return found;
  throw new Error(
    "Input file must export content as `default`, `Content`, or `content`."
  );
}

function getExternalTemplateComponent(moduleValue: ExternalDocumentModule): React.ComponentType | null {
  return pickComponent(moduleValue, ["Template", "template"]);
}

async function writeHtmlOutput(outDir: string, baseName: string, html: string): Promise<string> {
  const htmlPath = join(outDir, `${baseName}.html`);
  await writeFile(htmlPath, html, "utf8");
  return htmlPath;
}

export async function runExternalFile(options: RunExternalFileOptions): Promise<RunExternalFileResult> {
  const absoluteInputPath = resolve(options.inputPath);
  const outDir = resolve(options.outDir ?? "build/reactdoc-run");
  const baseName = basename(absoluteInputPath, extname(absoluteInputPath));

  await mkdir(outDir, { recursive: true });

  const loadedModule = (await loadExternalDocumentModule(absoluteInputPath)) as ExternalDocumentModule;
  const DocumentComponent = getDocumentComponent(loadedModule);
  const ExternalTemplateComponent = getExternalTemplateComponent(loadedModule);
  const contentElement = React.createElement(DocumentComponent);
  const templateElement = React.createElement(
    ExternalTemplateComponent ?? DefaultTemplate,
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
    template: ExternalTemplateComponent == null ? "default" : "external"
  };

  const html = renderResolvedToHTML(resolvedTree);

  if (options.formats.includes("html")) {
    result.htmlPath = await writeHtmlOutput(outDir, baseName, html);
  }

  if (options.formats.includes("pdf")) {
    const pdfPath = join(outDir, `${baseName}.pdf`);
    await buildPdfFromHtml(html, { outputPath: pdfPath });
    result.pdfPath = pdfPath;
  }

  return result;
}

function parseArgs(argv: string[]): RunExternalFileOptions {
  const positional: string[] = [];
  let outDir: string | undefined;
  let formatValue: string | undefined;

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

    positional.push(arg);
  }

  const inputPath = positional[0];
  if (inputPath == null) {
    throw new Error(usage());
  }

  return {
    inputPath,
    outDir,
    formats: parseFormats(formatValue)
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
