import { renderContentToIR } from "../content/render.js";

const Paper = () => (
  <document title="Minimal Test" author="Tauraj Greig">
    <section title="Introduction">
      <p>Hello world.</p>
    </section>
  </document>
);

console.log("Minimal semantic IR created.");
console.log(JSON.stringify(renderContentToIR(<Paper />), null, 2));
