import test from "node:test";
import assert from "node:assert/strict";
import React from "react";

import { renderContentToIR } from "../src/content/render.js";

test("content renderer creates semantic IR for a minimal document", () => {
  const result = renderContentToIR(
    <document title="Minimal Test" author="Tauraj Greig">
      <section title="Introduction">
        <paragraph>Hello world.</paragraph>
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
            children: [{ kind: "text", value: "Hello world." }]
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
    /paragraph may only contain text|produced no root node/i
  );
});
