import "reactwright/jsx";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";

import { Cite } from "../bibliography.js";
import { NumberedEquation } from "../components/numbered-equation.js";

const PIPELINE_DIAGRAM = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../packages/reactwright/tests/fixtures/reactwright-diagram.svg"
);

export function Architecture(): React.ReactElement {
  return (
    <section title="System Architecture">
      <p>
        Reactwright is structured as four cooperating stages: two
        front-end reconcilers, a resolver, and an HTML backend
        consumed by Paged.js. The arrangement is shown in{" "}
        <ref to="fig-pipeline" />.
      </p>

      <figure
        id="fig-pipeline"
        role="numbered"
        src={PIPELINE_DIAGRAM}
        caption="Compilation pipeline. Content and template JSX are reconciled separately into typed intermediate representations; the resolver joins them by substituting slot markers with content regions and stamping anchor identifiers; the HTML backend emits CSS Paged Media markup that Paged.js paginates inside headless Chromium."
        width="80mm"
      />

      <section title="Two reconcilers">
        <p>
          The decision to run two reconcilers — rather than one with a
          richer node set — is the most consequential design choice in
          the system. Each reconciler enforces a separate grammar:
          content nodes admit prose primitives (paragraphs, lists,
          quotes, figures, citations) and template nodes admit layout
          primitives (pages, regions, columns, slots, role rules). The
          grammars are disjoint, which lets each reconciler use a
          smaller dispatch table and a tighter type narrowing in its
          host-config.
        </p>
        <p>
          A single-grammar system would have admitted illegal
          combinations such as a <code>region</code> nested inside a{" "}
          <code>paragraph</code>. Forbidding such combinations would
          have required runtime checks at every JSX call site;
          splitting the grammar lets the type system forbid them at
          authoring time.
        </p>
      </section>

      <section title="The resolver">
        <p>
          The resolver is a pure function from{" "}
          <code>(contentIR, templateIR)</code> to a resolved IR. It
          performs five operations: it constructs a flow tree by
          substituting slot markers with content regions; it routes
          content to named-page regimes declared by <code>page-set</code>{" "}
          nodes; it applies role rules that map semantic content
          attributes to presentation variants; it stamps stable
          identifiers onto every referable node; and it collects
          aggregates — citation keys, figure captions, bibliography
          entries — that the back-matter generators consume. The five
          operations are independent: the resolver is one pass over
          the tree.
        </p>
      </section>

      <section title="Cross-reference resolution">
        <p>
          Cross-references in reactwright resolve in two phases. At
          render time, the resolver assigns each referable node a
          stable identifier and emits a matching{" "}
          <code>target-counter</code> call at every reference site. At
          paginate time, Paged.js evaluates the call against its
          counter state. The arrangement permits forward references —
          a reference to a figure that appears later in source order
          resolves correctly because the counter is evaluated against
          the post-pagination DOM, not the source.
        </p>
        <p>
          The information capacity of a single counter is bounded by
          the alphabet over which it is rendered. A standard arabic
          counter over <em>n</em> pages carries <Cite k="shannon1948" />{" "}
          information given by:
        </p>

        <NumberedEquation id="eq-counter-capacity" tex="C_{\text{ctr}} = \log_2 n \;\text{bits}" />

        <p>
          For a 200-page document, this is approximately 7.6 bits per
          reference, which is sufficient for the vast majority of
          academic and trade publications. Documents with denser
          cross-reference graphs — legal codes, parliamentary
          procedure, scripture — may require named counters that
          partition the address space hierarchically.
        </p>
      </section>
    </section>
  );
}
