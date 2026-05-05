import type { ReactNode } from "react";
import { registerFont } from "../fonts/registry.js";

// Courier Prime: the clean, screen-readable version of the industry-standard
// Courier typeface used in all professional script and development documents.
registerFont("Courier Prime", {
  html: {
    kind: "link",
    href: "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
  },
  latex: { command: "\\ttfamily" }
});

export function StoryBibleTemplate({ children }: { children?: ReactNode }) {
  return (
    <template
      style={{
        size: "a4",
        margin: "25mm",
        fontFamily: "Courier Prime",
        fontSize: "12pt",
        lineHeight: 1.5,
        sectionStyle: "label",
        blockquoteStyle: "plain"
      }}
    >
      <rules>
        <section-role role="scene-heading" variant="sceneHeading" />
        <quote-role role="dialogue" variant="dialogueBlock" />
        <page-role page="worldbuilding" use="worldbuilding" />
        <page-role page="script" use="script" />
      </rules>

      <flow gap="10mm">
        <region
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "14pt",
            paddingTop: "6mm",
            paddingBottom: "6mm",
            borderBottom: "1.5pt solid #000000"
          }}
        >
          <slot name="title" />
          <slot name="author" />
        </region>

        <page-set name="worldbuilding">
          <region style={{ breakable: true }}>
            {children ?? <slot name="body" />}
          </region>
        </page-set>

        <page-set name="script">
          <region style={{ breakable: true }}>
            {children ?? <slot name="body" />}
          </region>
        </page-set>
      </flow>
    </template>
  );
}
