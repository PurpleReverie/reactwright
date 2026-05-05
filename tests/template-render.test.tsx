import test from "node:test";
import assert from "node:assert/strict";
import React from "react";

import { renderTemplateToIR } from "../src/template/render.js";
import { registerTemplateIntrinsic } from "../src/template/registry.js";

test("template renderer creates template IR for a minimal page", () => {
  const result = renderTemplateToIR(
    <page style={{ size: "a4", margin: "25mm" }}>
      <stack gap="8mm">
        <box style={{ textAlign: "center" }}>
          <slot name="title" />
        </box>
        <box>
          <slot name="body" />
        </box>
      </stack>
    </page>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: { size: "a4", margin: "25mm" },
    children: [
      {
        kind: "stack",
        gap: "8mm",
        style: undefined,
        children: [
          {
            kind: "box",
            style: { textAlign: "center" },
            children: [{ kind: "slot", name: "title" }]
          },
          {
            kind: "box",
            style: undefined,
            children: [{ kind: "slot", name: "body" }]
          }
        ]
      }
    ]
  });
});

test("template renderer rejects unknown lowercase intrinsics", () => {
  assert.throws(
    () =>
      renderTemplateToIR(
        <page>{React.createElement("mystery", null)}</page>
      ),
    /unsupported template intrinsic|produced no root node/i
  );
});

test("template renderer accepts registered custom intrinsics", () => {
  registerTemplateIntrinsic({ name: "callout" });

  const result = renderTemplateToIR(
    <page>
      {React.createElement("callout", { tone: "warning" }, <slot name="body" />)}
    </page>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: undefined,
    children: [
      {
        kind: "custom",
        name: "callout",
        props: { tone: "warning" },
        style: undefined,
        children: [{ kind: "slot", name: "body" }]
      }
    ]
  });
});

test("template renderer supports rules and page sets in the new syntax", () => {
  const result = renderTemplateToIR(
    <template style={{ size: "a4" }}>
      <rules>
        <section-role role="scene-heading" variant="sceneHeading" />
        <quote-role role="dialogue" variant="dialogueBlock" />
        <page-role page="script" use="script" />
      </rules>
      <flow gap="8mm">
        <page-set name="script">
          <region>
            <slot name="body" />
          </region>
        </page-set>
      </flow>
    </template>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: { size: "a4" },
    children: [
      {
        kind: "rules",
        children: [
          { kind: "section-role", role: "scene-heading", variant: "sceneHeading" },
          { kind: "quote-role", role: "dialogue", variant: "dialogueBlock" },
          { kind: "page-role", page: "script", use: "script" }
        ]
      },
      {
        kind: "stack",
        gap: "8mm",
        style: undefined,
        children: [
          {
            kind: "page-set",
            name: "script",
            children: [{ kind: "box", style: undefined, children: [{ kind: "slot", name: "body" }] }]
          }
        ]
      }
    ]
  });
});
