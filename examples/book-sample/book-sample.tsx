import "reactwright/jsx";

import { Template } from "@reactwright/template-book";

// Sample book mockup exercising the long-form trade-paperback
// template. Title page, copyright, dedication, three chapters, and a
// short afterword. The placeholder fiction here ("The Last Cartographer")
// is invented for layout purposes.

export { Template };

export default function BookSample() {
  return (
    <document
      title="The Last Cartographer"
      author="Elinor Vance"
    >
      {/* Running-header source for chapter title */}
      <set running="document-title" value="The Last Cartographer" />

      <section role="title-page" title="The Last Cartographer">
        <p>A Novel</p>
        <p>Elinor Vance</p>
      </section>

      <section role="front-matter" title="Copyright">
        <p>Copyright © 2026 by Elinor Vance.</p>
        <p>
          All rights reserved. No part of this book may be reproduced
          without the prior written permission of the publisher, except
          in the case of brief quotations embodied in critical articles.
        </p>
        <p>Library of Congress Cataloging-in-Publication Data on file.</p>
        <p>First Edition.</p>
      </section>

      <section role="front-matter" title="Dedication">
        <p>For everyone who keeps a map of somewhere that no longer exists.</p>
      </section>

      <section role="chapter" title="The Office on Elm Street">
        <set running="chapter-title" value="The Office on Elm Street" />
        <p>
          Hesper Marlowe had not drawn a new map in eleven years, and she
          intended to die without drawing one more. The office above the
          stationers on Elm Street suited her exactly: two rooms, one
          window that faced east and so admitted only the morning, and a
          drafting table she had refused to throw out in 1987 and had
          continued to refuse to throw out every year since. She did not
          take new commissions. She did not advertise. She kept a small
          income by certifying the maps of cartographers who were
          younger than her, which was all of them, and who needed a
          signature from someone whose certification still meant
          something to the few clients who remembered when it had.
        </p>
        <p>
          The light through the east window was the first thing she
          noticed each morning, which was not unusual, and the second
          thing she noticed was the envelope on her drafting table,
          which was. She had not placed it there. The cleaning service
          had been by yesterday but the cleaning service did not bring
          envelopes, and besides the envelope was addressed to her in a
          hand she had not seen for sixty-one years.
        </p>
        <p>
          She sat down on the high stool by the table and looked at the
          envelope for some time. The light moved across the floor in
          the way it had moved across the floor every morning for the
          eleven years she had been refusing to draw new maps. Eventually
          she picked up the envelope, slit the seal with the bone knife
          her grandfather had given her, and unfolded the single page.
        </p>
        <p>
          The page contained one sentence, written in the careful
          backward-sloping script she had not seen since the spring of
          1964. The sentence was, <em>The island is back, and I need
          you to come and draw it.</em>
        </p>
        <p>
          Hesper Marlowe sat with the page in her lap for a long time
          before she stood up, retrieved her coat from the hook by the
          door, and went downstairs to buy a train ticket north.
        </p>
      </section>

      <section role="chapter" title="What the Sea Returned">
        <set running="chapter-title" value="What the Sea Returned" />
        <p>
          The train left at six and reached the coast by midnight, which
          was the only sensible time to arrive in the village of
          Carrick: the harbor lights would be on, the inn would still be
          serving, and the cartographers' guild office — which had been
          closed for forty years — would be dark, as it should be. She
          had spent the journey reading the page over again. She had
          read it perhaps eighty times by the time the train pulled into
          the small station.
        </p>
        <p>
          The man waiting on the platform was the man she had been
          expecting to meet, although she had not known until she saw
          him that this was who she had been expecting. He was seventy
          years old and stood the way a man stands who has spent his
          life on boats. He had her grandfather's eyes, which was
          impossible, because her grandfather had had no surviving
          children other than her mother, and her mother had had only
          her.
        </p>
        <p>
          "Miss Marlowe," he said, when she came down off the train. He
          did not offer his hand. He took her bag without asking and
          walked her down toward the harbor, and she did not speak
          either, because anything she might have said could only have
          been a question, and she had not yet decided which question to
          ask first.
        </p>
        <quote>
          <p>
            The island came back at the equinox tide. The Lighthouse-keeper saw it
            first, then the harbormaster, then the men on the trawlers. By morning
            it was on every chart in the harbormaster's office, and by noon every
            one of those charts had been wrong.
          </p>
        </quote>
        <p>
          He said this without preamble, while they were walking past
          the boatyard. The wind off the harbor was the kind of wind
          that has weather in it without being weather yet. Hesper did
          not stop walking. She had a feeling, by then, that if she
          stopped walking she would have to ask one of the questions she
          was not yet ready to ask, and so she kept walking and let him
          keep talking.
        </p>
        <p>
          The inn was warm, and the innkeeper had kept a room. The man
          who had her grandfather's eyes set her bag down inside the
          door of the room and stood in the hallway for a moment as if
          he were going to say something further. He did not. He nodded,
          and went back down the stairs, and she heard the front door of
          the inn close behind him.
        </p>
        <p>
          Hesper sat down on the edge of the bed and took out the page
          again. She did not unfold it. She held it in both hands and
          looked at the window, which faced east, as the window in her
          office on Elm Street faced east, and she waited for the
          morning to come, which it did.
        </p>
      </section>

      <section role="chapter" title="The Drafting Table at Sea">
        <set running="chapter-title" value="The Drafting Table at Sea" />
        <p>
          The trawler left at seven the following morning. Hesper had
          insisted on the drafting table. The man with her grandfather's
          eyes — whose name was Owen, she had finally asked — had
          insisted, less ostentatiously, that the drafting table would
          not fit, would not be necessary, and that the survey could be
          done from notebooks. They had compromised on a folding board
          and a stack of waxed paper.
        </p>
        <p>
          The folding board was sufficient. She had been a cartographer
          for sixty-three years before her retirement and she had drawn
          on worse surfaces than a folding board on the deck of a
          trawler. She set up by the wheelhouse, where the wind was
          least, and she began to sketch the coastline as Carrick fell
          behind them. She did this for an hour without saying anything
          to Owen, who had the wheel, and who did not interrupt her,
          which she appreciated.
        </p>

        <section title="The first sighting">
          <p>
            They sighted the island at half past nine. It was where the
            chart said it was, which was where it had been before it had
            gone away forty years ago, and which was where her
            grandfather's letter had said it was now. Hesper put down
            her pencil and looked at it for a long minute before she
            picked the pencil up again.
          </p>
          <p>
            It was a small island. Perhaps two miles long and a mile
            wide. It had a low spine of rock running east-to-west and
            what looked like a stand of pine on the eastern flank.
            There was no lighthouse, which there should have been; the
            lighthouse on the chart had been there in 1964 and was not
            there now. She made a note of this in pencil along the
            margin of the waxed paper.
          </p>
        </section>

        <section title="What she drew">
          <p>
            She drew the island in three passes, as her grandfather had
            taught her. The first pass was the outline, in soft pencil,
            for shape. The second pass was the elevation, in harder
            pencil, for the spine and the cove. The third pass was the
            notation — the names she did not yet know but would assign
            once she had been ashore.
          </p>
          <p>
            She did not go ashore on the first day. They circled the
            island once and went back to Carrick before dark, because
            Owen would not anchor off the island at night, and Hesper —
            who had thought she would insist — found, when the time
            came, that she did not insist either. She slept poorly. She
            woke before the morning. She unfolded the page and read it
            for the eighty-first time.
          </p>
        </section>
      </section>

      <section role="back-matter" title="Afterword">
        <p>
          The first draft of <em>The Last Cartographer</em> was begun on
          a folding board, in a cottage on the coast, in the second week
          of October. The second draft was written in an office that
          faced east, on a drafting table that had been refused for
          throwing-out since 1987. The two drafts are not the same book.
          The first was a book about a woman who returned to an island.
          The second was a book about a woman who returned to a habit.
          Both books survive in the present edition; the reader is
          invited to decide which one is being read at any given page.
        </p>
        <p>
          Names, places, and timings have been altered to protect the
          living. The island, however, is as the cartographer drew it.
        </p>
      </section>

      <section role="back-matter" title="Acknowledgments">
        <p>
          For the harbormaster at Carrick, who answered the question
          that was the question; for Owen, who never asked it; and for
          my grandfather, who left the letter where it would be found.
        </p>
      </section>
    </document>
  );
}
