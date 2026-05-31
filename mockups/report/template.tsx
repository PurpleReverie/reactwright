import "reactwright/jsx";
import { Bibliography } from "../../src/userland/Bibliography.js";

// Business/technical report template, packaged as a reusable module.
// Templates that want the same report styling can:
//
//   import { Template, REPORT_STYLES } from "./report";
//
// Rules captured:
//   • US Letter paper, 1" top/bottom, 1.25" left/right margins
//   • Body: Times 11pt, line-height 1.4 (NOT double-spaced)
//   • Title: 18pt bold centered; Author/Date block below
//   • Section headings: decimal-numbered ("1.", "2.", ...)
//   • Subsections: nested decimal ("1.1", "2.1", ...)
//   • Paragraphs: block style (no indent, 6pt top margin)
//   • Figure captions: "Figure 1." auto-numbered
//   • Table captions: "Table 1." auto-numbered
//   • Page header (page 2+): document title left, page number right
//   • Bibliography: IEEE-style [1], [2] numeric
//
// Slice-1+ dialect only. customCss is empty.

export const REPORT_STYLES = `
  .report-title {
    font-size: 18pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    margin: 0 0 6pt 0;
    line-height: 1.2;
    text-indent: 0;
  }

  .report-author {
    font-size: 11pt;
    font-style: italic;
    font-weight: normal;
    text-align: center;
    margin: 0 0 18pt 0;
    text-indent: 0;
  }

  .report-abstract {
    margin: 0 0 12pt 0;
    padding: 8pt 12pt;
    background-color: #f5f5f5;
  }

  .report-abstract-heading {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 4pt 0;
    text-indent: 0;
    text-align: left;
  }

  .report-abstract-p {
    margin: 0;
    text-indent: 0;
    text-align: justify;
  }

  .report-section-head {
    font-size: 13pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    margin: 14pt 0 4pt 0;
    text-indent: 0;
    numbering: counter(report-section) "$report-section. ";
    numbering-reset: report-subsection;
    break: after(avoid);
  }

  .report-subsection-head {
    font-size: 11pt;
    font-weight: bold;
    font-style: normal;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    margin: 10pt 0 2pt 0;
    text-indent: 0;
    numbering: counter(report-subsection) "$report-section.$report-subsection. ";
    break: after(avoid);
  }

  .report-body-p {
    margin: 6pt 0 0 0;
    text-indent: 0;
    text-align: justify;
  }

  .report-heading-adjacent-p {
    margin-top: 0;
  }

  .report-figure {
    margin: 10pt 0;
    text-align: center;
    break: inside(avoid);
  }

  .report-figure-img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 4pt auto;
  }

  .report-fig-caption {
    font-size: 10pt;
    font-style: italic;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    line-height: 1.3;
    text-indent: 0;
    numbering: counter(report-figure) "Figure $report-figure. ";
  }

  .report-table {
    margin: 10pt 0;
    border-collapse: collapse;
    font-size: 10pt;
    width: 100%;
    table-layout: fixed;
    break: inside(avoid);
  }

  .report-table-cell {
    padding: 3pt 6pt;
    text-align: left;
    text-indent: 0;
    border: 0.5pt solid #888;
  }

  .report-table-header-cell {
    font-weight: bold;
    background-color: #eeeeee;
    border-top: 0.75pt solid #000;
    border-bottom: 0.75pt solid #000;
  }

  .report-table-caption {
    font-size: 10pt;
    font-style: italic;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    line-height: 1.3;
    text-indent: 0;
    margin-bottom: 4pt;
    caption-side: top;
    numbering: counter(report-table) "Table $report-table. ";
  }

  .report-cell-p {
    margin: 0;
    text-indent: 0;
    font-size: inherit;
  }

  .report-cite {
    color: inherit;
    text-decoration: none;
    prefix: "[";
    suffix: target-counter(attr(href url), reactwright-bib) "]";
  }

  .report-bibliography {
    font-size: 10pt;
    margin-top: 18pt;
  }

  .report-bib-heading {
    font-size: 13pt;
    font-weight: bold;
    font-style: normal;
    text-align: left;
    margin: 0 0 6pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .report-bib-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  .report-bib-entry {
    margin-bottom: 3pt;
  }

  .report-bib-entry-p {
    margin: 0;
    text-align: left;
    text-indent: -1.6em;
    padding-left: 1.6em;
    prefix: "[" counter(reactwright-bib) "] ";
  }

  .report-code-inline {
    background: none;
    padding: 0;
    border-radius: 0;
    font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
    font-size: 0.92em;
  }
`;

export function Template() {
  return (
    <page
      page={{
        size: "letter",
        marginTop: "1in",
        marginBottom: "1in",
        marginLeft: "1.25in",
        marginRight: "1.25in"
      }}
      typography={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "11pt",
        lineHeight: 1.4,
        textAlign: "justify"
      }}
    >
      <styles>{REPORT_STYLES}</styles>

      <rule match={{ kind: "title" }} className="report-title" />
      <rule match={{ kind: "author" }} className="report-author" />
      <rule match={{ kind: "code" }} className="report-code-inline" />

      {/* Abstract / Executive Summary */}
      <rule match={{ kind: "section", role: "abstract" }} className="report-abstract" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "abstract" } }}
        className="report-abstract-heading"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "abstract" } }}
        className="report-abstract-p"
      />

      {/* Numbered top-level section headings (skip abstract + bibliography) */}
      <rule
        match={{
          kind: "section-heading",
          depth: 1,
          not: {
            or: [
              { within: { kind: "section", role: "bibliography" } },
              { within: { kind: "section", role: "abstract" } }
            ]
          }
        }}
        className="report-section-head"
      />
      <rule match={{ kind: "section-heading", depth: 2 }} className="report-subsection-head" />

      {/* Body paragraphs — exclude abstract/blockquote/bibliography/cell */}
      <rule
        match={{
          kind: "paragraph",
          not: {
            or: [
              { within: { kind: "section", role: "bibliography" } },
              { within: { kind: "section", role: "abstract" } },
              { within: { kind: "cell" } }
            ]
          }
        }}
        className="report-body-p"
      />
      <rule
        match={{ kind: "paragraph", follows: { kind: "section-heading" } }}
        className="report-heading-adjacent-p"
      />

      {/* Figures + tables */}
      <rule match={{ kind: "figure" }} className="report-figure" />
      <rule match={{ kind: "figure-image" }} className="report-figure-img" />
      <rule match={{ kind: "caption", parent: { kind: "figure" } }} className="report-fig-caption" />
      <rule match={{ kind: "table" }} className="report-table" />
      <rule match={{ kind: "caption", parent: { kind: "table" } }} className="report-table-caption" />
      <rule match={{ kind: "cell" }} className="report-table-cell" />
      <rule match={{ kind: "cell", attr: { header: true } }} className="report-table-header-cell" />
      <rule match={{ kind: "paragraph", within: { kind: "cell" } }} className="report-cell-p" />

      {/* Cites + IEEE-style numeric bibliography (via userland Bibliography) */}
      <rule match={{ kind: "cite" }} className="report-cite" />
      <rule match={{ kind: "section", role: "bibliography" }} className="report-bibliography" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "bibliography" } }}
        className="report-bib-heading"
      />
      <rule
        match={{ kind: "list", within: { kind: "section", role: "bibliography" } }}
        className="report-bib-list"
      />
      <rule
        match={{ kind: "item", within: { kind: "section", role: "bibliography" } }}
        className="report-bib-entry"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "bibliography" } }}
        className="report-bib-entry-p"
      />

      <header anchor="top-left" when="not-first-page" typography={{ fontSize: "9pt", fontStyle: "italic" }}>
        <running name="document-title" />
      </header>
      <header anchor="top-right" when="not-first-page" typography={{ fontSize: "9pt" }}>
        <page-number />
      </header>
      <footer anchor="bottom-center" typography={{ fontSize: "9pt" }}>
        <page-number /> / <page-count />
      </footer>

      <stack gap="0">
        <region>
          <slot name="title" />
          <slot name="author" />
          <slot name="abstract" />
          <slot name="body" />
          <Bibliography title="References" />
        </region>
      </stack>
    </page>
  );
}
