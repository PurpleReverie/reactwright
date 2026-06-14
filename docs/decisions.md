# Architectural Decisions

Decisions called during the slice-1 → slice-6 work. These supplement
the 12 binding decisions in `docs/styling-spec.md` §10 — they're
project-level calls about scope, sequencing, and deprecations, not
about the styling dialect's design.

Recorded so they don't get re-litigated.

## Active

### D1 — Slice 6.3 re-entry: path A (content reconciler)
The bib-data render-prop returns content JSX. Resolver flips from
`renderTemplateFragmentToIR` to `renderContentToIR` (or a
`*FragmentToIR` variant). `<bib-entry-content>` moves to content side.
The bibliography IS content; this is the architecturally honest path.
~10 files. Costs are paid once.

### D2 — `cssPropertyMap`: keep the allowlist
Catches typos. The dialect is supposed to be typed; an open-ended
pass-through erodes that contract. Add `table-layout`, `word-wrap`,
`overflow-wrap` for slice 5.4. Future missing properties get added
in their own slice — it's cheap.

### D3 — `parentContext` sibling tracking: fix in `apply.ts`
Propagate real parent sibling info so `parent: {index: "last"}` just
works. No new selector form. The walker already has this info; just
needs to pass it down.

### D4 — Slice 6.5 abstract removal: ship (option B)
Authors write `<section role="abstract">`. Engine doesn't define
"abstract." 12 files of mechanical change, but keeping dead
semantics in the engine is exactly what slice 6 exists to delete.

### D5 — Refactors #68 / #69: ship after 6.5, before slice 3
Split `resolver/ir.ts` and `resolver/resolve.ts`. Pure refactor,
behavior-preserving. Every future slice gets cheaper.

### D6 — Slice 3 promoted concepts: ship `hanging-indent` alone first
It's the one blocking customCss completion. The others (`indent`,
`text-flow`, `column-fit`, `caption-position`) wait for actual
demand. Don't pre-build.

### D7 — Slice 4 engine class rename: rejected
`reactwright-*` becomes stable public surface. Renaming to
underscore-prefixed internals breaks user CSS without proportional
gain. Spec §9 slice-4 entry: rejected. Engine classes are public
API as of v1.0.

### D8 — `customCss` deprecation warning: defer
Wait until IEEE_CSS hits zero. Warning the only consumer is noise.

### D9 — Engine compound removal: done in 0.3.0
`<bibliography>`, `<toc>`, `<list-of>`, and the template-side
`<index>` were removed in 0.3.0 (pre-1.0 breaking change). Authors
use the `<Bibliography>`, `<Toc>`, `<ListOf>`, `<Index>` userland
helpers from `reactwright/userland`, which compose the data-source
primitives. The `<index term=...>` content-side marker remains.

### D10 — Default helpers location: `src/userland/`
Single-package. Don't fragment into a separate `@reactwright/defaults`
until packaging demands it (subscriber feedback, monorepo split, etc.).

### D11 — Task #55 (page-set regime isolation): close as stale
Hasn't been touched. If it bites again it resurfaces with fresh
context. Don't carry unmaintained pending work.

### D12 — Documentation site is itself a reactwright project
The author-facing guide tree (see `docs/roadmap.md` Track C) ships as
`packages/docs-site/` — a reactwright document whose source uses every
primitive it describes. Rationale: (a) strongest possible drift check —
broken primitives can't ship if the docs that demonstrate them won't
compile; (b) showcase value — readers arrive at the docs and see the
engine's output; (c) zero-cost migration when the web-HTML render
target (Track D) lands, the same source compiles to a browsable site.
Cost: doc-site engineering (prop-table generator, live-example check)
that a markdown-based site wouldn't need. Worth it.

### D13 — HTML element coverage policy
Reactwright is not trying to be HTML. HTML's element list is treated
as a *coverage checklist* for "what genuine document primitives exist."
A node graduates to a reactwright primitive only when ALL THREE filters
pass:
1. **Templates need to address it by selector** — the kind carries
   information a `<rule match>` would want to bind to. (`<dfn>` passes:
   templates italicize first-mentions, link to glossary. `<u>` fails:
   purely presentational.)
2. **It has a print-relevant rendering distinct from a generic role**
   — a template would treat it differently. (`<hr>` passes — thematic
   break renders as dingbat/asterism/rule per template. `<small>` fails
   — a class binding via the styles dialect handles it.)
3. **It appears in source ASTs we plan to bridge** — Pandoc, MDX,
   Wit, AsciiDoc, etc.
Failing filter 2 means the answer is "use `role=` or `<rule>` with the
styles dialect," not a new IR kind. Failing filter 1 means it's
presentational and doesn't belong in the engine at all. The phased
prioritization in `docs/roadmap.md` Track A applies this policy.

## Execution order

Established by these decisions:

1. **Slice 5.4** — cssPropertyMap (D2) + parentContext fix (D3) +
   3 table customCss migrations. **Next.**
2. **Refactors #68 / #69** (D5).
3. **Slice 6.3 path A** (D1) + slice 6.4.
4. **Slice 6.5** (D4) + slice 3 `hanging-indent` (D6).
5. **`customCss` deprecation** (D8) when IEEE_CSS = 0.
6. **v1.0 removal pass** (D9) when ready to cut.
