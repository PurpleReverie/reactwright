import type { ReactNode } from "react";

export function HandbookStarter({ children }: { children?: ReactNode }) {
  return (
    <>
      <rules>
        <role on="quote" match="callout" apply="handbook-callout" />
        <role on="paragraph" match="note" apply="handbook-note" />
        <page match="appendix" use="appendix-pages" />
      </rules>

      <page-set
        name="main-pages"
        page={{ size: "a4", margin: "25mm" }}
        typography={{ fontFamily: "sans-serif", fontSize: "10.5pt", lineHeight: 1.4 }}
      >
        <stack gap="4mm">
          <slot name="title" />
          <slot name="abstract" />
          {children ?? <slot name="body" />}
        </stack>

        <header anchor="top-right">
          <running name="section-title" />
        </header>
        <footer anchor="bottom-right">
          <page-number /> / <page-count />
        </footer>
      </page-set>

      <page-set
        name="appendix-pages"
        page={{ size: "a4", margin: "22mm" }}
        typography={{ fontFamily: "sans-serif", fontSize: "10pt", color: "#444" }}
      >
        <slot name="body" />
        <header anchor="top-left">Appendix</header>
        <footer anchor="bottom-center"><page-number /></footer>
      </page-set>
    </>
  );
}
