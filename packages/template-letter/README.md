# @reactwright/template-letter

Formal business-letter template for the Reactwright document engine.
Single page (typically), US Letter, Times 11pt block-style body.
Composes the conventional regions of a formal letter via section
roles: letterhead, date, addressee, subject, salutation, body,
closing, signature.

## When to use this over alternatives

- Pick `@reactwright/template-letter` for cover letters, formal
  business correspondence, legal-style letters, or anything that
  wants the conventional letterhead-date-addressee-body-closing
  shape on a single page.
- For anything multi-page with sections, headings, and figures, use
  `@reactwright/template-essay`, `@reactwright/template-report`, or
  one of the IEEE variants.

## Format conventions

- US Letter, 1" margins all sides.
- Body: Times New Roman 11pt, line-height 1.3, single-spaced.
- Letterhead (`role="letterhead"`): sender's name as 14pt bold left-
  aligned heading; address + contact info as 10pt left-aligned
  paragraphs below.
- Date (`role="date"`): right-aligned 11pt below the letterhead.
- Addressee (`role="addressee"`): left-aligned 11pt block; name,
  title, organization, address as separate paragraphs.
- Subject (`role="subject"`): optional bold 11pt "Re: …" line.
- Salutation (`role="salutation"`): "Dear …,"
- Body: any paragraphs *not* inside one of the named regions get
  block-style body typography — no indent, 12pt top margin between
  paragraphs.
- Closing (`role="closing"`): "Sincerely,"
- Signature (`role="signature"`): name + title + organization, with
  48pt top margin to leave room for a handwritten signature.

No page numbers and no running header.

## Usage

```tsx
import "reactwright/jsx";
import { Template } from "@reactwright/template-letter";

export { Template };

export default function MyLetter() {
  return (
    <document title="Letter to …" author="Sender">
      <section role="letterhead" title="Alex Marsh">
        <p>142 Pine Street</p>
        <p>Carrick, NY 10001</p>
        <p>alex@example.com · (212) 555-0142</p>
      </section>

      <section role="date" title="">
        <p>1 October 2026</p>
      </section>

      <section role="addressee" title="">
        <p>Dr. R. Quinlan</p>
        <p>Department of Computer Science</p>
        <p>State University</p>
        <p>Albany, NY 12222</p>
      </section>

      <section role="subject" title="">
        <p>Re: Submission for Q3 review</p>
      </section>

      <section role="salutation" title="">
        <p>Dear Dr. Quinlan,</p>
      </section>

      <p>First body paragraph.</p>
      <p>Second body paragraph.</p>

      <section role="closing" title="">
        <p>Sincerely,</p>
      </section>

      <section role="signature" title="">
        <p>Alex Marsh</p>
        <p>Independent Researcher</p>
      </section>
    </document>
  );
}
```

## Implementation notes

Each named region is a `<section role="…">`. The template's rules use
the `within: { kind: "section", role: "<name>" }` selector to scope
typography. Body paragraphs are anything *not* inside one of the
named-role sections, so the author can intersperse plain `<p>` blocks
between the salutation and the closing without needing to wrap them
in a body region.

Use `title=""` on each region to suppress the section-heading; the
template does not emit one.

Styling is expressed entirely via the styling dialect (`<styles>` +
`<rule>`). The exported `LETTER_CSS` is an empty string.
