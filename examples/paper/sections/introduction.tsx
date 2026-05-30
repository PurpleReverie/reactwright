import "reactwright/jsx";
import React from "react";

import { Cite } from "../bibliography.js";

export function Introduction(): React.ReactElement {
  return (
    <section title="Introduction">
      <p>
        Paginated documents — academic papers, books, reports, journals —
        have for forty years been the domain of multi-pass typesetting
        systems descended from Knuth's TeX <Cite k="knuth1984" />. The
        family is technically impressive and pedagogically demanding: an
        author who wishes to produce a journal-grade PDF is expected to
        learn a bespoke macro language, install a multi-gigabyte toolchain,
        and accept a build cycle of several seconds per iteration. The
        cost of admission has shaped the form of academic prose as much
        as any disciplinary convention.
      </p>
      <p>
        Meanwhile the web platform has, almost as a side effect of its
        commercial expansion, acquired the typographic primitives a
        professional document engine needs. Modern browsers implement
        kerning, ligatures, hyphenation, justified paragraphs with
        Knuth–Plass line breaking, multi-column flow, named running
        headers, and footnote floats. The CSS Paged Media specification
        and its Generated Content for Paged Media companion{" "}
        <Cite k="w3cGcpm2014" /> describe a substrate that, until
        recently, no browser implemented natively. The Paged.js project{" "}
        <Cite k="pagedjs2020" /> closed the gap as a JavaScript polyfill
        executed at document load.
      </p>
      <p>
        We present a system, <em>Reactwright</em>, that compiles JSX into
        the HTML+CSS subset Paged.js consumes, exposing a typed primitive
        surface to authors while preserving the substrate's pagination
        guarantees. The key design choice is the use of two independent
        React reconcilers — one for content, one for template — joined
        by an intermediate-representation resolver that performs slot
        substitution, role-rule routing, and anchor stamping in a single
        pass. The contribution of this paper is empirical: we measure
        compilation time, output fidelity, and authoring effort across
        a representative sample of document types and report the results.
      </p>
      <p>
        Section II reviews related work in document engineering and in
        runtime typesetting. Section III describes the two-reconciler
        architecture and the resolver. Section IV describes the
        evaluation methodology. Section V reports the results. Section
        VI discusses limitations. Section VII concludes.
      </p>
    </section>
  );
}
