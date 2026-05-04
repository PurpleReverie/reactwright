import type { ReactNode } from "react";

export function ArticleTemplate({ children }: { children?: ReactNode }) {
  return (
    <page
      style={{
        size: "a4",
        margin: "25mm",
        fontFamily: "serif",
        fontSize: "11pt",
        lineHeight: 1.3
      }}
    >
      <stack gap="8mm">
        <box style={{ textAlign: "center", borderBottom: "1px solid", paddingBottom: "4mm" }}>
          <slot name="title" />
          <slot name="author" />
        </box>

        <box>
          <slot name="abstract" />
        </box>

        <box>{children ?? <slot name="body" />}</box>
      </stack>
    </page>
  );
}
