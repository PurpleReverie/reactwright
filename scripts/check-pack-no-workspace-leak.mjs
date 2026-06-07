#!/usr/bin/env node
// Regression check: ensure no publishable package's pack tarball contains
// a `workspace:` protocol specifier in its package.json. Published
// tarballs must carry real semver ranges so npm consumers can install
// them; a `workspace:*` leak means the publish-time rewrite that pnpm
// (or changesets) is responsible for did not run.
//
// Strategy: glob packages/*, skip private ones, `pnpm pack` each into a
// tmp dir, extract just the inner package.json, and grep for the
// substring "workspace:". Anything found is a leak.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = path.join(ROOT, "packages");

async function publishablePackages() {
  const out = [];
  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(PACKAGES_DIR, entry.name, "package.json");
    let json;
    try {
      json = JSON.parse(await readFile(pkgPath, "utf8"));
    } catch {
      continue;
    }
    if (json.private === true) continue;
    out.push({ name: json.name, dir: path.join(PACKAGES_DIR, entry.name) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function packAndExtractManifest(pkgDir, destDir) {
  execFileSync("pnpm", ["pack", "--pack-destination", destDir], {
    cwd: pkgDir,
    stdio: ["ignore", "ignore", "pipe"],
  });
  const tarball = readdirSync(destDir).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error(`No tarball produced for ${pkgDir}`);
  const tarballPath = path.join(destDir, tarball);
  const extractDir = path.join(destDir, "extract");
  execFileSync("tar", ["-xzf", tarballPath, "-C", destDir]);
  // npm tarballs put files under a top-level "package/" directory.
  const manifestPath = path.join(destDir, "package", "package.json");
  return readFileSync(manifestPath, "utf8");
}

function findWorkspaceLeaks(manifestText) {
  const json = JSON.parse(manifestText);
  const fields = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ];
  const offenders = [];
  for (const field of fields) {
    const block = json[field];
    if (!block || typeof block !== "object") continue;
    for (const [dep, spec] of Object.entries(block)) {
      if (typeof spec === "string" && spec.startsWith("workspace:")) {
        offenders.push(`${field}.${dep} = "${spec}"`);
      }
    }
  }
  return offenders;
}

async function main() {
  const pkgs = await publishablePackages();
  const failures = [];
  for (const pkg of pkgs) {
    const tmp = mkdtempSync(path.join(tmpdir(), "rw-pack-"));
    try {
      const manifest = packAndExtractManifest(pkg.dir, tmp);
      const offenders = findWorkspaceLeaks(manifest);
      if (offenders.length === 0) {
        console.log(`✓ ${pkg.name} — clean`);
      } else {
        console.log(`✗ ${pkg.name} — found workspace:* leaks:`);
        for (const o of offenders) console.log(`    ${o}`);
        failures.push({ name: pkg.name, offenders });
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (failures.length > 0) {
    console.error(
      `\nFAIL: ${failures.length} package(s) leaked workspace:* into their published tarball:`,
    );
    for (const f of failures) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`\nOK: ${pkgs.length} publishable package(s) checked, no workspace:* leaks.`);
}

main().catch((err) => {
  console.error("check-pack-no-workspace-leak: unexpected error");
  console.error(err);
  process.exit(2);
});
