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

registerFont("Cormorant SC", {
  html: {
    kind: "link",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@500;600;700&display=swap"
  },
  latex: { command: "\\rmfamily" }
});

export function StoryBibleTemplate({ children }: { children?: ReactNode }) {
  return (
    <template
      style={{
        size: "a4",
        marginTop: "18mm",
        marginRight: "18mm",
        marginBottom: "20mm",
        marginLeft: "18mm",
        fontFamily: "serif",
        fontSize: "11pt",
        lineHeight: 1.34,
        sectionStyle: "label",
        blockquoteStyle: "plain",
        backgroundColor: "#f7f0df",
        color: "#201818"
      }}
    >
      <rules>
        <section-role role="scene-heading" variant="sceneHeading" />
        <quote-role role="dialogue" variant="dialogueBlock" />
        <page-role page="worldbuilding" use="worldbuilding" />
        <page-role page="script" use="script" />
      </rules>

      <flow gap="8mm">
        <region
          style={{
            textAlign: "center",
            backgroundColor: "#1c2430",
            color: "#f6ead2",
            border: "1.5pt solid #8a6a2f",
            paddingTop: "4mm",
            paddingRight: "5mm",
            paddingBottom: "4mm",
            paddingLeft: "5mm"
          }}
        >
          <region
            style={{
              fontFamily: "Cormorant SC",
              fontSize: "9pt",
              fontWeight: "bold",
              paddingBottom: "1.5mm",
              borderBottom: "0.8pt solid #c8a96b"
            }}
          >
            SERIES DOSSIER / DEVELOPMENT MATERIAL
          </region>
          <region
            style={{
              fontFamily: "Cormorant SC",
              fontWeight: "bold",
              fontSize: "16pt",
              paddingTop: "2.5mm",
              paddingBottom: "1mm"
            }}
          >
            <slot name="title" />
          </region>
          <region
            style={{
              fontSize: "9pt",
              paddingTop: "1mm"
            }}
          >
            <slot name="author" />
          </region>
        </region>

        <page-set name="worldbuilding">
          <region
            style={{
              backgroundColor: "#fcf7ea",
              border: "1.1pt solid #b79a67",
              paddingTop: "4mm",
              paddingRight: "4mm",
              paddingBottom: "4mm",
              paddingLeft: "4mm",
              fontFamily: "serif",
              fontSize: "10.5pt",
              lineHeight: 1.3,
              breakable: true
            }}
          >
            <region
              style={{
                fontFamily: "Cormorant SC",
                fontWeight: "bold",
                fontSize: "9pt",
                textAlign: "center",
                paddingBottom: "2mm",
                borderBottom: "0.8pt solid #b79a67"
              }}
            >
              WORLD NOTES / THEMES / CHARACTER STRATEGY
            </region>
            {children ?? <slot name="body" />}
          </region>
        </page-set>

        <page-set name="script">
          <region
            style={{
              backgroundColor: "#fffdf8",
              border: "1.5pt solid #2b2f38",
              paddingTop: "4mm",
              paddingRight: "5mm",
              paddingBottom: "4mm",
              paddingLeft: "5mm",
              fontFamily: "Courier Prime",
              fontSize: "10pt",
              lineHeight: 1.22,
              breakable: true
            }}
          >
            <region
              style={{
                fontFamily: "Cormorant SC",
                fontWeight: "bold",
                fontSize: "9pt",
                textAlign: "center",
                paddingBottom: "2mm",
                borderBottom: "0.8pt solid #2b2f38"
              }}
            >
              SCRIPT SAMPLE / PERFORMANCE OF TONE
            </region>
            {children ?? <slot name="body" />}
          </region>
        </page-set>
      </flow>
    </template>
  );
}
