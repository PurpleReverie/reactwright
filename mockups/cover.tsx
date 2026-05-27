import "reactdoc/jsx";

import { resolve } from "node:path";

const SWATCH_PATH = resolve(process.cwd(), "tests/fixtures/reactdoc-diagram.svg");

// Cover + frontmatter — page regimes, layered backgrounds, fixed ornaments.
// Exercises: <layer> backgrounds, <fixed> at named + coordinate anchors,
// <image fill>, <page-set name> with <page match use> rule routing.
//
// KNOWN LIMITATION: The current resolver collapses all <page-set> children
// onto a single ResolvedPageNode; page-sets only filter content via
// matchesPageSet (body-slot routing), they do not yet emit separate
// CSS-Paged-Media named-page rules. So in this mockup the cover layer,
// frontmatter stack, and body stack all overlay on the same page-template
// instance, which is structurally wrong for a real cover/body book. See
// build/mockups/cover.html for the visual artifact.

export function Template() {
  return (
    <page
      page={{ size: "a4", margin: "20mm" }}
      typography={{ fontFamily: "Georgia, serif", fontSize: "11pt", lineHeight: 1.4 }}
    >
      <rules>
        <page match="cover" use="cover" />
        <page match="frontmatter" use="frontmatter" />
        <page match="body" use="body" />
      </rules>

      <page-set
        name="cover"
        anchors={{
          ornament: { top: "60mm", left: "50%" },
          subtitle: { top: "120mm", left: "20mm" }
        }}
      >
        <layer name="cover-bg" style={{ backgroundColor: "#1e293b" }} />
        <region fill>
          <image src={SWATCH_PATH} fill cover style={{ opacity: 0.2 }} />
        </region>
        <fixed anchor="ornament" style={{ transform: "translateX(-50%)" }}>
          <image src={SWATCH_PATH} width="40mm" />
        </fixed>
        <fixed anchor="page-top-left" style={{ padding: "30mm 24mm", color: "#fff" }}>
          <slot name="title" />
        </fixed>
        <fixed anchor="subtitle" style={{ color: "#fbbf24", fontStyle: "italic", fontSize: "14pt" }}>
          A Manual of Quiet Disciplines
        </fixed>
        <fixed anchor="page-bottom-right" style={{ padding: "20mm 24mm", color: "#cbd5e1" }}>
          <slot name="author" />
        </fixed>
      </page-set>

      <page-set name="frontmatter">
        <stack gap="8mm" style={{ paddingTop: "60mm" }}>
          <region style={{ textAlign: "center", fontStyle: "italic" }}>
            <slot name="body" />
          </region>
        </stack>
      </page-set>

      <page-set name="body">
        <footer anchor="bottom-center">
          <page-number />
        </footer>
        <stack gap="6mm">
          <region>
            <slot name="body" />
          </region>
        </stack>
      </page-set>
    </page>
  );
}

export default function Cover() {
  return (
    <document title="ON STILLNESS" author="N. L. Reed">
      <section page="cover" title="" />

      <section page="frontmatter" title="">
        <p>For my grandmother, who taught me to watch the kettle.</p>
      </section>

      <section page="body" title="Prologue">
        <p>
          What follows is a small book of attentions. It will not teach you anything
          new, but it may remind you of things you already knew and had agreed,
          somewhere along the way, to forget.
        </p>
      </section>

      <section page="body" title="On Waiting">
        <p>
          The kettle is a teacher because it asks for nothing while it does its work.
          It does not require your attention; it simply rewards it.
        </p>
      </section>
    </document>
  );
}
