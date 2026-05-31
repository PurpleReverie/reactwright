import "reactwright/jsx";
import React from "react";

// IEEE abstract block helper. Wraps a `<section role="abstract">` and
// prefixes its first child paragraph with bold-italic "Abstract—".
// Pair with IndexTerms for the second paragraph.
//
//   <IEEEAbstract>
//     We present a framework …
//   </IEEEAbstract>
//   <IndexTerms>
//     Document engineering, CSS Paged Media, …
//   </IndexTerms>
//
// Both render inside one `<section role="abstract">` block since the
// abstract slot is routed by role and aggregates contiguous abstract
// sections into a single region.

export function IEEEAbstract({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <section role="abstract" title="">
      <p>
        <em>Abstract</em>—{children}
      </p>
    </section>
  );
}

// Index Terms paragraph — meant to live alongside an IEEEAbstract,
// but rendered as its own <p> inside the same `<section role="abstract">` slot.
// Combine via fragments at the call site:
//
//   <IEEEFrontMatter abstract="..." indexTerms="..." />
//
// or just use the lower-level pieces.
export function IEEEFrontMatter({
  abstract,
  indexTerms
}: {
  abstract: React.ReactNode;
  indexTerms: React.ReactNode;
}): React.ReactElement {
  return (
    <section role="abstract" title="">
      <p>
        <em>Abstract</em>—{abstract}
      </p>
      <p>
        <em>Index Terms</em>—{indexTerms}
      </p>
    </section>
  );
}
