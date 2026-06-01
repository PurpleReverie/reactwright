#!/usr/bin/env node
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cliEntry = resolve(here, "../src/cli/run-file.tsx");

// Resolve tsx's loader entry relative to this bin script so the
// shim works no matter what the user's cwd is.
const require = createRequire(import.meta.url);
let tsxImportSpecifier;
try {
  const tsxEsm = require.resolve("tsx/esm");
  tsxImportSpecifier = pathToFileURL(tsxEsm).href;
} catch {
  tsxImportSpecifier = "tsx";
}

const args = process.argv.slice(2);

const child = spawn(
  process.execPath,
  ["--import", tsxImportSpecifier, cliEntry, ...args],
  { stdio: "inherit" }
);

child.on("exit", (code, signal) => {
  if (signal != null) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
