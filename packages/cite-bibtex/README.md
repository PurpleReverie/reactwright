# @reactwright/cite-bibtex

> **Not yet implemented.** This package is a placeholder; it is
> marked `private` in `package.json` and is not published to npm.
> Track status in the GitHub issue tracker:
> https://github.com/PurpleReverie/reactwright/issues

BibTeX (`.bib`) adapter for Reactwright. When shipped, it will read a
`.bib` file at build time and expose its entries as a typed
`createBibliography(...)` map consumable by the engine's `<cite>` and
`<refs>` primitives — letting authors keep their bibliography in
their existing `.bib` files rather than restating each entry in JSX.

## Planned shape

```ts
import { createBibliographyFromBibtex } from "@reactwright/cite-bibtex";

const refs = await createBibliographyFromBibtex("./refs.bib");
// refs.smith2024 — typed reference into the .bib catalogue
```

Until then, author bibliographies inline as
`<refs><ref-entry refKey="…">…</ref-entry></refs>` blocks.
