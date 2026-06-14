import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import React from "react";

import { renderContentToIR } from "../src/content/render.js";
import { renderResolvedToHTML } from "../src/backends/html/render.js";
import { resolveDocument } from "../src/resolver/resolve.js";
import { renderTemplateToIR } from "../src/template/render.js";

function minimalTemplate() {
  return (
    <page style={{ size: "a4", margin: "20mm" }}>
      <region>
        <slot name="body" />
      </region>
    </page>
  );
}

test("content renderer creates semantic IR for a minimal document", () => {
  const result = renderContentToIR(
    <document title="Minimal Test" author="Anya Strunk">
      <section title="Introduction">
        <p>
          Hello <em>world</em> with <strong>emphasis</strong> and <code>inline-code</code>.
        </p>
        <figure
          src={resolve(process.cwd(), "tests/fixtures/reactwright-swatch.png")}
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
    author: "Anya Strunk",
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
            src: resolve(process.cwd(), "tests/fixtures/reactwright-swatch.png"),
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

// RW-1 — factory exceptions used to be silently swallowed; the user
// only saw "Content renderer produced no root node." The wrapper
// error now carries the intrinsic name and the underlying message.
test("factory errors surface with the intrinsic name and original message", () => {
  let thrown: Error | null = null;
  try {
    renderContentToIR(
      <document title="Heading test">
        {/* `<heading>` requires a non-empty `title`. */}
        <heading level={1} title="" />
      </document>
    );
  } catch (err) {
    thrown = err as Error;
  }
  assert.ok(thrown, "expected an error to be thrown");
  assert.match(thrown!.message, /\[reactwright\] <heading>/);
  assert.match(thrown!.message, /title/);
  assert.doesNotMatch(thrown!.message, /produced no root node/);
});

// RW-2 — grammar violations carried informative per-rule messages
// that never reached the user. The wrapper now exposes them and adds
// the parent > child kinds as context.
test("grammar violations surface with parent>child context and the rule message", () => {
  let thrown: Error | null = null;
  try {
    renderContentToIR(
      <document title="Grammar test">
        <section title="L">
          <list>
            {/* `list` may only contain `item` children. */}
            <p>not allowed</p>
          </list>
        </section>
      </document>
    );
  } catch (err) {
    thrown = err as Error;
  }
  assert.ok(thrown, "expected an error to be thrown");
  assert.match(thrown!.message, /\[reactwright\] <list> > <paragraph>/);
  assert.match(thrown!.message, /may only contain `item` children/);
  assert.doesNotMatch(thrown!.message, /produced no root node/);
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

test("content renderer supports math (block) and m (inline) primitives", () => {
  const result = renderContentToIR(
    <document title="Maths">
      <math src={"\\int_0^1 x^2 dx"} />
      <p>
        We have <m src="x + 1" /> here.
      </p>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Maths",
    children: [
      { kind: "math", src: "\\int_0^1 x^2 dx" },
      {
        kind: "paragraph",
        children: [
          { kind: "text", value: "We have " },
          { kind: "m", src: "x + 1" },
          { kind: "text", value: " here." }
        ]
      }
    ]
  });
});

test("content renderer supports ref inline primitive", () => {
  const result = renderContentToIR(
    <document title="Refs">
      <p>
        See <ref to="fig-overview" show="number-and-page" />.
      </p>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Refs",
    children: [
      {
        kind: "paragraph",
        children: [
          { kind: "text", value: "See " },
          { kind: "ref", to: "fig-overview", show: "number-and-page" },
          { kind: "text", value: "." }
        ]
      }
    ]
  });
});

test("content renderer carries id prop on block primitives", () => {
  const result = renderContentToIR(
    <document title="Refs">
      <section id="intro" title="Introduction">
        <p id="opening">Opening line.</p>
      </section>
      <heading id="part-two" level={1} title="Part Two" />
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Refs",
    children: [
      {
        kind: "section",
        id: "intro",
        title: "Introduction",
        children: [{ kind: "paragraph", id: "opening", children: [{ kind: "text", value: "Opening line." }] }]
      },
      { kind: "heading", id: "part-two", level: 1, title: "Part Two" }
    ]
  });
});

test("content renderer supports standalone heading primitive", () => {
  const result = renderContentToIR(
    <document title="Headings">
      <heading level={1} title="Part One" />
      <heading level={3} title="Side note" role="ornament" />
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Headings",
    children: [
      { kind: "heading", level: 1, title: "Part One" },
      { kind: "heading", level: 3, title: "Side note", role: "ornament" }
    ]
  });
});

test("content renderer supports defs/def definition lists", () => {
  const result = renderContentToIR(
    <document title="Glossary">
      <defs role="glossary">
        <def term="Aspect">
          <p>A facet of identity.</p>
        </def>
        <def term="Reagent">
          <p>A consumable token.</p>
        </def>
      </defs>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Glossary",
    children: [
      {
        kind: "defs",
        role: "glossary",
        children: [
          {
            kind: "def",
            term: "Aspect",
            children: [{ kind: "paragraph", children: [{ kind: "text", value: "A facet of identity." }] }]
          },
          {
            kind: "def",
            term: "Reagent",
            children: [{ kind: "paragraph", children: [{ kind: "text", value: "A consumable token." }] }]
          }
        ]
      }
    ]
  });
});

test("content renderer supports inline img primitive", () => {
  const result = renderContentToIR(
    <document title="Inline img">
      <p>
        Inline <img src="/logo.png" alt="Logo" width="1em" /> here.
      </p>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Inline img",
    children: [
      {
        kind: "paragraph",
        children: [
          { kind: "text", value: "Inline " },
          { kind: "img", src: "/logo.png", alt: "Logo", width: "1em" },
          { kind: "text", value: " here." }
        ]
      }
    ]
  });
});

test("content renderer supports pre verbatim block", () => {
  const result = renderContentToIR(
    <document title="Pre">
      <pre>{"  indented\nlines preserved"}</pre>
    </document>
  );

  assert.deepEqual(result, {
    kind: "document",
    title: "Pre",
    children: [
      {
        kind: "pre",
        children: [{ kind: "text", value: "  indented\nlines preserved" }]
      }
    ]
  });
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

test("item id prop emits id attribute on <li>", () => {
  const html = renderResolvedToHTML(
    resolveDocument(
      renderContentToIR(
        <document title="Item Id Test" author="T">
          <section title="L">
            <list ordered>
              <item id="foo">
                <p>First.</p>
              </item>
            </list>
          </section>
        </document>
      ),
      renderTemplateToIR(minimalTemplate())
    )
  );
  assert.match(html, /<li id="foo"[^>]*><p>First\.<\/p><\/li>/);
});

test("section counter prop emits data-counter attribute on <section>", () => {
  const html = renderResolvedToHTML(
    resolveDocument(
      renderContentToIR(
        <document title="Section Counter Test" author="T">
          <section title="X" counter="my-counter">
            <p>Body.</p>
          </section>
        </document>
      ),
      renderTemplateToIR(minimalTemplate())
    )
  );
  assert.match(html, /<section[^>]*data-counter="my-counter"[^>]*>/);
});

test("item without id omits id attribute; section without counter omits data-counter", () => {
  const html = renderResolvedToHTML(
    resolveDocument(
      renderContentToIR(
        <document title="Neg Test" author="T">
          <section title="Y">
            <list>
              <item>
                <p>No id.</p>
              </item>
            </list>
          </section>
        </document>
      ),
      renderTemplateToIR(minimalTemplate())
    )
  );
  assert.match(html, /<li><p>No id\.<\/p><\/li>/);
  assert.ok(!/<section[^>]*data-counter[^>]*>[\s\S]*?<h2[^>]*>Y<\/h2>/.test(html), "section without counter prop should not emit data-counter");
});

// RW-3 — `<list type="ol">` sugar must emit <ol>, not <ul>. Reported
// against the wit-bridge where every @ol came through as <ul>.
test("list type=\"ol\" emits an ordered list", () => {
  const html = renderResolvedToHTML(
    resolveDocument(
      renderContentToIR(
        <document title="Ordered" author="T">
          <section title="L">
            <list type="ol">
              <item><p>first</p></item>
              <item><p>second</p></item>
            </list>
          </section>
        </document>
      ),
      renderTemplateToIR(minimalTemplate())
    )
  );
  assert.match(html, /<ol[^>]*><li><p>first<\/p><\/li><li><p>second<\/p><\/li><\/ol>/);
  assert.ok(!/<ul[^>]*><li><p>first<\/p>/.test(html), "type=\"ol\" must not emit <ul>");
});

test("list type=\"ul\" emits an unordered list", () => {
  const html = renderResolvedToHTML(
    resolveDocument(
      renderContentToIR(
        <document title="Unordered" author="T">
          <section title="L">
            <list type="ul">
              <item><p>a</p></item>
            </list>
          </section>
        </document>
      ),
      renderTemplateToIR(minimalTemplate())
    )
  );
  assert.match(html, /<ul[^>]*><li><p>a<\/p><\/li><\/ul>/);
});

// `<row header>` sugar: every cell inside a header row should render
// as <th>. Fills the gap noted in the AUDIT — Markdown's `| --- |`
// header separator produced <th> cells, which the engine had no
// idiomatic way to express on a per-row basis.
test("row header prop renders all child cells as <th>", () => {
  const html = renderResolvedToHTML(
    resolveDocument(
      renderContentToIR(
        <document title="Header Row" author="T">
          <section title="T">
            <table>
              <row header>
                <cell><p>House</p></cell>
                <cell><p>Seat</p></cell>
              </row>
              <row>
                <cell><p>Vael</p></cell>
                <cell><p>Greycrown</p></cell>
              </row>
            </table>
          </section>
        </document>
      ),
      renderTemplateToIR(minimalTemplate())
    )
  );
  assert.match(html, /<th[^>]*><p>House<\/p><\/th><th[^>]*><p>Seat<\/p><\/th>/);
  assert.match(html, /<td[^>]*><p>Vael<\/p><\/td><td[^>]*><p>Greycrown<\/p><\/td>/);
});
