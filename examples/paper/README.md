# examples/paper

A substantial multi-file Reactwright example: an IEEE conference paper
composed across one file per section plus shared infrastructure files.
The point of the example is to show what a real authoring workflow
looks like — not what fits in a 30-line README.

## Run it

```bash
npm run example:paper
```

Outputs `build/examples/paper.{html,pdf}`.

## Structure

```
examples/paper/
├── paper.tsx                       entry: imports the helper template,
│                                   composes <document> from sections
├── bibliography.tsx                createBibliography({...}) — one
│                                   typed catalogue of citation keys
├── components/
│   ├── data-table.tsx              <DataTable src="...csv" /> — reads
│   │                               a CSV at render time and emits
│   │                               <table>/<row>/<cell>
│   └── numbered-equation.tsx       <NumberedEquation /> — thin wrapper
│                                   for IEEE-numbered equations
├── data/
│   ├── build-times.csv             rendered as Table 1
│   └── compile-overhead.csv        rendered as Table 2
└── sections/
    ├── introduction.tsx
    ├── background.tsx
    ├── architecture.tsx            <ref to="fig-pipeline" />, figure
    ├── methodology.tsx
    ├── results.tsx                 two <DataTable> instances
    ├── discussion.tsx
    ├── limitations.tsx
    └── conclusion.tsx
```

## What it demonstrates

**Multi-file authoring.** Each section is a React component in its
own file. A long paper does not need to live in a single JSX blob.

**Typed citations.** `bibliography.tsx` declares the citation keys
once; every section imports `Cite` from that file. TypeScript
catches typos at compile time.

**Data-driven tables.** `DataTable` reads a CSV from disk during
content-tree reconciliation and emits the matching `<table>`. The
author updates a spreadsheet; the next build picks up the change.

**Engine ignorance of format.** All IEEE-specific styling lives in
`../../mockups/ieee/`. This directory contains zero IEEE knowledge —
only the prose, the data, the citation graph, and the composition.

## Adapting this example

To author your own paper:

1. Copy `examples/paper/` to a new directory.
2. Replace section files with your own sections.
3. Replace `bibliography.tsx` entries with your own references.
4. Replace CSVs in `data/` with your own measurements.
5. Run `npm run example:paper` (or add a new script pointing at your
   directory).

To use a different template, swap the import in `paper.tsx`:

```tsx
import { Template } from "../../my-templates/journal-x/index.js";
```

Everything else remains unchanged.
