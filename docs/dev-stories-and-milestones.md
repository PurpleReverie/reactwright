# Dev Stories and Milestones

This document describes how ReactDoc `v0` will be implemented.

It turns the current design decisions into:

- development milestones
- developer stories
- acceptance criteria
- sequencing guidance

This is a planning document, not a promise that every item will land immediately.

## Delivery Strategy

The project should be built as a narrow end-to-end pipeline first, then widened.

The implementation goal is not to solve all document authoring concerns at once. The goal is to prove the architecture with the smallest useful slice:

`React -> IR -> resolved tree -> HTML or LaTeX -> PDF`

That means we should prefer:

- small intrinsic vocabularies
- one tiny fixture document
- one tiny template
- one HTML path
- one LaTeX path
- one working PDF path

Everything else should layer on after that loop is stable.

## Milestones

## M1. Foundation

Set up the Node/TypeScript project and the minimum runtime needed to execute React trees.

Goals:

- initialize the TypeScript project
- add React and `react-reconciler`
- define initial folder structure
- create a tiny example entrypoint
- make sure React-authored files can be executed in Node

Why it matters:

- everything else depends on a clean runtime and package layout

## M2. Content Renderer

Implement the first content-side renderer path that turns content intrinsics into semantic IR.

Initial scope:

- `document`
- `section`
- `paragraph`
- text nodes

Why it matters:

- this proves we can turn content React trees into structured document meaning

## M3. Template Renderer

Implement the first template-side renderer path that turns template intrinsics into template IR.

Initial scope:

- `page`
- `stack`
- `box`
- `slot`

Why it matters:

- this proves templates can be authored in React and normalized into layout intent

## M4. Resolver

Build the resolver that maps semantic content regions into template slots.

Initial slot scope:

- `title`
- `body`

Expand shortly after:

- `author`
- `abstract`

Why it matters:

- this is the bridge between content meaning and template layout

## M5. HTML Backend

Compile the resolved render tree into HTML/CSS.

Goals:

- create a quick inspection path
- create a fast design iteration loop
- prove the style model works in one backend

Why it matters:

- HTML will be the quickest way to inspect output while the system is still young

## M6. LaTeX Backend

Compile the same resolved tree into `.tex`.

Goals:

- emit valid LaTeX
- support one simple article-style template first
- keep output correctness more important than feature breadth

Why it matters:

- LaTeX is the final typesetting target and the stricter backend

## M7. PDF Pipeline

Add final PDF generation using `pdflatex`.

Goals:

- write generated `.tex` to disk
- compile it with `pdflatex`
- surface errors clearly

Why it matters:

- this completes the first real end-to-end proof

## M8. Template Extensibility

Add custom template intrinsic registration.

Goals:

- allow built-in template intrinsics to remain small
- let template authors define backend-aware layout nodes
- fail clearly for unknown lowercase template nodes unless registered

Why it matters:

- this is the first extensibility layer beyond plain component composition

## M9. v0 Hardening

Clean up the first stable workflow.

Goals:

- add validation
- add better examples
- add fixture-based tests
- improve docs
- make errors readable

Why it matters:

- this is where the pipeline stops being a prototype and starts feeling repeatable

## Epics and Dev Stories

## Epic 1. Project Foundation

### Story 1.1

As a developer, I want a TypeScript/Node project scaffold so the renderer has a stable foundation.

### Story 1.2

As a developer, I want React and `react-reconciler` configured so React trees can be executed inside the project.

### Story 1.3

As a developer, I want a minimal example document and template so there is always a shared fixture while building.

### Story 1.4

As a developer, I want a clear folder structure for content IR, template IR, resolver, and backends so the codebase stays legible.

## Epic 2. Semantic Content

### Story 2.1

As a document author, I want to write semantic content in React using content intrinsics.

### Story 2.2

As the engine, I want to transform content intrinsics into semantic IR nodes.

### Story 2.3

As the engine, I want plain text preserved as text nodes in the semantic tree.

### Story 2.4

As a developer, I want invalid content structures to fail clearly once validation is introduced.

## Epic 3. Template Authoring

### Story 3.1

As a template author, I want to write templates in React using template intrinsics.

### Story 3.2

As the engine, I want to transform template intrinsics into template IR nodes.

### Story 3.3

As a template author, I want to attach style objects to layout nodes.

### Story 3.4

As a template author, I want named slots so I can choose where document regions appear.

## Epic 4. Resolution

### Story 4.1

As the engine, I want to extract semantic regions like `title`, `author`, `abstract`, and `body`.

### Story 4.2

As a template author, I want `<slot name="...">` to resolve consistently.

### Story 4.3

As a developer, I want missing or invalid slots to fail clearly.

## Epic 5. HTML Iteration

### Story 5.1

As a template author, I want to render documents to HTML/CSS quickly so I can iterate on layout without waiting on PDF compilation.

### Story 5.2

As a developer, I want the HTML backend to compile from the same resolved tree used by the LaTeX backend.

### Story 5.3

As a developer, I want style keys mapped to CSS predictably so template debugging is straightforward.

## Epic 6. LaTeX Output

### Story 6.1

As a template author, I want the resolved tree compiled into valid LaTeX.

### Story 6.2

As a developer, I want style keys mapped to LaTeX commands and packages through a controlled compiler layer.

### Story 6.3

As a user, I want a valid `.tex` file produced from a tiny example document and template.

## Epic 7. PDF Build

### Story 7.1

As a user, I want generated LaTeX compiled into a PDF with `pdflatex`.

### Story 7.2

As a developer, I want LaTeX compilation errors surfaced clearly so the output loop is debuggable.

### Story 7.3

As a user, I want one command that takes a React-authored document to PDF.

## Epic 8. Extensibility

### Story 8.1

As a template author, I want to define custom template intrinsics when normal React composition is not enough.

### Story 8.2

As the engine, I want unknown lowercase template nodes to fail unless they are registered.

### Story 8.3

As a backend author, I want custom intrinsic compilation hooks so custom template nodes can target HTML and LaTeX.

## Epic 9. Programmable Documents

### Story 9.1

As a user, I want document output to vary based on command-line arguments.

### Story 9.2

As a user, I want local JSON or API data injected into documents during the build step.

### Story 9.3

As a developer, I want TypeScript evaluation to happen before final rendering so documents can behave like real programs.

## Acceptance Criteria

## M1 Acceptance Criteria

- TypeScript project exists
- React and `react-reconciler` are installed
- a minimal example entrypoint runs successfully
- the repo has an initial implementation folder structure

## M2 Acceptance Criteria

- content intrinsics can be authored in React
- content trees reconcile into semantic IR
- text nodes are preserved
- semantic IR can be inspected in tests or fixtures

## M3 Acceptance Criteria

- template intrinsics can be authored in React
- template trees reconcile into template IR
- style objects are preserved on template nodes
- template IR can be inspected in tests or fixtures

## M4 Acceptance Criteria

- `title` and `body` can be resolved into slots
- one minimal content tree can render through one minimal template
- slot resolution failures produce readable errors

## M5 Acceptance Criteria

- resolved trees compile to HTML/CSS
- generated HTML is readable enough for quick inspection
- style keys are mapped consistently in the output

## M6 Acceptance Criteria

- resolved trees compile to valid `.tex`
- one article-like template produces expected LaTeX structure
- the compiler owns backend translation details rather than template authors

## M7 Acceptance Criteria

- generated `.tex` can be compiled by `pdflatex`
- a PDF artifact is produced
- compile failures are surfaced clearly

## M8 Acceptance Criteria

- custom template intrinsic registration exists
- one custom intrinsic can compile successfully
- unknown lowercase template intrinsics fail when not registered

## M9 Acceptance Criteria

- docs reflect the implemented workflow
- examples exist and are runnable
- core validation exists
- common failures are explained clearly

## Recommended Build Order

1. scaffold the project
2. define semantic IR types
3. implement the content renderer
4. define template IR types
5. implement the template renderer
6. implement the resolver
7. implement the HTML backend
8. implement the LaTeX backend
9. add the PDF pipeline
10. add custom template intrinsic registration
11. add validation, tests, and cleanup

## Intentional Deferrals

These should remain out of scope until the core loop works:

- citations
- bibliography support
- cross-references
- automatic numbering
- theorem-like domain semantics
- thesis-specific front matter complexity
- rich box styling beyond the first useful subset
- full CSS-style layout coverage
- live preview infrastructure beyond basic HTML output
- browser DOM renderer concerns

## Risks To Watch

- making the style system too broad too early
- mixing semantic content concerns with template concerns
- skipping the IR layer and compiling directly from React trees
- allowing arbitrary template intrinsics without registration
- trying to support too many document primitives before the pipeline works

## Recommended Team Mindset

When in doubt:

- shrink the scope
- prove one path end to end
- prefer one real example over many hypothetical ones
- keep the intrinsics small
- let React components carry abstraction before adding engine features

The architecture only needs a narrow working slice before it starts compounding.
