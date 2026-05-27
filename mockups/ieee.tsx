import "reactdoc/jsx";

import { resolve } from "node:path";

const SWATCH_PATH = resolve(process.cwd(), "tests/fixtures/reactdoc-swatch.png");

// IEEE — classic two-column conference paper.
//
// IEEE conference template (the "two-column" variant) has:
//   - Letter or A4 paper
//   - Title and author block span the full width at the top of page 1
//   - Abstract and Index Terms in a narrower indented box, also single-column
//   - Body in two equal columns with a small gap
//   - Running header on subsequent pages with conference title
//   - Footer with page numbers
//   - Numbered figures, equations, and references
//
// We approximate this by routing the title+abstract as a frontmatter
// region (single column) and the body sections through a body region
// that uses CSS column-count via the `columns` page style. This is a
// LOT of text on purpose so we can stress-test pagination across many
// pages.

export function Template() {
  return (
    <page
      page={{ size: "letter", margin: "20mm", marginTop: "15mm" }}
      typography={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: 1.2 }}
    >
      <rules>
        <role
          on="figure"
          match="numbered"
          apply="numberedFigure"
          numbering={{ counter: "figure", format: "Fig. $figure. " }}
        />
        <role
          on="math"
          match="numbered"
          apply="numberedEquation"
          numbering={{ counter: "equation", format: "($equation)" }}
        />
        <role on="section" match="references" apply="references" />
      </rules>

      <header anchor="top-center" when="not-first-page">
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center">
        <page-number />
      </footer>

      <stack gap="3mm">
        <region style={{ textAlign: "center", paddingBottom: "2mm" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        <region style={{ padding: "0 8mm" }}>
          <slot name="abstract" />
        </region>

        <region style={{ columns: 2, columnGap: "6mm", textAlign: "justify" }}>
          <slot name="body" />
        </region>

        <region style={{ columns: 2, columnGap: "6mm" }}>
          <bibliography
            title="References"
            entries={[
              { key: "shannon1948", text: "C. E. Shannon, 'A mathematical theory of communication,' Bell Syst. Tech. J., vol. 27, pp. 379-423, Jul. 1948." },
              { key: "turing1950", text: "A. M. Turing, 'Computing machinery and intelligence,' Mind, vol. 59, pp. 433-460, 1950." },
              { key: "kernighan1976", text: "B. W. Kernighan and P. J. Plauger, Software Tools. Reading, MA: Addison-Wesley, 1976." },
              { key: "knuth1984", text: "D. E. Knuth, The TeXbook. Reading, MA: Addison-Wesley, 1984." },
              { key: "tufte1983", text: "E. R. Tufte, The Visual Display of Quantitative Information. Cheshire, CT: Graphics Press, 1983." },
              { key: "lamport1986", text: "L. Lamport, LaTeX: A Document Preparation System. Reading, MA: Addison-Wesley, 1986." },
              { key: "raskin2000", text: "J. Raskin, The Humane Interface. Reading, MA: Addison-Wesley, 2000." },
              { key: "norman2013", text: "D. A. Norman, The Design of Everyday Things, revised and expanded ed. New York, NY: Basic Books, 2013." },
              { key: "bringhurst2004", text: "R. Bringhurst, The Elements of Typographic Style, 3rd ed. Vancouver, BC: Hartley & Marks, 2004." },
              { key: "kindersley1969", text: "D. Kindersley, Optical letter spacing for new printing systems. London, UK: Lund Humphries, 1969." }
            ]}
          />
        </region>
      </stack>
    </page>
  );
}

export default function IEEEPaper() {
  return (
    <document
      title="Self-Documenting Paginated Documents: A Browser-Native Approach to Cross-Reference Resolution"
      author="L. M. Cartwright, R. T. Holloway, Senior Member, IEEE, and A. K. Vance"
    >
      <abstract>
        <p>
          <strong>Abstract</strong>—We present a framework for paginated documents
          that resolve their own cross-references, page numbers, and counters at
          render time inside the browser. Unlike traditional multi-pass typesetting
          systems such as TeX <cite cite="knuth1984" /> or LaTeX <cite cite="lamport1986" />,
          our approach defers numeric resolution to CSS Generated Content for Paged
          Media, executing the second pass inside a Paged.js polyfill. We show that
          this approach generalises to bibliographies, indices, tables of contents,
          and floating footnotes without auxiliary tooling. The implementation is
          open source. We evaluate the resulting documents on three axes — typographic
          fidelity, build time, and authoring complexity — and find competitive
          results across all three.
        </p>

        <p>
          <strong>Index Terms</strong>—Document engineering, CSS Paged Media,
          Generated Content for Paged Media, cross-reference resolution,
          browser-native typesetting, React reconcilers, paginated HTML, headless
          Chromium.
        </p>
      </abstract>

      <section id="intro" title="I. Introduction">
        <p>
          The problem of cross-reference resolution in paginated documents has
          a long lineage in the document engineering literature. Knuth's TeX
          <cite cite="knuth1984" /> established the convention of multi-pass
          compilation: a first pass discovers all anchor points and writes them
          to an auxiliary file, a second pass reads that file and substitutes
          the resolved values into reference call sites, and a third pass, in
          some configurations, repeats to handle forward references between the
          auxiliary file and the document itself. Lamport's LaTeX
          <cite cite="lamport1986" /> inherited this architecture and extended
          it to bibliographies via the BibTeX side-channel, indices via MakeIndex,
          and the table of contents via the same auxiliary mechanism. The pattern
          is stable, well-understood, and serves the academic community well —
          but it predates the era in which a document's runtime environment is a
          web browser with a fully programmable layout engine.
        </p>

        <p>
          A more recent line of work explores typesetting in the browser
          <cite cite="tufte1983" />. The Paged.js project implements CSS Paged
          Media and its companion specification, Generated Content for Paged
          Media (GCPM), as a polyfill that runs at document load. GCPM provides
          primitives — <code>target-counter</code>, <code>target-text</code>,
          <code>string-set</code>, <code>position: running()</code>, and
          <code>content: element()</code> — that together cover the substrate
          most cross-references require. What has been missing, until now, is
          a writer-facing language that compiles to these primitives without
          exposing the underlying CSS.
        </p>

        <p>
          The contribution of this work is twofold. First, we define a typed
          primitive surface, expressed in JSX, that authors can target without
          writing CSS. Second, we describe a resolver that stamps stable
          identifiers onto every referable node in the document so that
          forward references such as <ref to="fig-pipeline" show="number-and-page" />
          can be written before the figure they refer to exists in source order.
        </p>

        <p>
          The remainder of this paper is organised as follows. Section II
          surveys related work in document engineering and browser-native
          typesetting. Section III describes the content and template primitive
          vocabularies. Section IV presents the resolver and its two-pass
          algorithm. Section V reports on a series of evaluation documents
          rendered through the system, including a novel chapter, a Tufte-style
          essay, and a multi-column newsletter. Section VI discusses limitations
          and concludes.
        </p>
      </section>

      <section id="related" title="II. Related Work">
        <p>
          Three threads of prior work bear on this paper.
        </p>

        <p>
          <em>Multi-pass typesetting.</em> Knuth's TeX <cite cite="knuth1984" />
          remains the canonical example of a system that resolves cross-references
          via auxiliary files written between passes. The architecture has the
          virtue of producing a static output artifact — a DVI or PDF file — but
          the price is a brittle build system in which a single misplaced citation
          can require three or four passes to converge.
        </p>

        <p>
          <em>Browser-native typesetting.</em> Paged.js exposes the CSS Paged
          Media specification as a JavaScript polyfill, allowing modern browsers
          to perform pagination at runtime. The GCPM specification provides the
          substrate for cross-references via <code>target-counter</code> and
          related functions. To our knowledge, no prior system provides a typed
          authoring surface above this substrate that hides the underlying CSS
          from writers and designers alike.
        </p>

        <p>
          <em>Information design and typography.</em> Tufte's work on the visual
          display of quantitative information <cite cite="tufte1983" /> and
          Bringhurst's treatise on typographic style <cite cite="bringhurst2004" />
          inform the default settings of our starter templates. Kindersley's
          earlier work on optical letter spacing <cite cite="kindersley1969" />
          motivates the kerning defaults in our serif body face.
        </p>

        <figure
          id="fig-pipeline"
          role="numbered"
          src={SWATCH_PATH}
          caption="Compilation pipeline. The React content tree and template tree are reconciled separately, joined by a resolver, emitted as paginated HTML, and consumed by Paged.js inside headless Chromium to produce the final PDF."
          width="78mm"
        />
      </section>

      <section id="vocabulary" title="III. Primitive Vocabulary">
        <p>
          Our system distinguishes two scopes — content and template — and
          provides a small primitive surface in each. Writers compose content
          primitives to express their prose; designers compose template
          primitives to express the geometry and chrome of the page. The
          surfaces communicate through a routing system based on three props:
          <code>role</code>, <code>page</code>, and <code>variant</code>.
        </p>

        <p>
          The content scope includes structural primitives such as
          <code>section</code>, <code>p</code>, <code>figure</code>, and
          <code>table</code>, together with inline primitives including
          <code>em</code>, <code>strong</code>, <code>ref</code>,
          <code>cite</code>, <code>footnote</code>, and <code>m</code> for
          inline mathematics. The full vocabulary covers, by our count, every
          structural concept required by the IMRaD article format, every
          floating element required by the IEEE conference template, and the
          primary marginalia patterns of Tufte-style essays. We discuss the
          exceptions in Section VI.
        </p>

        <p>
          The template scope includes geometric primitives such as
          <code>page</code>, <code>page-set</code>, <code>region</code>,
          <code>stack</code>, <code>columns</code>, and <code>column</code>,
          together with chrome primitives <code>header</code>,
          <code>footer</code>, <code>footnote-area</code>, and
          <code>sidenote-area</code>. Cross-cutting back-matter generators
          <code>toc</code>, <code>list-of</code>, <code>bibliography</code>,
          and <code>index</code> walk the resolved content tree at render time
          and emit the appropriate apparatus.
        </p>

        <math
          id="eq-capacity"
          role="numbered"
          src="C = W \\log_2 (1 + S/N)"
        />

        <p>
          A representative example, taken from <ref to="eq-capacity" />, shows
          a numbered equation generated by a <code>role</code> rule that pairs
          the math node with a counter increment and a format string. The
          format string admits <code>$counter</code> tokens that compile to
          CSS <code>counter()</code> calls; the present example yields the
          familiar parenthesised numbering at the right margin.
        </p>
      </section>

      <section id="resolver" title="IV. Resolver Algorithm">
        <p>
          The resolver is the most novel component of the system. It accepts
          two trees — content and template — and produces a third tree, the
          resolved tree, which is consumed by the HTML emitter. The algorithm
          proceeds in five phases.
        </p>

        <p>
          <strong>Phase 1: slot construction.</strong> The resolver walks the
          content tree once, producing a map from slot names to lists of
          resolved children. The slot names include the four built-ins
          (<code>title</code>, <code>author</code>, <code>abstract</code>,
          <code>body</code>) and any additional slots introduced by custom
          template intrinsics. The body slot collects all top-level content
          children that are not abstracts.
        </p>

        <p>
          <strong>Phase 2: rule application.</strong> The resolver walks the
          template tree to discover <code>role</code> and <code>page</code>
          rules, then applies them to the slot-resolved content tree. Role
          rules set the <code>variant</code> field on matched nodes; page
          rules establish a mapping from the abstract <code>page</code> token
          on a section to a concrete page-set name in the template.
        </p>

        <p>
          <strong>Phase 3: anchor stamping.</strong> Every section that lacks
          an explicit <code>id</code> receives a generated identifier derived
          from its title. Every figure, table, and equation likewise receives
          an auto-generated identifier scoped to its kind. These identifiers
          become the anchors targeted by <code>ref</code> nodes at the
          subsequent <code>target-counter</code>/<code>target-text</code>
          step.
        </p>

        <p>
          <strong>Phase 4: aggregate collection.</strong> The resolver collects
          three further data structures from the slot-resolved tree: a set of
          cited bibliography keys, a multimap of index terms to anchor lists,
          and an ordered list of section anchor descriptors. These collections
          drive the auto-generated back matter — bibliographies, indices, and
          tables of contents — at HTML emission time.
        </p>

        <p>
          <strong>Phase 5: template realisation.</strong> Finally, the resolver
          walks the template tree once more, substituting slots with their
          corresponding slot lists, applying page-set filtering to the body
          slot, and producing the final resolved tree. Custom template
          intrinsics are dispatched to their registered renderers at this
          phase.
        </p>
      </section>

      <section id="evaluation" title="V. Evaluation">
        <p>
          We evaluated the system by rendering five mockup documents through
          the pipeline: an academic treatise, a Tufte-style essay with
          marginal sidenotes, a two-sided novel chapter with mirror anchors,
          a multi-column newsletter, and the present IEEE conference paper.
          Each mockup was chosen to exercise a distinct combination of the
          primitive surface.
        </p>

        <p>
          <em>Typographic fidelity.</em> Across all five mockups, the rendered
          PDFs are visually indistinguishable from their conventional
          analogues for the reader. Justified paragraphs hyphenate
          appropriately under the default Latin Modern hyphenation patterns;
          drop caps render as expected via <code>::first-letter</code> and
          <code>initial-letter</code>; running headers and footers populate
          via Paged.js' <code>position: running()</code> mechanism. The one
          discrepancy we encountered concerned widow and orphan control,
          which the Paged.js polyfill implements partially. We discuss the
          workaround in Section VI.
        </p>

        <p>
          <em>Build time.</em> A single-document build takes between 300
          and 800 milliseconds end-to-end on a modern laptop, dominated by
          headless Chromium startup. Subsequent builds in the same process
          take 50–150 milliseconds. This compares favourably to LaTeX's
          multi-pass compilation, which on the same hardware takes 1.2–3.5
          seconds for documents of comparable size.
        </p>

        <p>
          <em>Authoring complexity.</em> We invited three writers and two
          designers, none of whom had prior experience with the system, to
          author short documents over a two-day workshop. All five subjects
          produced a complete document by the end of the first day; four of
          the five reported the experience as more pleasant than LaTeX, and
          three of the five said they would consider using the system for
          future projects.
        </p>
      </section>

      <section id="limitations" title="VI. Limitations and Conclusion">
        <p>
          Several limitations remain. The widow and orphan control mentioned
          above is the most user-visible. We are also limited by Paged.js's
          treatment of named-page geometries: while the underlying CSS Paged
          Media specification permits per-page-name margin boxes, Paged.js's
          implementation flattens these in ways that occasionally affect
          chrome placement on title pages and chapter-opening pages.
        </p>

        <p>
          A more architectural limitation concerns multi-pass cross-references
          that depend on each other: a reference that names a page, where
          inserting the reference itself changes the page numbering. The
          present system does not iterate; in practice, second-order effects
          of this kind are rare in technical writing, but they are not absent.
          We expect a future version to perform a fixed-point iteration over
          the rendering pass when such cycles are detected.
        </p>

        <p>
          Despite these limitations, we conclude that browser-native paginated
          typesetting is a viable replacement for traditional multi-pass
          typesetting systems in a substantial fraction of academic and
          long-form writing tasks. The primary advantage is the
          tooling — modern web inspectors, live reload, and the entire
          contemporary CSS authoring experience are immediately available to
          template designers. The primary disadvantage is the dependence on
          a JavaScript runtime to produce the final artifact, which is
          arguably no greater than the dependence on a TeX installation, but
          differs in kind.
        </p>

        <p>
          Future work includes extending the primitive surface to scientific
          floats (algorithms, listings, theorems) and integrating with the
          MathML rendering pipeline available in modern browsers. We also
          plan to investigate the interaction between this system and the
          forthcoming CSS Custom Highlight API as a substrate for
          accessibility annotations <cite cite="norman2013" /> and humane
          editorial interfaces <cite cite="raskin2000" />. Tooling for the
          authoring experience, including incremental rebuilds and inline
          preview, remains an area of active development; we draw heavy
          inspiration from earlier work on software tools in the Plan 9
          tradition <cite cite="kernighan1976" />.
        </p>

        <p>
          We close with the observation that document engineering is not, and
          has never been, primarily a technical problem; it is a problem of
          designing notation under constraints set by the human reader's
          attention. The technical substrate exists only to serve that
          design. The system described in this paper aspires to disappear
          from the writer's attention entirely, leaving only the writing.
        </p>
      </section>
    </document>
  );
}
