import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import React from "react";

import { buildPdfFromResolved } from "../src/backends/latex/build.js";
import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";

test("PDF build helper writes tex and pdf artifacts", async () => {
  const documentTree = renderContentToIR(
    <document title="PDF Test" author="Tauraj Greig">
      <section title="Intro">
        <paragraph>Hello PDF.</paragraph>
      </section>
    </document>
  );

  const templateTree = renderTemplateToIR(
    <page style={{ size: "a4", margin: "25mm" }}>
      <stack gap="8mm">
        <box style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </box>
        <box>
          <slot name="body" />
        </box>
      </stack>
    </page>
  );

  const resolved = resolveDocument(documentTree, templateTree);
  const result = await buildPdfFromResolved(resolved, {
    outputDir: "build/test-pdf",
    baseName: "test-pdf"
  });

  await access(result.texPath);
  await access(result.pdfPath);

  assert.match(result.texPath, /test-pdf\.tex$/);
  assert.match(result.pdfPath, /test-pdf\.pdf$/);
});
