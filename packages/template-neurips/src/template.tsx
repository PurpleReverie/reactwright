import "reactwright/jsx";
import React from "react";

// NeurIPS 2025 single-column conference-paper template, packaged as a
// reusable module:
//
//   import { Template, NEURIPS_STYLES } from "@reactwright/template-neurips";
//
// Drop <Template /> into a content `.tsx`, or compose NEURIPS_STYLES
// into your own <styles> block to inherit just the typography.
//
// The layout is matched to the official `neurips_2025.sty` /
// `neurips_2025.pdf` style files (the compiled example PDF is the
// visual spec):
//
//   • US Letter, text block 5.5in × 9in, centered (1in top/bottom,
//     1.5in left/right margins).
//   • Body: Times 10pt, 11pt leading, justified, NO first-line indent;
//     paragraphs separated by a 5.5pt skip.
//   • Title: 17pt bold, centered between a 4pt rule above and a 1pt
//     rule below (0.25in space to each rule).
//   • Authors: centered block(s) below the title — bold name,
//     affiliation/address regular, monospace email — rendered via the
//     <meta name="author"> slot (see AuthorCard / authorMetas).
//   • Abstract: centered bold "Abstract" heading (12pt) with the
//     paragraph indented 0.5in on both margins, 10pt justified.
//   • Section headings: flush-left, bold, Arabic-numbered. Level 1 is
//     12pt ("1 Title"); levels 2–3 are 10pt ("1.1", "1.1.1").
//     References, Acknowledgments, and the Paper Checklist are
//     UNnumbered (routed by role; excluded from the section counter).
//   • Figure captions "Figure N:" (below, 9pt); table captions
//     "Table N:" (above, 9pt); booktabs-style horizontal-rule tables.
//   • References: 9pt, hanging indent, plain text (author-year). No
//     BibTeX step — entries are authored as a `role="bibliography"`
//     section.
//   • Footer: page number on pages 2+; first page carries the
//     conference notice instead (matches the compiled example).
//
// Role conventions the template keys off (set these on back-matter
// `<section>`s; everything else is a numbered body section):
//   role="abstract"     → routed to the abstract slot, centered heading
//   role="bibliography" → References (unnumbered, 9pt hanging indent)
//   role="unnumbered"   → Acknowledgments etc. (unnumbered heading)
//   role="checklist"    → NeurIPS Paper Checklist (page break, plain
//                         numbered list; see NeurIPSChecklist)

export const NEURIPS_STYLES = `
  /* ---- Title ---------------------------------------------------- */
  /* 17pt bold, centered, bracketed by a 4pt rule above and a 1pt rule
     below with 0.25in (18pt) of space to each rule. */
  .nips-title {
    font-size: 17pt;
    font-weight: bold;
    text-align: center;
    text-align-last: center;
    line-height: 1.15;
    margin: 0;
    padding: 18pt 0;
    border-top: 4pt solid #000;
    border-bottom: 1pt solid #000;
  }

  /* ---- Authors -------------------------------------------------- */
  /* Centered; multiple authors sit side by side. The name is bold
     (AuthorCard wraps it in <strong>); affiliation/address are
     regular; the email is monospace. */
  .nips-authors {
    text-align: center;
    text-align-last: center;
    margin: 10pt 0 22pt 0;
    line-height: 1.3;
  }

  .nips-author {
    display: inline-block;
    vertical-align: top;
    text-align: center;
    margin: 0 18pt;
    font-size: 10pt;
  }

  /* Note: the dialect only emits CSS for single-class rules bound via
     <rule>; compound selectors like '.nips-author code' are dropped at
     lowering. The author name is bold via <strong> and the email is
     monospace via the engine's base <code> styling, so no extra rules
     are needed here. */

  /* ---- Abstract ------------------------------------------------- */
  /* Centered bold "Abstract" heading (12pt); paragraph indented 0.5in
     on both margins, 10pt justified. */
  .nips-abstract-region { margin: 6pt 0 4pt 0; }

  .nips-abstract-heading {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    text-align-last: center;
    margin: 0 0 6pt 0;
  }

  .nips-abstract-p {
    margin: 0 0.5in 5.5pt 0.5in;
    text-indent: 0;
    text-align: justify;
  }

  /* ---- Body ----------------------------------------------------- */
  /* Reset the section counter at the start of the body flow so the
     first numbered heading reads "1". */
  .nips-body { numbering-reset: nips-sec; }

  .nips-para {
    margin: 0 0 5.5pt 0;
    text-indent: 0;
    text-align: justify;
  }

  /* Lists — bound to the 'list' IR node (single-class rules only; the
     engine resets ol/ul margins, so spacing is restored here). */
  .nips-list { margin: 0 0 5.5pt 0; padding-left: 2em; }

  /* Block quotes — indented on both margins, like LaTeX's quote env. */
  .nips-quote { margin: 6pt 2em; }

  /* ---- Section headings ----------------------------------------- */
  /* Flush left, bold, Arabic-numbered. Level 1 = 12pt; 2–3 = 10pt. */
  .nips-section-head {
    font-size: 12pt;
    font-weight: bold;
    text-align: left;
    text-align-last: left;
    margin: 11pt 0 4pt 0;
    numbering: counter(nips-sec) "$nips-sec   ";
    numbering-reset: nips-sub;
    break: after(avoid);
  }

  .nips-subsection-head {
    font-size: 10pt;
    font-weight: bold;
    text-align: left;
    text-align-last: left;
    margin: 10pt 0 3pt 0;
    numbering: counter(nips-sub) "$nips-sec.$nips-sub   ";
    numbering-reset: nips-subsub;
    break: after(avoid);
  }

  .nips-subsubsection-head {
    font-size: 10pt;
    font-weight: bold;
    text-align: left;
    text-align-last: left;
    margin: 9pt 0 3pt 0;
    numbering: counter(nips-subsub) "$nips-sec.$nips-sub.$nips-subsub   ";
    break: after(avoid);
  }

  /* Appendix headings — top-level sections lettered A, B, … and
     subsections "A.1". The subsection mixes an upper-alpha counter
     (nips-app) with a decimal counter (nips-sub); since the 'numbering'
     concept applies a single counter-style to its whole format, the
     mixed case is expressed with 'prefix' + a pass-through
     'counter-increment' instead. */
  .nips-appendix-head {
    font-size: 12pt;
    font-weight: bold;
    text-align: left;
    text-align-last: left;
    margin: 11pt 0 4pt 0;
    numbering: counter(nips-app, upper-alpha) "$nips-app   ";
    numbering-reset: nips-sub;
    break: after(avoid);
  }

  .nips-appendix-subhead {
    font-size: 10pt;
    font-weight: bold;
    text-align: left;
    text-align-last: left;
    margin: 10pt 0 3pt 0;
    counter-increment: nips-sub;
    prefix: counter(nips-app, upper-alpha) "." counter(nips-sub) "   ";
    break: after(avoid);
  }

  /* Unnumbered back-matter headings (Acknowledgments, References,
     Checklist): 12pt bold, flush left, no counter. */
  .nips-unnumbered-head {
    font-size: 12pt;
    font-weight: bold;
    text-align: left;
    text-align-last: left;
    margin: 12pt 0 5pt 0;
    break: after(avoid);
  }

  /* ---- Figures -------------------------------------------------- */
  .nips-figure {
    margin: 9pt 0;
    text-align: center;
    break: inside(avoid);
  }

  /* Bound to the 'figure-image' IR node so it actually centers — a
     compound '.nips-figure img' rule would be dropped at lowering. */
  .nips-figure-img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }

  .nips-fig-caption {
    font-size: 9pt;
    text-align: center;
    text-align-last: center;
    line-height: 1.25;
    text-indent: 0;
    margin-top: 6pt;
    numbering: counter(nips-fig) "Figure $nips-fig:  ";
  }

  /* ---- Tables (booktabs: horizontal rules only) ----------------- */
  .nips-table {
    border-collapse: collapse;
    margin: 4pt auto 9pt auto;
    font-size: 10pt;
    border-top: 1pt solid #000;
    border-bottom: 1pt solid #000;
  }

  .nips-table-cell {
    padding: 2pt 10pt;
    text-align: left;
    text-indent: 0;
  }

  .nips-table-header {
    font-weight: normal;
    padding: 2pt 10pt;
    text-indent: 0;
    border-bottom: 0.6pt solid #000;
  }

  .nips-cell-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
    font-size: inherit;
  }

  .nips-table-caption {
    font-size: 9pt;
    text-align: center;
    text-align-last: center;
    line-height: 1.25;
    text-indent: 0;
    margin-bottom: 5pt;
    caption-side: top;
    numbering: counter(nips-tbl) "Table $nips-tbl:  ";
  }

  /* ---- References ----------------------------------------------- */
  /* 9pt, hanging indent, plain author-year text. */
  .nips-references { font-size: 9pt; }

  .nips-ref-entry {
    font-size: 9pt;
    line-height: 1.3;
    margin: 0 0 4pt 0;
    padding-left: 1.5em;
    text-indent: -1.5em;
    text-align: left;
  }

  /* ---- Paper Checklist ------------------------------------------ */
  /* The list itself gets '.nips-list'; the Question/Answer/Justification
     paragraphs keep the engine's tight default spacing, which suits the
     compact checklist. */
  .nips-checklist { break: before(page); }

  /* ---- Misc ----------------------------------------------------- */
  .nips-notice { font-size: 9pt; }
  .nips-cite { color: inherit; text-decoration: none; }
  .nips-math { text-align: center; margin: 6pt 0; text-indent: 0; }
`;

// NEURIPS_CSS is empty: every rule is expressed through the styling
// dialect (<styles> + <rule>). Kept as an export for forward-compat
// and parity with the other template packages.
export const NEURIPS_CSS = "";

export type TemplateProps = {
  // First-page footer notice. Defaults to the camera-ready ("final")
  // track string. Pass "Preprint." for the preprint look, or any other
  // string (e.g. a workshop banner). Set to "" to suppress it.
  notice?: string;
};

const DEFAULT_NOTICE =
  "39th Conference on Neural Information Processing Systems (NeurIPS 2025).";

export function Template({ notice = DEFAULT_NOTICE }: TemplateProps = {}) {
  return (
    <page
      page={{
        size: "letter",
        marginTop: "1in",
        marginBottom: "1in",
        marginLeft: "1.5in",
        marginRight: "1.5in"
      }}
      typography={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "10pt",
        lineHeight: 1.1,
        textAlign: "justify"
      }}
      style={{ customCss: NEURIPS_CSS }}
    >
      <styles>{NEURIPS_STYLES}</styles>

      {/* Title */}
      <rule match={{ kind: "title" }} className="nips-title" />

      {/* Authors — every <meta name="author"> becomes one centered card. */}
      <rule match={{ kind: "meta", attr: { name: "author" } }} className="nips-author" />

      {/* Abstract */}
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "abstract" } }}
        className="nips-abstract-heading"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "abstract" } }}
        className="nips-abstract-p"
      />

      {/* Numbered section headings — exclude the abstract and the
          unnumbered back matter (references / acknowledgments / checklist). */}
      <rule
        match={{
          kind: "section-heading",
          depth: 1,
          not: {
            or: [
              { within: { kind: "section", role: "abstract" } },
              { within: { kind: "section", role: "bibliography" } },
              { within: { kind: "section", role: "unnumbered" } },
              { within: { kind: "section", role: "checklist" } },
              { within: { kind: "section", role: "appendix" } }
            ]
          }
        }}
        className="nips-section-head"
      />
      <rule
        match={{ kind: "section-heading", depth: 2, not: { within: { kind: "section", role: "appendix" } } }}
        className="nips-subsection-head"
      />
      <rule match={{ kind: "section-heading", depth: 3 }} className="nips-subsubsection-head" />

      {/* Appendix — top-level sections lettered A, B; subsections "A.1". */}
      <rule
        match={{ kind: "section-heading", depth: 1, within: { kind: "section", role: "appendix" } }}
        className="nips-appendix-head"
      />
      <rule
        match={{ kind: "section-heading", depth: 2, within: { kind: "section", role: "appendix" } }}
        className="nips-appendix-subhead"
      />

      {/* Unnumbered back-matter headings. */}
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "bibliography" } }}
        className="nips-unnumbered-head"
      />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "unnumbered" } }}
        className="nips-unnumbered-head"
      />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "checklist" } }}
        className="nips-unnumbered-head"
      />

      {/* Body paragraphs — everything except abstract / references /
          checklist / table cells (each styled on its own below). */}
      <rule
        match={{
          kind: "paragraph",
          not: {
            or: [
              { within: { kind: "section", role: "abstract" } },
              { within: { kind: "section", role: "bibliography" } },
              { within: { kind: "section", role: "checklist" } },
              { within: { kind: "cell" } }
            ]
          }
        }}
        className="nips-para"
      />

      {/* References */}
      <rule match={{ kind: "section", role: "bibliography" }} className="nips-references" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "bibliography" } }}
        className="nips-ref-entry"
      />

      {/* Paper Checklist */}
      <rule match={{ kind: "section", role: "checklist" }} className="nips-checklist" />

      {/* Figures */}
      <rule match={{ kind: "figure" }} className="nips-figure" />
      <rule match={{ kind: "figure-image" }} className="nips-figure-img" />
      <rule match={{ kind: "caption", parent: { kind: "figure" } }} className="nips-fig-caption" />

      {/* Lists */}
      <rule match={{ kind: "list" }} className="nips-list" />

      {/* Tables */}
      <rule match={{ kind: "table" }} className="nips-table" />
      <rule match={{ kind: "caption", parent: { kind: "table" } }} className="nips-table-caption" />
      <rule match={{ kind: "cell" }} className="nips-table-cell" />
      <rule match={{ kind: "cell", attr: { header: true } }} className="nips-table-header" />
      <rule match={{ kind: "paragraph", within: { kind: "cell" } }} className="nips-cell-p" />

      {/* Block quotes */}
      <rule match={{ kind: "blockquote" }} className="nips-quote" />

      {/* Citations (plain author-year) and math */}
      <rule match={{ kind: "cite" }} className="nips-cite" />
      <rule match={{ kind: "math" }} className="nips-math" />

      {/* Chrome: page number on pages 2+, conference notice on page 1. */}
      <footer anchor="bottom-center" when="not-first-page" typography={{ fontSize: "10pt" }}>
        <page-number />
      </footer>
      {notice !== "" ? (
        <footer anchor="bottom-center" when="first-page" typography={{ fontSize: "9pt" }}>
          {notice}
        </footer>
      ) : null}

      {/* Layout — single column. */}
      <stack gap="0">
        <slot name="title" />
        <region className="nips-authors">
          <slot name="author" />
        </region>
        <region className="nips-abstract-region">
          <slot name="abstract" />
        </region>
        <region className="nips-body">
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}
