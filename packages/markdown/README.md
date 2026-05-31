# @reactwright/markdown

Author Reactwright documents in Markdown. Parses CommonMark plus YAML
frontmatter into Reactwright content JSX so any template — essay,
IEEE, report — can render `.md` files to HTML and PDF without writing
TSX.

## Install

```sh
pnpm add @reactwright/markdown
```

Peer-depends on `reactwright` and `react`.

## CLI

```sh
reactwright-md paper.md                      # uses frontmatter template, outputs paper.html + paper.pdf
reactwright-md paper.md --template=ieee      # override frontmatter template
reactwright-md paper.md -o output.pdf        # custom output path
reactwright-md paper.md --html-only          # skip PDF generation
```

## Frontmatter

```yaml
---
title: My Paper
author: A. Anonymous
template: essay        # essay | ieee | report (default: essay)
references:
  - key: smith2024
    text: "Smith, A. (2024). *Robust Results*. Publisher."
---
```

`title` → `<document title>`. `author` → `<document author>`.
`template` selects the wrapping Template. `references` becomes a
trailing `<refs>` block whose `text` may contain inline Markdown.

## Markdown -> Reactwright mapping

| Markdown                       | Reactwright JSX                              |
|--------------------------------|----------------------------------------------|
| `# H1`, `## H2`, ...           | nested `<section title="...">`               |
| paragraph                      | `<p>`                                        |
| `*em*` / `_em_`                | `<em>`                                       |
| `**strong**` / `__strong__`    | `<strong>`                                   |
| `` `code` ``                   | `<code>`                                     |
| fenced code block              | `<code-block language="...">`                |
| `[text](url)`                  | `<a href="url">text</a>`                     |
| `![alt](url)`                  | `<img src="url" alt="alt" />` inline         |
| `> blockquote`                 | `<quote>`                                    |
| `- item` / `1. item`           | `<list ordered={bool}><item><p>...</p></item></list>` |
| pipe-delimited table           | `<table><row><cell><p>...</p></cell></row></table>` |
| `$inline$`                     | `<m src="..." />`                            |
| `$$display$$`                  | `<math src="..." />`                         |
| `[^foo]` + `[^foo]: text`      | inline `<footnote>text</footnote>`           |
| Pandoc `[@key]`                | `<cite cite="key" />`                        |

## Library API

```ts
import { markdownToReactwright } from "@reactwright/markdown";

const { document, frontmatter } = markdownToReactwright(mdSource);
```

`document` is a React element ready to feed to `renderContentToIR`.
`frontmatter` is the parsed YAML object (untyped — consult
`frontmatter.template` to select a template).
