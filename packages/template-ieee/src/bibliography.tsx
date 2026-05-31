import "reactwright/jsx";
import React from "react";

// Type-safe IEEE-style bibliography helpers.
//
//   const refs = createBibliography({
//     knuth1984:  { authors: "D. E. Knuth", title: "The TeXbook",
//                   publisher: "Addison-Wesley", year: 1984 },
//     lamport1986:{ authors: "L. Lamport",  title: "LaTeX",
//                   publisher: "Addison-Wesley", year: 1986 },
//   });
//
//   // In prose: TypeScript catches typos in citation keys.
//   <p>Knuth's TeX <refs.Cite k="knuth1984" /> established …</p>
//
//   // At the bottom of the document:
//   <refs.RefList />
//
// The library composes the engine's <cite> + <refs>/<ref-entry>
// primitives; the engine itself stays format-agnostic.

export type IEEEEntry =
  | {
      authors: string;
      title: string;
      year: number;
      venue?: string;       // journal or conference
      volume?: string;
      pages?: string;       // e.g. "379-423"
      publisher?: string;
      location?: string;    // e.g. "Reading, MA"
      edition?: string;     // e.g. "3rd ed."
    };

type Bibliography<K extends string> = {
  Cite: (props: { k: K }) => React.ReactElement;
  RefList: () => React.ReactElement;
};

// Format an entry into the IEEE reference-list line.
// Example output:  D. E. Knuth, *The TeXbook*. Reading, MA: Addison-Wesley, 1984.
function formatEntry(e: IEEEEntry): React.ReactNode {
  const tail: string[] = [];
  if (e.venue != null) tail.push(`, ${e.venue}`);
  if (e.volume != null) tail.push(`, vol. ${e.volume}`);
  if (e.pages != null) tail.push(`, pp. ${e.pages}`);
  if (e.edition != null) tail.push(`, ${e.edition}`);
  if (e.location != null || e.publisher != null) {
    const loc = e.location != null ? `${e.location}: ` : "";
    const pub = e.publisher ?? "";
    tail.push(`. ${loc}${pub}`);
  }
  tail.push(`, ${e.year}.`);
  return (
    <>
      {`${e.authors}, `}
      <em>{e.title}</em>
      {tail.join("")}
    </>
  );
}

export function createBibliography<K extends string>(
  entries: Record<K, IEEEEntry>
): Bibliography<K> {
  const Cite = ({ k }: { k: K }): React.ReactElement => (
    <cite cite={k as string} />
  );

  const RefList = (): React.ReactElement => (
    <refs>
      {(Object.keys(entries) as K[]).map((key) => (
        <ref-entry refKey={key as string} key={key as string}>
          {formatEntry(entries[key])}
        </ref-entry>
      ))}
    </refs>
  );

  return { Cite, RefList };
}
