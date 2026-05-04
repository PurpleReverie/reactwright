export default function FullArticle() {
  return (
    <document
      title="Reactive Authoring for Long-Form Technical Documents"
      author="Tauraj Greig"
    >
      <abstract>
        <paragraph>
          This article examines whether a <em>React-authored</em> document system can
          provide a more programmable and reliable foundation for substantial
          technical writing than conventional markdown-centric workflows. The core
          claim is that long-form writing benefits from a semantic model that
          separates <strong>content meaning</strong> from <strong>template layout</strong>,
          while still allowing authors to use normal TypeScript abstractions,
          composition patterns, and compile-time logic. We outline the
          architectural motivation for such a system, describe the renderer
          pipeline required to support it, and discuss the implications for
          academic article and thesis production. The paper argues that a
          document system built on a dual React scope for content and template
          can retain the precision of structured typesetting while giving
          authors more control than markdown, without forcing them into the
          complexity of directly editing LaTeX templates.
        </paragraph>
      </abstract>

      <section title="Introduction">
        <paragraph>
          Long-form technical writing has always occupied an awkward space between
          plain prose and software construction. The writer wants freedom to
          express arguments, structure evidence, and revise ideas, but the final
          document also needs durable semantics, high-quality layout, and an
          export path that can survive beyond a single toolchain. In practice,
          the author often moves between too-light formats such as markdown and
          too-heavy formats such as raw LaTeX. Both can work, but each begins to
          resist the author once the document becomes substantial.
        </paragraph>

        <paragraph>
          Markdown is attractive because it is small, portable, and readable. It
          encourages forward movement. Yet the same minimalism that makes it
          comfortable for lightweight notes makes it fragile under the pressure
          of technical structure. Once a document needs stable semantics,
          reusable templates, conditional content, data-driven sections, or
          programmatic composition, markdown starts to accumulate ad hoc
          conventions. Writers then end up negotiating edge cases that were never
          part of the original format’s design goal.
        </paragraph>

        <paragraph>
          LaTeX, by contrast, provides a rigorous destination for final
          typesetting. It remains one of the strongest systems available for
          producing articles, dissertations, and mathematically dense work.
          However, authors who work directly in LaTeX must often internalize both
          document meaning and presentation mechanics at once. This coupling is
          manageable for experienced users, but it makes experimentation with
          layout, reuse, and higher-level semantic composition more difficult
          than it should be.
        </paragraph>

        <section title="Research Question">
          <paragraph>
            The motivating question for this paper is simple: can a document system
            built on React provide a better authoring model for large technical
            documents by treating the document as a semantic tree and the
            template as a separate, programmable layout tree? If the answer is
            yes, then the author gains a familiar programming environment
            without giving up the ability to render into stronger publishing
            formats.
          </paragraph>
        </section>
      </section>

      <section title="Problem Landscape">
        <paragraph>
          Existing writing workflows tend to optimize for only part of the full
          problem. Note-taking tools optimize for immediacy. Static site systems
          optimize for lightweight publishing. LaTeX optimizes for typesetting.
          Word processors optimize for interactive editing. None of these tools
          are intrinsically flawed, but they each embed a particular judgment
          about what writing is. A system intended for substantial technical work
          needs to handle writing as both <em>text</em> and <em>structure</em>.
        </paragraph>

        <blockquote>
          <paragraph>
            The problem is not merely choosing a format. It is choosing the
            vocabulary in which a document is allowed to exist while it is still
            being thought.
          </paragraph>
        </blockquote>

        <paragraph>
          When a document is small, authors can tolerate weak structure because the
          whole work remains mentally tractable. As the document grows, local
          shortcuts become global liabilities. Repeated manual formatting,
          inconsistent headings, improvised callouts, and fragile cross-cutting
          edits all compound. What looked like a convenient text format at the
          beginning becomes a coordination problem by the middle of the draft.
        </paragraph>

        <list>
          <item>
            <paragraph>
              A practical authoring model must keep content semantics explicit even
              while the draft is incomplete.
            </paragraph>
          </item>
          <item>
            <paragraph>
              A practical rendering model must permit multiple outputs without
              requiring content rewrites.
            </paragraph>
          </item>
          <item>
            <paragraph>
              A practical template model must let authors design layout without
              descending into backend-specific ceremony too early.
            </paragraph>
          </item>
        </list>
      </section>

      <section title="Design Goals">
        <paragraph>
          The system described here is guided by a small set of design goals.
          First, content should be authored as semantic components rather than as
          style instructions. Second, templates should be authored as their own
          React scope so that layout is programmable but does not contaminate the
          meaning of the content tree. Third, the renderer should normalize both
          scopes into intermediate trees before any backend-specific compilation
          happens.
        </paragraph>

        <paragraph>
          This design naturally encourages a pipeline where a content component is
          first turned into semantic IR, a template component is turned into
          template IR, and the two are joined through explicit slots such as
          title, author, abstract, and body. The backend then compiles a resolved
          render tree instead of directly traversing arbitrary JSX at the moment
          of output.
        </paragraph>

        <section title="Desired Authoring Properties">
          <list ordered>
            <item>
              <paragraph>
                The author should be able to use normal React composition for
                repeated content patterns.
              </paragraph>
            </item>
            <item>
              <paragraph>
                The template author should be able to design custom layouts with
                built-in primitives such as <code>page</code>, <code>stack</code>,
                <code>box</code>, and <code>slot</code>.
              </paragraph>
            </item>
            <item>
              <paragraph>
                Advanced extension points should exist, but they should not be
                required for the default writing workflow.
              </paragraph>
            </item>
          </list>
        </section>
      </section>

      <section title="Architecture">
        <paragraph>
          The system’s architecture revolves around a deliberate split between
          content and template. Content is authored with document primitives such
          as <code>document</code>, <code>section</code>, <code>paragraph</code>, and
          inline formatting primitives. Template is authored with page and layout
          primitives. The renderer does not immediately emit HTML or LaTeX from
          JSX. Instead it builds normalized internal trees and only later
          compiles them into concrete output.
        </paragraph>

        <paragraph>
          This distinction is not cosmetic. It is what makes the system usable for
          both experimentation and final output. Once the content tree is
          normalized, the same document can flow through an HTML preview backend
          for fast feedback and a LaTeX backend for final PDF production. The
          author does not have to manually rewrite the document to change its
          venue or format.
        </paragraph>

        <section title="Renderer Pipeline">
          <paragraph>
            A minimal renderer pipeline contains four conceptual phases. The first
            phase executes the content React tree. The second executes the
            template React tree. The third resolves semantic regions into
            template slots. The fourth compiles the resolved result into a
            backend-specific representation. Each phase narrows ambiguity rather
            than increasing it.
          </paragraph>

          <list ordered>
            <item>
              <paragraph>
                Content tree to semantic IR.
              </paragraph>
            </item>
            <item>
              <paragraph>
                Template tree to template IR.
              </paragraph>
            </item>
            <item>
              <paragraph>
                Semantic regions to resolved render tree.
              </paragraph>
            </item>
            <item>
              <paragraph>
                Resolved render tree to HTML, LaTeX, or PDF.
              </paragraph>
            </item>
          </list>
        </section>
      </section>

      <section title="Why React Helps">
        <paragraph>
          React is useful here not because documents are user interfaces in the
          usual sense, but because React already solves several problems that
          structured documents also face. It supports composition, conditional
          inclusion, reusable abstractions, and a strong mental model for nested
          trees. Authors can build helper components for recurring rhetorical
          structures in the same way that application developers build helper
          components for recurring interface patterns.
        </paragraph>

        <paragraph>
          A document written in this model is also a TypeScript program. That means
          content can vary based on command-line flags, data files, or build-time
          conditions. A draft can include working notes. A supervisor build can
          include additional sections. An appendix can be generated from results
          produced elsewhere in the codebase. This flexibility is not the only
          reason to use React, but it is a powerful one.
        </paragraph>

        <blockquote>
          <paragraph>
            The value of using React is not that documents should behave like apps.
            It is that large documents benefit from being authored in a system
            that already understands composition and controlled variation.
          </paragraph>
        </blockquote>
      </section>

      <section title="Academic Fit">
        <paragraph>
          Although the long-term aim is to support generic document generation,
          academic articles and thesis writing are a strong early target. They
          demand a balance of structure, compositional reuse, and backend
          quality. A useful academic authoring system must support durable
          sectioning, reliable prose formatting, quotation, lists, code-like
          emphasis, and eventually richer structures such as figures, tables, and
          citations.
        </paragraph>

        <paragraph>
          The present primitive set does not yet constitute a full academic
          toolkit. However, it is now expressive enough to begin writing prose
          that resembles a real paper rather than a toy example. This matters
          because architecture is most honestly evaluated when used under the
          pressure of actual writing, not only under isolated renderer tests.
        </paragraph>
      </section>

      <section title="Limitations and Future Work">
        <paragraph>
          Several limitations remain. The current system does not yet include
          figures, tables, footnotes, citations, or mathematical block
          structures. The style surface is still intentionally narrow, and the
          LaTeX backend only maps a small subset of document design features.
          Template extensibility exists, but it should remain an advanced tool
          rather than the ordinary path for authors.
        </paragraph>

        <paragraph>
          Future work should focus on expanding the primitive set in a way that
          preserves generic document value while serving academic writing well.
          Immediate candidates include code blocks, figures, tables, and
          footnotes. Beyond that, bibliography handling and more expressive
          cross-reference systems become important.
        </paragraph>
      </section>

      <section title="Conclusion">
        <paragraph>
          A React-based document engine offers a compelling middle path between
          markdown minimalism and direct LaTeX authoring. By splitting content
          and template into distinct React scopes, normalizing them into
          intermediate trees, and compiling from a resolved render model, the
          system can provide stronger semantics without losing programmability.
          The result is not just a new syntax for writing articles, but a more
          deliberate model for how large technical documents are authored,
          transformed, and published.
        </paragraph>

        <paragraph>
          If the architecture continues to scale under real writing pressure, then
          ReactDoc has a plausible path toward becoming a genuinely useful tool
          for academic articles, theses, and other structured long-form work.
        </paragraph>
      </section>
    </document>
  );
}
