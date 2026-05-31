# examples/ieee-report-sample

A multi-page IEEE technical report rendered with
`@reactwright/template-ieee-report`. Demonstrates the single-column
long-form variant of the IEEE template against a content-only file:
italic "Abstract—" preamble, Roman-numeral top-level sections, alpha
subsections, decimal-close sub-subsections, one figure, one table,
inline citations, and a numeric back-matter bibliography. All names,
figures, and findings are invented for layout purposes.

## Run it

```sh
pnpm --filter @example/ieee-report-sample mockup
```

Outputs `build/mockups/ieee-report-sample.{html,pdf}`.
