import React from "react";

import { renderResolvedToHTML } from "../backends/html/render.js";
import { renderResolvedToLatex } from "../backends/latex/render.js";
import { renderContentToIR } from "../content/render.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";
import { registerTemplateIntrinsic } from "../template/registry.js";

registerTemplateIntrinsic({
  name: "callout",
  html: ({ props, children, renderChildren, styleToCss, escapeHtml }) => {
    const style = styleToCss(
      {
        border: "1px solid #94a3b8",
        padding: "4mm",
        backgroundColor: "#f8fafc",
        ...(props.style as Record<string, unknown> | undefined)
      },
      "box"
    );

    return `<aside data-node="callout" data-tone="${escapeHtml(String(props.tone ?? "note"))}" style="${escapeHtml(style)}">${renderChildren(children)}</aside>`;
  },
  latex: ({ props, children, renderChildren }) => {
    const tone = String(props.tone ?? "note");

    return [
      "\\bigskip",
      "\\noindent\\fbox{%",
      "\\begin{minipage}{0.96\\linewidth}",
      `\\textbf{${tone.toUpperCase()}}\\\\`,
      renderChildren(children),
      "\\end{minipage}",
      "}",
      "\\bigskip"
    ].join("\n");
  }
});

const Paper = () => (
  <document title="Custom Intrinsic Demo" author="Tauraj Greig">
    <abstract>
      <paragraph>This abstract is rendered through a registered custom template intrinsic.</paragraph>
    </abstract>

    <section title="Introduction">
      <paragraph>Hello from a custom template intrinsic.</paragraph>
    </section>
  </document>
);

const CustomTemplate = () => (
  <page style={{ size: "a4", margin: "25mm", fontSize: "11pt" }}>
    <stack gap="8mm">
      <box style={{ textAlign: "center" }}>
        <slot name="title" />
        <slot name="author" />
      </box>

      {React.createElement(
        "callout",
        { tone: "warning", style: { textAlign: "left" } },
        <slot name="abstract" />
      )}

      <box>
        <slot name="body" />
      </box>
    </stack>
  </page>
);

const documentTree = renderContentToIR(<Paper />);
const templateTree = renderTemplateToIR(<CustomTemplate />);
const resolvedTree = resolveDocument(documentTree, templateTree);

console.log("Custom intrinsic resolved tree created.");
console.log(JSON.stringify(resolvedTree, null, 2));
console.log("\n--- HTML ---\n");
console.log(renderResolvedToHTML(resolvedTree));
console.log("\n--- LATEX ---\n");
console.log(renderResolvedToLatex(resolvedTree));
