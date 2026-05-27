import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import React from "react";

import { renderContentToIR } from "../src/content/render.js";

test("content renderer creates semantic IR for a minimal document", () => {
  const result = renderContentToIR(
    <document title="Minimal Test" author="Tauraj Greig">
      <section title="Introduction">
        <p>
          Hello <em>world</em> with <strong>emphasis</strong> and <code>inline-code</code>.
        </p>
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
          <p>Nope.</p>
        </section>
      ),
    /expected a `document` root/i
  );
});

test("content renderer rejects block children inside p", () => {
  assert.throws(
    () =>
      renderContentToIR(
        <document title="Broken">
          <p>
            {/** invalid on purpose */}
            <section title="Nested">Bad child.</section>
          </p>
        </document>
      ),
    /`p` may only contain inline primitives|produced no root node/i
  );
});

test("content renderer carries routing props and page-break primitive", () => {
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

test("content renderer supports br, sub, sup inline primitives", () => {
  const result = renderContentToIR(
    <document title="Inline finishes">
      <p>
        Line one.<br />Line two.
      </p>
      <p>
        H<sub>2</sub>O and x<sup>2</sup>.
      </p>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Inline finishes",
    children: [
      {
        kind: "paragraph",
        children: [
          { kind: "text", value: "Line one." },
          { kind: "br" },
          { kind: "text", value: "Line two." }
        ]
      },
      {
        kind: "paragraph",
        children: [
          { kind: "text", value: "H" },
          { kind: "sub", children: [{ kind: "text", value: "2" }] },
          { kind: "text", value: "O and x" },
          { kind: "sup", children: [{ kind: "text", value: "2" }] },
          { kind: "text", value: "." }
        ]
      }
    ]
  });
});

test("content renderer supports links and code-block primitives", () => {
  const result = renderContentToIR(
    <document title="Markdown-ish">
      <p>
        Visit <link href="https://example.com">Example</link>.
      </p>
      <code-block language="ts">const answer = 42;</code-block>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Markdown-ish",
    children: [
      {
        kind: "paragraph",
        children: [
          { kind: "text", value: "Visit " },
          {
            kind: "link",
            href: "https://example.com",
            children: [{ kind: "text", value: "Example" }]
          },
          { kind: "text", value: "." }
        ]
      },
      {
        kind: "code-block",
        language: "ts",
        children: [{ kind: "text", value: "const answer = 42;" }]
      }
    ]
  });
});

test("content renderer supports table primitives with row/cell", () => {
  const result = renderContentToIR(
    <document title="Tables">
      <table caption="House alignment">
        <row>
          <cell header>
            <p>House</p>
          </cell>
          <cell header>
            <p>Seat</p>
          </cell>
        </row>
        <row>
          <cell>
            <p>Vael</p>
          </cell>
          <cell>
            <p>Greycrown</p>
          </cell>
        </row>
      </table>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Tables",
    children: [
      {
        kind: "table",
        caption: "House alignment",
        children: [
          {
            kind: "row",
            children: [
              { kind: "cell", header: true, children: [{ kind: "paragraph", children: [{ kind: "text", value: "House" }] }] },
              { kind: "cell", header: true, children: [{ kind: "paragraph", children: [{ kind: "text", value: "Seat" }] }] }
            ]
          },
          {
            kind: "row",
            children: [
              { kind: "cell", header: undefined, children: [{ kind: "paragraph", children: [{ kind: "text", value: "Vael" }] }] },
              { kind: "cell", header: undefined, children: [{ kind: "paragraph", children: [{ kind: "text", value: "Greycrown" }] }] }
            ]
          }
        ]
      }
    ]
  });
});
