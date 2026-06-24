// NeurIPS 2025 sample — renders sample.md to HTML + PDF through the
// @reactwright/template-neurips template.
//
// The Markdown carries the body, the figure, the table, and the
// references list. Front matter carries the title, the structured
// author list, and the abstract. This build script wires the three
// NeurIPS-specific pieces that plain Markdown can't express on its own:
//
//   1. The multi-author block (one <meta name="author"> per author).
//   2. The abstract as a role="abstract" section.
//   3. The Paper Checklist appended at the end.
//
// It also performs two small Markdown-shape fixups (both mirror the
// fixes proven in the template-ieee workflow):
//
//   • tag back-matter sections (References / Acknowledgments) with the
//     roles the template keys numbering off;
//   • lift a "Table: caption" paragraph into the following table's
//     caption so the template's "Table N:" numbering applies;
//   • undo any double-encoded HTML entities before the PDF pass.

import "reactwright/jsx";
import React, { type ReactElement, type ReactNode } from "react";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  renderContentToIR,
  renderTemplateToIR,
  resolveDocument,
  renderResolvedToHTML,
  buildPdfFromHtml
} from "reactwright";
import { markdownToReactwright } from "@reactwright/markdown";
import {
  Template,
  authorMetas,
  NeurIPSChecklist,
  type NeurIPSAuthor
} from "@reactwright/template-neurips";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, "../../build/examples");

// ---- Markdown-tree transforms ---------------------------------------

function isIntrinsic(node: ReactNode, type: string): node is ReactElement<any> {
  return React.isValidElement(node) && node.type === type;
}

// Collapse an element's text content to a plain string (best effort).
function plainText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (React.isValidElement(node)) return plainText((node.props as any).children);
  return "";
}

// Walk a children list. Recurse into <section>s. When a <p> whose text
// starts with "Table:" is immediately followed by a <table>, drop the
// paragraph and splice its text in as the table's <caption>.
function liftTableCaptions(children: ReactNode): ReactNode[] {
  const arr = React.Children.toArray(children);
  const out: ReactNode[] = [];
  for (let i = 0; i < arr.length; i += 1) {
    const node = arr[i];
    if (isIntrinsic(node, "section")) {
      out.push(React.cloneElement(node, {}, liftTableCaptions((node.props as any).children)));
      continue;
    }
    if (isIntrinsic(node, "paragraph") || isIntrinsic(node, "p")) {
      const m = /^Table:\s*(.+)$/s.exec(plainText(node).trim());
      const next = arr[i + 1];
      if (m != null && isIntrinsic(next, "table")) {
        const caption = <caption>{m[1].trim()}</caption>;
        const tableKids = React.Children.toArray((next.props as any).children);
        out.push(React.cloneElement(next, {}, [caption, ...tableKids]));
        i += 1; // consume the table
        continue;
      }
    }
    out.push(node);
  }
  return out;
}

// Tag top-level back-matter sections with the roles the template uses to
// keep them out of (or onto) the right numbering scheme. Positional, so
// the Markdown stays pure content: Acknowledgments -> unnumbered,
// References -> bibliography, and every top-level section *after*
// References -> appendix (lettered A, B, …).
function tagBackMatterRoles(children: ReactNode[]): ReactNode[] {
  let afterReferences = false;
  return children.map((node) => {
    if (!isIntrinsic(node, "section")) return node;
    const title = String((node.props as any).title ?? "").trim().toLowerCase();
    let role: string | undefined;
    if (/^(references|bibliography)$/.test(title)) {
      role = "bibliography";
      afterReferences = true;
    } else if (/^acknowledg(?:e)?ments?$/.test(title)) {
      role = "unnumbered";
    } else if (afterReferences) {
      role = "appendix";
    }
    return role != null ? React.cloneElement(node, { role } as any) : node;
  });
}

// Undo double-encoded entities (e.g. "&amp;#39;" -> "&#39;",
// "&amp;amp;" -> "&amp;") that arise when Markdown-provided entities are
// escaped a second time by the HTML backend. Single-encoded entities and
// bare "&amp;" are left untouched.
function fixDoubleEncodedEntities(html: string): string {
  return html.replace(/&amp;(#\d+;|#x[0-9a-fA-F]+;|[a-zA-Z][a-zA-Z0-9]*;)/g, "&$1");
}

// ---- Build ----------------------------------------------------------

async function build(): Promise<void> {
  const md = await readFile(resolve(here, "sample.md"), "utf-8");
  const { document, frontmatter } = markdownToReactwright(md);

  const authors = ((frontmatter as any).authors ?? []) as NeurIPSAuthor[];
  const abstract = String((frontmatter as any).abstract ?? "").trim();

  // Body children from the Markdown, with the two shape fixups applied.
  const bodyChildren = tagBackMatterRoles(
    liftTableCaptions((document.props as any).children)
  );

  // Example checklist answers — the first few filled in to show the
  // rendered form; the rest fall back to "[TODO]".
  const checklistAnswers = [
    { answer: "Yes", justification: "The abstract and introduction enumerate the three contributions." },
    { answer: "Yes", justification: "Limitations are discussed in the Conclusion." },
    { answer: "NA", justification: "The paper contains no theoretical results." }
  ];

  const composedChildren: ReactNode[] = [
    ...authorMetas(authors),
    <section role="abstract" title="Abstract" key="nips-abstract">
      <p>{abstract}</p>
    </section>,
    ...bodyChildren,
    <NeurIPSChecklist key="nips-checklist" answers={checklistAnswers} />
  ];

  const composedDocument = React.cloneElement(document, {}, composedChildren);

  const contentIR = renderContentToIR(composedDocument);
  const templateIR = renderTemplateToIR(React.createElement(Template));
  const resolved = resolveDocument(contentIR, templateIR);
  const html = fixDoubleEncodedEntities(renderResolvedToHTML(resolved));

  await mkdir(OUT_DIR, { recursive: true });
  const htmlPath = resolve(OUT_DIR, "neurips-sample.html");
  await writeFile(htmlPath, html);
  console.log(`wrote ${htmlPath}`);

  // Smoke checks across the composed document.
  const checks: Array<{ name: string; pass: boolean }> = [
    { name: "three author cards", pass: (html.match(/data-meta="author"/g) ?? []).length === 3 },
    { name: "abstract slot present", pass: /data-slot="abstract"/.test(html) },
    { name: "section numbering counter wired", pass: /counter-increment:nips-sec/.test(html) },
    { name: "figure lifted from markdown image", pass: /<figure[\s\S]*?<img[\s\S]*?<figcaption/.test(html) },
    { name: "figure caption counter", pass: /counter\(nips-fig\)/.test(html) },
    { name: "table caption lifted + counter", pass: /counter\(nips-tbl\)/.test(html) && /<caption|<figcaption|nips-table-caption/.test(html) },
    { name: "references role tagged", pass: /class="[^"]*nips-references/.test(html) },
    { name: "checklist section present", pass: /class="[^"]*nips-checklist/.test(html) },
    { name: "page-number footer", pass: /data-node="page-number"/.test(html) },
    { name: "no double-encoded entities", pass: !/&amp;(#\d+;|#x[0-9a-fA-F]+;|[a-zA-Z][a-zA-Z0-9]*;)/.test(html) }
  ];
  for (const c of checks) console.log(`  ${c.pass ? "✓" : "✗"} ${c.name}`);
  const failed = checks.filter((c) => !c.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);

  try {
    const pdfPath = resolve(OUT_DIR, "neurips-sample.pdf");
    await buildPdfFromHtml(html, { outputPath: pdfPath, format: "letter" });
    console.log(`wrote ${pdfPath}`);
  } catch (err) {
    console.log("PDF build skipped:", (err as Error).message);
  }

  if (failed.length > 0) process.exit(1);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
