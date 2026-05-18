import type { ReactNode } from "react";

export function NovelStarter({ children }: { children?: ReactNode }) {
  return (
    <>
      <rules>
        <role on="section" match="chapter-opener" apply="chapter-display" />
        <page match="chapter-open" use="chapter-opener-pages" />
      </rules>

      <page-set
        name="body-pages"
        page={{ size: "a5", margin: "22mm", twoSided: true }}
        typography={{ fontFamily: "serif", fontSize: "10.5pt", lineHeight: 1.35 }}
      >
        <layer name="paper">
          <region fill style={{ backgroundColor: "#fbf7ee" }} />
        </layer>
        <layer name="content">
          {children ?? <slot name="body" />}
        </layer>

        <header anchor="top-outside" when="not-first-page">
          <running name="chapter-title" />
        </header>
        <footer anchor="bottom-center">
          <page-number />
        </footer>
      </page-set>

      <page-set name="chapter-opener-pages" page={{ size: "a5", margin: "0" }}>
        <layer name="art">
          {/* Replace with an actual chapter background image when authoring */}
          <region fill style={{ backgroundColor: "#1a1a24" }} />
        </layer>
        <layer name="scrim">
          <region fill style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
        </layer>
        <layer name="title-display">
          <region
            center
            style={{ padding: "20mm" }}
            typography={{ color: "white", fontFamily: "serif", fontSize: "32pt", textAlign: "center" }}
          >
            <slot name="body" />
          </region>
        </layer>
      </page-set>
    </>
  );
}
