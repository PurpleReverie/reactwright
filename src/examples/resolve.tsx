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
  </document>
);

const ArticleTemplate = () => (
  <page style={{ size: "a4", margin: "25mm", fontFamily: "serif", fontSize: "11pt" }}>
    <stack gap="8mm">
      <box style={{ textAlign: "center" }}>
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

console.log("Resolved render tree created.");
console.log(JSON.stringify(resolvedTree, null, 2));
