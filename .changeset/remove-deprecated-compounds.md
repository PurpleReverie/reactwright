---
"reactwright": minor
---

Remove the engine compound intrinsics (`<bibliography>`, `<toc>`,
`<list-of>`, and the template-side `<index>`). Authors should use the
userland helpers `<Bibliography>`, `<Toc>`, `<ListOf>`, and `<Index>`
from `reactwright/userland`, which compose the data-source primitives
(`<bib-data>`, `<toc-data>`, `<list-of-data>`, `<index-data>`) to
produce equivalent output. The content-side `<index term="...">`
inline marker is unchanged.
