import "reactdoc/jsx";

// Strict IEEE conference paper template, packaged as a reusable
// module. Templates that want the same IEEE styling can:
//
//   import { Template, IEEE_CSS } from "./ieee";
//
// and either drop the Template into their content `.tsx` or compose
// IEEE_CSS into their own customCss to inherit just the typography.
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

export const IEEE_CSS = [
  // ── Title block ──────────────────────────────────────────────────
  "h1.reactdoc-document-title{font-size:24pt;font-weight:normal;font-family:'Times New Roman',Times,serif;text-align:center;margin:0 0 12pt 0;line-height:1.1;}",

  // ── Abstract / Index Terms (9pt bold-italic block) ──────────────
  ".reactdoc-abstract{font-size:9pt;font-weight:bold;font-style:italic;text-align:justify;margin:0 0 8pt 0;}",
  ".reactdoc-abstract p{margin:0;text-indent:0;}",
  ".reactdoc-abstract p + p{margin-top:6pt;}",

  // ── Top-level section heads: ROMAN NUMERAL, centered, small-caps ─
  "h2.reactdoc-section-title{font-size:10pt;font-weight:normal;font-style:normal;font-family:'Times New Roman',Times,serif;text-align:center;text-align-last:center;text-transform:uppercase;letter-spacing:0.04em;margin:12pt 0 4pt 0;break-after:avoid;counter-increment:ieee-section;counter-reset:ieee-subsection;}",
  "h2.reactdoc-section-title::before{content:counter(ieee-section,upper-roman) '. ';}",
  ".reactdoc-flow{counter-reset:ieee-section;}",

  // ── Nested subsection heads (h3): italic, flush left, A./B./C. ──
  "h3.reactdoc-section-title{font-size:10pt;font-weight:normal;font-style:italic;font-family:'Times New Roman',Times,serif;text-align:left;text-transform:none;letter-spacing:0;margin:6pt 0 2pt 0;break-after:avoid;counter-increment:ieee-subsection;}",
  "h3.reactdoc-section-title::before{content:counter(ieee-subsection,upper-alpha) '. ';}",

  // ── Body paragraphs: 1em first-line indent ──────────────────────
  ".reactdoc-flow p{margin:0;text-indent:1em;}",
  "h2 + p, h3 + p, h4 + p{text-indent:0;}",

  // ── Figures: caption "Fig. 1. ..." centered below, 8pt ──────────
  "figure{margin:8pt 0;text-align:center;page-break-inside:avoid;break-inside:avoid;}",
  "figure img{max-width:100%;height:auto;display:block;margin:0 auto 4pt auto;}",
  "figure figcaption{font-size:8pt;font-family:'Times New Roman',Times,serif;text-align:center;line-height:1.2;text-indent:0;}",

  // ── Inline code: plain mono, no background box ──────────────────
  "code{background:none;padding:0;border-radius:0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:0.92em;}",

  // ── Citations: IEEE-style [N] brackets, black inline text ───────
  "a.reactdoc-cite{color:inherit;text-decoration:none;}",
  "a.reactdoc-cite::before{content:'[';}",
  "a.reactdoc-cite::after{content:target-counter(attr(href url), reactdoc-bib) ']';}",

  // ── References list ─────────────────────────────────────────────
  ".reactdoc-bibliography{font-size:8pt;}",
  ".reactdoc-bibliography h2{font-size:10pt;font-weight:normal;font-style:normal;text-transform:uppercase;letter-spacing:0.04em;text-align:center;text-align-last:center;margin:12pt 0 6pt 0;break-after:avoid;}",
  ".reactdoc-bibliography ol{list-style:none;padding-left:0;margin:0;}",
  ".reactdoc-bibliography li{text-indent:-1.4em;padding-left:1.4em;margin-bottom:2pt;text-align:justify;}",
  ".reactdoc-bibliography li::before{content:'[' counter(reactdoc-bib) '] ';}",

  // ── Math: numbered equation right-margin ────────────────────────
  ".reactdoc-math-block{text-indent:0;}"
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
