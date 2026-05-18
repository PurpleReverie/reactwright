import type { ReactNode } from "react";

export function ArticleTwoColumnStarter({ children }: { children?: ReactNode }) {
  return (
    <page
      page={{ size: "letter", margin: "20mm", columns: 2, columnGap: "6mm" }}
      typography={{ fontFamily: "serif", fontSize: "10pt", lineHeight: 1.2 }}
    >
      <region typography={{ textAlign: "center" }} paragraph={{ keepTogether: true }}>
        <slot name="title" />
        <slot name="author" />
        <slot name="abstract" />
      </region>

      {children ?? <slot name="body" />}

      <header anchor="top-center" when="not-first-page">
        <running name="section-title" />
      </header>

      <footer anchor="bottom-center">
        <page-number /> of <page-count />
      </footer>
    </page>
  );
}
