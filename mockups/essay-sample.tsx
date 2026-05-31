import "reactwright/jsx";

import { Template } from "./essay/index.js";

// Sample essay mockup exercising the MLA-style essay template. Three
// short sections, one block quote, a handful of inline citations, and a
// Works Cited list at the end. All names, titles, and quotes here are
// invented for layout purposes.

export { Template };

export default function EssaySample() {
  return (
    <document
      title="Brevity in Modern Prose"
      author="A. Quinlan Marsh"
    >
      {/* Set the running-header source for page 2+ */}
      <set running="author-lastname" value="Marsh" />

      <section title="The Case for Compression">
        <p>
          A sentence that says more than it needs to is a sentence that
          says less than it should. Modern prose, when it works, earns
          its words. When it fails, it borrows them from elsewhere and
          forgets to pay them back. This essay argues that the
          contemporary novel is recovering, slowly, from a long period
          of stylistic inflation, and that the recovery is visible most
          clearly in the work of writers who treat brevity not as a
          virtue but as a constraint.
        </p>
        <p>
          The point is not new. Critics have been calling for compression
          since at least the early twentieth century <cite cite="strunk1918" />,
          and the call has been answered intermittently. What is new is
          the scale of the inflation against which the present generation
          is reacting. A novel of three hundred pages in 1960 carried
          roughly the same narrative weight as one of five hundred today
          <cite cite="rendell2019" />. The difference, almost entirely,
          is padding.
        </p>
        <p>
          Padding is not the same as elaboration. Elaboration earns its
          length by adding something — a complication, a register shift,
          a doubling of meaning. Padding adds words without adding
          information. The distinction matters because the cure for one
          is not the cure for the other. Elaboration is trimmed by
          taste; padding is trimmed by indifference.
        </p>
      </section>

      <section title="A Test Case">
        <p>
          Consider the opening of a recent and widely praised novel. The
          first paragraph runs four hundred words and contains, as far
          as a charitable reader can tell, two pieces of information:
          the protagonist is tired, and the protagonist is in a kitchen.
          The remaining three hundred and ninety-four words are weather,
          furniture, and metaphor. None of them are bad, individually.
          Together they are a kind of fog.
        </p>
        <p>
          Compare this with a sentence Hemingway is supposed to have
          written on a wager:
        </p>
        <quote>
          <p>
            For sale: baby shoes, never worn.
          </p>
        </quote>
        <p>
          The provenance is doubtful <cite cite="haglund2013" />, but the
          example is instructive. Six words, three discrete facts, and a
          narrative arc that the reader is invited to complete. The
          contrast with the four-hundred-word kitchen is not flattering
          to the kitchen.
        </p>
      </section>

      <section title="What Compression Is For">
        <p>
          Brevity is not an end in itself. A short bad sentence is no
          better than a long bad one — usually it is worse, because it
          has fewer places to hide. The argument for compression is
          that it forces choices. A writer who cannot fit a paragraph
          into a hundred words must decide which of the available
          observations is most worth keeping. That decision is, in
          aggregate, what we call style.
        </p>
        <p>
          The contemporary recovery, if it is one, looks like a return
          to that older discipline. Whether it lasts long enough to
          become a tradition is another question. For now it is enough
          to notice that the best prose of the present decade tends to
          be lean, and that the leanness is not an accident.
        </p>
      </section>

      <refs>
        <ref-entry refKey="strunk1918">
          Strunk, W. <em>The Elements of Style</em>. Cornhill, 1918.
        </ref-entry>
        <ref-entry refKey="rendell2019">
          Rendell, P. "Word Counts and Reading Time: A Survey of the Anglophone Novel, 1950-2018."
          <em>Journal of Quantitative Literary Studies</em>, vol. 14, no. 2, 2019, pp. 21-47.
        </ref-entry>
        <ref-entry refKey="haglund2013">
          Haglund, D. "The Provenance of the Six-Word Story."
          <em>Slate</em>, 18 Jan. 2013.
        </ref-entry>
      </refs>
    </document>
  );
}
