# ReactDoc

React-authored document engine. Write documents as React components; the engine renders them through Paged.js into paginated HTML, and to PDF via headless Chromium.

## Status

Pre-release. The primitive vocabulary is being redesigned around Paged.js as the primary render target. The previous LaTeX backend is being removed.

See [docs/spec.md](docs/spec.md) for the current specification.

## How it works

ReactDoc separates document authoring into two React scopes:

- a **content scope** describing semantic meaning (`<section>`, `<p>`, `<quote>`)
- a **template scope** describing page layout and visual treatment (`<page>`, `<layer>`, `<region>`)

Both scopes are executed by custom React reconcilers, normalized into intermediate trees, joined by a slot resolver, and compiled to a paginated HTML document driven by Paged.js. PDF output comes from headless Chromium printing the paginated DOM.

```
content React tree  ─┐
                     ├──► resolver ──► HTML ──► Paged.js ──► paginated DOM ──► PDF
template React tree ─┘
```

## Quickstart

```bash
npm install
npm run run:file -- ./playground/paper.tsx --format html --out ./build/reactdoc-run
```

The runner accepts a `.tsx` file exporting `default` (or `Content` / `content`) as the content component and optionally `Template` (or `template`) as the template component. If no template is exported, a built-in starter template is used.

## Consumer authoring

For consumer projects:

```tsx
import "reactdoc/jsx";
import { ArticleTemplate } from "reactdoc/templates";
import type { ContentComponent, TemplateComponent } from "reactdoc";

export const Template: TemplateComponent = () => <ArticleTemplate />;

const Paper: ContentComponent = () => (
  <document title="My Paper">
    <section title="Intro">
      <p>Hello world.</p>
    </section>
  </document>
);

export default Paper;
```

A consumer-style proof fixture lives in `fixtures/intellisense-consumer/` and can be verified with `npm run check:intellisense`.

## Documentation

- [docs/spec.md](docs/spec.md) — full specification: vocabulary, architecture, rule system, layer system, examples
