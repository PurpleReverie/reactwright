import "reactwright/jsx";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";

// <DataTable src="…csv" caption="…" id="…" /> — reads a CSV from disk at
// reconciliation time and emits a reactwright <table>. The first row of
// the CSV is treated as the header row.
//
//   <DataTable
//     id="tbl-throughput"
//     caption="Throughput by document."
//     src="examples/paper/data/build-times.csv"
//   />
//
// The point of this helper is to keep tabular data out of the prose
// file: authors write a CSV, the engine renders it. Same pattern works
// for measurements, score tables, glossaries — anything tabular that
// might be edited by a non-author or generated from a script.

export function DataTable({
  src,
  caption,
  id
}: {
  src: string;
  caption?: string;
  id?: string;
}): React.ReactElement {
  const rows = parseCsv(readFileSync(resolve(process.cwd(), src), "utf8"));
  if (rows.length === 0) {
    throw new Error(`DataTable: CSV at ${src} is empty.`);
  }
  const [header, ...body] = rows;

  return (
    <table id={id} caption={caption}>
      <row>
        {header.map((cell, i) => (
          <cell header key={i}>
            <p>{cell}</p>
          </cell>
        ))}
      </row>
      {body.map((cells, r) => (
        <row key={r}>
          {cells.map((cell, c) => (
            <cell key={c}>
              <p>{cell}</p>
            </cell>
          ))}
        </row>
      ))}
    </table>
  );
}

// Minimal CSV parser: no embedded newlines, no escaped quotes. Trims
// each field. Skips blank lines. Sufficient for hand-edited data
// tables; swap for a real parser if your data needs it.
function parseCsv(input: string): string[][] {
  const out: string[][] = [];
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length === 0) continue;
    out.push(line.split(",").map((c) => c.trim()));
  }
  return out;
}
