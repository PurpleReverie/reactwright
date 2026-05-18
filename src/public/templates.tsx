import type { ReactNode } from "react";

export { ArticleStarter } from "../templates/starter/article.js";
export { ArticleTwoColumnStarter } from "../templates/starter/article-two-column.js";
export { NovelStarter } from "../templates/starter/novel.js";
export { HandbookStarter } from "../templates/starter/handbook.js";

export { Callout } from "../components/Callout.js";
export { Sidebar } from "../components/Sidebar.js";
export { DropCap } from "../components/DropCap.js";
export { Ornament } from "../components/Ornament.js";
export { Epigraph } from "../components/Epigraph.js";
export { SceneHeading } from "../components/SceneHeading.js";
export { Dialogue } from "../components/Dialogue.js";

/**
 * Legacy default template; kept for backwards compatibility with the
 * pre-spec ArticleTemplate import. Prefer the named starter templates
 * (`ArticleStarter`, `NovelStarter`, etc.) for new work.
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
