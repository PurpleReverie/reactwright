import "reactwright/jsx";
import React from "react";

import { Cite } from "../bibliography.js";

export function Background(): React.ReactElement {
  return (
    <section title="Background and Related Work">
      <p>
        Three threads of prior work bear on this paper. We summarise each
        before describing where our contribution sits.
      </p>

      <section title="Multi-pass typesetting">
        <p>
          TeX <Cite k="knuth1984" /> is the canonical multi-pass
          typesetter. A first pass discovers all cross-reference anchor
          points and writes them to an auxiliary file; a second pass
          reads that file and substitutes the resolved values; a third
          pass repeats the cycle to handle forward references that the
          second pass disturbed. LaTeX <Cite k="lamport1986" /> inherits
          this architecture and extends it to bibliographies via the
          BibTeX side-channel, to indices via MakeIndex, and to the
          table of contents via the same auxiliary mechanism. Each
          extension introduces an additional intermediate file and an
          additional opportunity for the cycle to fail to converge.
        </p>
        <p>
          The strength of this approach is that it is content-agnostic:
          the typesetter does not need to understand semantics, only
          anchor identifiers. The weakness is build time. For a 30-page
          paper with 50 references, four passes is typical, and each
          pass takes between half a second and several seconds depending
          on packages loaded. The total build time crosses the threshold
          at which authors begin to amortise their iteration loop with
          context switches.
        </p>
      </section>

      <section title="Browser-native typesetting">
        <p>
          The Paged.js project <Cite k="pagedjs2020" /> implements CSS
          Paged Media and GCPM <Cite k="w3cGcpm2014" /> as a JavaScript
          polyfill that runs at document load. GCPM provides the
          primitives our system depends on: <code>target-counter()</code>{" "}
          and <code>target-text()</code> for cross-references,{" "}
          <code>string-set</code> and <code>position: running()</code>{" "}
          for running headers, and <code>content: element()</code> for
          floating footnote regions. These primitives compose into the
          back-matter generators (bibliography, table of contents, index)
          that our resolver targets.
        </p>
        <p>
          What Paged.js does not provide is an authoring language. The
          author writes HTML and CSS by hand; the polyfill paginates it.
          For a single short report this is acceptable; for a corpus of
          long documents it is roughly the same labour as writing the
          underlying CSS Paged Media spec by hand. Our contribution lies
          here.
        </p>
      </section>

      <section title="Reactive runtimes for documents">
        <p>
          A growing line of work treats documents as React components{" "}
          <Cite k="reactReconciler2017" />. The argument for doing so is
          structural: the same composition rules that make application
          UIs maintainable — props, refs, hooks, suspense — apply
          symmetrically to documents. The argument against is that
          conventional React reconcilers target the DOM, and the DOM is
          neither paginated nor semantically rich enough to express the
          cross-reference graph a typesetter needs to resolve. Our two-
          reconciler architecture sidesteps this: neither reconciler
          targets the DOM. Both target a typed intermediate
          representation that the resolver consumes.
        </p>
        <p>
          The intellectual debt to programming-language literature
          deserves naming. The decision to run reconciliation against a
          typed IR rather than the DOM follows the standard compiler
          structure described in <Cite k="abelson1996" />: a front end
          parses surface syntax into an IR, a middle end performs passes
          over the IR, a back end emits target code. We treat JSX as the
          surface syntax, the resolver as the middle end, and Paged.js
          itself as the back end.
        </p>
      </section>
    </section>
  );
}
