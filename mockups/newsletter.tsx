import "reactdoc/jsx";

import { resolve } from "node:path";

const SWATCH_PATH = resolve(process.cwd(), "tests/fixtures/reactdoc-diagram.svg");

// Newsletter — multi-column layout.
// Exercises: <columns widths={["2fr","1fr"]}> with <column> children,
// inline <img> in body, <br>/<sub>/<sup>, <layer> for page-wide tint,
// <fixed> for masthead overlay.

export function Template() {
  return (
    <page
      page={{ size: "a4", margin: "18mm" }}
      typography={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif", fontSize: "10pt", lineHeight: 1.4 }}
    >
      <layer name="tint" style={{ backgroundColor: "#fbf5e8" }} />

      <fixed anchor="top-left" style={{ padding: "8mm 12mm", backgroundColor: "#0f172a", color: "#fff" }}>
        <slot name="title" />
      </fixed>

      <footer anchor="bottom-center">
        Issue #4 — <page-number /> / <page-count />
      </footer>

      <stack gap="6mm" style={{ paddingTop: "24mm" }}>
        <region>
          <slot name="abstract" />
        </region>

        <columns gap="8mm" widths={["2fr", "1fr"]}>
          <column>
            <region>
              <slot name="body" />
            </region>
          </column>
          <column>
            <region style={{ padding: "4mm", backgroundColor: "#fff", borderRadius: "2mm" }}>
              <slot name="abstract" />
            </region>
          </column>
        </columns>
      </stack>
    </page>
  );
}

export default function Newsletter() {
  return (
    <document title="THE FOLD — Issue #4">
      <abstract>
        <p>
          A weekly digest of the small details, half-finished thoughts, and
          curious findings from our reading desk this week.
        </p>
      </abstract>

      <section title="The Big Story">
        <p>
          The deepest part of any newsletter is usually the part that the editor
          almost cut. This issue's lead is a piece we nearly held until next week,
          on the strange afterlife of formulas like H<sub>2</sub>SO<sub>4</sub>
          in popular memory.
        </p>

        <p>
          The headline (rejected): <em>"x<sup>2</sup> + y<sup>2</sup> = 1, and other
          ways your textbook lied to you."</em>
          <br />
          The headline (accepted): <em>"The Quiet Persistence of the Unit Circle."</em>
        </p>

        <p>
          We include a small visual reference <img src={SWATCH_PATH} alt="Swatch" width="6mm" />
          alongside the longer article, because the editor likes a flag against the
          left margin and we have not yet talked her out of it.
        </p>

        <p>
          Three short notes follow.<br />
          One on archival paper.<br />
          One on a curious typo in the 1953 reprint.<br />
          One on a postcard that arrived without a postmark.
        </p>
      </section>

      <section title="Postcard from the Stacks">
        <p>
          The library's basement archive received a postcard last Tuesday from a
          sender who appears to no longer exist. The handwriting matches a 1971
          accession record. The stamp matches a 1985 issue. The postmark is
          missing. We are accepting theories.
        </p>
      </section>

      <section title="What We're Reading">
        <p>
          A short stack this week:
        </p>
        <list>
          <item>
            <p><em>The Fold and the Margin</em> — on book design as architecture.</p>
          </item>
          <item>
            <p>An essay on n<sub>1</sub> versus n<sub>2</sub> in early type specimens.</p>
          </item>
          <item>
            <p><em>Postcards Without Postmarks</em> — exactly what it sounds like.</p>
          </item>
        </list>
      </section>
    </document>
  );
}
