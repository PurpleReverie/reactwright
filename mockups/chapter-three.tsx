import "reactdoc/jsx";

// Chapter Three — novel chapter, two-sided book.
// Exercises: twoSided page, mirror anchors (top-inside / top-outside),
// auto-set running strings from chapter title, dropCap on opener, role
// rules for dialogue/scene-heading, breakBefore="recto" on chapter start,
// declarative <font>.

export function Template() {
  return (
    <page
      page={{ size: "a5", margin: "18mm", twoSided: true }}
      typography={{ fontFamily: "'Lora', Georgia, serif", fontSize: "10pt", lineHeight: 1.55 }}
    >
      <font
        family="Lora"
        src="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&display=swap"
      />

      <rules>
        <role
          on="section"
          match="chapter"
          apply="chapter"
          breakBefore="recto"
        />
        <role
          on="paragraph"
          match="opener"
          apply="opener"
          dropCap={{ lines: 3, font: "'Lora', serif" }}
        />
        <role on="quote" match="dialogue" apply="dialogue" />
        <role on="section" match="scene-heading" apply="sceneHeading" />
      </rules>

      <header anchor="top-outside" when="not-first-page">
        <running name="chapter-title" />
      </header>
      <header anchor="top-inside" when="not-first-page">
        <running name="document-title" />
      </header>
      <footer anchor="bottom-outside">
        <page-number />
      </footer>

      <stack gap="0">
        <region>
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}

export default function ChapterThree() {
  return (
    <document title="The Saltmarsh Letters" author="Adair Wren">
      <section role="chapter" title="Chapter Three: The Tide's Argument">
        <p role="opener">
          Mhairi had been waiting in the boathouse for the better part of an hour
          before she understood that no one was coming. The tide was already at the
          step, and the lamps along the seawall had begun the slow conversation
          they had every evening with the wind, blinking and recovering and
          blinking again.
        </p>

        <p>
          She did not move. She had made a habit, lately, of staying where she had
          been told to stay, even after the reason for staying had clearly gone
          home for the night. The habit was a kind of argument she was having with
          herself about whether she was the sort of person things happened to or
          the sort who let them.
        </p>

        <section role="scene-heading" title="Later, in the Long Room">
          <p>
            The Long Room was empty in the way that rooms are empty when something
            has just left them. The fire was still warm, the bottle still uncorked,
            and the chair her grandfather had once owned had been pushed back from
            the table at the same hurried angle as always.
          </p>

          <quote role="dialogue" speaker="THE STEWARD">
            <p>You're late, miss.</p>
          </quote>

          <quote role="dialogue" speaker="MHAIRI">
            <p>I'm exactly when I said I would be. It's everyone else that's early.</p>
          </quote>

          <p>
            He did not answer this, which was his way of agreeing without admitting
            it. She crossed to the table and stood near enough to the fire that the
            seams of her coat began to give up the rain they had been carrying for
            the last three miles.
          </p>
        </section>

        <section role="scene-heading" title="The Letter">
          <p>
            The letter was where she had been told it would be — under the brass
            paperweight shaped like a heron, in the second drawer of the writing
            desk. It was addressed to her in her grandfather's hand, which was
            impossible.
          </p>

          <quote role="dialogue" speaker="MHAIRI">
            <p>How long has this been here?</p>
          </quote>

          <quote role="dialogue" speaker="THE STEWARD">
            <p>
              Long enough. He left instructions that you should have it the
              evening the tide returned to the step. We have been waiting on the
              weather.
            </p>
          </quote>

          <p>
            She slit the seal with a thumbnail and unfolded the page, and the
            margin filled with that careful sloping script she had not seen since
            she was twelve years old, and which she had thought she had finally
            stopped looking for.
          </p>
        </section>
      </section>
    </document>
  );
}
