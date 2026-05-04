import { buildPdfFromResolved } from "../backends/latex/build.js";
import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";

const Paper = () => (
  <document title="Minimal Test" author="Tauraj Greig">
    <abstract>
      <paragraph>A tiny document used to validate the pipeline.</paragraph>
    </abstract>

    <section title="Introduction">
      <paragraph>Hello world.</paragraph>
    </section>

    <section title="Observation">
      <paragraph>The same content tree can flow through multiple backends.</paragraph>
    </section>
  </document>
);

const ArticleTemplate = () => (
  <page
    style={{
      size: "a4",
      margin: "25mm",
      fontFamily: "serif",
      fontSize: "11pt",
      lineHeight: 1.3
    }}
  >
    <stack gap="8mm">
      <box style={{ textAlign: "center", borderBottom: "1px solid", paddingBottom: "4mm" }}>
        <slot name="title" />
        <slot name="author" />
      </box>

      <box>
        <slot name="abstract" />
      </box>

      <box>
        <slot name="body" />
      </box>
    </stack>
  </page>
);

const documentTree = renderContentToIR(<Paper />);
const templateTree = renderTemplateToIR(<ArticleTemplate />);
const resolvedTree = resolveDocument(documentTree, templateTree);

const result = await buildPdfFromResolved(resolvedTree, {
  outputDir: "build/minimal-article",
  baseName: "minimal-article"
});

console.log("PDF artifacts created.");
console.log(JSON.stringify(result, null, 2));
