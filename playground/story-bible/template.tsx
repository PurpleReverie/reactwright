import type { ReactNode } from "react";
import { registerFont } from "../../src/fonts/registry.js";

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
      page={{
        size: "a4",
        marginTop: "18mm",
        marginRight: "18mm",
        marginBottom: "24mm",
        marginLeft: "18mm"
      }}
      typography={{
        fontFamily: "serif",
        fontSize: "11pt",
        lineHeight: 1.34,
        color: "#201818"
      }}
      box={{
        backgroundColor: "#f7f0df"
      }}
      style={{
        sectionStyle: "label",
        blockquoteStyle: "plain"
      }}
    >
      <rules>
        <section-role role="scene-heading" variant="sceneHeading" />
        <quote-role role="dialogue" variant="dialogueBlock" />
        <paragraph-role role="stageDirect" variant="stageDirect" />
        <page-role page="worldbuilding" use="worldbuilding" />
        <page-role page="script" use="script" />
      </rules>

      <repeat when="not-first-page" anchor="top-right">
        <region
          typography={{
            fontFamily: "Cormorant SC",
            fontWeight: "bold",
            fontSize: "8pt",
            color: "#8a6a2f"
          }}
        >
          <slot name="title" />
        </region>
      </repeat>

      <repeat when="not-first-page" anchor="bottom-center">
        <region
          typography={{
            fontSize: "8pt",
            color: "#8a6a2f"
          }}
        >
          <page-number />
        </region>
      </repeat>

      <flow gap="8mm">
        <region
          typography={{
            textAlign: "center",
            color: "#f6ead2"
          }}
          box={{
            backgroundColor: "#1c2430",
            border: "1.5pt solid #8a6a2f",
            paddingTop: "4mm",
            paddingRight: "5mm",
            paddingBottom: "4mm",
            paddingLeft: "5mm"
          }}
        >
          <region
            typography={{
              fontFamily: "Cormorant SC",
              fontSize: "9pt",
              fontWeight: "bold"
            }}
            box={{ paddingBottom: "1.5mm" }}
          >
            SERIES DOSSIER / DEVELOPMENT MATERIAL
          </region>
          <rule weight="0.8pt" color="#c8a96b" length="100%" />
          <region
            typography={{
              fontFamily: "Cormorant SC",
              fontWeight: "bold",
              fontSize: "16pt"
            }}
            box={{ paddingTop: "2.5mm", paddingBottom: "1mm" }}
          >
            <slot name="title" />
          </region>
          <region
            typography={{ fontSize: "9pt" }}
            box={{ paddingTop: "1mm" }}
          >
            <slot name="author" />
          </region>
        </region>

        <page-set name="worldbuilding">
          <region
            typography={{
              fontFamily: "serif",
              fontSize: "10.5pt",
              lineHeight: 1.3
            }}
            box={{
              backgroundColor: "#fcf7ea",
              border: "1.1pt solid #b79a67",
              paddingTop: "4mm",
              paddingRight: "4mm",
              paddingBottom: "4mm",
              paddingLeft: "4mm",
              breakable: true
            }}
          >
            <region
              typography={{
                fontFamily: "Cormorant SC",
                fontWeight: "bold",
                fontSize: "9pt",
                textAlign: "center"
              }}
              box={{ paddingBottom: "2mm" }}
            >
              WORLD NOTES / THEMES / CHARACTER STRATEGY
            </region>
            <rule weight="0.8pt" color="#b79a67" length="100%" />
            {children ?? <slot name="body" />}
          </region>
        </page-set>

        <page-set name="script">
          <region
            typography={{
              fontFamily: "Courier Prime",
              fontSize: "10pt",
              lineHeight: 1.22
            }}
            box={{
              backgroundColor: "#fffdf8",
              border: "1.5pt solid #2b2f38",
              paddingTop: "4mm",
              paddingRight: "5mm",
              paddingBottom: "4mm",
              paddingLeft: "5mm",
              breakable: true
            }}
          >
            <region
              typography={{
                fontFamily: "Cormorant SC",
                fontWeight: "bold",
                fontSize: "9pt",
                textAlign: "center"
              }}
              box={{ paddingBottom: "2mm" }}
            >
              SCRIPT SAMPLE / PERFORMANCE OF TONE
            </region>
            <rule weight="0.8pt" color="#2b2f38" length="100%" />
            {children ?? <slot name="body" />}
          </region>
        </page-set>
      </flow>
    </template>
  );
}
