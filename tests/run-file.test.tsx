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
