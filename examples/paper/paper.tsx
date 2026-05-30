import "reactwright/jsx";

import { Template, IEEEFrontMatter } from "../../mockups/ieee/index.js";

import { RefList } from "./bibliography.js";
import { Introduction } from "./sections/introduction.js";
import { Background } from "./sections/background.js";
import { Architecture } from "./sections/architecture.js";
import { Methodology } from "./sections/methodology.js";
import { Results } from "./sections/results.js";
import { Discussion } from "./sections/discussion.js";
import { Limitations } from "./sections/limitations.js";
import { Conclusion } from "./sections/conclusion.js";

// Example: a substantial IEEE-format conference paper composed across
// multiple files. Each section lives in its own module; data tables are
// rendered from CSV files via the DataTable helper; citations are
// declared once in bibliography.tsx and referenced by typed key from
// every section. The template comes from mockups/ieee — this file
// contains zero IEEE-specific styling.
//
// Build:
//   npm run example:paper
//
// Outputs: build/examples/paper.{html,pdf}

export { Template };

export default function Paper() {
  return (
    <document
      title="Empirical Evaluation of Reconciler-Driven Paginated Document Compilation"
      author="L. M. Cartwright, R. T. Holloway, Senior Member, IEEE, A. K. Vance, and M. P. Halliday"
    >
      <IEEEFrontMatter
        abstract={
          <>
            We report an empirical evaluation of a paginated-document
            compilation pipeline that targets a browser-native
            typesetting substrate. The system compiles JSX content
            and template trees through two independent React
            reconcilers, joins them via an intermediate-representation
            resolver, and emits CSS Paged Media markup consumed by
            Paged.js inside headless Chromium. Across a five-document
            reference corpus we measure end-to-end build time of
            between 0.6 and 2.1 seconds, with more than 80 per cent of
            the budget consumed by browser-bound work. We characterise
            the authoring surface, report on the typed cross-reference
            mechanism that catches mis-spelled citation keys at compile
            time, and discuss limitations relating to widow control,
            named-page geometries, and print-only optimisations.
          </>
        }
        indexTerms="Document engineering, CSS Paged Media, Generated Content for Paged Media, browser-native typesetting, React reconcilers, paginated HTML, headless Chromium, cross-reference resolution, typed citations."
      />

      <Introduction />
      <Background />
      <Architecture />
      <Methodology />
      <Results />
      <Discussion />
      <Limitations />
      <Conclusion />

      <RefList />
    </document>
  );
}
