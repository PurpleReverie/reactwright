import { ObservationSection } from "./fragments/observation.js";

export function Template() {
  return (
    <page
      style={{
        size: "a4",
        margin: "20mm",
        fontFamily: "serif",
        fontSize: "11pt",
        lineHeight: 1.35
      }}
    >
      <stack gap="7mm">
        <box
          style={{
            textAlign: "center",
            padding: "5mm",
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

export default function ResearchMemo() {
  return (
    <document title="Same File Custom Doc" author="Tauraj Greig">
      <abstract>
        <paragraph>
          This file exports both content and template, proving the two React scopes
          can live together in one external module.
        </paragraph>
      </abstract>

      <section title="Introduction">
        <paragraph>
          ReactDoc should let authors control both meaning and presentation from
          project code.
        </paragraph>
      </section>

      <ObservationSection />
    </document>
  );
}
