import "reactwright/jsx";
import React from "react";

// Formal business-letter template. One page, US Letter, 1" margins,
// Times 11pt block-style body (no indent, paragraph spacing). The
// letter is composed of named regions, each tagged with `role`:
//
//   role="letterhead"  — sender's name + address + contact info, top
//                        of page, left-aligned modern style.
//   role="date"        — right-aligned date line below letterhead.
//   role="addressee"   — left-aligned recipient block (name, title,
//                        organization, address).
//   role="subject"     — optional bold "Re: …" line.
//   role="salutation"  — "Dear …,"
//   role="body"        — one or more paragraphs of body prose. NOT
//                        a section role; just normal author-side
//                        sections without a role get treated as body.
//   role="closing"     — "Sincerely,"
//   role="signature"   — name + title + organization. The template
//                        adds three blank lines above for the
//                        handwritten signature.
//
// No page numbers, no running headers. Single-page assumed; the
// engine will paginate if the body overflows.
//
// Slice-1+ dialect only. customCss is empty.

export const LETTER_STYLES = `
  .letter-letterhead {
    margin: 0 0 24pt 0;
  }

  .letter-letterhead-heading {
    font-size: 14pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    text-align: left;
    margin: 0 0 2pt 0;
    text-indent: 0;
    break: after(avoid);
  }

  .letter-letterhead-p {
    font-size: 10pt;
    margin: 0;
    text-indent: 0;
    text-align: left;
    line-height: 1.3;
  }

  .letter-date {
    margin: 0 0 18pt 0;
  }

  .letter-date-p {
    margin: 0;
    text-indent: 0;
    text-align: right;
    font-size: 11pt;
  }

  .letter-addressee {
    margin: 0 0 18pt 0;
  }

  .letter-addressee-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
    font-size: 11pt;
    line-height: 1.3;
  }

  .letter-subject {
    margin: 0 0 12pt 0;
  }

  .letter-subject-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
    font-size: 11pt;
    font-weight: bold;
  }

  .letter-salutation {
    margin: 0 0 12pt 0;
  }

  .letter-salutation-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
    font-size: 11pt;
  }

  .letter-body-p {
    margin: 12pt 0 0 0;
    text-indent: 0;
    text-align: left;
    font-size: 11pt;
  }

  .letter-closing {
    margin: 18pt 0 0 0;
  }

  .letter-closing-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
    font-size: 11pt;
  }

  .letter-signature {
    margin: 48pt 0 0 0;
  }

  .letter-signature-p {
    margin: 0;
    text-indent: 0;
    text-align: left;
    font-size: 11pt;
    line-height: 1.3;
  }

  .letter-code-inline {
    background: none;
    padding: 0;
    border-radius: 0;
    font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
    font-size: 0.92em;
  }
`;

// LETTER_CSS is empty. All styling is expressed via the dialect's
// <styles> block + <rule> bindings.
export const LETTER_CSS = "";

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
        fontSize: "11pt",
        lineHeight: 1.3,
        textAlign: "left"
      }}
    >
      <styles>{LETTER_STYLES}</styles>

      <rule match={{ kind: "code" }} className="letter-code-inline" />

      {/* Letterhead */}
      <rule match={{ kind: "section", role: "letterhead" }} className="letter-letterhead" />
      <rule
        match={{ kind: "section-heading", within: { kind: "section", role: "letterhead" } }}
        className="letter-letterhead-heading"
      />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "letterhead" } }}
        className="letter-letterhead-p"
      />

      {/* Date */}
      <rule match={{ kind: "section", role: "date" }} className="letter-date" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "date" } }}
        className="letter-date-p"
      />

      {/* Addressee */}
      <rule match={{ kind: "section", role: "addressee" }} className="letter-addressee" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "addressee" } }}
        className="letter-addressee-p"
      />

      {/* Subject */}
      <rule match={{ kind: "section", role: "subject" }} className="letter-subject" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "subject" } }}
        className="letter-subject-p"
      />

      {/* Salutation */}
      <rule match={{ kind: "section", role: "salutation" }} className="letter-salutation" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "salutation" } }}
        className="letter-salutation-p"
      />

      {/* Closing */}
      <rule match={{ kind: "section", role: "closing" }} className="letter-closing" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "closing" } }}
        className="letter-closing-p"
      />

      {/* Signature block — extra top margin to leave room for a
          handwritten signature. */}
      <rule match={{ kind: "section", role: "signature" }} className="letter-signature" />
      <rule
        match={{ kind: "paragraph", within: { kind: "section", role: "signature" } }}
        className="letter-signature-p"
      />

      {/* Body paragraphs — any paragraph that isn't in a named region
          gets block-style body typography with paragraph spacing. */}
      <rule
        match={{
          kind: "paragraph",
          not: {
            or: [
              { within: { kind: "section", role: "letterhead" } },
              { within: { kind: "section", role: "date" } },
              { within: { kind: "section", role: "addressee" } },
              { within: { kind: "section", role: "subject" } },
              { within: { kind: "section", role: "salutation" } },
              { within: { kind: "section", role: "closing" } },
              { within: { kind: "section", role: "signature" } }
            ]
          }
        }}
        className="letter-body-p"
      />

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
