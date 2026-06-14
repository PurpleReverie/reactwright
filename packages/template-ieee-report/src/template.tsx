import "reactwright/jsx";
import React from "react";
import { Bibliography } from "reactwright/userland";

// IEEE technical-report template. Same authority and brand as the
// conference paper template (Times serif, italic abstract preamble,
// "Fig. 1." captions, numeric bracketed citations) but configured for
// longer-form single-column documents: white papers, working papers,
// internal IEEE technical reports.
//
// Differences vs. @reactwright/template-ieee:
//   • Single column body, no two-column flow
//   • Larger margins (1" top/bottom, 1.25" L/R) for binding & notes
//   • 11pt body, line-height 1.4 — breathing room for technical prose
//   • Three heading depths: Roman (I.), Alpha (A.), Decimal-close (1))
//   • Smaller body first-line indent (0.25" vs. 1em)
//   • Page footer: centered page number; running header on page 2+
//     shows the document title centered italic.
//
// Slice-1+ dialect only. customCss is empty.

export const IEEE_REPORT_STYLES = `
  .ieeer-title {
    font-size: 18pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    margin: 0 0 6pt 0;
    line-height: 1.2;
    text-indent: 0;
  }

  .ieeer-author {
    font-size: 11pt;
    font-style: italic;
    font-weight: normal;
    text-align: center;
    margin: 0 0 2pt 0;
    text-indent: 0;
  }

  .ieeer-affiliation {
    font-size: 9pt;
    font-style: normal;
    font-weight: normal;
    text-align: center;
    margin: 0 0 12pt 0;
    text-indent: 0;
  }

  .ieeer-abstract {
    margin: 0 0 8pt 0;
  }

  .ieeer-abstract-p {
    font-size: 10pt;
    margin: 0;
    text-indent: 0;
    text-align: justify;
  }

  .ieeer-section-head {
    font-size: 12pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 14pt 0 4pt 0;
    text-indent: 0;
    numbering: counter(ieeer-section, upper-roman) "$ieeer-section. ";
    numbering-reset: ieeer-subsection;
    break: after(avoid);
  }

  .ieeer-subsection-head {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    margin: 8pt 0 2pt 0;
    text-indent: 0;
    numbering: counter(ieeer-subsection, upper-alpha) "$ieeer-subsection. ";
    numbering-reset: ieeer-subsubsection;
    break: after(avoid);
  }

  .ieeer-subsubsection-head {
    font-size: 11pt;
    font-weight: normal;
    font-style: italic;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    margin: 6pt 0 2pt 0;
    text-indent: 0;
    numbering: counter(ieeer-subsubsection) "($ieeer-subsubsection) ";
    break: after(avoid);
  }

  .ieeer-body-p {
    margin: 0;
    text-indent: 0.25in;
    text-align: justify;
  }

  .ieeer-heading-adjacent-p {
    text-indent: 0;
  }

  .ieeer-figure {
    margin: 10pt 0;
    text-align: center;
    break: inside(avoid);
  }

  .ieeer-figure-img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 4pt auto;
  }

  .ieeer-fig-caption {
    font-size: 9pt;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    line-height: 1.3;
    text-indent: 0;
    numbering: counter(ieeer-figure) "Fig. $ieeer-figure. ";
  }

  /*
   * Ported from template-ieee so report tables render with the same
   * thin-top / thin-bottom rule on the header and thin-bottom rule
   * on the last row that IEEE expects. The conference template's
   * defaults are battle-tested for the same paper grid; reuse them
   * here with the ieeer- prefix so report-only overrides remain
   * isolated.
   */
  .ieeer-table {
    margin: 10pt 0;
    border-collapse: collapse;
    border-spacing: 0;
    font-size: 9pt;
    width: 100%;
    table-layout: fixed;
    break: inside(avoid);
  }

  .ieeer-table-cell {
    padding: 3pt 5pt;
    text-align: left;
    text-indent: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    vertical-align: top;
  }

  .ieeer-table-header-cell {
    font-weight: bold;
    text-align: left;
    border-top: 0.75pt solid #000;
    border-bottom: 0.5pt solid #000;
    padding: 4pt 5pt;
  }

  .ieeer-table-last-row-cell {
    border-bottom: 0.75pt solid #000;
  }

  .ieeer-table-caption {
    font-size: 9pt;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    line-height: 1.3;
    text-indent: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4pt;
    caption-side: top;
    numbering: counter(ieeer-table, upper-roman) "Table $ieeer-table. ";
  }

  .ieeer-cell-p {
    margin: 0;
    text-indent: 0;
    font-size: inherit;
  }

  .ieeer-cite {
    color: inherit;
    text-decoration: none;
    prefix: "[";
    suffix: target-counter(attr(href url), reactwright-bib) "]";
  }

  .ieeer-bibliography {
    font-size: 9pt;
    margin-top: 18pt;
  }

  .ieeer-bib-heading {
    font-size: 12pt;
    font-weight: bold;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
    margin: 0 0 6pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .ieeer-bib-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  .ieeer-bib-entry {
    margin-bottom: 2pt;
  }

  .ieeer-bib-entry-p {
    margin: 0;
    text-align: justify;
    text-indent: -1.6em;
    padding-left: 1.6em;
    prefix: "[" counter(reactwright-bib) "] ";
  }

  .ieeer-code-inline {
    background: none;
    padding: 0;
    border-radius: 0;
    font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
    font-size: 0.92em;
  }
`;

// IEEE_REPORT_CSS is empty. All styling is expressed via the dialect's
// <styles> block + <rule> bindings.
export const IEEE_REPORT_CSS = "";

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
      <styles>{IEEE_REPORT_STYLES}</styles>

      <rule match={{ kind: "title" }} className="ieeer-title" />
      <rule match={{ kind: "author" }} className="ieeer-author" />
      <rule match={{ kind: "code" }} className="ieeer-code-inline" />

      {/* Abstract block (role="abstract"). Mirrors template-ieee:
          italic "Abstract—" preamble lives in author content; the rule
          just adjusts paragraph typography. */}
      <rule match={{ kind: "section", role: "abstract" }} className="ieeer-abstract" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "abstract" } }}
        className="ieeer-abstract-p"
      />

      {/* Roman-numeral top-level section heads; exclude bibliography +
          abstract. */}
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
        className="ieeer-section-head"
      />
      <rule match={{ kind: "section-heading", depth: 2 }} className="ieeer-subsection-head" />
      <rule match={{ kind: "section-heading", depth: 3 }} className="ieeer-subsubsection-head" />

      {/* Body paragraphs everywhere except abstract / bibliography / cells */}
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
        className="ieeer-body-p"
      />
      <rule
        match={{ kind: "paragraph", follows: { kind: "section-heading" } }}
        className="ieeer-heading-adjacent-p"
      />

      {/* Figures + tables */}
      <rule match={{ kind: "figure" }} className="ieeer-figure" />
      <rule match={{ kind: "figure-image" }} className="ieeer-figure-img" />
      <rule match={{ kind: "caption", parent: { kind: "figure" } }} className="ieeer-fig-caption" />
      <rule match={{ kind: "table" }} className="ieeer-table" />
      <rule match={{ kind: "caption", parent: { kind: "table" } }} className="ieeer-table-caption" />
      <rule match={{ kind: "cell" }} className="ieeer-table-cell" />
      <rule match={{ kind: "cell", attr: { header: true } }} className="ieeer-table-header-cell" />
      <rule
        match={{ kind: "cell", parent: { kind: "row", index: "last" } }}
        className="ieeer-table-last-row-cell"
      />
      <rule match={{ kind: "paragraph", within: { kind: "cell" } }} className="ieeer-cell-p" />

      {/* Cites + IEEE-style numeric bibliography (via userland Bibliography) */}
      <rule match={{ kind: "cite" }} className="ieeer-cite" />
      <rule match={{ kind: "section", role: "bibliography" }} className="ieeer-bibliography" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "bibliography" } }}
        className="ieeer-bib-heading"
      />
      <rule
        match={{ kind: "list", within: { kind: "section", role: "bibliography" } }}
        className="ieeer-bib-list"
      />
      <rule
        match={{ kind: "item", within: { kind: "section", role: "bibliography" } }}
        className="ieeer-bib-entry"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "bibliography" } }}
        className="ieeer-bib-entry-p"
      />

      <header anchor="top-center" when="not-first-page" typography={{ fontSize: "9pt", fontStyle: "italic" }}>
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center" typography={{ fontSize: "9pt" }}>
        <page-number />
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
