import "reactwright/jsx";
import React from "react";

import { Cite } from "../bibliography.js";

export function Conclusion(): React.ReactElement {
  return (
    <section title="Conclusion">
      <p>
        We have presented a system for compiling React-authored
        documents to paginated HTML and PDF via a two-reconciler front
        end, a typed intermediate representation, and a CSS Paged
        Media back end consumed by Paged.js. The system compiles a
        representative IEEE conference paper in approximately two
        seconds end-to-end, with more than 80 per cent of the budget
        spent in browser-bound work. The authoring surface admits
        type-safe cross-references and citations, eliminating a class
        of error that conventional multi-pass typesetters defer to
        the build log.
      </p>
      <p>
        The deeper claim of this work is methodological. The browser
        is now a typographic substrate of professional caliber. The
        cost of admission to high-quality paginated output has, for
        the first time in forty years, declined from a multi-gigabyte
        toolchain to a peer dependency on a JavaScript polyfill.
        Authors who wish to write papers, books, or reports without
        first learning TeX <Cite k="knuth1984" /> now have a viable
        alternative. The corpus of documents producible in the
        browser will, we believe, expand significantly in the
        coming years.
      </p>
      <p>
        Future work falls in three directions. We are exploring a
        warm-Chromium worker pool to amortise the browser launch
        cost across compilations. We intend to resolve the named-page
        regime isolation issue described in Section VI to admit
        first-page-only ornaments and cover overlays. And we are
        interested in the use of the reactwright IR as a target for
        higher-level authoring tools — outliners, structured-text
        editors, and collaborative writing environments — that
        produce JSX as a serialisation format.
      </p>
      <p>
        We dedicate this paper, in the spirit of <Cite k="kernighan1976" />,
        to the proposition that small tools composed correctly
        outperform large tools designed comprehensively. The browser
        is a small tool. We have used it to build a typesetter.
      </p>
    </section>
  );
}
