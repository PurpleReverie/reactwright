import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";

const Paper = () => (
  <document title="Minimal Test" author="Tauraj Greig">
    <abstract>
      <p>A tiny document used to validate the pipeline.</p>
    </abstract>

    <section title="Introduction">
      <p>Hello world.</p>
    </section>
  </document>
);

const ArticleTemplate = () => (
  <page style={{ size: "a4", margin: "25mm", fontFamily: "serif", fontSize: "11pt" }}>
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

const documentTree = renderContentToIR(<Paper />);
const templateTree = renderTemplateToIR(<ArticleTemplate />);
const resolvedTree = resolveDocument(documentTree, templateTree);

console.log("Resolved render tree created.");
console.log(JSON.stringify(resolvedTree, null, 2));
