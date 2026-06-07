#!/usr/bin/env node
// End-to-end regression check: scaffold a consumer document with the
// local `create-reactwright-doc`, swap its registry deps for local
// `pnpm pack` tarballs, install with plain npm (no pnpm), and build to
// HTML. Verifies that a fresh-from-npm consumer would get a working
// document for every template we ship.
//
// Format is restricted to `html` so we don't need Chromium in CI.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = path.join(ROOT, "packages");
const SCAFFOLDER = path.join(PACKAGES_DIR, "create-reactwright-doc", "src", "index.js");

// Template key → workspace package directory. Mirrors TEMPLATES in
// packages/create-reactwright-doc/src/index.js.
const TEMPLATES = {
  essay: { pkg: "@reactwright/template-essay", dir: "template-essay" },
  ieee: { pkg: "@reactwright/template-ieee", dir: "template-ieee" },
  "ieee-report": { pkg: "@reactwright/template-ieee-report", dir: "template-ieee-report" },
  report: { pkg: "@reactwright/template-report", dir: "template-report" },
  book: { pkg: "@reactwright/template-book", dir: "template-book" },
  letter: { pkg: "@reactwright/template-letter", dir: "template-letter" },
};

const MIN_HTML_BYTES = 1024; // anything under this is almost certainly an empty shell

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "pipe", ...opts });
}

function packOne(srcDir, destDir) {
  run("pnpm", ["pack", "--pack-destination", destDir], { cwd: srcDir });
  const tgz = readdirSync(destDir).find(
    (f) => f.endsWith(".tgz") && !existsSync(path.join(destDir, f + ".consumed")),
  );
  if (!tgz) throw new Error(`pnpm pack produced no tarball for ${srcDir}`);
  // Mark consumed so the next pack call picks a fresh one even if the
  // filename happens to collide.
  writeFileSync(path.join(destDir, tgz + ".consumed"), "");
  return path.join(destDir, tgz);
}

async function buildTarballSet(tarballDir) {
  // Pack reactwright + all six templates once and reuse across scaffolds.
  const set = {};
  console.log("→ packing local workspace packages…");
  set.reactwright = packOne(path.join(PACKAGES_DIR, "reactwright"), tarballDir);
  console.log(`    reactwright → ${path.basename(set.reactwright)}`);
  for (const [key, info] of Object.entries(TEMPLATES)) {
    const tgz = packOne(path.join(PACKAGES_DIR, info.dir), tarballDir);
    set[info.pkg] = tgz;
    console.log(`    ${info.pkg} → ${path.basename(tgz)}`);
  }
  return set;
}

function rewriteConsumerPkg(consumerDir, tarballs, templatePkg) {
  const pkgPath = path.join(consumerDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies.reactwright = `file:${tarballs.reactwright}`;
  pkg.dependencies[templatePkg] = `file:${tarballs[templatePkg]}`;
  // Force any transitive reactwright peer (from the template) to resolve
  // to the local tarball, not the npm registry.
  pkg.overrides = {
    ...(pkg.overrides || {}),
    reactwright: `file:${tarballs.reactwright}`,
  };
  // Drop PDF format so we don't need Chromium.
  if (pkg.scripts && typeof pkg.scripts.build === "string") {
    pkg.scripts.build = pkg.scripts.build.replace("--format html,pdf", "--format html");
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function scaffold(templateKey, parentDir) {
  const name = `consumer-${templateKey}`;
  run("node", [SCAFFOLDER, name, `--template=${templateKey}`], { cwd: parentDir });
  return { name, dir: path.join(parentDir, name) };
}

function npmInstall(dir) {
  try {
    run("npm", ["install", "--no-audit", "--no-fund", "--silent"], { cwd: dir });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : "";
    const stdout = err.stdout ? err.stdout.toString() : "";
    throw new Error(`npm install failed:\n${stderr || stdout}`);
  }
}

function npmBuild(dir) {
  try {
    run("npm", ["run", "build", "--silent"], { cwd: dir });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : "";
    const stdout = err.stdout ? err.stdout.toString() : "";
    throw new Error(`npm run build failed:\n${stderr || stdout}`);
  }
}

function assertHtmlOutput(dir, entryBase) {
  const htmlPath = path.join(dir, `${entryBase}.html`);
  if (!existsSync(htmlPath)) {
    throw new Error(`expected HTML output at ${htmlPath}, not found`);
  }
  const size = statSync(htmlPath).size;
  if (size < MIN_HTML_BYTES) {
    throw new Error(`HTML output too small (${size} bytes < ${MIN_HTML_BYTES}); likely empty`);
  }
  return size;
}

async function checkOne(templateKey, tarballs, workRoot) {
  const parentDir = mkdtempSync(path.join(workRoot, `scaffold-${templateKey}-`));
  const info = TEMPLATES[templateKey];
  const { name, dir } = scaffold(templateKey, parentDir);
  rewriteConsumerPkg(dir, tarballs, info.pkg);
  npmInstall(dir);
  npmBuild(dir);
  const size = assertHtmlOutput(dir, name);
  return { name, dir, size };
}

async function main() {
  const workRoot = mkdtempSync(path.join(tmpdir(), "rw-scaffold-"));
  const tarballDir = path.join(workRoot, "tarballs");
  mkdirSync(tarballDir, { recursive: true });
  let failures = 0;
  try {
    const tarballs = await buildTarballSet(tarballDir);
    for (const key of Object.keys(TEMPLATES)) {
      process.stdout.write(`→ ${key}: scaffolding + installing + building… `);
      try {
        const { size } = await checkOne(key, tarballs, workRoot);
        console.log(`✓ ${size} bytes`);
      } catch (err) {
        console.log("✗");
        console.error(`  ${err.message.split("\n").slice(0, 8).join("\n  ")}`);
        failures += 1;
      }
    }
  } finally {
    // Leave tmp dirs in place if anything failed, to aid debugging.
    if (failures === 0) rmSync(workRoot, { recursive: true, force: true });
    else console.error(`\n(work tree retained at ${workRoot} for inspection)`);
  }
  if (failures > 0) {
    console.error(`\nFAIL: ${failures} of ${Object.keys(TEMPLATES).length} templates failed.`);
    process.exit(1);
  }
  console.log(`\nOK: ${Object.keys(TEMPLATES).length} templates scaffolded, installed, and built to HTML.`);
}

main().catch((err) => {
  console.error("check-scaffold-build: unexpected error");
  console.error(err);
  process.exit(2);
});
