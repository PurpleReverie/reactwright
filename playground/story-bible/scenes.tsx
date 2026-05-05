import { Dialogue } from "./helpers.js";

export function ScenesSection() {
  return (
    <section title="PROTOTYPE SCENES" page="script">
      <section title="Scene One — The Inland Tide, Before Dawn" role="scene-heading">
        <p>INT./EXT. SURVEY SKIFF — THE INLAND TIDE — BEFORE DAWN</p>
        <p>
          A small wooden skiff on flat, dark water. Fog sitting low. ALDRIC at the
          stern with a depth-line and a wax tablet, recording measurements in a
          grid. He has been awake since the third hour of the night.
        </p>
        <p>
          The water changes. Not visibly at first — just a pressure difference, a
          settling in the air. Then: stillness. Total, wrong stillness. The lapping
          against the hull stops. The fog stops drifting. The depth-line goes slack.
        </p>
        <p>
          Aldric notices his compass needle is spinning. He notices this in the
          detached way of someone who always knows which direction is north, but
          finds it interesting that the instrument does not.
        </p>
        <p>
          Something breaks the surface six feet from the skiff. A flat stone disc,
          roughly the diameter of a cartwheel, engraved with a symbol he has never
          seen — and he has mapped every shoreline on this island. It rises slowly,
          tilts, and stops. Floating perfectly still on water that has no current.
        </p>
        <p>
          He reaches out and touches it. In the half-second before he yanks his hand
          back, he sees: the loch from above, at an altitude that should be
          impossible, and at its centre, something vast and dark and patient shifting
          its weight.
        </p>
        <Dialogue speaker="ALDRIC" direction="(to no one, very quietly)">
          That's not in the survey record.
        </Dialogue>
        <p>
          He picks up the stone. Heavier than it looks. Warmer than the water. He
          wraps it in his survey cloth, stows it under the bench, and picks up his
          oars.
        </p>
        <p>
          The Silence ends. The loch breathes. The fog resumes its drift. Aldric
          rows toward shore with the methodical stroke of someone who has decided not
          to think about something until he is on solid ground.
        </p>
      </section>

      <section title="Scene Two — Threshold Bridge, Midday" role="scene-heading">
        <p>EXT. THRESHOLD BRIDGE — VAEL-MIRREN BORDER — MIDDAY</p>
        <p>
          A narrow stone arch over the river marking the territorial boundary. Old
          enough that the stonework has been repaired in three different styles.
          Signs on each approach: commercial traffic requires a permit. Weapons must
          be peace-bonded.
        </p>
        <p>
          ALDRIC approaches from the north, survey satchel over one shoulder, the
          wrapped stone in his hand. He is watching the ground because he has turned
          his ankle on this bridge before.
        </p>
        <p>
          SENNA approaches from the south, oilskin instrument case, sustained
          controlled irritation. She is watching the horizon because she always is.
        </p>
        <p>They become aware of each other at exactly the midpoint.</p>
        <Dialogue speaker="SENNA">You're a Vael.</Dialogue>
        <Dialogue speaker="ALDRIC" direction="(not stopping)">
          Technically I'm a surveyor. The Vael part is a family disagreement.
        </Dialogue>
        <Dialogue speaker="SENNA">
          The family disagreement is the reason I spent a winter in Mirren's Landing
          eating salted leather.
        </Dialogue>
        <p>
          He stops. She has already stopped. They are four feet apart on a bridge
          not wide enough to pass without one of them stepping aside.
        </p>
        <Dialogue speaker="ALDRIC">I know. I'm the one who reported it.</Dialogue>
        <p>
          She reassesses him. Not warmly — but with the quality of attention that
          means she is updating a model rather than dismissing data.
        </p>
        <Dialogue speaker="SENNA">Why are you crossing into Mirren territory?</Dialogue>
        <Dialogue speaker="ALDRIC">
          I need someone who can date a stone artifact that surfaced during a Silence
          on the Inland Tide this morning.
        </Dialogue>
        <p>
          He holds up the wrapped cloth. The warmth is visible through the fabric —
          a faint, steady heat, like a coal that has forgotten to go out.
        </p>
        <p>Senna looks at it. Then at him. Then she steps aside and gestures south.</p>
        <Dialogue speaker="SENNA">Mirren's Landing. I'll take you.</Dialogue>
        <Dialogue speaker="ALDRIC">You don't need to —</Dialogue>
        <Dialogue speaker="SENNA" direction="(already walking)">
          I know. I'm choosing to.
        </Dialogue>
      </section>

      <section title="Scene Three — The Pale Warden Speaks" role="scene-heading">
        <p>INT. THE PALE WARDEN'S TOWER, ORATH'S GATE — NIGHT</p>
        <p>
          A stone room at the top of a tower not on any map Aldric has drawn.
          Smells of deep water and old paper. The PALE WARDEN is seated at a table
          with a single lamp. He has been waiting. This is apparent.
        </p>
        <p>
          Aldric and Senna enter. The Warden does not stand. He looks at them with
          the unhurried attention of someone who has waited longer for more important
          things.
        </p>
        <Dialogue speaker="THE PALE WARDEN">
          Sit down, please. You've had a long day, and what I have to tell you will
          take some time to understand.
        </Dialogue>
        <p>They do not sit. He does not seem surprised.</p>
        <Dialogue speaker="ALDRIC">You've been working against us for three weeks.</Dialogue>
        <Dialogue speaker="THE PALE WARDEN">Yes.</Dialogue>
        <Dialogue speaker="SENNA">
          The Silences. The artifacts. The Breath failing. You know what's causing
          it.
        </Dialogue>
        <Dialogue speaker="THE PALE WARDEN">
          I've known for three hundred years. The suppression weakens every time the
          island moves closer to unity. It will continue to weaken as long as you do
          what you're doing. The god will wake. The island will not survive it.
        </Dialogue>
        <p>
          He places both hands flat on the table. Not a threat. Something closer to
          showing he has nothing hidden.
        </p>
        <Dialogue speaker="THE PALE WARDEN" direction="(with genuine tiredness)">
          I am not asking you to stop because I want to live. I stopped caring about
          that several decades ago. I am asking you to stop because I have seen what
          happens when gods wake, and I would prefer not to see it again.
        </Dialogue>
        <p>
          Senna is watching him with the focused attention she reserves for reading
          the Tide. Aldric is looking at the lamp.
        </p>
        <Dialogue speaker="ALDRIC">
          What if we didn't wake him? What if we just — stopped suppressing him?
        </Dialogue>
        <p>
          The Warden looks at him. For the first time something in his expression
          shifts — not surprise exactly, but the very specific quality of a man
          encountering a question he has not already answered.
        </p>
        <Dialogue speaker="THE PALE WARDEN" direction="(quietly)">
          That is not the same thing.
        </Dialogue>
        <Dialogue speaker="SENNA">No. It's not.</Dialogue>
      </section>
    </section>
  );
}
