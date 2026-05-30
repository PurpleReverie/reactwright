import "reactwright/jsx";
import React from "react";

import { Cite } from "../bibliography.js";

export function Discussion(): React.ReactElement {
  return (
    <section title="Discussion">
      <p>
        Our results invite three observations. First, the dominant
        cost in a browser-based document pipeline is the browser
        itself; further engineering on the authoring layer will not
        meaningfully change the iteration cycle until that cost is
        amortised. Second, type-safe citations are a small ergonomic
        win that nonetheless materially reduces the number of failed
        builds an author encounters during writing. Third, the
        decision to split the grammar into content and template
        reconcilers proved easier to teach in practice than we had
        expected — the separation maps onto the writer-versus-designer
        division that authors already understand.
      </p>

      <section title="On the locus of complexity">
        <p>
          One persistent design tension in this project has been the
          placement of format-specific knowledge. The engine itself
          should know nothing about IEEE conventions, journal styles,
          or genre-specific running-head treatments; these belong to
          the template layer, or to typed authoring helpers that
          compose the primitives the engine exposes. The discipline of
          keeping the engine format-agnostic is borrowed directly from
          the Unix software-tools tradition <Cite k="kernighan1976" />:
          small primitives, sharp boundaries, composition over
          configuration.
        </p>
        <p>
          The risk of this discipline is that authors confronting the
          bare primitive surface for the first time find it too low.
          The mitigation we adopted, and which we recommend to anyone
          building a similar system, is to ship pre-baked typed
          helpers alongside the primitive surface — in our case a
          working IEEE template and a typed bibliography helper — so
          that new authors can copy an existing pattern rather than
          assembling one from scratch.
        </p>
      </section>

      <section title="On reactive runtimes for static artefacts">
        <p>
          A document, once compiled, is a static artefact. The choice
          to compile it through a reactive runtime might seem
          extravagant — and is, if the runtime were a cost paid at
          read time. Our use of React, however, is purely compile-time:
          the reconciler runs, produces the IR, and exits. The reader
          of the resulting PDF or HTML never encounters React at all.
          The runtime is a convenience for the author, not a cost
          imposed on the reader.
        </p>
        <p>
          This distinction matters because much of the criticism of
          reactive runtimes — bundle size, hydration delay, perceived
          interactivity cost — applies to runtime-rendered SPAs and
          not to authoring tools. Our design rhymes with the use of
          Lisp as a metaprogramming language in <Cite k="abelson1996" />:
          the metalanguage runs at compile time and contributes
          nothing to the runtime image.
        </p>
      </section>

      <section title="What we got wrong">
        <p>
          The original system shipped with a single grammar that
          admitted both content and template nodes. The decision to
          split it came late, after a bug in the resolver corrupted
          the page geometry of every document in the test corpus
          simultaneously. Recovering from the bug required carving
          out the template grammar, and once carved out the smaller
          surface admitted a sharper type system; we have not
          regretted the split since. We would, however, have saved
          a week of work by splitting it at the start.
        </p>
        <p>
          We also shipped, in the engine, more opinionated default
          styling than was warranted: heading sizes, code-block
          backgrounds, table borders, citation bracket characters.
          Each was a small format-specific assumption baked into the
          engine that downstream authors then had to override. The
          principled approach <Cite k="raskin2000" /> was to ship a
          near-empty default and let each template establish its own
          tone. We stripped these in a later release.
        </p>
      </section>
    </section>
  );
}
