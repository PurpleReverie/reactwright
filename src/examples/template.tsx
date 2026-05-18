import { renderTemplateToIR } from "../template/render.js";

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

console.log("Minimal template IR created.");
console.log(JSON.stringify(renderTemplateToIR(<ArticleTemplate />), null, 2));
