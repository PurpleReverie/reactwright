import "reactwright/jsx";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Template, createBibliography, IEEEFrontMatter } from "@reactwright/template-ieee";

// Strict IEEE conference paper, content-only file. All the IEEE
// styling, citation wiring, and front-matter formatting live in the
// @reactwright/template-ieee package — this file is just prose + a
// typed reference list.

export { Template };

const FIGURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../packages/reactwright/tests/fixtures/reactwright-diagram.svg"
);

const refs = createBibliography({
  kernighan1976: {
    authors: "B. W. Kernighan and P. J. Plauger",
    title: "Software Tools",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 1976
  },
  knuth1984: {
    authors: "D. E. Knuth",
    title: "The TeXbook",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 1984
  },
  tufte1983: {
    authors: "E. R. Tufte",
    title: "The Visual Display of Quantitative Information",
    location: "Cheshire, CT",
    publisher: "Graphics Press",
    year: 1983
  },
  lamport1986: {
    authors: "L. Lamport",
    title: "LaTeX: A Document Preparation System",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 1986
  },
  raskin2000: {
    authors: "J. Raskin",
    title: "The Humane Interface",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 2000
  },
  bringhurst2004: {
    authors: "R. Bringhurst",
    title: "The Elements of Typographic Style",
    edition: "3rd ed.",
    location: "Vancouver, BC",
    publisher: "Hartley & Marks",
    year: 2004
  },
  kindersley1969: {
    authors: "D. Kindersley",
    title: "Optical Letter Spacing for New Printing Systems",
    location: "London, UK",
    publisher: "Lund Humphries",
    year: 1969
  }
});

const { Cite, RefList } = refs;

export default function IEEEStrictPaper() {
  return (
    <document
      title="A Browser-Native Substrate for Paginated Document Engineering"
      author="L. M. Cartwright, R. T. Holloway, Senior Member, IEEE, and A. K. Vance"
    >
      <IEEEFrontMatter
        abstract={
          <>
            We present a framework for paginated documents that resolves
            cross-references, page numbers, and counters at render time
            inside a browser. Unlike traditional multi-pass typesetting
            systems such as TeX <Cite k="knuth1984" /> or LaTeX{" "}
            <Cite k="lamport1986" />, our approach defers numeric
            resolution to CSS Generated Content for Paged Media,
            executing the second pass inside a Paged.js polyfill. We show
            that this approach generalises to bibliographies, indices,
            tables of contents, and floating footnotes without auxiliary
            tooling. We evaluate the resulting documents on three axes —
            typographic fidelity, build time, and authoring complexity —
            and report competitive results on all three.
          </>
        }
        indexTerms="Document engineering, CSS Paged Media, Generated Content for Paged Media, cross-reference resolution, browser-native typesetting, React reconcilers, paginated HTML, headless Chromium."
      />

      <section title="Introduction">
        <p>
          The problem of cross-reference resolution in paginated documents
          has a long lineage in the document engineering literature.
          Knuth's TeX <Cite k="knuth1984" /> established the convention of
          multi-pass compilation: a first pass discovers all anchor
          points and writes them to an auxiliary file, a second pass
          reads that file and substitutes the resolved values into
          reference call sites, and a third pass repeats to handle
          forward references. Lamport's LaTeX <Cite k="lamport1986" />{" "}
          inherited this architecture and extended it to bibliographies
          via the BibTeX side-channel, indices via MakeIndex, and the
          table of contents via the same auxiliary mechanism.
        </p>
        <p>
          A more recent line of work explores typesetting in the browser{" "}
          <Cite k="tufte1983" />. The Paged.js project implements CSS
          Paged Media and its companion specification, Generated Content
          for Paged Media (GCPM), as a polyfill that runs at document
          load. GCPM provides primitives — <code>target-counter</code>,{" "}
          <code>target-text</code>, <code>string-set</code>,{" "}
          <code>position: running()</code>, and{" "}
          <code>content: element()</code> — that together cover the
          substrate most cross-references require. What has been missing
          is a writer-facing language that compiles to these primitives
          without exposing the underlying CSS.
        </p>
        <p>
          The contribution of this work is twofold. First, we define a
          typed primitive surface, expressed in JSX, that authors can
          target without writing CSS. Second, we describe a resolver
          that stamps stable identifiers onto every referable node in
          the document so that forward references such as Fig. 1 on
          page 2 can be written before the figure they refer to exists
          in source order.
        </p>
        <p>
          The remainder of this paper is organised as follows. Section
          II surveys related work. Section III describes the content
          and template primitive vocabularies. Section IV presents the
          resolver. Section V reports on evaluation. Section VI
          discusses limitations and concludes.
        </p>
      </section>

      <section title="Related Work">
        <p>Three threads of prior work bear on this paper.</p>

        <section title="Multi-pass typesetting">
          <p>
            Knuth's TeX <Cite k="knuth1984" /> remains the canonical
            example of a system that resolves cross-references via
            auxiliary files written between passes. LaTeX{" "}
            <Cite k="lamport1986" /> extends this with the BibTeX
            side-channel for bibliographies and MakeIndex for indices,
            each introducing additional intermediate files.
          </p>
        </section>

        <section title="Browser-native typesetting">
          <p>
            Paged.js exposes the CSS Paged Media specification as a
            JavaScript polyfill, allowing modern browsers to perform
            pagination at runtime. The GCPM specification provides the
            substrate for cross-references via <code>target-counter</code>{" "}
            and related functions.
          </p>
        </section>

        <section title="Information design and typography">
          <p>
            Tufte's work on the visual display of quantitative
            information <Cite k="tufte1983" /> and Bringhurst's treatise
            on typographic style <Cite k="bringhurst2004" /> inform the
            default settings of our starter templates. Kindersley's
            earlier work on optical letter spacing{" "}
            <Cite k="kindersley1969" /> motivates the kerning defaults
            in our serif body face.
          </p>
        </section>

        <figure
          id="fig-pipeline"
          role="numbered"
          src={FIGURE_PATH}
          width="80mm"
        >
          <caption>Compilation pipeline. The React content tree and template tree are reconciled separately, joined by a resolver, emitted as paginated HTML, and consumed by Paged.js inside headless Chromium to produce the final PDF.</caption>
        </figure>
      </section>

      <section title="Primitive Vocabulary">
        <p>
          Our system distinguishes two scopes — content and template —
          and provides a small primitive surface in each. The surfaces
          communicate through a routing system based on three props:{" "}
          <code>role</code>, <code>page</code>, and <code>variant</code>.
        </p>
        <math
          id="eq-capacity"
          role="numbered"
          src={"C = W \\log_2 (1 + S/N)"}
        />
        <p>
          A representative example, shown in (1) above, gives a numbered
          equation generated by a <code>role</code> rule that pairs the
          math node with a counter increment and a format string.
        </p>
      </section>

      <section title="Resolver Algorithm">
        <p>
          The resolver accepts two trees — content and template — and
          produces a third, the resolved tree, consumed by the HTML
          emitter. It proceeds in five phases: slot construction, rule
          application, anchor stamping, aggregate collection, and
          template realisation.
        </p>
      </section>

      <section title="Evaluation">
        <p>
          We evaluated the system by rendering five mockup documents
          through the pipeline. Across all five, the rendered PDFs are
          visually indistinguishable from their conventional analogues.
          A single-document build takes between 300 and 800 milliseconds
          end-to-end, dominated by headless Chromium startup. This
          compares favourably to LaTeX <Cite k="lamport1986" />, which
          on the same hardware takes 1.2 to 3.5 seconds for documents of
          comparable size.
        </p>
      </section>

      <section title="Limitations and Conclusion">
        <p>
          Several limitations remain. The widow and orphan control is
          the most user-visible. We are also limited by Paged.js's
          treatment of named-page geometries.
        </p>
        <p>
          Despite these limitations, we conclude that browser-native
          paginated typesetting is a viable replacement for traditional
          multi-pass typesetting systems in a substantial fraction of
          academic and long-form writing tasks. We draw inspiration
          from earlier work on software tools in the Plan 9 tradition{" "}
          <Cite k="kernighan1976" /> and on humane interface design{" "}
          <Cite k="raskin2000" />.
        </p>
      </section>

      <RefList />
    </document>
  );
}
