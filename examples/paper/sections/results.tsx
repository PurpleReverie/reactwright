import "reactwright/jsx";
import React from "react";

import { DataTable } from "../components/data-table.js";

export function Results(): React.ReactElement {
  return (
    <section title="Results">
      <p>
        We report two principal results: end-to-end build time across
        the five reference documents, and a phase breakdown of the
        compile-time budget. Both are reproducible from the CSV data
        files in the example's <code>data/</code> directory.
      </p>

      <section title="End-to-end build time">
        <p>
          Wall-clock build time across the reference corpus is shown
          in <ref to="tbl-build-times" />. The smallest document
          (Field Notes, four sections, 1,240 words) compiled in 612
          milliseconds; the largest (IEEE Strict, eight sections,
          3,120 words) compiled in 2,104 milliseconds. The relationship
          between document size and build time is sub-linear: doubling
          the word count does not double the build time, because the
          Chromium startup cost dominates for short documents and
          amortises over longer ones.
        </p>

        <DataTable
          id="tbl-build-times"
          caption="End-to-end build times across the reference corpus. Times are wall-clock medians over five consecutive trials. HTML and PDF sizes are reported uncompressed."
          src="data/build-times.csv"
        />

        <p>
          The PDF size is approximately linear in the word count for
          prose-heavy documents (treatise, IEEE strict) and dominated
          by raster assets for figure-heavy documents (newsletter, in
          which the masthead image is the single largest contributor).
        </p>
      </section>

      <section title="Phase breakdown">
        <p>
          The compile-time budget is dominated by browser-bound work.{" "}
          <ref to="tbl-overhead" /> reports the mean per-phase cost,
          the 95th-percentile cost, and the percentage of total budget
          consumed by each phase. The four reactwright-internal phases
          (React reconciliation, resolver pass, HTML emission, and PDF
          capture) together account for under 16 per cent of the
          budget. The Chromium-bound phases — browser launch and
          Paged.js layout — together account for more than 84 per cent.
        </p>

        <DataTable
          id="tbl-overhead"
          caption="Per-phase compile-time budget. Means and 95th-percentile values measured over 100 consecutive builds of the IEEE strict reference document. The four reactwright-internal phases together account for under 16 per cent of the budget."
          src="data/compile-overhead.csv"
        />

        <p>
          The implication for optimisation is that engineering work
          inside the reactwright layer has diminishing returns: the
          worst-case scenario in which the entire reactwright stack
          ran in zero time would reduce a 1.8-second build to about
          1.5 seconds. Substantive improvements would require either
          a warm-Chromium worker pool or a server-side renderer that
          short-circuits the Paged.js layout pass.
        </p>
      </section>

      <section title="Authoring effort">
        <p>
          The five reference documents required between 104 lines (the
          newsletter) and 352 lines (the story bible) of JSX content.
          The IEEE strict paper, at 249 lines of content using the
          shared template helper, compares to roughly 480 lines for a
          standalone LaTeX version of the same paper with custom
          IEEEtran options. The gain in surface concision is partly
          attributable to the type system: TypeScript catches
          mis-spelled citation keys at compile time, eliminating a
          class of error that LaTeX defers to the build log.
        </p>
      </section>
    </section>
  );
}
