import { renderTemplateToIR } from "../template/render.js";

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

console.log("Minimal template IR created.");
console.log(JSON.stringify(renderTemplateToIR(<ArticleTemplate />), null, 2));
