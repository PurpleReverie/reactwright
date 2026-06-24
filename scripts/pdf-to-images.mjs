#!/usr/bin/env node
// Dev/debugging helper: rasterize a PDF to one PNG per page so rendered
// output can be eyeballed (or diffed) against a reference. Wraps the
// `pdftoppm` binary from poppler.
//
// Usage:
//   node scripts/pdf-to-images.mjs <input.pdf> [outDir] [--dpi N]
//
// Defaults: outDir = <pdf-dir>/<pdf-name>-pages, dpi = 150.
// Writes <outDir>/page-01.png, page-02.png, …

import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const input = positional[0];
if (input == null) {
  console.error("usage: node scripts/pdf-to-images.mjs <input.pdf> [outDir] [--dpi N]");
  process.exit(1);
}

const dpiFlag = args.find((a) => a.startsWith("--dpi"));
const dpi = dpiFlag != null ? Number(dpiFlag.split("=")[1] ?? args[args.indexOf(dpiFlag) + 1]) : 150;

const base = path.basename(input).replace(/\.pdf$/i, "");
const outDir = positional[1] ?? path.join(path.dirname(input), `${base}-pages`);
mkdirSync(outDir, { recursive: true });

execFileSync(
  "pdftoppm",
  ["-png", "-r", String(dpi), input, path.join(outDir, "page")],
  { stdio: "inherit" }
);

console.log(`rendered ${input} -> ${outDir}/page-*.png @ ${dpi}dpi`);
