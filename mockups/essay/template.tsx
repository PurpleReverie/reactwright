import "reactwright/jsx";
import { Bibliography } from "../../src/userland/Bibliography.js";

// MLA-style academic essay template, packaged as a reusable module.
// Templates that want the same essay styling can:
//
//   import { Template, ESSAY_STYLES } from "./essay";
//
// Rules captured:
//   • US Letter paper, 1" margins all around
//   • Body: Times New Roman 12pt, line-height 2.0 (double-spaced)
//   • Paragraphs: 0.5em first-line indent
//   • Title: 14pt bold centered; Author: italic centered below
//   • Section headings: 12pt bold, left-aligned, NO numbering
//   • Block quotes: indented 0.5", upright (no italic)
//   • Running header on page 2+: lastname + page number, right-aligned
//   • Works Cited: hanging indent, no numeric prefix
//
// Slice-1+ dialect only. customCss is empty.

export const ESSAY_STYLES = `
  .essay-title {
    font-size: 14pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    margin: 0 0 4pt 0;
    line-height: 1.2;
    text-indent: 0;
  }

  .essay-author {
    font-size: 12pt;
    font-style: italic;
    font-weight: normal;
    text-align: center;
    margin: 0 0 12pt 0;
    text-indent: 0;
  }

  .essay-section-head {
    font-size: 12pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    margin: 12pt 0 0 0;
    text-indent: 0;
    break: after(avoid);
  }

  .essay-body-p {
    margin: 0;
    text-indent: 0.5in;
    text-align: left;
  }

  .essay-heading-adjacent-p {
    text-indent: 0;
  }

  .essay-blockquote {
    margin: 6pt 0.5in;
    font-style: normal;
    text-indent: 0;
  }

  .essay-blockquote-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
  }

  .essay-bibliography {
    font-size: 12pt;
    margin-top: 18pt;
  }

  .essay-bib-heading {
    font-size: 12pt;
    font-weight: bold;
    font-style: normal;
    text-align: center;
    margin: 0 0 6pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .essay-bib-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  .essay-bib-entry {
    margin-bottom: 0;
  }

  .essay-bib-entry-p {
    margin: 0;
    text-align: left;
    text-indent: -0.5in;
    padding-left: 0.5in;
  }

  .essay-cite {
    color: inherit;
    text-decoration: none;
  }

  .essay-code-inline {
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
        marginLeft: "1in",
        marginRight: "1in"
      }}
      typography={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "12pt",
        lineHeight: 2.0,
        textAlign: "left"
      }}
    >
      <styles>{ESSAY_STYLES}</styles>

      <rule match={{ kind: "title" }} className="essay-title" />
      <rule match={{ kind: "author" }} className="essay-author" />
      <rule match={{ kind: "code" }} className="essay-code-inline" />

      {/* Section headings — depth 1 only, exclude bibliography heading */}
      <rule
        match={{
          kind: "section-heading",
          depth: 1,
          not: { within: { kind: "section", role: "bibliography" } }
        }}
        className="essay-section-head"
      />

      {/* Body paragraphs everywhere except blockquote + bibliography */}
      <rule
        match={{
          kind: "paragraph",
          not: {
            or: [
              { within: { kind: "section", role: "bibliography" } },
              { within: { kind: "blockquote" } }
            ]
          }
        }}
        className="essay-body-p"
      />

      {/* First paragraph after a heading is flush left (no indent) */}
      <rule
        match={{ kind: "paragraph", follows: { kind: "section-heading" } }}
        className="essay-heading-adjacent-p"
      />

      {/* Block quotes — left/right indented, no italic, no first-line indent */}
      <rule match={{ kind: "blockquote" }} className="essay-blockquote" />
      <rule
        match={{ kind: "paragraph", within: { kind: "blockquote" } }}
        className="essay-blockquote-p"
      />

      {/* Cites: plain author-style — no [N] bracket; rely on the bib
          target ID instead. The default engine cite suffix is a [N]
          counter via target-counter, which we override here with
          empty prefix/suffix so author may insert their own. */}
      <rule match={{ kind: "cite" }} className="essay-cite" />

      {/* Works Cited (userland Bibliography emits a section role="bibliography"). */}
      <rule match={{ kind: "section", role: "bibliography" }} className="essay-bibliography" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "bibliography" } }}
        className="essay-bib-heading"
      />
      <rule
        match={{ kind: "list", within: { kind: "section", role: "bibliography" } }}
        className="essay-bib-list"
      />
      <rule
        match={{ kind: "item", within: { kind: "section", role: "bibliography" } }}
        className="essay-bib-entry"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "bibliography" } }}
        className="essay-bib-entry-p"
      />

      <header anchor="top-right" when="not-first-page" typography={{ fontSize: "12pt" }}>
        <running name="author-lastname" /> <page-number />
      </header>

      <stack gap="0">
        <region>
          <slot name="title" />
          <slot name="author" />
          <slot name="body" />
          <Bibliography title="Works Cited" />
        </region>
      </stack>
    </page>
  );
}
