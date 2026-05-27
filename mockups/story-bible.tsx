import "reactdoc/jsx";

import { resolve } from "node:path";

const DIAGRAM = resolve(process.cwd(), "tests/fixtures/reactdoc-diagram.svg");

// Story Bible — tests three distinct page regimes routing in one document.
//
//   <page-set name="chapter">  — A5 two-sided novel pages with running head,
//                                page numbers, Lora serif, drop caps
//   <page-set name="portrait"> — A5 full-bleed plate pages, no margins, no
//                                chrome, image fills the entire page
//   <page-set name="script">   — A5 screenplay pages with Courier-style face,
//                                wider margins, no running header
//
// Content sections route to a regime via page="<name>". Adjacent sections
// targeting different regimes get an automatic page break, so the bible
// alternates: prose → portrait plate → prose → script scene → prose.

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
      <font
        family="JetBrains Mono"
        src="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
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
        <role
          on="figure"
          match="plate"
          apply="plate"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "calc(100vh - 1px)",
            margin: 0,
            padding: 0
          }}
        />
      </rules>

      <page-set
        name="chapter"
        style={{ size: "a5", margin: "18mm" }}
      >
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
      </page-set>

      <page-set
        name="portrait"
        style={{ size: "a5", margin: "0", backgroundColor: "#0f172a" }}
      >
        <stack gap="0">
          <region>
            <slot name="body" />
          </region>
        </stack>
      </page-set>

      <page-set
        name="script"
        style={{ size: "a5", margin: "22mm", marginLeft: "30mm" }}
      >
        <footer anchor="bottom-center">
          — <page-number /> —
        </footer>

        <stack gap="0" style={{ fontFamily: "'JetBrains Mono', Menlo, monospace", fontSize: "9pt", lineHeight: 1.4 }}>
          <region>
            <slot name="body" />
          </region>
        </stack>
      </page-set>
    </page>
  );
}

export default function StoryBible() {
  return (
    <document title="The Saltmarsh Letters: Story Bible" author="Adair Wren">
      <section page="chapter" role="chapter" title="Prologue: The First Letter">
        <p role="opener">
          The letter was waiting for Mhairi when the tide returned to the step,
          as she had been told it would be. The boathouse light was already on,
          though no one had come to light it. The brass paperweight in the
          shape of a heron sat squarely on top of the page, as if to hold it
          against a wind that had not yet started.
        </p>

        <p>
          She had been told to expect this for eleven years. She had been told
          by a man who would not, by then, have been alive to deliver the
          letter himself. That fact was the entire premise of the letter, and
          the entire premise of the story that followed, and the reason this
          story bible exists.
        </p>

        <p>
          What follows is the working compendium for <em>The Saltmarsh
          Letters</em> — a novel-in-progress, a film adaptation in early
          development, and a small collection of reference images and scene
          extracts intended for the writing room. The bible is not chronological.
          It alternates between the prose that constitutes the novel proper, the
          plate images that anchor each major character or location, and the
          script excerpts that have been written for the adaptation. Each kind
          of material is set in its own typographic register so that the
          reader of the bible can tell at a glance whether they are reading
          fiction, looking at reference, or working from the screenplay.
        </p>
      </section>

      <section page="portrait" title="">
        <figure role="plate" src={DIAGRAM} alt="Reference plate of the lighthouse keeper's quarters at dusk" />
      </section>

      <section page="chapter" role="chapter" title="Chapter One: The Boathouse">
        <p role="opener">
          Mhairi had been waiting in the boathouse for the better part of an
          hour before she understood that no one was coming. The tide was
          already at the step, and the lamps along the seawall had begun the
          slow conversation they had every evening with the wind, blinking
          and recovering and blinking again.
        </p>

        <p>
          She did not move. She had made a habit, lately, of staying where
          she had been told to stay, even after the reason for staying had
          clearly gone home for the night. The habit was a kind of argument
          she was having with herself about whether she was the sort of
          person things happened to or the sort who let them.
        </p>

        <p>
          The wind off the marsh was the kind that has weather in it without
          actually being weather — a thickening of the air, an early
          conversation between dampness and decision. She sat on the stone
          bench beside the lamp and waited, and the longer she waited the
          more certain she became that the wait itself was the point.
        </p>

        <p>
          The lamp at the far end of the seawall went out and then came back
          on. A bird that she could not name and would not learn the name of
          for another six years made a small comment somewhere in the reeds.
          Eventually she stood. She walked the seawall back to the village
          without hurrying, because hurrying would have been an admission
          about why she had come.
        </p>
      </section>

      <section page="chapter" role="chapter" title="Chapter Two: The Long Room">
        <p role="opener">
          The Long Room was empty in the way that rooms are empty when
          something has just left them. The fire was still warm, the bottle
          still uncorked, and the chair her grandfather had once owned had
          been pushed back from the table at the same hurried angle as
          always. Mhairi closed the door behind her gently, as one closes
          the door to a room one is about to interrupt.
        </p>

        <p>
          The Steward was at the window. He did not turn when she came in,
          which was the most respectful thing he could have done. After a
          long minute he said, without turning, that the tide had returned
          to the step and the letter was where her grandfather had said it
          would be. She did not ask how he had known. Her grandfather had
          told him; her grandfather had also told her, but she had been
          twelve years old and unable to hold the instruction.
        </p>

        <p>
          The Steward poured her a small glass of the brandy in the
          uncorked bottle and set it on the table beside the heron
          paperweight. He had positioned the glass, she noticed, at the
          precise distance from the page at which a person could read
          without having to hold the page open. The Steward was a man whose
          attention to particulars survived almost any other change in him.
        </p>
      </section>

      <section page="script" role="scene-heading" title="SCRIPT EXCERPT — INT. THE LONG ROOM — DUSK">
        <p>
          The same scene, from the working adaptation by Halloran &amp; Vance
          (revised second draft, March). Not to be confused with the novel
          version above; the screenplay condenses the moment considerably and
          gives the Steward a line that does not appear in the prose.
        </p>

        <p>
          The Long Room. Empty. The fire is still going. The Steward stands at
          the window. MHAIRI enters and closes the door behind her with care.
          The camera holds on the door for a beat after she has crossed the
          room.
        </p>

        <quote role="dialogue" speaker="THE STEWARD">
          <p>You're late, miss.</p>
        </quote>

        <quote role="dialogue" speaker="MHAIRI">
          <p>
            I'm exactly when I said I would be. It's everyone else
            that's early.
          </p>
        </quote>

        <p>
          He does not answer this, which is his way of agreeing without
          admitting it. She crosses to the table and stands near enough to
          the fire that the seams of her coat begin to give up the rain
          they have been carrying for the last three miles.
        </p>

        <quote role="dialogue" speaker="THE STEWARD">
          <p>
            (without turning)
            <br />
            The tide came back to the step at four. The letter has been
            there since.
          </p>
        </quote>

        <quote role="dialogue" speaker="MHAIRI">
          <p>How long has it been there in total.</p>
        </quote>

        <quote role="dialogue" speaker="THE STEWARD">
          <p>
            Eleven years, miss. Less the eight hours between the writing
            and the leaving.
          </p>
        </quote>

        <p>
          She accepts this. She walks to the writing desk in the corner of
          the room and slides the second drawer open with her thumbnail. The
          letter is there, under the brass paperweight, addressed to her in
          her grandfather's hand. The Steward turns at last, and the scene
          ends on the moment of his turning rather than on the moment of her
          opening the envelope.
        </p>
      </section>

      <section page="portrait" title="">
        <figure role="plate" src={DIAGRAM} alt="Reference plate of the long room at the moment of the steward's turn" />
      </section>

      <section page="chapter" role="chapter" title="Chapter Three: The Letter">
        <p role="opener">
          The letter was where she had been told it would be — under the
          brass paperweight shaped like a heron, in the second drawer of the
          writing desk. It was addressed to her in her grandfather's hand,
          which was impossible, and yet it was undeniably his hand: the
          slight backward slope on the lowercase d, the careful loop on the
          terminal g. She had spent half her childhood watching that hand
          write things on the same kind of paper, in the same kind of ink,
          in the same kind of light.
        </p>

        <p>
          She slit the seal with a thumbnail and unfolded the page. The
          margin filled, line by line, with the script she had not seen in
          eleven years, and which she had thought she had finally stopped
          looking for. The letter was three pages long. The first page was
          dated; the date was the morning of the day he had died.
        </p>

        <p>
          She did not read it standing up. She sat in the chair her
          grandfather had once owned, at the table he had once written at,
          in the room he had once kept the fire going in, and she read the
          letter through twice before she folded it again and returned it
          to its envelope and placed it on the table beside the brandy that
          the Steward had poured for her at the proper distance to do
          exactly this.
        </p>

        <p>
          The Steward, at the window, said nothing. The wind outside the
          Long Room finally began to be weather, and the rain on the
          windowpanes started a conversation it would not finish for
          another seventy-two hours.
        </p>
      </section>

      <section page="chapter" role="chapter" title="Coda: What She Did Next">
        <p role="opener">
          What Mhairi did next — the journey she undertook on the strength of
          the letter, the seventeen people she had to find, the second letter
          she eventually wrote in answer to the first — is the substance of
          the remaining chapters of the novel. The film adaptation, by
          contrast, condenses the journey into its central act and keeps the
          letter itself as the structural device throughout.
        </p>

        <p>
          What follows in this bible are the reference plates for each major
          character and location, the script extracts that the writing room
          has approved, and a small set of notes for the production designer
          on the colour palette of the saltmarsh in the late autumn.
        </p>
      </section>
    </document>
  );
}
