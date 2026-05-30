import "reactwright/jsx";

import { resolve } from "node:path";

const SWATCH_PATH = resolve(process.cwd(), "tests/fixtures/reactwright-diagram.svg");

// Treatise — academic paper mockup.
// Exercises: abstract, sections with ids, figures with auto-numbered captions
// (via role+numbering), <ref> cross-references, <cite> + <bibliography>,
// <footnote> + <footnote-area>, inline+block <math>/<m>, <list-of>, <toc>.

export function Template() {
  return (
    <page
      page={{ size: "a4", margin: "25mm" }}
      typography={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "11pt", lineHeight: 1.45 }}
    >
      <rules>
        <role on="section" match="appendix" apply="appendix" breakBefore="page" />
        <role
          on="figure"
          match="numbered"
          apply="numberedFigure"
          numbering={{ counter: "figure", scope: "chapter", format: "Figure $figure" }}
        />
        <role
          on="math"
          match="numbered"
          apply="numberedEquation"
          numbering={{ counter: "equation", format: "($equation)" }}
        />
      </rules>

      <header anchor="top-center" when="not-first-page">
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center">
        <page-number /> / <page-count />
      </footer>

      <footnote-area />

      <stack gap="6mm">
        <region style={{ textAlign: "center", paddingBottom: "4mm", borderBottom: "1px solid #cbd5e1" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        <region style={{ padding: "3mm", backgroundColor: "#f8fafc" }}>
          <slot name="abstract" />
        </region>

        <region>
          <toc title="Contents" depth={2} />
        </region>

        <region>
          <list-of of="figure" title="List of Figures" />
        </region>

        <region>
          <slot name="body" />
        </region>

        <region>
          <bibliography title="References" />
        </region>
      </stack>
    </page>
  );
}

export default function Treatise() {
  return (
    <document title="On the Construction of Self-Documenting Documents" author="L. M. Cartwright">
      <abstract>
        <p>
          We present a framework for documents that describe themselves: sections that
          number their own figures, references that resolve their own page numbers,
          and bibliographies that know which entries were cited. The approach
          generalises classical hypertext<footnote>The term was coined by Ted Nelson in 1965.</footnote>
          to fixed-page output via Paged Media.
        </p>
      </abstract>

      <section id="intro" title="Introduction">
        <p>
          The problem of cross-reference resolution in paginated documents has a long
          lineage <cite cite="knuth1984" />. Earlier approaches relied on multi-pass
          compilation; we follow that tradition but lift the second pass into the
          browser, where CSS Generated Content for Paged Media exposes
          <m src={"\\text{target-counter}(\\text{url}, n)"} /> as a first-class primitive.
        </p>

        <p>
          The contribution of this work is twofold. First, a typed primitive surface
          that authors can target without writing CSS. Second, a resolver that stamps
          stable identifiers onto every referable node so that <ref to="fig-flow" /> can
          be written before the figure exists.
        </p>

        <p role="numbered">
          See <ref to="fig-flow" show="number-and-page" /> for the full flow.
        </p>
      </section>

      <section id="background" title="Background">
        <p>
          Classical information theory <cite cite="shannon1948" /> bounds the channel
          capacity of any encoding. For document encoding the channel is the printed
          page, whose capacity per square centimetre is invariant under the choice of
          markup language but depends critically on typography.
        </p>

        <figure
          id="fig-flow"
          role="numbered"
          src={SWATCH_PATH}
          caption="Pipeline overview from React content to paginated HTML to PDF."
          width="80mm"
        />

        <p>
          Consider the channel as defined by the page geometry. The available capacity
          per page satisfies the inequality
        </p>

        <math
          id="eq-capacity"
          role="numbered"
          src={"C = W \\log_2 \\left( 1 + \\frac{S}{N} \\right)"}
        />

        <p>
          where <m src="W" /> is the printable width, <m src="S/N" /> the typeface-to-leading
          ratio, and <m src="C" /> the achievable characters per page. Equation
          <ref to="eq-capacity" /> is presented for illustration and is not strictly
          analogous, but the analogy holds for our purposes <cite cite="turing1950" />.
        </p>
      </section>

      <section id="method" title="Method">
        <p>
          The implementation operates in three stages. The content reconciler
          produces a semantic IR; the template reconciler produces a layout IR; the
          resolver joins them and emits paginated HTML for Paged.js to render.
        </p>

        <p>
          Critically, references are not resolved at compile time. The compiler emits
          an anchor pair: the source carries a stable <code>id</code>, the reference
          carries a <code>href</code>. The browser fills in counters via
          <m src={"\\text{target-counter}"} /> at render time. This decouples the order
          of authorship from the order of resolution.
        </p>
      </section>

      <section id="appendix-a" role="appendix" title="Appendix A. Notation">
        <p>
          Throughout this paper, we use H<sub>2</sub>O and x<sup>2</sup> in the obvious way,
          and superscript footnote markers<footnote>Symbols are auto-numbered unless overridden.</footnote>
          as standard.
        </p>
      </section>

      <refs>
        <ref-entry refKey="shannon1948">
          Shannon, C. E. (1948). A Mathematical Theory of Communication.
          <em>Bell System Technical Journal</em>, 27(3), 379–423.
        </ref-entry>
        <ref-entry refKey="turing1950">
          Turing, A. M. (1950). Computing Machinery and Intelligence.
          <em>Mind</em>, 59(236), 433–460.
        </ref-entry>
        <ref-entry refKey="knuth1984">
          Knuth, D. E. (1984). <em>The TeXbook</em>. Addison-Wesley.
        </ref-entry>
      </refs>
    </document>
  );
}
