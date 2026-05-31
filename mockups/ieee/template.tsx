import "reactwright/jsx";

// Strict IEEE conference paper template, packaged as a reusable
// module. Templates that want the same IEEE styling can:
//
//   import { Template, IEEE_CSS } from "./ieee";
//
// and either drop the Template into their content `.tsx` or compose
// IEEE_CSS into their own customCss to inherit just the typography.
//
// Slice-1 migration: the rules below that use ONLY pass-through CSS
// properties have been moved to a <styles> block + <rule> bindings.
// The rules that still need promoted concepts (numbering, prefix,
// break-inside, table-layout) stay in IEEE_CSS until slices 2–3 land.
//
// IEEE rules captured:
//   • US Letter paper, IEEE margins (0.75" top, 1.0" bottom, 0.625" L/R)
//   • Title block spans both columns at top of page 1 (24pt Times)
//   • Two-column body, 3.5" each, 0.167" gutter
//   • Section heads: Roman numerals, 10pt SMALL CAPS, centered
//   • Subsections: A. B. C., 10pt italic, flush left
//   • Abstract+Index Terms: 9pt bold-italic with em-dash prefix
//   • Figure captions: 8pt "Fig. 1. ..." centered
//   • Equation numbering: "(1)" right-margin
//   • References: 8pt with [N] hanging-indent
//   • Running header (page 2+): document title, italic 8pt centered
//   • Footer: page number centered, 8pt

// Styles dialect block — migrated from customCss in slice 1.9. Every
// rule below is expressible via pass-through CSS + the rule-class
// binding system; no engine-internal class names are mentioned.
export const IEEE_STYLES = `
  .ieee-title {
    font-size: 24pt;
    font-weight: normal;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    margin: 0 0 12pt 0;
    line-height: 1.1;
  }

  .ieee-abstract {
    font-size: 9pt;
    font-weight: bold;
    font-style: italic;
    text-align: justify;
    margin: 0 0 8pt 0;
  }

  .ieee-code-inline {
    background: none;
    padding: 0;
    border-radius: 0;
    font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
    font-size: 0.92em;
  }

  .ieee-bibliography {
    font-size: 8pt;
  }

  .ieee-section-head {
    font-size: 10pt;
    font-weight: normal;
    font-style: normal;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    text-align-last: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 12pt 0 4pt 0;
    numbering: counter(ieee-section, upper-roman) "$ieee-section. ";
    numbering-reset: ieee-subsection;
    break: after(avoid);
  }

  .ieee-subsection-head {
    font-size: 10pt;
    font-weight: normal;
    font-style: italic;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    text-align-last: left;
    text-transform: none;
    letter-spacing: 0;
    margin: 6pt 0 2pt 0;
    numbering: counter(ieee-subsection, upper-alpha) "$ieee-subsection. ";
    break: after(avoid);
  }

  .ieee-figure {
    margin: 8pt 0;
    text-align: center;
    break: inside(avoid);
  }

  .ieee-figure-img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 4pt auto;
  }

  .ieee-fig-caption {
    font-size: 8pt;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    line-height: 1.2;
    text-indent: 0;
    numbering: counter(ieee-figure) "Fig. $ieee-figure. ";
  }

  .ieee-table {
    margin: 8pt 0;
    border-collapse: collapse;
    font-size: 8pt;
    width: 100%;
    table-layout: fixed;
    break: inside(avoid);
  }

  .ieee-table-cell {
    padding: 1pt 2pt;
    text-align: left;
    text-indent: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .ieee-table-last-row-cell {
    border-bottom: 0.5pt solid #000;
  }

  .ieee-table-caption {
    font-size: 8pt;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    text-align-last: center;
    line-height: 1.2;
    text-indent: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4pt;
    caption-side: top;
    numbering: counter(ieee-table, upper-roman) "Table $ieee-table. ";
  }

  .ieee-table-header-cell {
    font-weight: normal;
    font-style: italic;
    border-top: 0.5pt solid #000;
    border-bottom: 0.5pt solid #000;
  }

  .ieee-cite {
    color: inherit;
    text-decoration: none;
    prefix: "[";
    suffix: target-counter(attr(href url), reactwright-bib) "]";
  }

  .ieee-bib-entry {
    margin-bottom: 2pt;
    text-align: justify;
    prefix: "[" counter(reactwright-bib) "] ";
  }

  .ieee-heading-adjacent-p {
    text-indent: 0;
  }

  .ieee-abstract-p {
    margin: 0;
    text-indent: 0;
  }

  .ieee-abstract-p-follow {
    margin-top: 6pt;
  }

  .ieee-body-p {
    margin: 0;
    text-indent: 1em;
  }

  .ieee-cell-p {
    margin: 0;
    text-indent: 0;
    font-size: inherit;
  }

  .ieee-math-block {
    text-indent: 0;
  }
`;

// Three rules remain. All three target renderer-generated DOM that has
// no IR identity today: the bibliography <h2> and <ol> wrappers, plus
// the <li> hanging-indent (which is partly a slice-3 promoted-concept
// problem). They migrate when slice 6.3 ships userland <Bibliography>
// (or slice 5.3 synthesizes the wrappers), and slice 3 ships
// `hanging-indent`.
export const IEEE_CSS = [
  ".reactwright-bibliography h2{font-size:10pt;font-weight:normal;font-style:normal;text-transform:uppercase;letter-spacing:0.04em;text-align:center;text-align-last:center;margin:12pt 0 6pt 0;break-after:avoid;}",
  ".reactwright-bibliography ol{list-style:none;padding-left:0;margin:0;}",
  ".reactwright-bibliography li{text-indent:-1.4em;padding-left:1.4em;}"
].join("");

export function Template() {
  return (
    <page
      page={{
        size: "letter",
        marginTop: "19.05mm",
        marginBottom: "25.4mm",
        marginLeft: "15.875mm",
        marginRight: "15.875mm"
      }}
      typography={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "10pt",
        lineHeight: 1.15,
        textAlign: "justify"
      }}
      style={{ customCss: IEEE_CSS }}
    >
      <styles>{IEEE_STYLES}</styles>
      <rule match={{ kind: "title" }} className="ieee-title" />
      <rule match={{ kind: "abstract" }} className="ieee-abstract" />
      <rule match={{ kind: "code" }} className="ieee-code-inline" />
      <rule match={{ kind: "bibliography" }} className="ieee-bibliography" />
      <rule match={{ kind: "section-heading", depth: 1 }} className="ieee-section-head" />
      <rule match={{ kind: "section-heading", depth: 2 }} className="ieee-subsection-head" />
      <rule
        match={{ kind: "paragraph", follows: { kind: "section-heading" } }}
        className="ieee-heading-adjacent-p"
      />
      <rule match={{ kind: "figure" }} className="ieee-figure" />
      <rule match={{ kind: "figure-image" }} className="ieee-figure-img" />
      <rule match={{ kind: "caption", parent: { kind: "figure" } }} className="ieee-fig-caption" />
      <rule match={{ kind: "table" }} className="ieee-table" />
      <rule match={{ kind: "caption", parent: { kind: "table" } }} className="ieee-table-caption" />
      <rule match={{ kind: "cell" }} className="ieee-table-cell" />
      <rule match={{ kind: "cell", attr: { header: true } }} className="ieee-table-header-cell" />
      <rule
        match={{ kind: "cell", parent: { kind: "row", index: "last" } }}
        className="ieee-table-last-row-cell"
      />
      <rule match={{ kind: "cite" }} className="ieee-cite" />
      <rule match={{ kind: "ref-entry" }} className="ieee-bib-entry" />
      <rule match={{ kind: "paragraph", within: { kind: "abstract" } }} className="ieee-abstract-p" />
      <rule
        match={{ kind: "paragraph", within: { kind: "abstract" }, follows: { kind: "paragraph" } }}
        className="ieee-abstract-p-follow"
      />
      <rule match={{ kind: "paragraph" }} className="ieee-body-p" />
      <rule match={{ kind: "paragraph", within: { kind: "cell" } }} className="ieee-cell-p" />
      <rule match={{ kind: "math" }} className="ieee-math-block" />

      <rules>
        <role
          on="figure"
          match="numbered"
          apply="ieeeFigure"
          numbering={{ counter: "ieee-figure", format: "Fig. $ieee-figure. " }}
          style={{ fontSize: "8pt", textAlign: "center" }}
        />
        <role
          on="math"
          match="numbered"
          apply="ieeeEquation"
          numbering={{ counter: "ieee-equation", format: "($ieee-equation)" }}
        />
      </rules>

      <header anchor="top-center" when="not-first-page" typography={{ fontSize: "8pt", fontStyle: "italic" }}>
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center" typography={{ fontSize: "8pt" }}>
        <page-number />
      </footer>

      <stack gap="0">
        <region style={{ textAlign: "center", paddingBottom: "4mm" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        <region style={{ columns: 2, columnGap: "4.24mm", textAlign: "justify" }}>
          <slot name="abstract" />
          <slot name="body" />
          <bibliography title="References" />
        </region>
      </stack>
    </page>
  );
}
