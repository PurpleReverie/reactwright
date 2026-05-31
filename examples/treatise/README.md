# examples/treatise

A general-purpose academic-paper mockup with an inline template (no
external template package). Exercises abstract, auto-numbered figure
captions via role+numbering, `<ref>` cross-references, `<cite>` +
`<bibliography>`, `<footnote>` + `<footnote-area>`, inline and block
`<math>`/`<m>`, `<list-of>`, and `<toc>`.

## Run it

```sh
pnpm --filter @example/treatise mockup
```

Outputs `build/mockups/treatise.{html,pdf}`.
