import type { ReactNode } from "react";

export function ArticleStarter({ children }: { children?: ReactNode }) {
  return (
    <page
      page={{ size: "a4", margin: "28mm" }}
      typography={{ fontFamily: "serif", fontSize: "11pt", lineHeight: 1.45 }}
    >
      <stack gap="6mm">
        <region typography={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region>
          <slot name="abstract" />
        </region>
        <region>{children ?? <slot name="body" />}</region>
      </stack>

      <footer anchor="bottom-center">
        <page-number />
      </footer>
    </page>
  );
}
