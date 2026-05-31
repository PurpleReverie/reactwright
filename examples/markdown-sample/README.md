# markdown-sample

End-to-end demo of the `@reactwright/markdown` workflow.

`sample.md` is a short essay with YAML frontmatter (title, author,
template, references). Run:

```sh
pnpm mockup
```

The script invokes the `reactwright-md` CLI on `sample.md` and writes
`markdown-sample.html` + `markdown-sample.pdf` into `build/mockups/`.
The frontmatter `template: essay` selects `@reactwright/template-essay`;
override with `--template=ieee` or `--template=report` on the command
line if you want to see the same content wrapped in a different
template.

Workflow:

1. The CLI reads `sample.md` and parses it via `markdownToReactwright`,
   producing a `<document>` React element plus a frontmatter object.
2. The frontmatter `template` field selects the Reactwright template
   package; the CLI dynamically imports its `Template` export.
3. Content + template flow through the engine's existing render
   pipeline (content IR → resolve → HTML → PDF).
