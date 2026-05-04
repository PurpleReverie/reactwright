export function ResearchMemoTemplate() {
  return (
    <page
      style={{
        size: "a4",
        margin: "22mm",
        fontFamily: "serif",
        fontSize: "11pt",
        lineHeight: 1.35
      }}
    >
      <stack gap="7mm">
        <box
          style={{
            textAlign: "center",
            padding: "6mm",
            borderBottom: "2px solid #cbd5e1",
            backgroundColor: "#f8fafc"
          }}
        >
          <slot name="title" />,
          <slot name="author" />
        </box>

        <box
          style={{
            border: "1px solid #dbe2ea",
            padding: "4mm",
            backgroundColor: "#fcfcfd"
          }}
        >
          <slot name="abstract" />
        </box>

        <box>
          <slot name="body" />
        </box>
      </stack>
    </page>
  );
}
