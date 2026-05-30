import "reactwright/jsx";

// Field Notes — Tufte-style essay with sidenotes in the outside margin.
// Exercises: <sidenote> + <sidenote-area>, <defs>/<def>, <ref>, <toc>,
// <index>, dropCap on opener paragraphs, declarative <font>.

export function Template() {
  return (
    <page
      page={{ size: "a4", margin: "30mm", marginRight: "60mm" }}
      typography={{ fontFamily: "'Source Serif Pro', Georgia, serif", fontSize: "11pt", lineHeight: 1.5 }}
    >
      <font
        family="Source Serif Pro"
        src="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,400;0,700;1,400&display=swap"
      />

      <rules>
        <role
          on="paragraph"
          match="opener"
          apply="opener"
          dropCap={{ lines: 3, font: "Georgia, serif" }}
        />
        <role on="defs" match="glossary" apply="glossary" />
      </rules>

      <header anchor="top-outside" when="not-first-page">
        <running name="section-title" />
      </header>
      <footer anchor="bottom-outside">
        <page-number />
      </footer>

      <sidenote-area side="right" width="45mm" gap="6mm" />

      <stack gap="6mm">
        <region style={{ paddingBottom: "4mm", borderBottom: "1px solid #cbd5e1" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        <region>
          <slot name="abstract" />
        </region>

        <region>
          <toc title="Contents" depth={2} />
        </region>

        <region>
          <slot name="body" />
        </region>

        <region style={{ borderTop: "1px solid #cbd5e1", paddingTop: "4mm" }}>
          <index title="Index" />
        </region>
      </stack>
    </page>
  );
}

export default function FieldNotes() {
  return (
    <document title="Field Notes from the Margins" author="E. Whitcombe">
      <abstract>
        <p>
          A note on the practice of carrying notes in the margin. The essay form,
          properly understood, is a conversation between two columns: the main
          argument and the second voice that watches it skeptically.
        </p>
      </abstract>

      <section title="The Margin as Instrument">
        <p role="opener">
          Tufte's design treats the wide outer margin not as wasted paper but as a
          second column for the apparatus
          <sidenote>Sources, asides, contrary readings, definitions of terms in transit.</sidenote>
          {" "}of the main argument. The body holds the claim; the margin holds the
          machinery.
        </p>

        <p>
          In conventional layouts the apparatus retreats to the bottom of the page,
          where it competes with itself for attention. By moving it laterally the
          designer admits that footnotes<index term="footnote" /> were never really at
          the foot of anything — they were always trying to be adjacent.
        </p>

        <p>
          Sidenotes<index term="sidenote" /> are also a discipline. The writer who must
          fit each note in a finite margin learns to compress
          <sidenote>One sentence, sometimes two; never a paragraph.</sidenote>
          {" "}rather than expand, and the reader is repaid for it.
        </p>
      </section>

      <section title="A Working Vocabulary">
        <p>
          Three terms recur in essays of this kind and benefit from definition.
        </p>

        <defs role="glossary">
          <def term="Sidenote">
            <p>
              A short remark, anchored at a point in the body text but typeset in
              the margin alongside it
              <sidenote>Margins are themselves a kind of meta-typography: they say what the layout is willing to admit but not commit to.</sidenote>
              {" "}rather than below.
            </p>
          </def>
          <def term="Marginalia">
            <p>
              The full set of marginal materials in a document: sidenotes, gloss
              numbers<index term="gloss" />, decorative ornaments<index term="ornament" />,
              and references like <ref to="margin-as-instrument" />.
            </p>
          </def>
          <def term="Apparatus">
            <p>
              The scholarly term for everything that isn't the primary text:
              citations<index term="citation" />, variants, commentary, indices.
            </p>
          </def>
        </defs>
      </section>

      <section id="margin-as-instrument" title="Why It Holds Up">
        <p role="opener">
          Reading across two columns is a different cognitive act than reading down
          one. The eye learns to triangulate, the writer learns to alternate
          registers, and the document gains a second voice it could not afford in a
          single-column layout.
        </p>

        <p>
          That second voice is what makes the margin worth keeping wide. Anything
          less and the apparatus collapses back into footnotes — which is to say,
          back into hiding.
        </p>
      </section>
    </document>
  );
}
