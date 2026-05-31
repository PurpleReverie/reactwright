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
        <region
          style={{
            textAlign: "center",
            padding: "5mm",
            borderBottom: "2px solid #cbd5e1",
            backgroundColor: "#f8fafc"
          }}
        >
          <slot name="title" />
          <slot name="author" />
        </region>

        <region
          style={{
            border: "1px solid #dbe2ea",
            padding: "4mm",
            backgroundColor: "#fcfcfd"
          }}
        >
          <slot name="abstract" />
        </region>

        <region>
          <slot name="body" />
        </region>
      </stack>
    </page>
  );
}

export default function ResearchMemo() {
  return (
    <document title="Same File Custom Doc" author="Anya Strunk">
      <section role="abstract" title="">
        <p>
          This file exports both content and template, proving the two React scopes
          can live together in one external module.
        </p>
      </section>

      <section title="Introduction">
        <p>
          Reactwright should let authors control both meaning and presentation from
          project code.
        </p>
      </section>

      <ObservationSection />
    </document>
  );
}
