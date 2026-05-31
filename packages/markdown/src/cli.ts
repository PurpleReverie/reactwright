#!/usr/bin/env node --import=tsx
// reactwright-md — render Markdown files through Reactwright.
//
// Mirrors the engine's run-file.tsx CLI but takes a .md file as input
// instead of a .tsx module. The workflow is:
//   1. Read the .md and parse it (frontmatter + body) via
//      markdownToReactwright.
//   2. Resolve the template name (CLI flag > frontmatter > "essay").
//   3. Dynamically import the template package and pull its
//      `Template` export.
//   4. Build content IR + template IR + resolve + render to HTML.
//   5. Optionally write a PDF using the engine's buildPdfFromHtml.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";

import {
  renderContentToIR,
  renderTemplateToIR,
  resolveDocument,
  renderResolvedToHTML,
  buildPdfFromHtml
} from "reactwright";

import { markdownToReactwright } from "./index.js";
import { loadTemplateComponent, normalizeTemplateName } from "./template-router.js";

type CliOptions = {
  inputPath: string;
  outputPath?: string;
  templateOverride?: string;
  htmlOnly: boolean;
};

function usage(): string {
  return [
    "Usage:",
    "  reactwright-md <input.md> [options]",
    "",
    "Options:",
    "  --template=<name>   Override frontmatter template (essay | ieee | report)",
    "  -o, --output=<path> Output file path. Determines output directory and base name.",
    "                      Both .html and .pdf are written next to it.",
    "  --html-only         Skip PDF generation.",
    "  -h, --help          Show this message.",
    "",
    "Examples:",
    "  reactwright-md paper.md",
    "  reactwright-md paper.md --template=ieee -o build/paper.pdf",
    "  reactwright-md paper.md --html-only"
  ].join("\n");
}

function parseArgs(argv: string[]): CliOptions {
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  let templateOverride: string | undefined;
  let htmlOnly = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--html-only") {
      htmlOnly = true;
      continue;
    }
    if (arg === "-o" || arg === "--output") {
      outputPath = argv[++i];
      continue;
    }
    if (arg.startsWith("--output=")) {
      outputPath = arg.slice("--output=".length);
      continue;
    }
    if (arg.startsWith("-o=")) {
      outputPath = arg.slice("-o=".length);
      continue;
    }
    if (arg === "--template") {
      templateOverride = argv[++i];
      continue;
    }
    if (arg.startsWith("--template=")) {
      templateOverride = arg.slice("--template=".length);
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}\n\n${usage()}`);
    }
    if (inputPath == null) {
      inputPath = arg;
      continue;
    }
    throw new Error(`Unexpected positional argument: ${arg}\n\n${usage()}`);
  }

  if (inputPath == null) throw new Error(usage());
  return { inputPath, outputPath, templateOverride, htmlOnly };
}

type OutputPaths = {
  outDir: string;
  baseName: string;
  htmlPath: string;
  pdfPath: string;
};

function deriveOutputPaths(inputPath: string, outputPath?: string): OutputPaths {
  if (outputPath != null) {
    const abs = isAbsolute(outputPath) ? outputPath : resolve(outputPath);
    const ext = extname(abs);
    const baseName = basename(abs, ext);
    const outDir = dirname(abs);
    return {
      outDir,
      baseName,
      htmlPath: join(outDir, `${baseName}.html`),
      pdfPath: join(outDir, `${baseName}.pdf`)
    };
  }
  const abs = resolve(inputPath);
  const outDir = dirname(abs);
  const baseName = basename(abs, extname(abs));
  return {
    outDir,
    baseName,
    htmlPath: join(outDir, `${baseName}.html`),
    pdfPath: join(outDir, `${baseName}.pdf`)
  };
}

export async function runMarkdownFile(options: CliOptions): Promise<{
  htmlPath: string;
  pdfPath?: string;
  template: string;
}> {
  const absoluteInput = resolve(options.inputPath);
  const source = await readFile(absoluteInput, "utf8");
  const { document, frontmatter } = markdownToReactwright(source);

  const requestedTemplate =
    options.templateOverride ??
    (typeof frontmatter.template === "string" ? frontmatter.template : undefined);
  const templateName = normalizeTemplateName(requestedTemplate);
  const Template = await loadTemplateComponent(templateName);

  const contentTree = renderContentToIR(document);
  const templateTree = renderTemplateToIR(React.createElement(Template));
  const resolvedTree = resolveDocument(contentTree, templateTree);
  const html = renderResolvedToHTML(resolvedTree);

  const paths = deriveOutputPaths(absoluteInput, options.outputPath);
  await mkdir(paths.outDir, { recursive: true });
  await writeFile(paths.htmlPath, html, "utf8");

  let pdfPath: string | undefined;
  if (!options.htmlOnly) {
    await buildPdfFromHtml(html, { outputPath: paths.pdfPath });
    pdfPath = paths.pdfPath;
  }

  return { htmlPath: paths.htmlPath, pdfPath, template: templateName };
}

const isDirectRun =
  process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await runMarkdownFile(options);
    console.log("reactwright-md completed.");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
