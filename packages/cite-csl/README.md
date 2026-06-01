# @reactwright/cite-csl

> **Not yet implemented.** This package is a placeholder; it is
> marked `private` in `package.json` and is not published to npm.
> Track status in the GitHub issue tracker:
> https://github.com/PurpleReverie/reactwright/issues

Citation Style Language (CSL-JSON, `.csl`) adapter for Reactwright.
When shipped, it will let a document declare a CSL style file and
emit formatted in-text citations + bibliography entries that match
the chosen style (APA, Chicago, MLA, Vancouver, …).

## Planned shape

```ts
import { createCslBibliography } from "@reactwright/cite-csl";

const refs = await createCslBibliography({
  data: "./refs.json",
  style: "./apa.csl"
});
```

Until then, author bibliographies inline as
`<refs><ref-entry refKey="…">…</ref-entry></refs>` and hand-format
each entry in the style you need.
