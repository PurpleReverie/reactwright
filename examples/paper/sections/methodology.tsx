import "reactwright/jsx";
import React from "react";

import { Cite } from "../bibliography.js";

export function Methodology(): React.ReactElement {
  return (
    <section title="Methodology">
      <p>
        We evaluated the system on a corpus of five reference documents,
        selected to exercise the disjoint set of features the
        primitive surface exposes. Each document was authored
        independently in the JSX surface and compiled to PDF via the
        full pipeline. We measured wall-clock compilation time, output
        artefact size, and authoring effort.
      </p>

      <section title="The reference corpus">
        <p>
          The five documents are: a Tufte-style essay with sidenotes in
          the outside margin <Cite k="tufte1983" />; a multi-column
          newsletter with a fixed masthead overlay; a multi-regime
          story bible alternating between novel prose, full-bleed
          plates, and a Courier-faced screenplay scene; an academic
          treatise with auto-numbered figures, a table of contents, a
          list of figures, a bibliography, and floating footnotes; and
          a strict IEEE two-column conference paper of approximately
          three thousand words.
        </p>
        <p>
          The corpus was chosen to be jointly exhaustive over the
          features the primitive surface exposes. Every primitive
          appears in at least one document; every named-page regime
          mode appears in at least one. The narrow corpus understates
          the system's range — it is, for instance, also capable of
          producing technical reports, recipe cards, and field
          notebooks — but it is sufficient to validate the architecture.
        </p>
      </section>

      <section title="Hardware and software environment">
        <p>
          All measurements were taken on a single 2024 MacBook Pro with
          an Apple M3 Pro processor and 36 GB of unified memory.
          Headless Chromium was launched fresh for each build, with no
          warm cache. The version of Paged.js used was the project's
          mainline release as of the measurement date. Each document
          was compiled five times in succession; we report the median
          of the five trials.
        </p>
      </section>

      <section title="What we did not measure">
        <p>
          We deliberately omit a comparison against LaTeX{" "}
          <Cite k="lamport1986" /> wall-clock time. A fair comparison
          would require a controlled experiment over a substantially
          larger corpus than the present study admits, and the result
          would in any case be heavily dependent on the LaTeX package
          set loaded. We instead report our own absolute numbers and
          leave the cross-system comparison to future work.
        </p>
        <p>
          We also did not measure visual fidelity quantitatively. The
          rendered PDFs were inspected by hand and judged to be
          visually indistinguishable from their LaTeX analogues for
          each document type. A formal pixel-diff against a TeX
          reference rendering is again left to future work.
        </p>
      </section>
    </section>
  );
}
