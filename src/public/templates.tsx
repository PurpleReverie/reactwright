import type { ReactNode } from "react";

/**
 * Minimal default template used during Phase 0. The previous LaTeX-era templates
 * (article, ieee, goofy) were removed; full starter templates will be
 * reintroduced in M12 once the Paged.js-targeted vocabulary is in place.
 */
export function ArticleTemplate({ children }: { children?: ReactNode }) {
  return (
    <page style={{ size: "a4", margin: "25mm", fontFamily: "serif", fontSize: "11pt", lineHeight: 1.4 }}>
      <stack gap="6mm">
        <region style={{ textAlign: "center" }}>
          <slot name="title" />
          <slot name="author" />
        </region>
        <region>
          <slot name="abstract" />
        </region>
        <region>{children ?? <slot name="body" />}</region>
      </stack>
    </page>
  );
}
