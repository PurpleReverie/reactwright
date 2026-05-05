import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import React from "react";

import { renderContentToIR } from "../src/content/render.js";

test("content renderer creates semantic IR for a minimal document", () => {
  const result = renderContentToIR(
    <document title="Minimal Test" author="Tauraj Greig">
      <section title="Introduction">
        <paragraph>
          Hello <em>world</em> with <strong>emphasis</strong> and <code>inline-code</code>.
        </paragraph>
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
          alt="Tiny test swatch"
          caption="A tiny figure used to validate the figure primitive."
          width="40mm"
        />
      </section>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Minimal Test",
    author: "Tauraj Greig",
    children: [
      {
        kind: "section",
        title: "Introduction",
        children: [
          {
            kind: "paragraph",
            children: [
              { kind: "text", value: "Hello " },
              { kind: "em", children: [{ kind: "text", value: "world" }] },
              { kind: "text", value: " with " },
              { kind: "strong", children: [{ kind: "text", value: "emphasis" }] },
              { kind: "text", value: " and " },
              { kind: "code", children: [{ kind: "text", value: "inline-code" }] },
              { kind: "text", value: "." }
            ]
          },
          {
            kind: "figure",
            src: resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png"),
            alt: "Tiny test swatch",
            caption: "A tiny figure used to validate the figure primitive.",
            width: "40mm"
          }
        ]
      }
    ]
  });
});

test("content renderer rejects non-document roots", () => {
  assert.throws(
    () =>
      renderContentToIR(
        <section title="Bad Root">
          <paragraph>Nope.</paragraph>
        </section>
      ),
    /expected a `document` root/i
  );
});

test("content renderer rejects block children inside paragraph", () => {
  assert.throws(
    () =>
      renderContentToIR(
        <document title="Broken">
          <paragraph>
            {/** invalid on purpose */}
            <section title="Nested">Bad child.</section>
          </paragraph>
        </document>
      ),
    /paragraph may only contain inline primitives|produced no root node/i
  );
});

test("content renderer supports concise block aliases and page breaks", () => {
  const result = renderContentToIR(
    <document title="Paged Test">
      <section title="Worldbuilding" page="world">
        <p>First mode.</p>
      </section>
      <page-break />
      <section title="Script" role="scene-heading" page="script">
        <quote role="dialogue" speaker="ALDRIC">
          <p>Second mode.</p>
        </quote>
      </section>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Paged Test",
    children: [
      {
        kind: "section",
        title: "Worldbuilding",
        page: "world",
        children: [{ kind: "paragraph", children: [{ kind: "text", value: "First mode." }] }]
      },
      { kind: "page-break" },
      {
        kind: "section",
        title: "Script",
        role: "scene-heading",
        page: "script",
        children: [
          {
            kind: "blockquote",
            role: "dialogue",
            speaker: "ALDRIC",
            children: [{ kind: "paragraph", children: [{ kind: "text", value: "Second mode." }] }]
          }
        ]
      }
    ]
  });
});

test("content renderer rejects empty metadata tokens", () => {
  assert.throws(
    () =>
      renderContentToIR(
        <document title="Broken">
          <section title="Bad" role="   ">
            <p>Nope.</p>
          </section>
        </document>
      ),
    /`role` must be a non-empty string|produced no root node/i
  );
});
