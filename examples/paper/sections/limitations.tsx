import "reactwright/jsx";
import React from "react";

import { Cite } from "../bibliography.js";

export function Limitations(): React.ReactElement {
  return (
    <section title="Limitations">
      <p>
        Three classes of limitation deserve naming. None is fatal, but
        each shapes the kinds of documents the present system is and
        is not suited to.
      </p>

      <section title="Widow and orphan control">
        <p>
          The Paged.js polyfill <Cite k="pagedjs2020" /> implements the
          CSS <code>widows</code> and <code>orphans</code> properties
          with serviceable but not professional fidelity. Authors
          working on book-length manuscripts may find isolated stragglers
          at section boundaries that a hand-edited TeX <Cite k="knuth1984" />{" "}
          run would have smoothed away. The present system offers
          <code> break-before</code> and <code>break-inside</code> overrides
          at the role level, but these are blunt instruments compared
          to the Knuth–Plass line breaker. Authors of long-form
          fiction may need to make finer adjustments by hand.
        </p>
      </section>

      <section title="Named-page geometry interactions">
        <p>
          The CSS Paged Media spec permits multiple named page
          geometries within a single document, and Paged.js implements
          this faithfully. The interaction between fixed overlays
          (page borders, watermarks, cover ornaments) and the
          named-page mechanism is, however, currently undefined: a
          fixed element declared on a cover regime will appear on
          every subsequent page, since CSS positions it relative to
          the document and not to the page-set. We are exploring a
          per-element <code>when</code> prop and a custom Paged.js
          handler hook to resolve this. Until that work lands,
          first-page-only ornaments require workarounds.
        </p>
      </section>

      <section title="Print-only optimisations">
        <p>
          The reactwright output is HTML, and the HTML is consumed by
          a browser engine. Several conventional print-only
          optimisations — colour-managed CMYK output, hairline rule
          widths, bleed-aware crop marks — are either unavailable or
          must be applied as a post-processing step. Authors targeting
          professional offset printing rather than digital distribution
          will need a vendor-side workflow on top of the present
          system. The economics of academic publishing, however, have
          tilted heavily toward digital distribution in the last
          decade <Cite k="bringhurst2004" />, and we judge that the
          present trade-off is the right one for most users.
        </p>
      </section>
    </section>
  );
}
