import test from "node:test";
import assert from "node:assert/strict";
import React from "react";

import { renderTemplateToIR } from "../src/template/render.js";
import { registerTemplateIntrinsic } from "../src/template/registry.js";

test("template renderer creates template IR for a minimal page", () => {
  const result = renderTemplateToIR(
    <page style={{ size: "a4", margin: "25mm" }}>
      <stack gap="8mm">
        <region style={{ textAlign: "center" }}>
          <slot name="title" />
        </region>
        <region>
          <slot name="body" />
        </region>
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
            kind: "region",
            style: { textAlign: "center" },
            children: [{ kind: "slot", name: "title" }]
          },
          {
            kind: "region",
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
    <page
      page={{ size: "a4", margin: "25mm" }}
      typography={{ fontFamily: "serif", fontSize: "11pt", textAlign: "center" }}
      paragraph={{ paragraphSpacing: "0.8em" }}
      box={{ backgroundColor: "#fffdf8" }}
      style={{ sectionStyle: "label" }}
    >
      <stack layout={{ gap: "8mm" }}>
        <region
          box={{ paddingBottom: "4mm", borderBottom: "1pt solid #000000" }}
          typography={{ textAlign: "center" }}
        >
          <slot name="title" />
        </region>
      </stack>
    </page>
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
            kind: "region",
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

test("template renderer supports layer primitive with z-order and when", () => {
  const result = renderTemplateToIR(
    <page>
      <layer name="paper">
        <region fill style={{ backgroundColor: "#fbf7ee" }} />
      </layer>
      <layer name="content">
        <slot name="body" />
      </layer>
      <layer name="watermark" when="not-first-page">
        <region center style={{ opacity: 0.06 }}>DRAFT</region>
      </layer>
    </page>
  );

  assert.equal(result.children.length, 3);
  assert.equal(result.children[0]?.kind, "layer");
  assert.equal(result.children[0]?.name, "paper");
  assert.equal(result.children[2]?.kind, "layer");
  assert.equal(result.children[2]?.when, "not-first-page");
  const paperRegion = (result.children[0] as { children: { kind: string; positioning?: { fill?: boolean } }[] }).children[0];
  assert.equal(paperRegion.kind, "region");
  assert.equal(paperRegion.positioning?.fill, true);
});

test("template renderer supports fixed as overlay primitive with conditional when", () => {
  const result = renderTemplateToIR(
    <page>
      <fixed anchor="page-bottom-right" when="first-page" typography={{ fontSize: "8pt" }}>
        <page-number />
      </fixed>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: undefined,
    children: [
      {
        kind: "fixed",
        anchor: "page-bottom-right",
        when: "first-page",
        style: { fontSize: "8pt" },
        children: [{ kind: "page-number", style: undefined }]
      },
      {
        kind: "stack",
        gap: undefined,
        style: undefined,
        children: [{ kind: "slot", name: "body" }]
      }
    ]
  });
});

test("template renderer supports page-number as a standalone template primitive", () => {
  const result = renderTemplateToIR(
    <page>
      <page-number typography={{ fontSize: "8pt" }} />
    </page>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: undefined,
    children: [{ kind: "page-number", style: { fontSize: "8pt" } }]
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

test("template renderer supports header/footer/page-count primitives with anchors and when", () => {
  const result = renderTemplateToIR(
    <page>
      <header anchor="top-center" when="not-first-page">
        <slot name="title" />
      </header>
      <footer anchor="bottom-center">
        <page-number /> of <page-count />
      </footer>
      <stack>
        <slot name="body" />
      </stack>
    </page>
  );

  assert.equal(result.children.length, 3);
  assert.equal(result.children[0]?.kind, "header");
  assert.equal(result.children[0]?.anchor, "top-center");
  assert.equal(result.children[0]?.when, "not-first-page");
  assert.equal(result.children[1]?.kind, "footer");
  const footer = result.children[1] as { children: { kind: string }[] };
  assert.equal(footer.children.some((c) => c.kind === "page-number"), true);
  assert.equal(footer.children.some((c) => c.kind === "page-count"), true);
});

test("template renderer supports unified role and page rules", () => {
  const result = renderTemplateToIR(
    <page style={{ size: "a4" }}>
      <rules>
        <role match="scene-heading" apply="sceneHeading" />
        <role on="quote" match="dialogue" apply="dialogueBlock" />
        <role on="paragraph" match="lead" apply="leadParagraph" />
        <page match="script" use="script" />
      </rules>
      <stack gap="8mm">
        <page-set name="script">
          <region>
            <slot name="body" />
          </region>
        </page-set>
      </stack>
    </page>
  );

  assert.deepEqual(result, {
    kind: "page",
    style: { size: "a4" },
    children: [
      {
        kind: "rules",
        children: [
          { kind: "role-rule", match: "scene-heading", apply: "sceneHeading" },
          { kind: "role-rule", match: "dialogue", apply: "dialogueBlock", on: "quote" },
          { kind: "role-rule", match: "lead", apply: "leadParagraph", on: "paragraph" },
          { kind: "page-rule", match: "script", use: "script" }
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
            style: undefined,
            children: [{ kind: "region", style: undefined, children: [{ kind: "slot", name: "body" }] }]
          }
        ]
      }
    ]
  });
});

test("template renderer rejects empty rule tokens", () => {
  assert.throws(
    () =>
      renderTemplateToIR(
        <page>
          <rules>
            <role match="scene-heading" apply="   " />
          </rules>
        </page>
      ),
    /`apply` must be a non-empty string|produced no root node/i
  );
});

test("template renderer rejects non-object typed prop groups", () => {
  assert.throws(
    () =>
      renderTemplateToIR(
        React.createElement("page", { typography: "serif" }, React.createElement("slot", { name: "body" }))
      ),
    /`typography` must be an object|produced no root node/i
  );
});

test("template renderer rejects invalid fixed when value", () => {
  assert.throws(
    () =>
      renderTemplateToIR(
        React.createElement("page", null, React.createElement("fixed", { anchor: "page-top-right", when: "chapter" }))
      ),
    /`fixed` `when` must be|produced no root node/i
  );
});
