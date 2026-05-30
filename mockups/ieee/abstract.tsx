import "reactwright/jsx";
import React from "react";

// IEEE abstract block helper. Wraps the engine's <abstract> and
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
// Both render inside one <abstract> block since the engine treats
// the abstract section as one slot.

export function IEEEAbstract({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <abstract>
      <p>
        <em>Abstract</em>—{children}
      </p>
    </abstract>
  );
}

// Index Terms paragraph — meant to live alongside an IEEEAbstract,
// but rendered as its own <p> inside the same <abstract> slot.
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
    <abstract>
      <p>
        <em>Abstract</em>—{abstract}
      </p>
      <p>
        <em>Index Terms</em>—{indexTerms}
      </p>
    </abstract>
  );
}
