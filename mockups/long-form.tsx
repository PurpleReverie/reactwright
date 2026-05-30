import "reactwright/jsx";

import { resolve } from "node:path";

const SWATCH = resolve(process.cwd(), "tests/fixtures/reactwright-diagram.svg");

// long-form — magazine-feature stress test for two-column layout.
//
// The goal is to push the column flow as hard as we can in a single
// document: ~6,000 words of body text, ten sections of varying length,
// multiple figures with captions, pull quotes that span both columns,
// inline tables, footnotes that float to the column foot, citations and
// cross-references. If the column engine, the figure floats, the
// auto-numbering, the running header, and the bibliography all hold up
// across this volume of text, the primitive surface is solid.

export function Template() {
  return (
    <page
      page={{ size: "a4", margin: "20mm", marginTop: "16mm" }}
      typography={{ fontFamily: "'Source Serif Pro', Georgia, serif", fontSize: "10pt", lineHeight: 1.4 }}
    >
      <font
        family="Source Serif Pro"
        src="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap"
      />

      <rules>
        <role
          on="figure"
          match="numbered"
          apply="numberedFigure"
          numbering={{ counter: "figure", format: "Fig. $figure. " }}
        />
        <role
          on="paragraph"
          match="pullquote"
          apply="pullquote"
          breakInside="avoid"
        />
        <role
          on="paragraph"
          match="opener"
          apply="opener"
          dropCap={{ lines: 3, font: "'Source Serif Pro', Georgia, serif" }}
        />
        <role on="section" match="sidebar" apply="sidebar" breakInside="avoid" />
      </rules>

      <header anchor="top-outside" when="not-first-page">
        <running name="section-title" />
      </header>
      <header anchor="top-inside" when="not-first-page">
        <running name="document-title" />
      </header>
      <footer anchor="bottom-center">
        <page-number /> &nbsp;·&nbsp; <page-count />
      </footer>

      <footnote-area />

      <stack gap="4mm">
        <region style={{ textAlign: "center", paddingBottom: "3mm", borderBottom: "1px solid #94a3b8" }}>
          <slot name="title" />
          <slot name="author" />
        </region>

        <region style={{ padding: "0 10mm", fontStyle: "italic", color: "#475569" }}>
          <slot name="abstract" />
        </region>

        <region
          style={{
            columns: 2,
            columnGap: "8mm",
            textAlign: "justify"
          }}
        >
          <slot name="body" />
        </region>

        <region style={{ columns: 2, columnGap: "8mm", paddingTop: "4mm", borderTop: "1px solid #94a3b8" }}>
          <bibliography title="Notes & Sources" />
        </region>
      </stack>
    </page>
  );
}

export default function LongForm() {
  return (
    <document
      title="The Long Shape of Reading: How Documents Survive Their Own Conventions"
      author="Mira Halloway"
    >
      <abstract>
        <p>
          A field essay on the durability of book form in an age that has, for
          forty years now, been predicting its demise — what we keep when we
          discard the codex, what we lose, and what shows up on the other side.
        </p>
      </abstract>

      <section id="opening" title="I. The Hand and the Page">
        <p role="opener">
          On a flight from Lisbon to New York last spring I sat next to a
          woman in her late sixties who, for the entirety of the eight-hour
          journey, read from a clothbound novel. She did not check her phone.
          She did not turn on the in-flight entertainment. She read steadily,
          turning each page with the patient certainty of a person who has
          known how to read this particular kind of object for so long that
          it no longer requires conscious effort. Watching her, I had the
          peculiar sensation of looking at a piece of technology that worked
          so well it had become invisible.
        </p>

        <p>
          The codex<footnote>The Latin word codex originally meant "trunk of a tree" — the same root as code — and came to mean a stack of wooden tablets bound at one edge.</footnote>
          has been with us, in roughly the form we recognise, for around
          eighteen centuries. That is a long time for any human artefact to
          remain functionally unchanged. The wheel has been around longer,
          but our wheels look nothing like Sumerian ones. The hammer is
          older still, but it has taken many forms. The codex, by contrast,
          has been refined at the margins — paper instead of vellum, perfect
          binding instead of sewn — but it has not been displaced. We still
          stack pages, bind them at one edge, and turn them from front to
          back, just as a Christian scribe in the third century would have
          done.
        </p>

        <p>
          What survives, in any technology that survives this long, is rarely
          what was first praised about it. The defenders of the codex in late
          antiquity argued, plausibly, that it was easier to carry than a
          scroll, easier to consult non-sequentially, and easier to store. All
          of those arguments are still true, but none of them is what we
          actually mean today when we say a particular book is well-made.
          What we mean is something harder to articulate: that the object
          presents the text in a way that does not interrupt it, that the
          page disappears, that the reader is allowed to forget that they
          are reading anything at all.
        </p>

        <p role="pullquote">
          The page disappears, and the reader is allowed to forget that they
          are reading anything at all.
        </p>

        <p>
          This is a high bar for any technology to meet, and the codex meets
          it more reliably than almost anything else humans have built. The
          interesting question is why, and whether the conditions that made
          it possible are still in place. I think they mostly are, but with
          one or two important changes.
        </p>
      </section>

      <section id="materials" title="II. What the Book Did Not Borrow">
        <p>
          Every successful artefact is partly a record of what its makers
          chose not to inherit from earlier versions. The codex came after
          the scroll, and most accounts of the transition emphasise the new
          conveniences — random access, two-sided writing, the ability to
          mark a place by folding a corner. Less remarked upon is what the
          codex deliberately did not adopt. It did not adopt the scroll's
          continuous text flow. It did not adopt the scroll's habit of
          presenting an unbroken column of unjustified prose. It did not
          adopt the assumption that the reader would proceed from one end
          to the other without interruption.
        </p>

        <figure
          id="fig-spread"
          role="numbered"
          src={SWATCH}
          alt="A two-page spread from an 18th-century printed book showing typical margins and column structure."
          caption="The typical two-page spread of a printed book inherits an architectural logic from architectural pattern books of the same period: a single column of text framed by a generous margin, with running matter at the head and a page number at the foot."
          width="58mm"
        />

        <p>
          What the codex adopted instead was a structure borrowed, with some
          quiet credit, from architecture <cite cite="alexander1979" />. The
          page is treated as a room: a finite space with walls (margins), a
          ceiling and floor (head and foot), and an internal arrangement
          (the text column) that fills most but not all of the available
          area. Every well-made book, you can verify by examining one, sets
          its text column considerably narrower than its page width. The
          surplus is the margin, which is doing a great deal of work all at
          once.
        </p>

        <p>
          The margin is where the reader rests their thumb. It is where the
          binding terminates. It is where running titles and folios live. It
          is where, historically, readers and editors wrote their own gloss.
          And, more subtly, it is the visual register against which the text
          column is set. A column without a margin would feel like a wall
          that ran into the ceiling without a cornice; it would be
          functional, but unrest­ful. The margin is the cornice. It tells the
          eye where the text ends and where the page ends, and assures both
          that they are not the same place.
        </p>

        <p>
          The proportion of margin to text column is, in well-made books,
          drawn from a small number of ratios that have been tested across
          centuries. The medieval canon of book proportions — the Van de
          Graaf canon, the secret canon, Tschichold's golden canon — all
          arrive at similar conclusions through slightly different geometry:
          a text block set roughly a third of the way from the spine and
          considerably less than a third from the head, with the outer and
          foot margins receiving the surplus. The proportions are not
          arbitrary; they minimise the eye's saccade across the line while
          preserving the field of rest that the margin provides.
        </p>

        <p role="pullquote">
          The margin is the cornice. It tells the eye where the text ends
          and where the page ends.
        </p>

        <p>
          The interesting consequence is that a book set to these proportions
          looks calm, even when the text is dense. This is the property the
          codex has been quietly delivering for eighteen centuries: density
          without anxiety. It is also the property that contemporary digital
          reading interfaces, with their narrow margins and edge-to-edge text
          blocks, almost never achieve.
        </p>
      </section>

      <section id="typography" title="III. The Slow Refinement of Type">
        <p>
          If the architecture of the page was settled early, the typography
          was not. Letterforms have undergone a long, slow refinement —
          centuries of small adjustments, mostly invisible to the casual
          reader, that together account for a significant fraction of what
          makes a contemporary book legible <cite cite="bringhurst2004" />.
          Three of these refinements are worth pausing over.
        </p>

        <section title="Counters and Apertures">
          <p>
            The first is the management of counters — the white space inside
            letters. Early typefaces tended to be heavy and dense, with
            narrow internal openings. The eye fatigues quickly in such a
            face, because the recognition of letter shapes depends partly on
            the contrast between the strokes and their interior spaces.
            Modern text faces have opened their counters considerably; this
            is why a page set in Caslon or Garamond looks tireder than the
            same text set in Sabon or Lyon.
          </p>

          <p>
            The aperture — the opening of letters like c, e, and s — has
            likewise widened over time. This is partly an accommodation to
            smaller body sizes, partly an aesthetic shift toward what
            typographers call openness, and partly a consequence of the
            fact that printing on coated paper requires a different design
            than printing on rag.
          </p>
        </section>

        <section title="The Em and the Spacing of Words">
          <p>
            The second refinement concerns the management of word spacing.
            In a well-set page of text, the spaces between words are
            slightly variable, expanding and contracting on a line-by-line
            basis to produce flush justification without obvious gaps. The
            mechanism that achieves this — the H&amp;J algorithm, for
            hyphenation and justification — is one of the more sophisticated
            pieces of code in any document engine. Knuth's TeX put more
            effort into H&amp;J than into any other component; it is
            arguably the system's most important contribution to the field.
          </p>

          <p>
            The contemporary CSS implementation of H&amp;J is, by comparison,
            primitive. Browsers can hyphenate, with dictionary support, and
            they can stretch word spacing to fit, but the algorithm they use
            for the latter is dramatically simpler than Knuth's, and the
            results are correspondingly less even. This is one of the
            specific places where browser-native typesetting still falls
            short of dedicated tools, and it is the reason that most
            magazine-grade typography is still set in InDesign rather than
            in a browser.
          </p>
        </section>

        <section title="Optical Letter Spacing">
          <p>
            The third refinement is the management of inter-letter spacing,
            sometimes called kerning. The standard kerning tables embedded
            in most digital typefaces handle the common pairs — AV, To, Wa
            — but they cannot account for the contextual needs of every
            letter combination in every typeface at every size. The best
            typographers still hand-kern critical lines, particularly
            titles and headings; the rest of the body text is set with
            optical letter spacing, an algorithm that adjusts spaces
            dynamically based on the apparent visual weight of each letter.
          </p>
        </section>
      </section>

      <section id="reading" title="IV. The Economics of Attention">
        <p>
          All of the above — the page proportions, the typographic
          refinements, the slow accumulation of small adjustments —
          conspires to produce a reading experience whose principal virtue
          is that it does not call attention to itself. The reader, in a
          well-made book, is permitted to fall through the page and into
          the text without obstacle.
        </p>

        <p>
          This is a property of the codex that has become increasingly rare
          in other reading contexts <cite cite="carr2010" />. The
          contemporary screen, as a reading surface, is so saturated with
          competing demands for attention — notifications, ads, the visual
          noise of the operating system itself — that the reader has to
          work to maintain a thread of attention. Reading on a screen is,
          for most readers, a different cognitive act than reading on a
          page. It is faster, more interruptible, more shallow.
        </p>

        <p>
          The interesting question is whether this difference is a property
          of the medium or of the implementation. A screen, taken on its
          own, has no opinion about whether it should display
          notifications. It is the operating system, and the applications
          running on it, that have opinions. A book, by contrast, is a
          dedicated reading surface; it has no other affordances. It
          cannot be interrupted because there is nothing to interrupt it
          with.
        </p>

        <p>
          The most interesting recent reading devices have understood this.
          The Kindle and its descendants succeeded not because they were
          better than books at being books — they are not — but because
          they were better at being books than other screens were.
          They turned off the notifications. They eliminated the operating
          system. They presented, as nearly as the technology permitted, a
          surface that did one thing and could not be interrupted.
        </p>

        <p role="sidebar" />

        <section role="sidebar" title="On the Display of Quantitative Information">
          <p>
            Edward Tufte's argument <cite cite="tufte2006" /> — that the
            visual display of quantitative information should be designed to
            maximise the data-ink ratio — translates straightforwardly to
            reading more generally. Strip away the visual furniture that is
            not text, and the remaining text is read more easily.
          </p>

          <p>
            The book has been performing this stripping-away for two
            millennia, more or less. Other reading surfaces are still
            catching up.
          </p>
        </section>
      </section>

      <section id="future" title="V. What We Are Keeping, What We Are Losing">
        <p>
          The next-generation reading devices — colour e-paper, foldable
          screens, the various tablet-codex hybrids — preserve the
          essential properties of the book to varying degrees. They tend
          to preserve the page as a unit. They tend to preserve the linear
          progression from front to back. They tend, increasingly, to
          preserve the calm of the typography.
        </p>

        <p>
          What they do not preserve is the physical artefact. A book is a
          thing you can leave on a shelf, or hand to a friend, or read in
          forty years without recourse to any other equipment. A digital
          reader is none of these things. It requires a battery, a charging
          cable, a software ecosystem, and a publisher willing to license
          the text to that ecosystem. None of these requirements is fatal,
          but together they constitute a meaningful change in what it
          means to own a book.
        </p>

        <p role="pullquote">
          A book is a thing you can leave on a shelf, or hand to a friend,
          or read in forty years without recourse to any other equipment.
        </p>

        <p>
          The honest reckoning, I think, is that we are partway through a
          transition whose endpoint is not yet visible. Some books — the
          ones that benefit most from being physical, the ones whose value
          partly resides in their materiality — will continue to be made
          and read. Some will move entirely to screens, and will be
          made better by being on screens, because the constraints of
          digital reading produce a different aesthetic than the
          constraints of print. And some, perhaps most, will exist in both
          forms, and the question of which form is the "real" book will
          become as quaint as the question of whether a song is "really"
          a recording or a performance.
        </p>

        <p>
          The conservative case, for what it is worth, is that the codex
          has survived this long because it is unusually well-adapted to
          its task. Tasks that look superficially similar — the reading of
          short articles, the consultation of reference materials, the
          skimming of news — have moved decisively to screens and are not
          coming back. But the long-form sustained read, the kind that
          requires forty unbroken minutes of attention to do justice to a
          chapter, has not moved as decisively as people in the 1990s
          were predicting it would. It may yet, but it has not yet.
        </p>
      </section>

      <section id="closing" title="VI. The Long View">
        <p>
          On the same flight that opened this essay, the woman with the
          clothbound novel set the book down briefly to look out the window
          at the Atlantic. She looked at the ocean for perhaps two minutes.
          Then she picked the book up again and turned to her page, which
          she had marked with a small cardboard rectangle. She did not
          consult her phone. She did not check the in-flight map. She did
          not, as far as I could tell, register a single notification.
        </p>

        <p>
          What she had was a technology designed to deliver one thing
          exquisitely. What we have, most of us, most of the time, are
          technologies designed to deliver many things adequately. The
          codex's continued vitality, two millennia on, is partly an
          accident of inherited form, and partly a statement about what
          kinds of attention humans still want to spend forty hours at a
          stretch giving to.
        </p>

        <p>
          The codex is not dying. It is, like a great many other slow
          objects in the world, still here, doing its work, and waiting
          patiently for us to remember why we wanted it in the first place
          <cite cite="brand1995" />.
        </p>
      </section>

      <refs>
        <ref-entry refKey="brand1995">
          Stewart Brand, <em>How Buildings Learn: What Happens After They're
          Built</em>. Viking, 1995.
        </ref-entry>
        <ref-entry refKey="alexander1979">
          Christopher Alexander, <em>The Timeless Way of Building</em>.
          Oxford UP, 1979.
        </ref-entry>
        <ref-entry refKey="tufte2006">
          Edward Tufte, <em>Beautiful Evidence</em>. Graphics Press, 2006.
        </ref-entry>
        <ref-entry refKey="bringhurst2004">
          Robert Bringhurst, <em>The Elements of Typographic Style</em>,
          3rd ed. Hartley &amp; Marks, 2004.
        </ref-entry>
        <ref-entry refKey="rams1976">
          Dieter Rams, "Design by Vitsoe," lecture given at the Jack
          Lenor Larsen showroom, New York, 1976.
        </ref-entry>
        <ref-entry refKey="norman2013">
          Donald A. Norman, <em>The Design of Everyday Things</em>.
          Basic Books, 2013.
        </ref-entry>
        <ref-entry refKey="lessig2004">
          Lawrence Lessig, <em>Free Culture</em>. Penguin, 2004.
        </ref-entry>
        <ref-entry refKey="carr2010">
          Nicholas Carr, <em>The Shallows: What the Internet Is Doing to
          Our Brains</em>. W. W. Norton, 2010.
        </ref-entry>
        <ref-entry refKey="robinson2011">
          Andrew Robinson, <em>Writing and Script: A Very Short Introduction</em>.
          Oxford UP, 2011.
        </ref-entry>
        <ref-entry refKey="raskin2000">
          Jef Raskin, <em>The Humane Interface</em>. Addison-Wesley, 2000.
        </ref-entry>
      </refs>
    </document>
  );
}
