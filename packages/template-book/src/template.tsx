import "reactwright/jsx";
import { Bibliography } from "../../reactwright/src/userland/Bibliography.js";

// Long-form book template. Trade-paperback dimensions (5.5" × 8.5"),
// chapter-based flow, serif body. Distinguishes three section roles:
//
//   role="chapter"      — body chapter; gets "Chapter N" small-caps
//                         eyebrow, large centered title, page break
//                         before, first paragraph drop-cap-ready.
//   role="front-matter" — title page, copyright, dedication. Renders
//                         centered without chapter numbering. Author
//                         supplies the typographic shape via inline
//                         content.
//   role="back-matter"  — afterword, acknowledgments, etc. Renders as
//                         a chapter-like section without numbering.
//
// Conventions:
//   • 5.5" × 8.5" page (US trade paperback)
//   • 0.75"/0.75" top/bottom margin, 0.75" inside, 0.625" outside
//     (twoSided: true for mirrored chrome; the binding asymmetry is
//     approximated by uniform margins because the engine does not yet
//     expose marginInside/marginOutside on @page — see the README).
//   • Body: Georgia 10.5pt, line-height 1.35
//   • Chapter title block centered, content begins ~⅓ down the page
//   • Section heads within a chapter: 11pt bold italic, no numbering
//   • Body paragraphs: 1.5em first-line indent, 0 margin (standard
//     book flow). First paragraph after any heading: no indent.
//   • Running header (page 2+): chapter title on odd pages, book
//     title on even pages, page number on outside corner.
//
// Slice-1+ dialect only. customCss is empty.

export const BOOK_STYLES = `
  .book-frontmatter {
    text-align: center;
    margin: 0 0 18pt 0;
  }

  .book-frontmatter-heading {
    font-size: 12pt;
    font-weight: normal;
    font-style: normal;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin: 0 0 12pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .book-frontmatter-p {
    font-size: 10.5pt;
    margin: 0 0 6pt 0;
    text-indent: 0;
    text-align: center;
  }

  .book-titlepage {
    text-align: center;
    padding: 18pt 0;
  }

  .book-titlepage-heading {
    font-size: 22pt;
    font-weight: bold;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-align: center;
    margin: 0 0 18pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .book-titlepage-p {
    font-size: 12pt;
    margin: 0 0 4pt 0;
    text-indent: 0;
    text-align: center;
  }

  .book-chapter {
    margin: 0;
    break: before(page);
  }

  .book-chapter-heading {
    font-size: 16pt;
    font-weight: bold;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-align: center;
    margin: 96pt 0 36pt 0;
    text-indent: 0;
    line-height: 1.2;
    numbering: counter(book-chapter) "Chapter $book-chapter — ";
    break: after(avoid);
  }

  .book-section-head {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    margin: 12pt 0 2pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .book-body-p {
    margin: 0;
    text-indent: 1.5em;
    text-align: justify;
  }

  .book-heading-adjacent-p {
    text-indent: 0;
  }

  .book-blockquote {
    margin: 6pt 18pt;
    font-style: normal;
    text-indent: 0;
  }

  .book-blockquote-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
  }

  .book-backmatter {
    margin: 0;
    break: before(page);
  }

  .book-backmatter-heading {
    font-size: 14pt;
    font-weight: bold;
    font-style: normal;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-align: center;
    margin: 36pt 0 18pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .book-bibliography {
    font-size: 10pt;
    margin-top: 18pt;
  }

  .book-bib-heading {
    font-size: 14pt;
    font-weight: bold;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-align: center;
    margin: 36pt 0 18pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .book-bib-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  .book-bib-entry {
    margin-bottom: 4pt;
  }

  .book-bib-entry-p {
    margin: 0;
    text-align: left;
    text-indent: -1.4em;
    padding-left: 1.4em;
  }

  .book-cite {
    color: inherit;
    text-decoration: none;
  }

  .book-code-inline {
    background: none;
    padding: 0;
    border-radius: 0;
    font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
    font-size: 0.92em;
  }
`;

// BOOK_CSS is empty. All styling is expressed via the dialect's
// <styles> block + <rule> bindings.
export const BOOK_CSS = "";

export function Template() {
  return (
    <page
      page={{
        size: "5.5in 8.5in",
        marginTop: "0.75in",
        marginBottom: "0.75in",
        marginLeft: "0.75in",
        marginRight: "0.75in",
        twoSided: true
      }}
      typography={{
        fontFamily: "'Georgia', 'Times New Roman', Times, serif",
        fontSize: "10.5pt",
        lineHeight: 1.35,
        textAlign: "justify"
      }}
    >
      <styles>{BOOK_STYLES}</styles>

      <rule match={{ kind: "title" }} className="book-titlepage-heading" />
      <rule match={{ kind: "author" }} className="book-titlepage-p" />
      <rule match={{ kind: "code" }} className="book-code-inline" />

      {/* Front-matter sections (copyright, dedication, etc.) */}
      <rule match={{ kind: "section", role: "front-matter" }} className="book-frontmatter" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "front-matter" } }}
        className="book-frontmatter-heading"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "front-matter" } }}
        className="book-frontmatter-p"
      />

      {/* Title page (a special front-matter shape — role="title-page") */}
      <rule match={{ kind: "section", role: "title-page" }} className="book-titlepage" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "title-page" } }}
        className="book-titlepage-p"
      />

      {/* Chapter sections — large centered title, page break before */}
      <rule match={{ kind: "section", role: "chapter" }} className="book-chapter" />
      <rule
        match={{
          kind: "section-heading",
          depth: 1,
          within: { kind: "section", role: "chapter" }
        }}
        className="book-chapter-heading"
      />

      {/* Subsection headings inside a chapter — depth 2, plain */}
      <rule
        match={{
          kind: "section-heading",
          depth: 2,
          within: { kind: "section", role: "chapter" }
        }}
        className="book-section-head"
      />

      {/* Body paragraphs inside chapters — exclude blockquotes */}
      <rule
        match={{
          kind: "paragraph",
          within: { kind: "section", role: "chapter" },
          not: { within: { kind: "blockquote" } }
        }}
        className="book-body-p"
      />
      <rule
        match={{
          kind: "paragraph",
          within: { kind: "section", role: "chapter" },
          follows: { kind: "section-heading" }
        }}
        className="book-heading-adjacent-p"
      />

      {/* Block quotes — modest indent, no italic */}
      <rule match={{ kind: "blockquote" }} className="book-blockquote" />
      <rule
        match={{ kind: "paragraph", within: { kind: "blockquote" } }}
        className="book-blockquote-p"
      />

      {/* Back-matter sections (afterword, acknowledgments). */}
      <rule match={{ kind: "section", role: "back-matter" }} className="book-backmatter" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "back-matter" } }}
        className="book-backmatter-heading"
      />
      <rule
        match={{
          kind: "paragraph",
          within: { kind: "section", role: "back-matter" }
        }}
        className="book-body-p"
      />

      {/* Cites pass through as plain superscript-style references */}
      <rule match={{ kind: "cite" }} className="book-cite" />

      {/* Bibliography (userland) — only present if author calls it. */}
      <rule match={{ kind: "section", role: "bibliography" }} className="book-bibliography" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "bibliography" } }}
        className="book-bib-heading"
      />
      <rule
        match={{ kind: "list", within: { kind: "section", role: "bibliography" } }}
        className="book-bib-list"
      />
      <rule
        match={{ kind: "item", within: { kind: "section", role: "bibliography" } }}
        className="book-bib-entry"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "bibliography" } }}
        className="book-bib-entry-p"
      />

      {/* Running headers — chapter title on the inside, book title on
          the outside, page numbers on the outside corner. Two-sided
          mirroring is automatic for inside/outside anchors. */}
      <header
        anchor="top-inside"
        when="not-first-page"
        typography={{ fontSize: "9pt", fontStyle: "italic" }}
      >
        <running name="chapter-title" />
      </header>
      <header
        anchor="top-outside"
        when="not-first-page"
        typography={{ fontSize: "9pt", fontStyle: "italic" }}
      >
        <running name="document-title" />
      </header>
      <footer anchor="bottom-outside" typography={{ fontSize: "9pt" }}>
        <page-number />
      </footer>

      <stack gap="0">
        <region>
          <slot name="title" />
          <slot name="author" />
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}
