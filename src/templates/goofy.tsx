import type { ReactNode } from "react";

export function GoofyCreativeTemplate({ children }: { children?: ReactNode }) {
  return (
    <page
      style={{
        size: "a4",
        marginTop: "18mm",
        marginRight: "20mm",
        marginBottom: "20mm",
        marginLeft: "20mm",
        fontFamily: "times",
        fontSize: "11pt",
        lineHeight: 1.28,
        backgroundColor: "#fff8e7",
        color: "#3b1d0f"
      }}
    >
      <stack gap="7mm">
        <box
          style={{
            textAlign: "center",
            fontFamily: "avant-garde",
            fontSize: "12pt",
            fontWeight: "bold",
            backgroundColor: "#fde68a",
            border: "1.5pt solid #b45309",
            paddingTop: "4mm",
            paddingRight: "4mm",
            paddingBottom: "5mm",
            paddingLeft: "4mm"
          }}
        >
          <slot name="title" />
          <slot name="author" />
        </box>

        <box
          style={{
            fontFamily: "times",
            fontSize: "10pt",
            backgroundColor: "#dcfce7",
            border: "1.5pt solid #16a34a",
            paddingTop: "3mm",
            paddingRight: "4mm",
            paddingBottom: "3mm",
            paddingLeft: "4mm"
          }}
        >
          <slot name="abstract" />
        </box>

        <box
          style={{
            breakable: true,
            fontFamily: "helvetica",
            fontSize: "10pt",
            lineHeight: 1.18,
            backgroundColor: "#dbeafe",
            border: "1.5pt solid #2563eb",
            paddingTop: "4mm",
            paddingRight: "5mm",
            paddingBottom: "4mm",
            paddingLeft: "5mm"
          }}
        >
          {children ?? <slot name="body" />}
        </box>
      </stack>
    </page>
  );
}
