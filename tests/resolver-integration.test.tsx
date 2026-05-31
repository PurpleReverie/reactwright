import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import React from "react";

import { renderContentToIR } from "../src/content/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";

// Tests that operate on resolveDocument's output structure (resolved
// IR), not on the rendered HTML. Slot filling, role-rule assignment,
// page-set regime-flow capture.

function createPaper() {
  return (
    <document title="Pipeline Test" author="Tauraj Greig">
      <section role="abstract" title="">
        <p>
          Testing <em>end-to-end</em> resolution.
        </p>
      </section>
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
          src={resolve(process.cwd(), "tests/fixtures/reactwright-swatch.png")}
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
  // Slice 5.1: children[0] is the synthesized section-heading node;
  // the original content children shift by one.
  assert.equal((sec0.children[0] as { kind: string }).kind, "section-heading");
  assert.equal((sec0.children[1] as { variant?: string }).variant, "leadParagraph");
  assert.equal((sec0.children[2] as { variant?: string }).variant, "framedMap");
  assert.equal((sec0.children[3] as { variant?: string }).variant, "compactChecklist");
  const sec1 = region.children[1];
  assert.equal(sec1?.kind, "section");
  if (sec1?.kind !== "section") throw new Error("expected section");
  assert.equal(sec1.variant, "sceneHeading");
  assert.equal((sec1.children[0] as { kind: string }).kind, "section-heading");
  assert.equal((sec1.children[1] as { variant?: string }).variant, "dialogueBlock");
});

// --- Slice 6.2: data-source primitives ------------------------------

test("bib-data passes merged ref-entry + cite-key entries to its render-prop", () => {
  const captured: { key: string; used: boolean; text?: string }[][] = [];
  const documentTree = renderContentToIR(
    <document title="Cited">
      <section title="Body">
        <p>
          Per <cite cite="smith-2024" />, the result holds.
        </p>
      </section>
      <refs>
        <ref-entry refKey="smith-2024">
          Smith, A. (2024). <em>Robust Results</em>.
        </ref-entry>
        <ref-entry refKey="jones-2023">
          Jones, B. (2023). Other Work.
        </ref-entry>
      </refs>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <region>
        <slot name="body" />
        <bib-data>
          {(entries) => {
            captured.push(entries);
            return (
              <region>
                <slot name="abstract" />
              </region>
            );
          }}
        </bib-data>
      </region>
    </page>
  );
  resolveDocument(documentTree, template);
  assert.equal(captured.length, 1, "bib-data render-prop ran once");
  const entries = captured[0];
  // Order: ref-entry insertion order first, then cite-only placeholders.
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.key, "smith-2024");
  assert.equal(entries[0]?.used, true);
  assert.equal(entries[1]?.key, "jones-2023");
  assert.equal(entries[1]?.used, false);
});

test("bib-entry-content substitutes the resolved inline body of the matching ref-entry", () => {
  const documentTree = renderContentToIR(
    <document title="Cited">
      <section title="Body">
        <p>
          Per <cite cite="smith-2024" />.
        </p>
      </section>
      <refs>
        <ref-entry refKey="smith-2024">
          Smith, A. (2024). <em>Robust</em> Results.
        </ref-entry>
      </refs>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <region>
        <bib-data>
          {(entries) => (
            <region>
              {entries.map((e) => (
                <React.Fragment key={e.key}>
                  <stack>
                    <bib-entry-content for={e.key} />
                  </stack>
                </React.Fragment>
              ))}
            </region>
          )}
        </bib-data>
      </region>
    </page>
  );
  const resolved = resolveDocument(documentTree, template);
  // page > region > region(from render-prop) > stack > [inline nodes from ref-entry]
  const outerRegion = resolved.children[0];
  assert.equal(outerRegion?.kind, "region");
  if (outerRegion?.kind !== "region") throw new Error("expected region");
  const innerRegion = outerRegion.children[0];
  assert.equal(innerRegion?.kind, "region");
  if (innerRegion?.kind !== "region") throw new Error("expected region");
  const stack = innerRegion.children[0];
  assert.equal(stack?.kind, "stack");
  if (stack?.kind !== "stack") throw new Error("expected stack");
  // The stack's children are the inline IR from <ref-entry>: a text node,
  // an em node (children: "Robust"), and another text node.
  const inline = stack.children;
  assert.ok(inline.length >= 2);
  // Find the em node.
  const em = inline.find((c) => (c as { kind: string }).kind === "em");
  assert.ok(em != null, "em node from ref-entry body survives substitution");
});

test("toc-data produces an entries list keyed by collected section anchors", () => {
  let captured: { id: string; title: string; depth: number }[] | null = null;
  const documentTree = renderContentToIR(
    <document title="With TOC">
      <section title="Alpha">
        <p>Alpha body.</p>
        <section title="Alpha One">
          <p>Sub.</p>
        </section>
      </section>
      <section title="Beta">
        <p>Beta body.</p>
      </section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <region>
        <toc-data>
          {(entries) => {
            captured = entries;
            return <region />;
          }}
        </toc-data>
        <slot name="body" />
      </region>
    </page>
  );
  resolveDocument(documentTree, template);
  const got = captured as { id: string; title: string; depth: number }[] | null;
  assert.ok(got != null, "toc-data render-prop ran");
  if (got == null) throw new Error("unreachable");
  const titles = got.map((e) => e.title);
  assert.deepEqual(titles, ["Alpha", "Alpha One", "Beta"]);
  // Section IDs are reactwright-sec-<slug>; depths are 1, 2, 1.
  assert.deepEqual(got.map((e) => e.depth), [1, 2, 1]);
  for (const e of got) {
    assert.ok(e.id.startsWith("reactwright-sec-"), `id is anchor: ${e.id}`);
  }
});

test("bib-data without a function child throws a clear error at resolve time", () => {
  // React's reconciler swallows errors from createInstance (commit-phase
  // capture), so the contract is enforced when the resolver tries to
  // invoke the render-prop. See resolve.ts:assertRenderFn.
  const documentTree = renderContentToIR(
    <document title="No render">
      <section title="Body">
        <p>Body.</p>
      </section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <region>
        {/* @ts-expect-error - intentionally missing the render-prop child */}
        <bib-data />
      </region>
    </page>
  );
  assert.throws(
    () => resolveDocument(documentTree, template),
    /bib-data.*function child/
  );
});

test("bib-entry-content for a missing key throws", () => {
  const documentTree = renderContentToIR(
    <document title="No matching entry">
      <section title="Body">
        <p>Body.</p>
      </section>
    </document>
  );
  const template = renderTemplateToIR(
    <page>
      <region>
        <bib-data>
          {() => (
            <region>
              <bib-entry-content for="nonexistent" />
            </region>
          )}
        </bib-data>
      </region>
    </page>
  );
  assert.throws(
    () => resolveDocument(documentTree, template),
    /bib-entry-content.*nonexistent.*no matching/
  );
});
