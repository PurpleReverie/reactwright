import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";

// Tests that operate on resolveDocument's output structure (resolved
// IR), not on the rendered HTML. Slot filling, role-rule assignment,
// page-set regime-flow capture.

function createPaper() {
  return (
    <document title="Pipeline Test" author="Tauraj Greig">
      <abstract>
        <p>
          Testing <em>end-to-end</em> resolution.
        </p>
      </abstract>
      <section title="Intro">
        <p>
          Hello <strong>world</strong>.
        </p>
      </section>
    </document>
  );
}

function createTemplate() {
  return (
    <page style={{ size: "a4", margin: "25mm", fontSize: "11pt" }}>
      <stack gap="8mm">
        <region style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region>
          <slot name="abstract" />
        </region>
        <region>
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}

test("resolver fills title author abstract and body slots", () => {
  const resolved = resolveDocument(
    renderContentToIR(createPaper()),
    renderTemplateToIR(createTemplate())
  );
  assert.equal(resolved.kind, "page");
  assert.equal(resolved.children[0]?.kind, "stack");
  const stack = resolved.children[0];
  assert.equal(stack.kind, "stack");
  assert.equal(stack.children[0]?.kind, "region");
  assert.equal(stack.children[1]?.kind, "region");
  assert.equal(stack.children[2]?.kind, "region");
});

test("resolver applies role rules and stores page-set body flow as a per-regime template", () => {
  const documentTree = renderContentToIR(
    <document title="Story Pilot">
      <section title="World" page="world">
        <p role="lead">World copy.</p>
        <figure
          role="map"
          src={resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png")}
          caption="Map"
          width="20mm"
        />
        <list role="checklist">
          <item>
            <p>Bullet.</p>
          </item>
        </list>
      </section>
      <section title="Scene One" role="scene-heading" page="script">
        <quote role="dialogue">
          <p>Dialogue line.</p>
        </quote>
      </section>
    </document>
  );

  const templateTree = renderTemplateToIR(
    <page>
      <rules>
        <role on="section" match="scene-heading" apply="sceneHeading" />
        <role on="quote" match="dialogue" apply="dialogueBlock" />
        <role on="paragraph" match="lead" apply="leadParagraph" />
        <role on="list" match="checklist" apply="compactChecklist" />
        <role on="figure" match="map" apply="framedMap" />
        <page match="world" use="world" />
        <page match="script" use="script" />
      </rules>
      <page-set name="world">
        <region>
          <slot name="body" />
        </region>
      </page-set>
      <page-set name="script">
        <region>
          <slot name="body" />
        </region>
      </page-set>
      <region>
        <slot name="body" />
      </region>
    </page>
  );

  const resolved = resolveDocument(documentTree, templateTree);

  // Page-sets are declarations: their body flow becomes a regime
  // template, keyed by name. The flow template contains a body-slot
  // marker that the renderer fills per-section.
  const flows = resolved.regimeFlows;
  assert.ok(flows != null);
  const worldFlow = flows.world;
  assert.equal(worldFlow.length, 1);
  assert.equal(worldFlow[0]?.kind, "region");
  assert.equal(worldFlow[0]?.children[0]?.kind, "body-slot");
  const scriptFlow = flows.script;
  assert.equal(scriptFlow[0]?.kind, "region");
  assert.equal(scriptFlow[0]?.children[0]?.kind, "body-slot");

  // The page-level body slot streams all body sections in document
  // order (no regime filtering). Role rules are still applied to each
  // section's contents.
  const region = resolved.children[0];
  assert.equal(region?.kind, "region");
  assert.equal(region.children.length, 2);
  const sec0 = region.children[0];
  assert.equal(sec0?.kind, "section");
  if (sec0?.kind !== "section") throw new Error("expected section");
  assert.equal(sec0.title, "World");
  assert.equal((sec0.children[0] as { variant?: string }).variant, "leadParagraph");
  assert.equal((sec0.children[1] as { variant?: string }).variant, "framedMap");
  assert.equal((sec0.children[2] as { variant?: string }).variant, "compactChecklist");
  const sec1 = region.children[1];
  assert.equal(sec1?.kind, "section");
  if (sec1?.kind !== "section") throw new Error("expected section");
  assert.equal(sec1.variant, "sceneHeading");
  assert.equal((sec1.children[0] as { variant?: string }).variant, "dialogueBlock");
});
