import { renderContentToIR } from "../content/render.js";

const Paper = () => (
  <document title="Minimal Test" author="Tauraj Greig">
    <section title="Introduction">
      <paragraph>Hello world.</paragraph>
    </section>
  </document>
);

console.log("Minimal semantic IR created.");
console.log(JSON.stringify(renderContentToIR(<Paper />), null, 2));
