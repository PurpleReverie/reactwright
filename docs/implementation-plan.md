# ReactDoc Implementation Plan

Implementation plan for migrating the ReactDoc source code to the [target specification](./spec.md). Work is structured as user stories → dev stories → atomic TDD stories.

## Framework

**User story** — single end-user-visible capability. Format: *"As a [writer/template designer], I want to [X] so that [Y]."* One sentence.

**Dev stories** — engineering chunks needed to enable the user story. 3–8 per user story. Each is a self-contained unit of work, not a test.

**Atomic TDD stories** — single test + minimal implementation. Each lives in one of three layers:

- **Utility** — pure functions. Stateless. Inputs in, output out. Most numerous, fastest to write, anchor the test pyramid. Examples: `kebabCase`, `normalizePageStyle`, `escapeHTML`, `resolveAnchorToCSS`.
- **State/store** — data structures and their invariants. IR builders, rule registry, running-strings table. Tested for shape and invariants, not behavior. Examples: "creating a section node carries title and routing props," "rule registry deduplicates by `(on, match)` key."
- **Composition** — integration. Where reconcilers, resolver, and emitter wire together. Tested end-to-end on small fixtures. Fewest in count, slowest to run.

TDD order within a story is **utility → state → composition**. Pure functions first; once they exist, you can compose them into stateful pieces; once those exist, you wire them up. Composition tests should mostly fail for *integration* reasons, not internal-logic reasons — the utilities should already be solid.

## Phase 0 — Preparation

No user value, just unblocks. Removes code that contradicts the spec so subsequent milestones don't have to fight it.

- **D0.1** Remove `src/backends/latex/` and the `pdf`/`latex` format paths from the runner
- **D0.2** Remove the six typed role-rule kinds from `src/template/ir.ts`; introduce a placeholder unified `role` and `page` rule shape
- **D0.3** Remove `repeat`, `fixed`-as-running-matter, `box`, `flow`, `page-set` rule kind from template IR; mark `region`/`stack`/`columns` as canonical
- **D0.4** Drop content aliases (`paragraph`, `blockquote`, `pre`, `a`, `thematic-break`) and the `font` inline node from `src/content/ir.ts` and the reconciler
- **D0.5** Rename `table-row` → `row`, `table-cell` → `cell`
- **D0.6** Delete tests for removed surface; mark integration tests as `.skip` if they exercise vocabulary that will be reintroduced
- **D0.7** Remove example files that exercise removed primitives (`src/examples/latex.tsx`, `src/examples/pdf.tsx`, possibly `playground/full-article.tsx`)

**Exit criteria:** repo compiles, tests pass (with some skips), source surface matches what's left of the spec's content vocabulary. Nothing user-visible works yet beyond what was already working.

## Milestone sequence

Ordered by dependency. Each is a single user-visible capability.

| # | User story | Spec sections exercised |
|---|---|---|
| **M1** | As a writer, I want to author a tiny document and template in React and get an HTML file I can open in a browser, so I can verify the pipeline works end-to-end. | Foundation: minimal content + template + resolver + emitter. No Paged.js yet. |
| **M2** | As a template designer, I want my HTML to paginate into real pages with my declared size and margins. | Paged.js integration. `page` style group. |
| **M3** | As a writer, I want my `<abstract>` and document title to land in the right places on the page. | Slot resolution beyond `body`. |
| **M4** | As a template designer, I want to layer a background tint behind my content and a watermark in front. | `<layer>` primitive + z-ordering. |
| **M5** | As a template designer, I want page numbers in my footer and a running header on every page after the first. | `<header>`, `<footer>`, `<page-number>`, `<page-count>`, `when` conditions. |
| **M6** | As a template designer, I want the current section title to appear in my header automatically, and I want to set custom running strings from content. | Auto-set strings + `<set>` + `<running>` + policies. |
| **M7** | As a writer, I want some sections of my document to use a different page layout (chapter title pages, appendices, etc.). | Page regimes via `<page-set>` and `<page>` rule. |
| **M8** | As a writer, I want to tag a paragraph as "dialogue" and have the template style it appropriately, without coupling my prose to CSS. | `<role>` rule + variant application. |
| **M9** | As a template designer, I want to place ornaments at arbitrary positions on the page. | Custom anchors: coordinates + named registration; `<fixed>` overlay. |
| **M10** | As a writer, I want to add a decorative full-bleed image as a chapter background. | `<image>` primitive with `fill`/`cover`. |
| **M11** | As a writer, I want to produce a PDF from my React document with one command. | Headless Chromium print path. |
| **M12** | As a writer, I want a small library of starter templates and components I can copy and modify. | Starter kit ships. |

## Worked example: M1 — minimum viable HTML pipeline

### User story

As a writer, I want to author a tiny document and template in React and get an HTML file I can open in a browser, so I can verify the full pipeline works end-to-end.

**Acceptance:** `npm run run:file -- ./playground/minimal.tsx --format html` produces an HTML file with `<h1>` for the document title, `<section>` blocks, `<p>` paragraphs, and inline CSS for the declared text/page style.

### Dev stories

- **D1.1** Define the minimal content IR subset: `document`, `section`, `p`, `em`, `strong`, `text`
- **D1.2** Define the minimal template IR subset: `page`, `slot`, `region`, `stack`
- **D1.3** Define the minimal style groups: `page` (size, margin), `text` (fontFamily, fontSize, lineHeight)
- **D1.4** Implement content reconciler for the M1 vocabulary
- **D1.5** Implement template reconciler for the M1 vocabulary
- **D1.6** Implement slot resolver: copy content into `<slot name="body">` only (other slots come in M3)
- **D1.7** Implement HTML emitter: walk resolved tree, emit structural HTML + a `<style>` block with the page and text styles inlined
- **D1.8** Wire CLI: read input file, route through content + template + resolver + emitter, write HTML to output dir

### Atomic TDD stories

**Utility layer** (write first)

- **U1.1** `kebabCase("fontSize") → "font-size"` — converts JS-style style keys to CSS property names
- **U1.2** `escapeHTML(s)` — escapes `<`, `>`, `&`, `"` for safe HTML text emission
- **U1.3** `formatLength("11pt") → "11pt"` and `formatLength(11) → "11px"` — normalizes length values
- **U1.4** `normalizeTextStyle({fontSize: "11pt", lineHeight: 1.4})` → CSS declaration map. Pure transform of the `text` style group.
- **U1.5** `normalizePageStyle({size: "a4", margin: "25mm"})` → CSS `@page` declaration map. Pure transform of the `page` style group.
- **U1.6** `semanticKindToTag("p") → "p"`, `semanticKindToTag("section") → "section"` — maps semantic IR node kinds to default HTML element tags
- **U1.7** `renderCSSBlock(selector, declarations) → string` — emits a single CSS rule as a string

**State/store layer**

- **S1.1** Semantic-IR builder: `createSemanticNode("section", {title: "Intro"})` returns a `SectionNode` with the right shape and `children: []`
- **S1.2** Template-IR builder: `createTemplateNode("page", {page: {size: "a4"}})` returns a `PageNode` with style props on the right group
- **S1.3** Content child-append rules: appending a `TextNode` to a `ParagraphNode` works; appending to a `DocumentNode` throws (semantic validity at construction time)
- **S1.4** Template child-append rules: appending a `<slot>` to a `<page>` works; appending a `<page>` inside a `<region>` throws
- **S1.5** Slot collection: walking template IR returns a map of `{slotName → path in tree}`

**Composition layer**

- **C1.1** Content reconciler integration: rendering `<document title="X"><section title="Intro"><p>Hi</p></section></document>` produces a SemanticNode tree with the expected shape
- **C1.2** Template reconciler integration: rendering `<page page={{size: "a4"}}><slot name="body" /></page>` produces a TemplateNode tree with the slot at the expected path
- **C1.3** Resolver integration: given a content tree with one section + paragraph and a template tree with a `body` slot, the resolved tree has the section inserted at the slot's position
- **C1.4** Emitter integration: a resolved tree of `page → slot:body → section → p → text` emits an HTML document containing the text and a `<style>` block with the `@page` rule
- **C1.5** CLI integration: running the CLI on a fixture file produces an HTML file at the expected output path

**Per-story TDD rhythm:** write the test, watch it fail, write the minimal implementation, watch it pass, refactor. Utilities tend to be 5–15 lines of impl. State stories are mostly type-driven and ~20–40 lines. Composition stories use utilities and state pieces already in place — failures should point to wiring, not algorithms.

**Sequencing within M1:** U1.1 → U1.2 → U1.3 → U1.4 → U1.5 in parallel-ish order (no dependencies between them); S1.1 → S1.2 in parallel; S1.3, S1.4, S1.5 once builders exist; then C1.1 → C1.2 → C1.3 → C1.4 → C1.5 in strict order. Roughly 20 atomic stories total; M1 is realistically a week of focused work.

## Open questions for subsequent milestones

These are noted for when we expand M2–M12 to this level of detail:

- **Granularity** — the atomic stories above are quite fine-grained (one function per story). If a chunkier shape feels better in practice, dial down.
- **Documentation as a fourth layer?** Right now docs are implicit. May want explicit doc stories per milestone.
- **Fixture strategy** — composition tests need fixtures. Centralize in `tests/fixtures/` with one fixture per milestone, or co-locate?
- **Visual regression** — once Paged.js is integrated (M2+), some tests need to assert visual output. Snapshot of generated HTML/CSS? Screenshot diff? Defer until needed.

## Process notes

- After Phase 0, work milestone-by-milestone in order. Don't start M2 before M1 is fully green.
- Within a milestone, finish utility layer before starting state layer; finish state before composition.
- One PR per milestone (or per dev story, if a milestone is large).
- Each atomic story is one test + one implementation. Squash within a dev story; don't squash across dev stories.

---

# Phase 2 — Vocabulary expansion (N1–N20)

The M1–M12 milestones produced a working pipeline but the vocabulary is still too narrow for "any document, any layout." Phase 2 closes that gap by adding primitives that paginated-HTML documents need in practice. Each milestone follows the same framework — user story → dev stories → atomic TDD stories (utility / state / composition).

## Milestone table

| # | User story | Primitive(s) added |
|---|---|---|
| **N1** | As a writer, I want to break lines inside a paragraph and write subscripts/superscripts. | content inline: `br`, `sub`, `sup` |
| **N2** | As a writer, I want a verbatim block that preserves whitespace without being marked as code. | content block: `pre` |
| **N3** | As a writer, I want to drop an inline image inside a paragraph without forcing figure semantics. | content inline: `img` |
| **N4** | As a writer, I want definition lists for glossaries and term/definition pairs. | content block: `defs`, `def` |
| **N5** | As a writer, I want standalone headings that aren't tied to a section wrapper. | content block: `heading` (level/title) |
| **N6** | As a writer, I want to label any block so I can cross-reference it later. | `id` prop on every block primitive |
| **N7** | As a writer, I want to write "see Figure 3 on p. 42" and have the number and page filled in. | content inline: `ref` (to/show) |
| **N8** | As a writer, I want to write footnotes inline and have them rendered at the bottom of the page. | content inline: `footnote`; template: `footnote-area` |
| **N9** | As a writer, I want to embed equations. | content: `math` (block), `m` (inline) |
| **N10** | As a writer, I want to cite sources and have a bibliography collected automatically. | content inline: `cite`; template: `bibliography` |
| **N11** | As a writer, I want to mark index entries and get an auto-generated index. | content inline: `index`; template: `index` |
| **N12** | As a writer, I want Tufte-style sidenotes anchored in the outside margin. | content inline: `sidenote`; template: `sidenote-area` |
| **N13** | As a template designer, I want to drop a `<toc>` and get an auto-generated table of contents. | template: `toc` |
| **N14** | As a template designer, I want to auto-generate lists of figures, tables, or equations. | template: `list-of` |
| **N15** | As a template designer, I want asymmetric multi-column layouts. | template: `columns`, `column` |
| **N16** | As a template designer, I want to register custom fonts. | template: `font` |
| **N17** | As a template designer, I want to control break-before/after/inside on matched roles. | role-rule props: `breakBefore`, `breakAfter`, `breakInside` |
| **N18** | As a template designer, I want to attach counters and numbered captions to matched roles. | role-rule prop: `numbering` |
| **N19** | As a template designer, I want first-line drop-caps via a single declaration. | role-rule prop: `dropCap` + `position="first-in-section"` |
| **N20** | As a template designer, I want my supported roles to be typed so writers can't typo a role string. | `Template<TRoles>` generic + `page-set roles` registry |

## TDD layer pattern (recurring)

For each Nx milestone, the atomic stories fall into the same three layers. The shape repeats per primitive — only the names change.

### Utility layer
- IR-shape constructors (`createFootnoteNode({...}) → FootnoteNode`)
- Parsers / validators (`readMathSrc(props) → string`)
- HTML emitters (`renderFootnoteCallHTML(node) → string`)
- CSS generators (`buildFootnoteAreaCss({...}) → string`)

### State/store layer
- Reconciler `createInstance` accepts the new intrinsic type and yields the right IR shape
- Child-append rules accept the primitive in valid parents and reject in invalid ones
- Resolver passes new IR through the resolved tree (or extracts and aggregates, for back-matter primitives)

### Composition layer
- React tree → IR → resolved → HTML round-trip for a small fixture containing the new primitive
- Co-existence with adjacent primitives (footnote inside a paragraph inside a list item, etc.)

## Per-milestone execution order

Implementation order **per primitive**: utility → state → composition. Implementation order **across milestones**: simple structural primitives first (N1–N6), then primitives requiring resolver-side aggregation (N7–N12), then template-only additions (N13–N19), then the role-typing pass (N20). The ordering minimizes IR/resolver churn — each round of resolver changes happens against a stable content IR.

Each Nx ships as one micro-commit (or a small stack of micro-commits if utility/state/composition are individually meaningful). Tests + tsc + intellisense fixture stay green at every commit.
