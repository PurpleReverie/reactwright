import type { ReactNode } from "react";

export function IEEETemplate({ children }: { children?: ReactNode }) {
  return (
    <page
      style={{
        size: "a4",
        marginTop: "16mm",
        marginRight: "13mm",
        marginBottom: "18mm",
        marginLeft: "13mm",
        fontFamily: "serif",
        fontSize: "10pt",
        lineHeight: 1.12
      }}
    >
      <stack gap="3.5mm">
        <box
          style={{
            textAlign: "center",
            borderBottom: "1px solid",
            paddingBottom: "3mm"
          }}
        >
          <slot name="title" />
          <slot name="author" />
        </box>

        <box
          style={{
            fontSize: "9pt",
            lineHeight: 1.08,
            paddingLeft: "2mm",
            paddingRight: "2mm",
            paddingBottom: "2mm",
            borderBottom: "1px solid"
          }}
        >
          <slot name="abstract" />
        </box>

        <box
          style={{
            columns: 2,
            columnGap: "6mm",
            fontSize: "10pt",
            lineHeight: 1.1
          }}
        >
          {children ?? <slot name="body" />}
        </box>
      </stack>
    </page>
  );
}
