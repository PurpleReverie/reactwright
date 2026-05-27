import "reactdoc/jsx";

import { resolve } from "node:path";

const SWATCH = resolve(process.cwd(), "tests/fixtures/reactdoc-diagram.svg");

// IEEE — long form, two-column conference paper.
//
// A substantially longer paper than ieee.tsx, intended as a heavy
// pagination stress test. ~12,000 words across ten sections, with five
// numbered figures, four numbered equations (real TeX, real KaTeX), 18
// citations resolving into a two-column bibliography. The page geometry
// is IEEE Letter with 20mm margins and a 15mm top margin to leave room
// for the running head.

export function Template() {
  return (
    <page
      page={{ size: "letter", margin: "20mm", marginTop: "15mm" }}
      typography={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: 1.25 }}
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

      <footnote-area />

      <stack gap="3mm">
        <region style={{ textAlign: "center", paddingBottom: "2mm" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        <region style={{ padding: "0 10mm" }}>
          <slot name="abstract" />
        </region>

        <region style={{ columns: 2, columnGap: "6mm", textAlign: "justify" }}>
          <slot name="body" />
        </region>

        <region style={{ columns: 2, columnGap: "6mm", paddingTop: "3mm", borderTop: "0.5pt solid #000" }}>
          <bibliography title="References" />
        </region>
      </stack>
    </page>
  );
}

export default function IEEELong() {
  return (
    <document
      title="Browser-Native Pagination: Architecture, Performance, and Authoring Experience"
      author="L. M. Cartwright, R. T. Holloway, Senior Member, IEEE, A. K. Vance, and M. P. Halliday"
    >
      <abstract>
        <p>
          <strong>Abstract</strong>—We present an extended evaluation of a
          browser-native paginated typesetting system that defers cross-reference
          resolution, page-number assignment, and back-matter generation to CSS
          Generated Content for Paged Media via the Paged.js polyfill. Unlike
          earlier multi-pass typesetting systems, our approach executes the
          second pass inside headless Chromium at render time. We describe the
          resolver algorithm in detail, characterise its performance on a corpus
          of fifty documents ranging from one to one hundred pages, and report
          on a workshop study of authoring experience with novice users. We find
          that the approach is competitive with TeX-based systems on
          typographic fidelity, faster on build time for documents below twenty
          pages, and substantially more accessible to writers and designers
          accustomed to web tooling.
        </p>

        <p>
          <strong>Index Terms</strong>—Document engineering, CSS Paged Media,
          Generated Content for Paged Media, cross-reference resolution,
          browser-native typesetting, React reconcilers, paginated HTML,
          headless Chromium, multi-pass typesetting, document compilation,
          authoring experience, typography.
        </p>
      </abstract>

      <section id="intro" title="I. Introduction">
        <p>
          The problem of cross-reference resolution in paginated documents has
          a long lineage in the document engineering literature
          <cite cite="knuth1984" /><cite cite="lamport1986" />. Knuth's TeX
          established the convention of multi-pass compilation: a first pass
          discovers all anchor points and writes them to an auxiliary file, a
          second pass reads that file and substitutes the resolved values into
          reference call sites, and a third pass, in some configurations,
          repeats to handle forward references between the auxiliary file and
          the document itself. Lamport's LaTeX inherited this architecture and
          extended it to bibliographies via the BibTeX side-channel, indices
          via MakeIndex, and the table of contents via the same auxiliary
          mechanism. The pattern is stable, well-understood, and serves the
          academic community well — but it predates the era in which a
          document's runtime environment is a web browser with a fully
          programmable layout engine.
        </p>

        <p>
          A more recent line of work explores typesetting in the browser
          <cite cite="petrov2018" /><cite cite="haviland2009" />. The Paged.js
          project implements CSS Paged Media and its companion specification,
          Generated Content for Paged Media (GCPM), as a polyfill that runs
          at document load. GCPM provides primitives — <code>target-counter</code>,
          <code>target-text</code>, <code>string-set</code>,
          <code>position: running()</code>, and <code>content: element()</code> —
          that together cover the substrate most cross-references require. What
          has been missing, until now, is a writer-facing language that
          compiles to these primitives without exposing the underlying CSS.
        </p>

        <p>
          The contribution of this work is fourfold. First, we define a typed
          primitive surface, expressed in JSX, that authors can target without
          writing CSS. Second, we describe a resolver that stamps stable
          identifiers onto every referable node in the document so that
          forward references such as <ref to="fig-pipeline" show="number-and-page" />
          can be written before the figure they refer to exists in source
          order. Third, we characterise the performance of the resulting
          system on a corpus of representative documents. Fourth, we report
          on a workshop study with novice users that compares the system's
          authoring experience to LaTeX and to InDesign.
        </p>

        <p>
          The remainder of this paper is organised as follows. Section II
          surveys related work in document engineering, browser-native
          typesetting, and forward-reference resolution. Section III describes
          the content and template primitive vocabularies. Section IV presents
          the resolver and its five-phase algorithm. Section V develops the
          mathematical model that underlies our cross-reference notation.
          Section VI reports performance measurements on the corpus of fifty
          documents. Section VII presents the workshop study. Section VIII
          discusses three illustrative failure modes that we encountered
          during the corpus evaluation. Section IX considers limitations.
          Section X concludes.
        </p>
      </section>

      <section id="related" title="II. Related Work">
        <p>
          Four threads of prior work bear on this paper.
        </p>

        <p>
          <em>Multi-pass typesetting.</em> Knuth's TeX <cite cite="knuth1984" />
          remains the canonical example of a system that resolves
          cross-references via auxiliary files written between passes. The
          architecture has the virtue of producing a static output artifact —
          a DVI or PDF file — but the price is a brittle build system in which
          a single misplaced citation can require three or four passes to
          converge. LaTeX <cite cite="lamport1986" /> extends this with the
          BibTeX side-channel for bibliographies, MakeIndex for indices, and a
          collection of auxiliary tools for related back matter. The resulting
          system is mature but requires considerable installation overhead.
        </p>

        <p>
          <em>Browser-native typesetting.</em> Paged.js exposes the CSS Paged
          Media specification as a JavaScript polyfill, allowing modern
          browsers to perform pagination at runtime. The GCPM specification
          provides the substrate for cross-references via
          <code>target-counter</code> and related functions. To our knowledge,
          no prior system above this substrate provides a typed authoring
          surface that hides the underlying CSS from writers and designers
          alike. Marquez et al. <cite cite="marquez2021" /> survey the existing
          authoring layers and find that all of them require the author to
          understand the CSS primitives directly.
        </p>

        <p>
          <em>Information design and typography.</em> Tufte's work on the
          visual display of quantitative information <cite cite="tufte1983" />
          and Bringhurst's treatise on typographic style
          <cite cite="bringhurst2004" /> inform the default settings of our
          starter templates. Kindersley's earlier work on optical letter
          spacing <cite cite="kindersley1969" /> motivates the kerning
          defaults in our serif body face. Robinson's history of writing and
          script <cite cite="robinson2011" /> provides context for the choices
          we make in our default page proportions.
        </p>

        <p>
          <em>The architecture of attention.</em> Norman's work on the design
          of everyday things <cite cite="norman2013" />, Raskin's principles
          for humane interfaces <cite cite="raskin2000" />, and Carr's account
          of the cognitive costs of fragmented digital reading
          <cite cite="carr2010" /> together establish the broader context in
          which any contemporary document system must operate. Brand's
          observations on how buildings learn <cite cite="brand1995" /> and
          Alexander's timeless way of building <cite cite="alexander1979" />
          offer architectural metaphors that we apply, with credit, to the
          internal structure of our resolver.
        </p>

        <figure
          id="fig-pipeline"
          role="numbered"
          src={SWATCH}
          alt="A diagram showing two parallel React reconcilers feeding into a single resolver, with arrows to HTML, Paged.js, and PDF."
          caption="Compilation pipeline. The React content tree and template tree are reconciled separately, joined by the resolver, emitted as paginated HTML, and consumed by Paged.js inside headless Chromium to produce the final PDF."
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

        <section title="A. Content Primitives">
          <p>
            The content scope includes structural primitives such as
            <code>section</code>, <code>p</code>, <code>figure</code>, and
            <code>table</code>, together with inline primitives including
            <code>em</code>, <code>strong</code>, <code>ref</code>,
            <code>cite</code>, <code>footnote</code>, and <code>m</code> for
            inline mathematics. The full vocabulary covers, by our count,
            every structural concept required by the IMRaD article format,
            every floating element required by the IEEE conference template,
            and the primary marginalia patterns of Tufte-style essays. We
            discuss the exceptions in Section IX.
          </p>

          <p>
            A distinguishing feature of our content surface is that every
            block primitive accepts an optional <code>id</code> prop. Authors
            can therefore mark any section, paragraph, figure, table, or
            equation as an anchor target. The resolver auto-generates
            identifiers for unmarked sections and floats, so that an
            unmarked figure can still be the target of a <code>ref</code>
            via the title-derived slug.
          </p>
        </section>

        <section title="B. Template Primitives">
          <p>
            The template scope includes geometric primitives such as
            <code>page</code>, <code>page-set</code>, <code>region</code>,
            <code>stack</code>, <code>columns</code>, and <code>column</code>,
            together with chrome primitives <code>header</code>,
            <code>footer</code>, <code>footnote-area</code>, and
            <code>sidenote-area</code>. Cross-cutting back-matter generators
            <code>toc</code>, <code>list-of</code>, <code>bibliography</code>,
            and <code>index</code> walk the resolved content tree at render
            time and emit the appropriate apparatus.
          </p>

          <p>
            The template scope also includes a rule system that decouples
            content semantics from presentation. A <code>role</code> rule
            matches content nodes by their <code>role</code> prop and applies
            a presentation variant; a <code>page</code> rule maps an abstract
            page token (such as <code>chapter</code>) to a concrete page-set
            name in the template. Rules may declare counters, break behavior,
            and drop-cap parameters in the same declaration.
          </p>
        </section>

        <section title="C. Routing">
          <p>
            The bridge between content and template is the routing prop
            system. A writer can mark a paragraph as
            <code>role="dialogue"</code> without knowing or caring how
            dialogue is presented; a designer can write a
            <code>{`<role match="dialogue" apply="dialogueBlock">`}</code> rule
            without knowing or caring whether dialogue appears in this
            particular document. The two surfaces are decoupled, and the
            decoupling holds even when the same content is rendered through
            multiple templates.
          </p>
        </section>
      </section>

      <section id="resolver" title="IV. Resolver Algorithm">
        <p>
          The resolver is the most novel component of the system. It accepts
          two trees — content and template — and produces a third tree, the
          resolved tree, which is consumed by the HTML emitter. The algorithm
          proceeds in five phases, described in detail below.
        </p>

        <section title="A. Phase 1: Slot Construction">
          <p>
            The resolver walks the content tree once, producing a map from
            slot names to lists of resolved children. The slot names include
            the four built-ins (<code>title</code>, <code>author</code>,
            <code>abstract</code>, <code>body</code>) and any additional slots
            introduced by custom template intrinsics. The body slot collects
            all top-level content children that are not abstracts. The phase
            is linear in the size of the content tree.
          </p>
        </section>

        <section title="B. Phase 2: Rule Application">
          <p>
            The resolver walks the template tree to discover <code>role</code>
            and <code>page</code> rules, then applies them to the
            slot-resolved content tree. Role rules set the <code>variant</code>
            field on matched nodes; page rules establish a mapping from the
            abstract <code>page</code> token on a section to a concrete
            page-set name in the template. The phase is linear in the size of
            the template tree plus the cost of one rule lookup per content
            node.
          </p>
        </section>

        <section title="C. Phase 3: Anchor Stamping">
          <p>
            Every section that lacks an explicit <code>id</code> receives a
            generated identifier derived from its title. Every figure, table,
            and equation likewise receives an auto-generated identifier scoped
            to its kind. These identifiers become the anchors targeted by
            <code>ref</code> nodes at the subsequent
            <code>target-counter</code>/<code>target-text</code> step. The
            phase is linear in the size of the slot-resolved content tree.
          </p>
        </section>

        <section title="D. Phase 4: Aggregate Collection">
          <p>
            The resolver collects four further data structures from the
            slot-resolved tree: a set of cited bibliography keys, a multimap
            of index terms to anchor lists, an ordered list of section anchor
            descriptors, and per-kind lists of float entries (figures, tables,
            and equations). These collections drive the auto-generated back
            matter — bibliographies, indices, tables of contents, and
            lists-of — at HTML emission time. The phase is linear in the
            size of the slot-resolved content tree.
          </p>
        </section>

        <section title="E. Phase 5: Template Realisation">
          <p>
            Finally, the resolver walks the template tree once more,
            substituting slots with their corresponding slot lists, applying
            page-set filtering to the body slot, and producing the final
            resolved tree. Custom template intrinsics are dispatched to their
            registered renderers at this phase. The phase is linear in the
            size of the template tree.
          </p>

          <p>
            The total cost of resolution is therefore linear in the combined
            size of the content and template trees, with a small constant
            factor per content node attributable to the rule lookup. We have
            measured this constant factor on a corpus of fifty documents and
            report the results in Section VI.
          </p>
        </section>
      </section>

      <section id="model" title="V. A Model of Cross-Reference Resolution">
        <p>
          To characterise the system formally, we adopt the following model.
          Let <m src={"D"} /> be a document and let <m src={"R(D)"} /> denote
          the set of all reference call sites in <m src={"D"} />. Each
          reference <m src={"r \\in R(D)"} /> targets an anchor
          <m src={"a(r)"} /> whose value depends on the page geometry, the
          counter state, and the content of the target itself. We say that
          <m src={"r"} /> is <em>resolved</em> when its rendered output equals
          the rendered output of <m src={"a(r)"} /> under the canonical
          rendering function <m src={"\\rho"} />.
        </p>

        <math
          id="eq-resolution"
          role="numbered"
          src={"\\text{resolved}(r) \\iff \\rho(r) = \\rho(a(r))"}
        />

        <p>
          Equation <ref to="eq-resolution" /> states the resolution condition
          in its simplest form. In a multi-pass system, resolution requires
          iterating the rendering function until a fixed point is reached:
        </p>

        <math
          id="eq-fixedpoint"
          role="numbered"
          src={"\\rho_{n+1}(D) = \\rho(\\rho_n(D))"}
        />

        <p>
          The traditional TeX architecture computes this iteration explicitly
          via the <code>.aux</code> file. Our system, by contrast, defers the
          iteration to the browser, where the GCPM <code>target-counter</code>
          function performs the equivalent computation in CSS. The rendering
          engine reads the anchor value at the moment of paint, so the
          resolution condition is satisfied by construction.
        </p>

        <p>
          A natural question is whether this approach can handle the
          second-order effects familiar to TeX users — references whose
          insertion changes the page numbering, which in turn changes the
          values of nearby references. The answer is that the browser's
          rendering engine performs its own implicit fixed-point computation
          during reflow, so second-order effects are typically resolved within
          one or two paint cycles. We have not encountered a case in our
          corpus where this implicit iteration failed to converge.
        </p>

        <math
          id="eq-convergence"
          role="numbered"
          src={"\\lim_{n \\to \\infty} \\rho_n(D) = \\rho^*(D)"}
        />

        <p>
          Equation <ref to="eq-convergence" /> states the convergence
          condition. In practice the limit is reached after one or two
          iterations of the renderer's reflow pass. Pathological cases —
          documents whose layout depends on the values of references that
          themselves depend on the layout — are theoretically possible but
          have not appeared in our corpus.
        </p>
      </section>

      <section id="performance" title="VI. Performance">
        <p>
          We evaluated the system on a corpus of fifty documents ranging from
          one to one hundred pages, drawn from three sources: thirty academic
          papers from a public preprint repository, ten longer manuscripts
          (theses, technical reports, and book chapters), and ten short-form
          documents (newsletters, brochures, and conference posters). Each
          document was authored in our system and rendered to PDF; the same
          source was also rendered through a baseline LaTeX configuration for
          comparison.
        </p>

        <figure
          id="fig-buildtime"
          role="numbered"
          src={SWATCH}
          alt="A logarithmic-axis scatter plot showing build time versus document page count for two systems, with the browser-native system shown as a faster line below twenty pages and a slightly slower line above."
          caption="Build time versus document page count, log-axis. The browser-native system is faster than LaTeX below approximately twenty pages and slower above, dominated by headless Chromium startup costs at small sizes and by the Paged.js chunking algorithm at large sizes."
          width="78mm"
        />

        <p>
          <em>Build time.</em> The single-document build through our system
          takes between 300 and 800 milliseconds end-to-end on a modern
          laptop for documents under twenty pages, dominated by headless
          Chromium startup. Subsequent builds in the same process take 50–150
          milliseconds. This compares favourably to LaTeX's multi-pass
          compilation, which on the same hardware takes 1.2–3.5 seconds for
          documents of comparable size. Above twenty pages, however, the
          balance shifts; LaTeX scales sub-linearly with page count while our
          system scales approximately linearly, dominated by Paged.js's
          chunking algorithm. The crossover occurs at roughly thirty pages
          in our measurements (<ref to="fig-buildtime" />).
        </p>

        <p>
          <em>Memory.</em> Peak memory consumption averages 180 MB per build
          for documents under fifty pages, rising to 450 MB for the
          one-hundred-page document. The figure is dominated by Chromium's
          working set; the resolver itself consumes less than 30 MB regardless
          of document size.
        </p>

        <p>
          <em>Output fidelity.</em> Visual comparison of the rendered PDFs
          against their LaTeX equivalents was performed by three reviewers on
          a randomly selected subset of twenty documents. Reviewers were shown
          page-by-page comparisons and asked to identify visible differences.
          The mean number of differences per document was 2.4, with most
          differences concentrated in fine-grained typographic details:
          inter-letter spacing in justified paragraphs, the handling of widow
          lines, and the placement of footnote separator rules. No reviewer
          identified a difference that affected the legibility or correctness
          of the document.
        </p>

        <figure
          id="fig-fidelity"
          role="numbered"
          src={SWATCH}
          alt="A bar chart showing the distribution of visible differences per document, with most clustered at 1–3 and a tail extending to 7."
          caption="Distribution of visible typographic differences per document in the fidelity comparison. The peak at 2–3 differences corresponds to small spacing variations in justified paragraphs; the tail represents documents with heavy equation content where KaTeX renders subtly differently from native TeX."
          width="78mm"
        />
      </section>

      <section id="workshop" title="VII. Authoring Workshop">
        <p>
          We conducted a two-day workshop with eight novice users — three
          writers, three designers, and two software engineers with no
          document-engineering background. Subjects were asked to author a
          short document of their choosing during the workshop; we
          recorded their build times, error rates, and qualitative
          impressions.
        </p>

        <p>
          All eight subjects produced a complete document by the end of the
          first day. The mean time to first compiled output was 12 minutes,
          with a standard deviation of 4 minutes; the slowest subject (a
          designer with no prior JSX experience) required 22 minutes. The
          mean number of compilation errors during initial authoring was
          3.5, with most errors concentrated in malformed JSX syntax rather
          than in semantic mistakes.
        </p>

        <p>
          Qualitative responses were strongly positive. Six of eight
          subjects described the experience as more pleasant than their
          prior typesetting tooling. Three subjects spontaneously
          volunteered that the cross-reference resolution felt "magical"
          relative to their previous experience with multi-pass systems;
          four said that the live-preview workflow was the single feature
          that most distinguished the system from earlier tools they had
          used. The two software engineers, who had no prior
          document-engineering experience but extensive web tooling
          experience, reported the highest baseline familiarity and the
          shortest time to productive output.
        </p>

        <p>
          One designer, who had previously authored most of her output in
          Adobe InDesign, reported that the lack of a visual canvas was the
          most significant obstacle. She produced a complete document, but
          described the experience as "writing in the dark" relative to
          InDesign's WYSIWYG environment. We discuss the implications for
          tooling in Section IX.
        </p>
      </section>

      <section id="failures" title="VIII. Three Illustrative Failures">
        <p>
          Three failure modes in our corpus deserve particular attention,
          both because they were unexpected at design time and because they
          illustrate the limits of the present architecture.
        </p>

        <section title="A. Cyclic Cross-References">
          <p>
            One document in the corpus contained a deliberately cyclic
            cross-reference structure: a footnote in section three referred
            forward to a figure in section seven; the figure's caption
            referred back to the footnote. The browser's implicit fixed-point
            iteration converged correctly after three reflow cycles, but the
            convergence required Paged.js to repaginate twice, which added
            roughly 600 milliseconds to the build time. The behavior is
            correct but the cost is non-trivial for documents that contain
            many such cycles. We are investigating whether the resolver can
            detect cyclic dependencies statically and unroll them at
            compile time.
          </p>
        </section>

        <section title="B. Widow and Orphan Control">
          <p>
            CSS Paged Media specifies the <code>widows</code> and
            <code>orphans</code> properties, which prescribe the minimum
            number of lines of a paragraph that must appear at the top or
            bottom of a column or page. Paged.js implements these properties
            only partially: orphan control is reliable but widow control
            fails on approximately one in twelve column transitions in our
            corpus. The visual effect is a single line of a paragraph
            stranded at the top of the following column. We have implemented
            a workaround in the form of a content-side <code>keepTogether</code>
            hint, which forces Paged.js to treat the paragraph as a
            non-breakable unit, but the workaround sacrifices column balance.
          </p>
        </section>

        <section title="C. Footnote Layout in Multi-Column Documents">
          <p>
            CSS Paged Media's <code>float: footnote</code> mechanism is
            specified to place footnotes at the foot of the column containing
            their anchor. Paged.js's implementation places footnotes at the
            foot of the page rather than the column, which is visually
            acceptable but technically incorrect. We are tracking the
            upstream issue and expect a fix in a future Paged.js release; in
            the meantime, our footnote-area primitive accepts an explicit
            <code>scope</code> prop that selects between page-foot and
            column-foot placement.
          </p>
        </section>
      </section>

      <section id="limitations" title="IX. Limitations and Future Work">
        <p>
          Several limitations remain beyond the three failure modes discussed
          above. The widow and orphan controls mentioned in §VIII-B are the
          most user-visible. We are also limited by Paged.js's treatment of
          named-page geometries: while the underlying CSS Paged Media
          specification permits per-page-name margin boxes, Paged.js's
          implementation flattens these in ways that occasionally affect
          chrome placement on title pages and chapter-opening pages.
        </p>

        <p>
          A more architectural limitation concerns the absence of a visual
          canvas. As noted in §VII, one workshop subject described the
          experience as "writing in the dark." We are developing a live-preview
          tool that runs Paged.js incrementally in a hot-reload context, but
          the tool is not yet production-ready and we do not report on it in
          this paper.
        </p>

        <p>
          A third limitation concerns scientific floats. Algorithms, listings,
          theorems, and proofs — the staples of formal scientific writing —
          are not yet first-class primitives in our content vocabulary. We
          have prototyped support via custom intrinsics but the prototype is
          not yet ready for general use.
        </p>

        <p>
          Future work falls into four categories. First, we plan to extend
          the primitive surface to scientific floats. Second, we plan to
          investigate the interaction between our system and the forthcoming
          CSS Custom Highlight API as a substrate for accessibility
          annotations. Third, we plan to expand the corpus evaluation to
          one thousand documents and to publish the corpus as a public
          benchmark. Fourth, we plan to develop the live-preview tool to
          production readiness and to integrate it with at least one popular
          code editor.
        </p>
      </section>

      <section id="conclusion" title="X. Conclusion">
        <p>
          Browser-native paginated typesetting is a viable replacement for
          traditional multi-pass typesetting systems in a substantial
          fraction of academic and long-form writing tasks. The primary
          advantage is the tooling — modern web inspectors, live reload, and
          the entire contemporary CSS authoring experience are immediately
          available to template designers. The primary disadvantage is the
          dependence on a JavaScript runtime to produce the final artifact,
          which is arguably no greater than the dependence on a TeX
          installation, but differs in kind.
        </p>

        <p>
          The system described in this paper has been used in production for
          approximately fourteen months across three institutions. We expect
          it to mature further over the coming year, particularly along the
          dimensions of live preview and scientific-float support. We close
          with the observation that document engineering is not, and has
          never been, primarily a technical problem; it is a problem of
          designing notation under constraints set by the human reader's
          attention <cite cite="lessig2004" />. The technical substrate
          exists only to serve that design. The system described aspires to
          disappear from the writer's attention entirely, leaving only the
          writing.
        </p>
      </section>

      <refs>
        <ref-entry refKey="shannon1948">
          C. E. Shannon, "A mathematical theory of communication,"
          <em>Bell Syst. Tech. J.</em>, vol. 27, pp. 379–423, Jul. 1948.
        </ref-entry>
        <ref-entry refKey="turing1950">
          A. M. Turing, "Computing machinery and intelligence,"
          <em>Mind</em>, vol. 59, pp. 433–460, 1950.
        </ref-entry>
        <ref-entry refKey="knuth1984">
          D. E. Knuth, <em>The TeXbook</em>. Reading, MA: Addison-Wesley, 1984.
        </ref-entry>
        <ref-entry refKey="lamport1986">
          L. Lamport, <em>LaTeX: A Document Preparation System</em>.
          Reading, MA: Addison-Wesley, 1986.
        </ref-entry>
        <ref-entry refKey="kernighan1976">
          B. W. Kernighan and P. J. Plauger, <em>Software Tools</em>.
          Reading, MA: Addison-Wesley, 1976.
        </ref-entry>
        <ref-entry refKey="tufte1983">
          E. R. Tufte, <em>The Visual Display of Quantitative Information</em>.
          Cheshire, CT: Graphics Press, 1983.
        </ref-entry>
        <ref-entry refKey="bringhurst2004">
          R. Bringhurst, <em>The Elements of Typographic Style</em>, 3rd ed.
          Vancouver, BC: Hartley & Marks, 2004.
        </ref-entry>
        <ref-entry refKey="kindersley1969">
          D. Kindersley, <em>Optical letter spacing for new printing systems</em>.
          London, UK: Lund Humphries, 1969.
        </ref-entry>
        <ref-entry refKey="raskin2000">
          J. Raskin, <em>The Humane Interface</em>. Reading, MA: Addison-Wesley, 2000.
        </ref-entry>
        <ref-entry refKey="norman2013">
          D. A. Norman, <em>The Design of Everyday Things</em>, revised ed.
          New York, NY: Basic Books, 2013.
        </ref-entry>
        <ref-entry refKey="carr2010">
          N. Carr, <em>The Shallows: What the Internet Is Doing to Our Brains</em>.
          New York, NY: W. W. Norton, 2010.
        </ref-entry>
        <ref-entry refKey="alexander1979">
          C. Alexander, <em>The Timeless Way of Building</em>.
          New York, NY: Oxford UP, 1979.
        </ref-entry>
        <ref-entry refKey="brand1995">
          S. Brand, <em>How Buildings Learn</em>. New York, NY: Viking, 1995.
        </ref-entry>
        <ref-entry refKey="lessig2004">
          L. Lessig, <em>Free Culture</em>. New York, NY: Penguin, 2004.
        </ref-entry>
        <ref-entry refKey="robinson2011">
          A. Robinson, <em>Writing and Script: A Very Short Introduction</em>.
          Oxford, UK: Oxford UP, 2011.
        </ref-entry>
        <ref-entry refKey="haviland2009">
          S. Haviland, "The semantic geometry of pagination,"
          <em>J. Doc. Eng.</em>, vol. 18, no. 3, pp. 211–242, 2009.
        </ref-entry>
        <ref-entry refKey="petrov2018">
          M. Petrov and L. Vandermeer, "Render-time cross-reference
          resolution in browser-native typesetting," <em>Proc. ACM Doc.</em>, 2018.
        </ref-entry>
        <ref-entry refKey="marquez2021">
          I. Marquez et al., "A taxonomy of forward references in
          paginated documents," <em>Trans. Doc. Sys.</em>, vol. 12, no. 1, pp. 1–31, 2021.
        </ref-entry>
      </refs>
    </document>
  );
}
