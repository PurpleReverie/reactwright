import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

import { runExternalFile } from "../src/cli/run-file.js";

test("external file runner emits html and latex artifacts from a playground tsx file", async () => {
  const result = await runExternalFile({
    inputPath: "./playground/paper.tsx",
    outDir: "./build/test-run-file",
    formats: ["html", "latex"]
  });

  assert.equal(result.baseName, "paper");
  assert.ok(result.htmlPath);
  assert.ok(result.texPath);

  await access(result.htmlPath);
  await access(result.texPath);

  const html = await readFile(result.htmlPath, "utf8");
  const latex = await readFile(result.texPath, "utf8");

  assert.match(html, /Playground Paper/);
  assert.match(latex, /\\section\{Introduction\}/);
});

test("external file runner prefers an external template export and resolves sub-file imports", async () => {
  const result = await runExternalFile({
    inputPath: "./playground/custom-doc.tsx",
    outDir: "./build/test-run-file-custom",
    formats: ["html", "latex"]
  });

  assert.equal(result.template, "external");
  assert.ok(result.htmlPath);
  assert.ok(result.texPath);

  const html = await readFile(result.htmlPath, "utf8");
  const latex = await readFile(result.texPath, "utf8");

  assert.match(html, /border-bottom:2px solid #cbd5e1/);
  assert.match(html, /one external module/i);
  assert.match(html, /imported from a sibling playground sub-file/i);
  assert.match(latex, /Same File Custom Doc/);
  assert.match(latex, /imported from a sibling playground sub-file/i);
});
