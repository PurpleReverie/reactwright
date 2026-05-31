// IEEE conference paper helper package. Bundles a Template that
// implements the canonical IEEEtran layout plus typed content helpers
// (createBibliography, IEEEAbstract, IEEEFrontMatter) so authors only
// import this one module and TypeScript catches typos in citation
// keys at compile time.
export { Template, IEEE_CSS } from "./template.js";
export { createBibliography, type IEEEEntry } from "./bibliography.js";
export { IEEEAbstract, IEEEFrontMatter } from "./abstract.js";
