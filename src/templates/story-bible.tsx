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
    <page
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
      <stack gap="10mm">
        <box
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
        </box>

        <box style={{ breakable: true }}>
          {children ?? <slot name="body" />}
        </box>
      </stack>
    </page>
  );
}
