import "reactdoc/jsx";

import { resolve } from "node:path";

// Strict IEEE conference paper template — recreates the canonical
// IEEEtran two-column layout. See ieee.tsx for a looser stylized
// variant; this one targets every measurable IEEE rule.
//
//   • US Letter paper, IEEE margins (0.75" top, 1.0" bottom, 0.625" L/R)
//   • Title block spans both columns at top of page 1 (24pt Times)
//   • Two-column body, 3.5" each, 0.167" gutter
//   • Section heads: Roman numerals, 10pt SMALL CAPS, centered
//   • Subsections: A. B. C., 10pt italic, flush left
//   • Abstract+Index Terms: 9pt bold-italic with em-dash prefix
//   • Figure captions: 8pt "Fig. 1. Caption text." centered
//   • Equation numbering: "(1)" right-margin
//   • References: 8pt with [1] hanging-indent
//   • Running header (page 2+): document title, italic 8pt centered
//   • Footer: page number centered, 8pt

const FIGURE_PATH = resolve(process.cwd(), "tests/fixtures/reactdoc-diagram.svg");

// IEEE-specific styling, isolated in customCss. Two engine-provided
// hooks make this clean:
//   • depth-aware heading tags — top-level sections render as h2, nested
//     sections as h3, so the Roman-vs-alphabetic style split is a simple
//     tag selector.
//   • the abstract no longer auto-emits a heading; the IEEE inline
//     "Abstract—" prefix in content stands on its own.
const IEEE_CSS = [
  // ── Title block ──────────────────────────────────────────────────
  "h1.reactdoc-document-title{font-size:24pt;font-weight:normal;font-family:'Times New Roman',Times,serif;text-align:center;margin:0 0 12pt 0;line-height:1.1;}",

  // ── Abstract / Index Terms (9pt bold-italic block) ──────────────
  ".reactdoc-abstract{font-size:9pt;font-weight:bold;font-style:italic;text-align:justify;margin:0 0 8pt 0;}",
  ".reactdoc-abstract p{margin:0;text-indent:0;}",
  ".reactdoc-abstract p + p{margin-top:6pt;}",

  // ── Top-level section heads: ROMAN NUMERAL, centered, small-caps ─
  "h2.reactdoc-section-title{font-size:10pt;font-weight:normal;font-style:normal;font-family:'Times New Roman',Times,serif;text-align:center;text-align-last:center;text-transform:uppercase;letter-spacing:0.04em;margin:12pt 0 4pt 0;break-after:avoid;counter-increment:ieee-section;counter-reset:ieee-subsection;}",
  "h2.reactdoc-section-title::before{content:counter(ieee-section,upper-roman) '. ';}",
  ".reactdoc-flow{counter-reset:ieee-section;}",

  // ── Nested subsection heads (h3): italic, flush left, A./B./C. ──
  "h3.reactdoc-section-title{font-size:10pt;font-weight:normal;font-style:italic;font-family:'Times New Roman',Times,serif;text-align:left;text-transform:none;letter-spacing:0;margin:6pt 0 2pt 0;break-after:avoid;counter-increment:ieee-subsection;}",
  "h3.reactdoc-section-title::before{content:counter(ieee-subsection,upper-alpha) '. ';}",

  // ── Body paragraphs: 1em first-line indent ──────────────────────
  ".reactdoc-flow p{margin:0;text-indent:1em;}",
  // First paragraph after a heading: no indent.
  "h2 + p, h3 + p, h4 + p{text-indent:0;}",

  // ── Figures: caption "Fig. 1. ..." centered below, 8pt ──────────
  "figure{margin:8pt 0;text-align:center;page-break-inside:avoid;break-inside:avoid;}",
  "figure img{max-width:100%;height:auto;display:block;margin:0 auto 4pt auto;}",
  "figure figcaption{font-size:8pt;font-family:'Times New Roman',Times,serif;text-align:center;line-height:1.2;text-indent:0;}",

  // ── Inline code: plain mono, no background box ──────────────────
  "code{background:none;padding:0;border-radius:0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:0.92em;}",

  // ── Citations: IEEE-style [N] brackets, black inline text ───────
  // The engine emits only the counter value via .reactdoc-cite::after;
  // wrap it in brackets here and suppress the default link styling.
  "a.reactdoc-cite{color:inherit;text-decoration:none;}",
  "a.reactdoc-cite::before{content:'[';}",
  "a.reactdoc-cite::after{content:target-counter(attr(href url), reactdoc-bib) ']';}",

  // ── References list ─────────────────────────────────────────────
  ".reactdoc-bibliography{font-size:8pt;}",
  ".reactdoc-bibliography h2{font-size:10pt;font-weight:normal;font-style:normal;text-transform:uppercase;letter-spacing:0.04em;text-align:center;text-align-last:center;margin:12pt 0 6pt 0;break-after:avoid;}",
  ".reactdoc-bibliography ol{list-style:none;padding-left:0;margin:0;}",
  ".reactdoc-bibliography li{text-indent:-1.4em;padding-left:1.4em;margin-bottom:2pt;text-align:justify;}",
  ".reactdoc-bibliography li::before{content:'[' counter(reactdoc-bib) '] ';}",

  // ── Math: numbered equation right-margin ────────────────────────
  ".reactdoc-math-block{text-indent:0;}"
].join("");

export function Template() {
  return (
    <page
      page={{
        size: "letter",
        marginTop: "19.05mm",
        marginBottom: "25.4mm",
        marginLeft: "15.875mm",
        marginRight: "15.875mm"
      }}
      typography={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "10pt",
        lineHeight: 1.15,
        textAlign: "justify"
      }}
      style={{ customCss: IEEE_CSS }}
    >
      <rules>
        <role
          on="figure"
          match="numbered"
          apply="ieeeFigure"
          numbering={{ counter: "ieee-figure", format: "Fig. $ieee-figure. " }}
          style={{ fontSize: "8pt", textAlign: "center" }}
        />
        <role
          on="math"
          match="numbered"
          apply="ieeeEquation"
          numbering={{ counter: "ieee-equation", format: "($ieee-equation)" }}
        />
      </rules>

      <header anchor="top-center" when="not-first-page" typography={{ fontSize: "8pt", fontStyle: "italic" }}>
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center" typography={{ fontSize: "8pt" }}>
        <page-number />
      </footer>

      <stack gap="0">
        {/* Title block: spans full width above two columns. */}
        <region style={{ textAlign: "center", paddingBottom: "4mm" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        {/* Two-column body — abstract + sections + bibliography all
            flow together so the abstract opens column 1 on page 1
            and the references continue in the column flow at the end. */}
        <region style={{ columns: 2, columnGap: "4.24mm", textAlign: "justify" }}>
          <slot name="abstract" />
          <slot name="body" />
          <bibliography title="References" />
        </region>
      </stack>
    </page>
  );
}

export default function IEEEStrictPaper() {
  return (
    <document
      title="A Browser-Native Substrate for Paginated Document Engineering"
      author="L. M. Cartwright, R. T. Holloway, Senior Member, IEEE, and A. K. Vance"
    >
      <abstract>
        <p>
          <em>Abstract</em>—We present a framework for paginated documents
          that resolves cross-references, page numbers, and counters at
          render time inside a browser. Unlike traditional multi-pass
          typesetting systems such as TeX <cite cite="knuth1984" /> or
          LaTeX <cite cite="lamport1986" />, our approach defers numeric
          resolution to CSS Generated Content for Paged Media, executing
          the second pass inside a Paged.js polyfill. We show that this
          approach generalises to bibliographies, indices, tables of
          contents, and floating footnotes without auxiliary tooling. We
          evaluate the resulting documents on three axes — typographic
          fidelity, build time, and authoring complexity — and report
          competitive results on all three.
        </p>
        <p>
          <em>Index Terms</em>—Document engineering, CSS Paged Media,
          Generated Content for Paged Media, cross-reference resolution,
          browser-native typesetting, React reconcilers, paginated HTML,
          headless Chromium.
        </p>
      </abstract>

      <section title="Introduction">
        <p>
          The problem of cross-reference resolution in paginated documents
          has a long lineage in the document engineering literature.
          Knuth's TeX <cite cite="knuth1984" /> established the convention
          of multi-pass compilation: a first pass discovers all anchor
          points and writes them to an auxiliary file, a second pass
          reads that file and substitutes the resolved values into
          reference call sites, and a third pass repeats to handle
          forward references. Lamport's LaTeX <cite cite="lamport1986" />{" "}
          inherited this architecture and extended it to bibliographies
          via the BibTeX side-channel, indices via MakeIndex, and the
          table of contents via the same auxiliary mechanism.
        </p>
        <p>
          A more recent line of work explores typesetting in the
          browser <cite cite="tufte1983" />. The Paged.js project
          implements CSS Paged Media and its companion specification,
          Generated Content for Paged Media (GCPM), as a polyfill that
          runs at document load. GCPM provides primitives —{" "}
          <code>target-counter</code>, <code>target-text</code>,{" "}
          <code>string-set</code>, <code>position: running()</code>, and{" "}
          <code>content: element()</code> — that together cover the
          substrate most cross-references require. What has been
          missing is a writer-facing language that compiles to these
          primitives without exposing the underlying CSS.
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
          II surveys related work in document engineering and
          browser-native typesetting. Section III describes the content
          and template primitive vocabularies. Section IV presents the
          resolver and its two-pass algorithm. Section V reports on
          evaluation documents rendered through the system. Section VI
          discusses limitations and concludes.
        </p>
      </section>

      <section title="Related Work">
        <p>Three threads of prior work bear on this paper.</p>

        <section title="Multi-pass typesetting">
          <p>
            Knuth's TeX <cite cite="knuth1984" /> remains the canonical
            example of a system that resolves cross-references via
            auxiliary files written between passes. The architecture has
            the virtue of producing a static output artifact — a DVI or
            PDF file — but the price is a brittle build system in which
            a single misplaced citation can require three or four passes
            to converge. LaTeX <cite cite="lamport1986" /> extends this
            with the BibTeX side-channel for bibliographies and
            MakeIndex for indices, each introducing additional
            intermediate files.
          </p>
        </section>

        <section title="Browser-native typesetting">
          <p>
            Paged.js exposes the CSS Paged Media specification as a
            JavaScript polyfill, allowing modern browsers to perform
            pagination at runtime. The GCPM specification provides the
            substrate for cross-references via <code>target-counter</code>{" "}
            and related functions. To our knowledge, no prior system
            provides a typed authoring surface above this substrate
            that hides the underlying CSS from writers and designers
            alike.
          </p>
        </section>

        <section title="Information design and typography">
          <p>
            Tufte's work on the visual display of quantitative
            information <cite cite="tufte1983" /> and Bringhurst's
            treatise on typographic style{" "}
            <cite cite="bringhurst2004" /> inform the default settings
            of our starter templates. Kindersley's earlier work on
            optical letter spacing <cite cite="kindersley1969" />{" "}
            motivates the kerning defaults in our serif body face.
          </p>
        </section>

        <figure
          id="fig-pipeline"
          role="numbered"
          src={FIGURE_PATH}
          caption="Compilation pipeline. The React content tree and template tree are reconciled separately, joined by a resolver, emitted as paginated HTML, and consumed by Paged.js inside headless Chromium to produce the final PDF."
          width="80mm"
        />
      </section>

      <section title="Primitive Vocabulary">
        <p>
          Our system distinguishes two scopes — content and template —
          and provides a small primitive surface in each. Writers
          compose content primitives to express their prose; designers
          compose template primitives to express the geometry and
          chrome of the page. The surfaces communicate through a
          routing system based on three props: <code>role</code>,{" "}
          <code>page</code>, and <code>variant</code>.
        </p>
        <p>
          The content scope includes structural primitives such as{" "}
          <code>section</code>, <code>p</code>, <code>figure</code>, and{" "}
          <code>table</code>, together with inline primitives including{" "}
          <code>em</code>, <code>strong</code>, <code>ref</code>,{" "}
          <code>cite</code>, <code>footnote</code>, and <code>m</code>{" "}
          for inline mathematics. The full vocabulary covers, by our
          count, every structural concept required by the IMRaD article
          format, every floating element required by the IEEE
          conference template, and the primary marginalia patterns of
          Tufte-style essays.
        </p>
        <math
          id="eq-capacity"
          role="numbered"
          src={"C = W \\log_2 (1 + S/N)"}
        />
        <p>
          A representative example, shown in (1) above, gives a
          numbered equation generated by a <code>role</code> rule that
          pairs the math node with a counter increment and a format
          string. The format string admits <code>$counter</code> tokens
          that compile to CSS <code>counter()</code> calls; the present
          example yields the familiar parenthesised numbering at the
          right margin.
        </p>
      </section>

      <section title="Resolver Algorithm">
        <p>
          The resolver is the most novel component of the system. It
          accepts two trees — content and template — and produces a
          third, the resolved tree, which is consumed by the HTML
          emitter. The algorithm proceeds in five phases.
        </p>

        <section title="Slot construction">
          <p>
            The resolver walks the content tree once, producing a map
            from slot names to lists of resolved children. The slot
            names include the four built-ins (<code>title</code>,{" "}
            <code>author</code>, <code>abstract</code>, <code>body</code>
            ) and any additional slots introduced by custom template
            intrinsics. The body slot collects all top-level content
            children that are not abstracts.
          </p>
        </section>

        <section title="Rule application">
          <p>
            The resolver walks the template tree to discover{" "}
            <code>role</code> and <code>page</code> rules, then applies
            them to the slot-resolved content tree. Role rules set the{" "}
            <code>variant</code> field on matched nodes; page rules
            establish a mapping from the abstract <code>page</code>{" "}
            token on a section to a concrete page-set name in the
            template.
          </p>
        </section>

        <section title="Anchor stamping">
          <p>
            Every section that lacks an explicit <code>id</code>{" "}
            receives a generated identifier derived from its title.
            Every figure, table, and equation likewise receives an
            auto-generated identifier scoped to its kind. These
            identifiers become the anchors targeted by <code>ref</code>{" "}
            nodes at the subsequent <code>target-counter</code> step.
          </p>
        </section>

        <section title="Aggregate collection">
          <p>
            The resolver collects three further data structures from
            the slot-resolved tree: a set of cited bibliography keys, a
            multimap of index terms to anchor lists, and an ordered
            list of section anchor descriptors. These collections
            drive the auto-generated back matter — bibliographies,
            indices, and tables of contents — at HTML emission time.
          </p>
        </section>

        <section title="Template realisation">
          <p>
            Finally, the resolver walks the template tree once more,
            substituting slots with their corresponding slot lists,
            applying page-set filtering to the body slot, and producing
            the final resolved tree. Custom template intrinsics are
            dispatched to their registered renderers at this phase.
          </p>
        </section>
      </section>

      <section title="Evaluation">
        <p>
          We evaluated the system by rendering five mockup documents
          through the pipeline: an academic treatise, a Tufte-style
          essay with marginal sidenotes, a two-sided novel chapter
          with mirror anchors, a multi-column newsletter, and the
          present IEEE conference paper. Each mockup was chosen to
          exercise a distinct combination of the primitive surface.
        </p>
        <section title="Typographic fidelity">
          <p>
            Across all five mockups, the rendered PDFs are visually
            indistinguishable from their conventional analogues.
            Justified paragraphs hyphenate appropriately under the
            default Latin Modern hyphenation patterns; drop caps
            render as expected via <code>::first-letter</code> and{" "}
            <code>initial-letter</code>; running headers and footers
            populate via Paged.js' <code>position: running()</code>{" "}
            mechanism. The one discrepancy concerned widow and orphan
            control, which the Paged.js polyfill implements partially.
          </p>
        </section>
        <section title="Build time">
          <p>
            A single-document build takes between 300 and 800
            milliseconds end-to-end on a modern laptop, dominated by
            headless Chromium startup. Subsequent builds in the same
            process take 50 to 150 milliseconds. This compares
            favourably to LaTeX's multi-pass compilation, which on the
            same hardware takes 1.2 to 3.5 seconds for documents of
            comparable size.
          </p>
        </section>
        <section title="Authoring complexity">
          <p>
            We invited three writers and two designers, none of whom
            had prior experience with the system, to author short
            documents over a two-day workshop. All five subjects
            produced a complete document by the end of the first day;
            four reported the experience as more pleasant than LaTeX,
            and three said they would consider using the system for
            future projects.
          </p>
        </section>
      </section>

      <section title="Limitations and Conclusion">
        <p>
          Several limitations remain. The widow and orphan control
          mentioned above is the most user-visible. We are also
          limited by Paged.js's treatment of named-page geometries:
          while the underlying CSS Paged Media specification permits
          per-page-name margin boxes, Paged.js's implementation
          flattens these in ways that occasionally affect chrome
          placement on title pages and chapter-opening pages.
        </p>
        <p>
          A more architectural limitation concerns multi-pass
          cross-references that depend on each other: a reference
          that names a page, where inserting the reference itself
          changes the page numbering. The present system does not
          iterate; in practice, second-order effects of this kind
          are rare in technical writing, but they are not absent.
        </p>
        <p>
          Despite these limitations, we conclude that browser-native
          paginated typesetting is a viable replacement for
          traditional multi-pass typesetting systems in a substantial
          fraction of academic and long-form writing tasks. Future
          work includes extending the primitive surface to scientific
          floats (algorithms, listings, theorems) and integrating
          with the MathML rendering pipeline available in modern
          browsers. We draw inspiration from earlier work on software
          tools in the Plan 9 tradition <cite cite="kernighan1976" />{" "}
          and on humane interface design <cite cite="raskin2000" />.
        </p>
      </section>

      <refs>
        <ref-entry refKey="kernighan1976">
          B. W. Kernighan and P. J. Plauger, <em>Software Tools</em>.
          Reading, MA: Addison-Wesley, 1976.
        </ref-entry>
        <ref-entry refKey="knuth1984">
          D. E. Knuth, <em>The TeXbook</em>. Reading, MA:
          Addison-Wesley, 1984.
        </ref-entry>
        <ref-entry refKey="tufte1983">
          E. R. Tufte,{" "}
          <em>The Visual Display of Quantitative Information</em>.
          Cheshire, CT: Graphics Press, 1983.
        </ref-entry>
        <ref-entry refKey="lamport1986">
          L. Lamport, <em>LaTeX: A Document Preparation System</em>.
          Reading, MA: Addison-Wesley, 1986.
        </ref-entry>
        <ref-entry refKey="raskin2000">
          J. Raskin, <em>The Humane Interface</em>. Reading, MA:
          Addison-Wesley, 2000.
        </ref-entry>
        <ref-entry refKey="bringhurst2004">
          R. Bringhurst, <em>The Elements of Typographic Style</em>,
          3rd ed. Vancouver, BC: Hartley &amp; Marks, 2004.
        </ref-entry>
        <ref-entry refKey="kindersley1969">
          D. Kindersley,{" "}
          <em>Optical Letter Spacing for New Printing Systems</em>.
          London, UK: Lund Humphries, 1969.
        </ref-entry>
      </refs>
    </document>
  );
}
