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

test("template renderer flattens typed template prop groups into style IR", () => {
  const result = renderTemplateToIR(
    <template
      page={{ size: "a4", margin: "25mm" }}
      typography={{ fontFamily: "serif", fontSize: "11pt", textAlign: "center" }}
      paragraph={{ paragraphSpacing: "0.8em" }}
      box={{ backgroundColor: "#fffdf8" }}
      style={{ sectionStyle: "label" }}
    >
      <flow layout={{ gap: "8mm" }}>
        <region
          box={{ paddingBottom: "4mm", borderBottom: "1pt solid #000000" }}
          typography={{ textAlign: "center" }}
        >
          <slot name="title" />
        </region>
      </flow>
    </template>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: {
      size: "a4",
      margin: "25mm",
      fontFamily: "serif",
      fontSize: "11pt",
      textAlign: "center",
      paragraphSpacing: "0.8em",
      backgroundColor: "#fffdf8",
      sectionStyle: "label"
    },
    children: [
      {
        kind: "stack",
        gap: "8mm",
        style: { gap: "8mm" },
        children: [
          {
            kind: "box",
            style: {
              paddingBottom: "4mm",
              borderBottom: "1pt solid #000000",
              textAlign: "center"
            },
            children: [{ kind: "slot", name: "title" }]
          }
        ]
      }
    ]
  });
});

test("template renderer supports row and rule intrinsics", () => {
  const result = renderTemplateToIR(
    <template>
      <row gap="6mm">
        <region box={{ width: "60%" }}>
          <slot name="title" />
        </region>
        <rule weight="0.8pt" color="#c8a96b" length="100%" />
        <region box={{ width: "40%" }}>
          <slot name="author" />
        </region>
      </row>
    </template>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: undefined,
    children: [
      {
        kind: "row",
        gap: "6mm",
        style: undefined,
        children: [
          {
            kind: "box",
            style: { width: "60%" },
            children: [{ kind: "slot", name: "title" }]
          },
          {
            kind: "rule",
            axis: undefined,
            weight: "0.8pt",
            color: "#c8a96b",
            length: "100%",
            style: undefined
          },
          {
            kind: "box",
            style: { width: "40%" },
            children: [{ kind: "slot", name: "author" }]
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

test("template renderer rejects empty rule tokens and invalid columns", () => {
  assert.throws(
    () =>
      renderTemplateToIR(
        <template>
          <rules>
            <section-role role="scene-heading" variant="   " />
          </rules>
        </template>
      ),
    /`variant` must be a non-empty string|produced no root node/i
  );

  assert.throws(
    () =>
      renderTemplateToIR(
        <template>
          <columns count={0}>
            <slot name="body" />
          </columns>
        </template>
      ),
    /positive integer `count`|produced no root node/i
  );
});

test("template renderer rejects non-object typed prop groups", () => {
  assert.throws(
    () =>
      renderTemplateToIR(
        React.createElement("template", { typography: "serif" }, React.createElement("slot", { name: "body" }))
      ),
    /`typography` must be an object|produced no root node/i
  );
});
