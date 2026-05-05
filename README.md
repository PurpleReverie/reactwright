# ReactDoc v0 Specification

This README is the official `v0` implementation spec for the project in `/Users/taurajgreig/Projects/Personal/react_doc`.

It replaces the earlier brainstorm spec. Anything not described here should be treated as out of scope for `v0`.

## Goal

`v0` exists to prove that we can author documents in React, render them through a custom React renderer, and produce backend output for:

- fast HTML/CSS iteration
- LaTeX generation
- PDF generation via `pdflatex`

The first successful pipeline is:

`React -> semantic IR + template IR -> resolved render tree -> HTML or LaTeX -> PDF`

This version is primarily aimed at academic-style documents, but the architecture should remain general-purpose enough to support other document types later.

## Non-Goals

The following are explicitly not part of `v0`:

- a full academic writing feature set
- citations or bibliography support
- cross-references or numbering
- Markdown import/export fidelity
- live updates or incremental reconciliation
- browser DOM rendering as the primary engine
- support for every possible LaTeX or CSS styling feature
- domain-specific systems like D&D, legal, or thesis-only primitives

## Core Model

The system has two separate React scopes:

1. content scope
2. template scope

The content scope expresses document meaning.  
The template scope expresses layout, styling, and placement.

Both scopes are authored in React.

## Renderer Model

ReactDoc `v0` is a custom React renderer built with `react-reconciler`.

We use React as the authoring/runtime model, but we do not render to the browser DOM. Instead, the renderer turns React trees into internal tree structures that we compile into backend output.

For planning purposes:

- reconciler = the implementation mechanism
- renderer = the document engine we expose

## Two Intrinsic Families

The renderer recognizes two families of intrinsic elements.

### Content intrinsics

These describe document semantics.

Example `v0` candidates:

- `document`
- `section`
- `p`
- `quote`
- `abstract`

### Template intrinsics

These describe layout and styling.

Example `v0` candidates:

- `template`
- `flow`
- `region`
- `columns`
- `slot`

Canonical authoring now prefers the concise lowercase surface:

- content: `document`, `section`, `p`, `quote`, `list`, `item`, `figure`, `page-break`
- template: `template`, `flow`, `region`, `columns`, `slot`, `rules`, `page-set`
- template: `template`, `flow`, `row`, `region`, `columns`, `rule`, `repeat`, `fixed`, `page-number`, `slot`, `rules`, `page-set`

Running matter primitives support basic scope controls:

- `repeat when="all" | "first-page" | "not-first-page"`
- `fixed when="all" | "first-page"`

Legacy aliases like `paragraph`, `blockquote`, `page`, `box`, and `stack` are still supported for compatibility.

### Naming rule

- lowercase JSX tags are engine intrinsics
- PascalCase components are user-defined abstractions

This means a project can define custom components without changing the engine:

```tsx
const Epigraph = ({ children }: { children: React.ReactNode }) => (
  <section>
    <p>{children}</p>
  </section>
);
```

## Template Composition

Templates are React-authored wrappers around document content.

Preferred shape:

```tsx
renderToPdf(
  <ArticleTemplate>
    <Paper />
  </ArticleTemplate>
);
```

This is preferred over attaching a template directly to the `document` node because:

- content stays portable
- the same content can be rendered through multiple templates
- layout concerns stay outside semantic authoring

## Render Pipeline

`v0` uses a multi-stage pipeline:

1. execute the content React tree
2. reconcile it into semantic IR
3. execute the template React tree
4. reconcile it into template IR
5. resolve semantic regions into template slots
6. compile the resolved tree to a backend
7. optionally run `pdflatex` for PDF output

The key point is that React is not rendered directly to LaTeX or HTML strings. It is first normalized into internal tree structures.

## Internal Trees

`v0` uses three internal representations.

### 1. Semantic IR

Represents document meaning.

Example:

```ts
type SemanticNode =
  | {
      kind: "document";
      title?: string;
      author?: string | string[];
      children: SemanticNode[];
    }
  | {
      kind: "abstract";
      children: SemanticNode[];
    }
  | {
      kind: "section";
      title: string;
      children: SemanticNode[];
    }
  | {
      kind: "paragraph";
      children: SemanticNode[];
    }
  | {
      kind: "text";
      value: string;
    };
```

### 2. Template IR

Represents layout and style intent.

Example:

```ts
type TemplateNode =
  | {
      kind: "page";
      style?: TemplateStyle;
      children: TemplateNode[];
    }
  | {
      kind: "box";
      style?: TemplateStyle;
      children: TemplateNode[];
    }
  | {
      kind: "stack";
      gap?: string;
      children: TemplateNode[];
    }
  | {
      kind: "slot";
      name: "title" | "author" | "abstract" | "body";
    };
```

### 3. Resolved render tree

The template tree after slots have been replaced with actual semantic content.

Backend compilers read this resolved tree rather than reading raw React elements.

## Slot Model

`v0` keeps slotting intentionally small.

Initial slot targets:

- `title`
- `author`
- `abstract`
- `body`

The content tree is normalized first, then the template decides where these regions appear.

## Styling Model

Templates carry styling information.

The public style API should be:

- CSS-inspired
- constrained
- mappable to LaTeX
- mappable to HTML

We are not implementing all of CSS. We are defining a document-layout subset.

Example direction:

```tsx
<template
  page={{
    size: "a4",
    margin: "25mm",
  }}
  typography={{
    fontFamily: "serif",
    fontSize: "11pt",
    lineHeight: 1.4,
    textAlign: "center",
  }}
>
  <slot name="body" />
</template>
```

The style system is informed by what LaTeX can actually express, but the API should remain intuitive for people who think in CSS-like terms.

Canonical authoring now prefers typed prop groups like `page`, `typography`, `paragraph`, `box`, `layout`, and `breaks`, with raw `style` reserved as a compatibility escape hatch.

## Backends

`v0` supports two backend directions.

### HTML backend

Used for fast iteration and template feedback.

Purpose:

- inspect structure quickly
- experiment with layout ideas quickly
- shorten the design loop

### LaTeX backend

Used for final typesetting and PDF generation.

Purpose:

- generate `.tex`
- compile `.pdf` via `pdflatex`

LaTeX is the stricter backend and should guide what style features are considered real.

## Custom Template Intrinsics

`v0` needs a way to define custom template intrinsics when regular React composition is not enough.

Use this rule:

- if behavior is just composition, use a PascalCase component
- if behavior needs backend-aware compilation, register a custom template intrinsic

Conceptually:

```ts
defineTemplateIntrinsic("runningHeader", {
  // backend-aware compiler hooks
});
```

Built-in template intrinsics are part of the core engine.  
Custom template intrinsics are an extension point for template authors.

Unknown lowercase template intrinsics should fail unless they are registered.

## Initial Rendering Constraints

`v0` only needs initial render.

That means:

- no live editing loop inside the reconciler
- no diff-heavy update system
- no hydration
- no browser-specific mutation model

This is a static document engine first.

## Compile-Time Programmability

One of the key reasons for using React and TypeScript is compile-time programmability.

Documents may vary based on:

- command-line arguments
- environment variables
- local data files
- API data fetched during the build step

Example use cases:

- draft vs final output
- article vs thesis template
- student vs supervisor build
- reports generated from structured data

## Minimal `v0` Example

### Content

```tsx
const Paper = () => (
  <document title="Minimal Test" author="Tauraj Greig">
    <abstract>
      <paragraph>A tiny document used to validate the pipeline.</paragraph>
    </abstract>

    <section title="Introduction">
      <paragraph>Hello world.</paragraph>
    </section>
  </document>
);
```

### Template

```tsx
const ArticleTemplate = ({ children }: { children: React.ReactNode }) => (
  <page
    style={{
      size: "a4",
      margin: "25mm",
      fontFamily: "serif",
      fontSize: "11pt",
      lineHeight: 1.4,
    }}
  >
    <stack gap="8mm">
      <box style={{ textAlign: "center" }}>
        <slot name="title" />
        <slot name="author" />
      </box>

      <box>
        <slot name="abstract" />
      </box>

      <box>
        <slot name="body" />
      </box>
    </stack>
  </page>
);
```

### Render

```tsx
renderToPdf(
  <ArticleTemplate>
    <Paper />
  </ArticleTemplate>
);
```

## Initial Scope

The first implementation only needs enough breadth to validate the architecture.

Recommended starting scope:

- content intrinsics:
  - `document`
  - `section`
  - `paragraph`
- template intrinsics:
  - `page`
  - `stack`
  - `slot`
- initial slots:
  - `title`
  - `body`
- backends:
  - HTML preview
  - LaTeX output

`abstract`, richer style keys, and more template nodes can be added after the core loop works.

## Suggested Implementation Order

1. implement the content reconciler
2. implement the template reconciler
3. define the semantic IR and template IR types
4. implement slot resolution
5. implement HTML output for fast inspection
6. implement LaTeX output
7. compile LaTeX with `pdflatex`

## Reference Material To Add

The most useful supporting docs to add next are:

- `docs/latex-style-reference.md`
- `docs/template-vocabulary.md`
- `docs/content-vocabulary.md`
- `docs/examples/`

The highest-value reference is a LaTeX style table mapping:

- public style concept
- API key
- example value
- LaTeX command or package
- whether it belongs in `v0`, later `v1`, or out of scope

## Summary

ReactDoc `v0` is a static document engine with:

- a custom React renderer
- separate semantic and template scopes
- two intrinsic families
- a normalized IR pipeline
- HTML/CSS iteration
- LaTeX/PDF export
- a constrained, CSS-inspired template style system

Everything else comes later.

## Local Runner

ReactDoc now includes a repo-local runner for testing arbitrary TSX content files before packaging ReactDoc as a module.

Example:

```bash
npm run run:file -- ./playground/paper.tsx --format html,latex,pdf --out ./build/reactdoc-run
```

Current `M10` contract:

- input file must export content as `default`, `Content`, or `content`
- input file may also export a template as `Template` or `template`
- if no external template is exported, ReactDoc falls back to the built-in `article` template
- supported formats are `html`, `latex`, and `pdf`
- default output dir is `build/reactdoc-run`

This means an external file may own both React scopes:

- one scope for content
- one scope for template

and they may live in the same file or import sub-files normally.

## Project-Scope Template Example

ReactDoc also supports project-scoped content and project-scoped templates without changing the engine.

Relevant files:

- [playground/custom-content.tsx](/Users/taurajgreig/Projects/Personal/react_doc/playground/custom-content.tsx)
- [playground/custom-template.tsx](/Users/taurajgreig/Projects/Personal/react_doc/playground/custom-template.tsx)
- [src/examples/project-scope.tsx](/Users/taurajgreig/Projects/Personal/react_doc/src/examples/project-scope.tsx)

Run it with:

```bash
npm run example:project-scope
```

That example shows:

- content authored in project scope
- template authored in project scope
- a custom template built from the normal built-in template primitives
- the normal ReactDoc pipeline reused without engine changes

For the external runner specifically, [playground/custom-doc.tsx](/Users/taurajgreig/Projects/Personal/react_doc/playground/custom-doc.tsx) now demonstrates:

- content export and template export from the same external file
- a relative import from [playground/fragments/observation.tsx](/Users/taurajgreig/Projects/Personal/react_doc/playground/fragments/observation.tsx)
- external template ownership without falling back to the built-in article template
- the primary authoring path using `page`, `stack`, `box`, and `slot` without custom intrinsic registration

## TypeScript IntelliSense

ReactDoc now exposes a public JSX typing entrypoint for consumer projects:

- `reactdoc`
- `reactdoc/jsx`
- `reactdoc/templates`

The intended consumer setup is:

```ts
import "reactdoc/jsx";
```

Then author content normally in `.tsx`:

```tsx
import "reactdoc/jsx";
import { ArticleTemplate } from "reactdoc/templates";
import type { ContentComponent, TemplateComponent } from "reactdoc";

export const Template: TemplateComponent = () => <ArticleTemplate />;

const Paper: ContentComponent = () => (
  <document title="My Paper">
    <section title="Intro">
      <paragraph>Hello world.</paragraph>
    </section>
  </document>
);

export default Paper;
```

A consumer-style proof fixture lives in:

- [fixtures/intellisense-consumer/paper.tsx](/Users/taurajgreig/Projects/Personal/react_doc/fixtures/intellisense-consumer/paper.tsx)

and can be verified with:

```bash
npm run check:intellisense
```
